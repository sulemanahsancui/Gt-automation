import moment from 'moment-timezone'
import { Browser, Page } from 'playwright'
import { HelperService, ProfileService, ProxyService, TicketService } from '.'
import { config } from '../config'
import {
  BotLogEntry,
  CORRECT_COUNTRY_CITIZENSHIPS,
  END_EXECUTION_REASONS,
  IScreenResolution,
  newBrowser,
  PAGE_ERRORS,
  ProxyCredentials,
  random,
  sleep,
} from '../lib'
import { IP_CHECK_URL } from '../lib/constants'

export class BotUtilities {
  // Basic properties
  order: any = null
  page: Page | null = null
  protected puppeteer: Browser | null = null
  protected browser: Browser | null = null
  stop = false
  protected pageCount = 1
  botType: any
  // Keep track of crawl variables
  protected proxy: ProxyCredentials | null = null
  protected profile: any | null = null
  protected userAgent: string | undefined | null = null
  protected userAgentId: number | undefined | null = null
  protected screenResolution: IScreenResolution | null = null
  protected captchaMinScore = 0
  randomized_mouse_movements = 0
  // DOB / Years variables
  protected dob: number | null = null
  protected minimumYears: number = 0
  protected minimumYears_18: number | null = null
  useProxy: boolean
  test: boolean = false
  protected botLog: BotLogEntry | null = null
  protected paymentIframe: any

  constructor(
    useProxy = false,
    page: Page | null,
    proxy: ProxyCredentials | null = null,
    browser: Browser | null,
    order?: any,
  ) {
    this.useProxy = useProxy
    this.proxy = proxy
    if (page) this.page = page
    this.setupEnvironment()
    if (browser) this.browser = browser
    if (order) this.order = order
  }

  /**
   * Start Puppeteer
   */
  async startPuppeteer() {
    const args = [
      '--incognito',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--lang=en-US',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      //'--user-agent=' . $this.profile.user_agent
    ]

    this.browser = await newBrowser({
      headless: config('NODE_ENV') == 'development' ? false : true,
      args,
      ...(this.useProxy &&
        this.proxy && {
          proxy: {
            server: `${this?.proxy?.host}:${this.proxy?.port}`,
            username: this.proxy?.username as string,
            password: this.proxy?.password as string,
          },
        }),
    })

    const context = await this.browser.newContext()
    this.page = await context.newPage()

    await this.page.setViewportSize({
      width: 1280,
      height: 743,
    })

    this.page.on('dialog', async (dialog) => await dialog.accept())
  }

  /**
   * Adds an action (click) to the page.  (Simplified for Node.js)
   * @param {string} selector
   */
  async add(selector: string): Promise<void> {
    try {
      await this.page?.click(selector)
    } catch (error) {
      console.error(
        `Error clicking on element with selector "${selector}"`,
        error,
      )
      throw error
    }
  }

  getInnerText(selector: string): Promise<string> | undefined {
    return this.page?.$eval(selector, (el) => el.textContent?.trim() || '')
  }

  async saveBotLog(): Promise<void> {
    try {
      await this?.page?.goto(IP_CHECK_URL, {
        timeout: 10000,
        waitUntil: 'domcontentloaded',
      })

      const json = await this.getInnerText('pre')
      const out = JSON.parse(json as string)

      const botLog: BotLogEntry = {
        command: this.botType,
        ipaddress: out.query,
        proxyUsername: this?.proxy?.username,
        orderId: this?.order?.id,
        proxyDetails: json,
      }

      console.log('Saving BotLog:', botLog)

      this.botLog = botLog

      //TODO: ADD THIS TO BOT LOG TABLE...
    } catch (error) {
      console.error('Error saving bot log:', error)
    }
  }

  /**
   * Get a random profile from our list
   * @return string proxy
   */

  getProfile() {
    const new_profile = new ProfileService()
    this.profile = new_profile.profile
    this.userAgent = new_profile.userAgent
    this.userAgentId = new_profile.userAgentId
  }

  /**
   * Get a random proxy using ProxyService and assign it to this.proxy
   */
  async getRandomProxy(): Promise<void> {
    const username = this.order?.proxy_username || null

    // Get proxy from service
    const proxyService = new ProxyService(username)
    this.proxy = proxyService.getProxyObject() as any

    // Save updated username to the order object
    await this.saveProxyUsername()
  }

  /**
   * Save proxy username to the order object
   */
  async saveProxyUsername(): Promise<void> {
    if (this.order && this.proxy?.username) {
      this.order.proxy_username = this.proxy.username
      // TODO: Save the proxy username into Order DB table.
    }
  }

  /**
   * Executes randomized mouse movements.
   */
  async randomizedMouseMovements(): Promise<void> {
    if (Math.random() < 0.5) {
      //  Simplified the rand(0,1)
      this.randomized_mouse_movements = 1
      const moveTimes = random(3, 10)

      for (let i = 0; i <= moveTimes; i++) {
        try {
          await this.page?.mouse.move(random(5, 320), random(400, 820))
          await sleep(random(100, 600))
        } catch (error) {
          console.error('Error during mouse movement', error)
          // throw error;
        }
      }
    }
  }

  /**
   * Get a random screen size from a predefined list
   * @returns {Object} Screen size object with width and height
   */
  getRandomScreenSize(): { id: number; width: number; height: number } {
    const screenSizes: IScreenResolution[] = [
      { id: 0, width: 1366, height: 768 },
      { id: 1, width: 1920, height: 1080 },
      { id: 2, width: 1536, height: 864 },
      { id: 3, width: 1440, height: 900 },
      { id: 4, width: 1600, height: 900 },
      { id: 5, width: 1280, height: 720 },
      { id: 6, width: 1280, height: 800 },
    ]

    const randomIndex = Math.floor(Math.random() * screenSizes.length)
    const screenSize = screenSizes[randomIndex]

    return screenSize
  }

  /**
   * Record status for diagnostics
   * @returns {boolean} false if test or stop flag is set, otherwise updates the order status
   */
  recordStatus(): boolean {
    if (this.test && this.test) {
      return false
    }

    if (this.stop) {
      return false
    }

    const botProperties = `Page #: ${this.pageCount} | PXY: ${this.proxy?.id} | PFL: ${this.profile?.id} | RES: ${this.screenResolution?.id}`
    console.log('botProperties', botProperties)
    // TODO:
    // Save this to order
    // this.order?.bot_message = botProperties;

    // // Simulate saving the order (replace with actual database update logic)
    // this.order?.save();

    return true
  }

  /**
   * Setup environment
   */
  async setupEnvironment() {
    // Profile
    this.getProfile()

    // Proxy
    await this.getRandomProxy()

    // Screen resolution
    this.getRandomScreenSize()

    // Record status
    this.recordStatus()
  }

  /**
   * Create a ticket
   * @param error
   * @returns Promise<boolean>
   */
  async createTicket(error: string): Promise<boolean> {
    const ticketService = new TicketService(this.order, error)
    const status = await ticketService.createTicketAndFollowup()
    return status
  }

  /**
   * Close browser
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) await this.browser.close()
  }

  /**
   * Type text inside element
   * @param selector
   * @param text
   * @param overwrite
   * @returns Promise<boolean|void>
   */
  async type(
    selector: string,
    text: string | number,
    overwrite: boolean = false,
  ): Promise<boolean | void> {
    if (text === undefined || text === null || text === '') return false

    await this.elementExists(selector)

    if (overwrite) {
      await this.click(selector, 3)
    }

    try {
      await this.page?.type(selector, String(text), {
        delay: Math.floor(Math.random() * (50 - 20 + 1)) + 20,
      })
    } catch (error) {
      console.log(error)
      this.endExecution('Node Exception')
    }
  }

  /**
   * Select option in dropdown
   * @param selector
   * @param value
   */
  async select(selector: string, value: string): Promise<void> {
    await this.elementExists(selector)
    try {
      await this.page?.selectOption(selector, value)
    } catch (error) {
      this.endExecution('Node Exception')
    }
  }

  /**
   * Select option in dropdown by visible label
   * @param selector
   * @param label
   */
  async selectByLabel(selector: string, label: string): Promise<void> {
    await this.page?.evaluate(
      (args: { sel: string; lbl: string }) => {
        const { sel, lbl } = args
        const select = document.querySelector(sel) as HTMLSelectElement
        if (!select) return
        for (let i = 0; i < select.options.length; i++) {
          const option = select.options[i]
          if (option.text.trim() === lbl) {
            select.value = option.value
            const event = new Event('change', { bubbles: true })
            select.dispatchEvent(event)
            break
          }
        }
      },
      { sel: selector, lbl: label },
    )
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    // Example usage of Puppeteer waitForNavigation
    // try {
    //     await this.page.waitForNavigation({
    //         timeout: 120000,
    //         waitUntil: 'networkidle2',
    //     });
    // } catch (error) {
    //     this.endExecution('Navigation Timeout');
    // }
  }

  /**
   * Wait for an element to appear on the page
   * @param selector - CSS selector for the element
   */
  async waitForElement(selector: string): Promise<void> {
    for (let x = 0; x <= 20; x++) {
      const element = await this.page?.$(selector)
      if (!element) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
      } else {
        break
      }
    }
  }

  /**
   * Click on an element
   * @param selector
   * @param clickCount
   */
  async click(selector: string, clickCount: number = 1): Promise<void> {
    await this.elementExists(selector)
    try {
      await this.page?.click(selector, {
        clickCount,
        delay: Math.floor(Math.random() * (50 - 20 + 1)) + 20,
      })
    } catch (error) {
      this.endExecution('Node Exception')
    }
  }

  /**
   * Wait until the selector is visible or hidden
   * @param selector - CSS selector
   * @param hidden - Whether to wait for the element to be hidden
   * @returns Promise<boolean>
   */
  async waitForSelector(
    selector: string,
    hidden: boolean = false,
  ): Promise<boolean> {
    try {
      for (let x = 1; x <= 24; x++) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        const element = await this.page?.$(selector)
        if (hidden && !element) return true
        if (!hidden && element) return true
      }
    } catch (error) {
      this.endExecution('Node Exception')
    }
    return false
  }

  /**
   * Take a screenshot of the current page
   * @param completion - Whether the screenshot is at completion stage
   */
  async screenshot(completion: boolean = false): Promise<void> {
    if (!this.page) return

    const imageName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.png`
    const path = completion
      ? `storage/images/applications/${imageName}`
      : `storage/images/bot/${imageName}`

    if (completion) {
      this.order.screenshot = imageName
    } else {
      this.order.bot_screenshot = imageName
    }

    await this.page.screenshot({
      path,
      fullPage: ![3, 4, 5].includes(this.botType),
    })

    if (this?.order?.save) await this?.order?.save()
  }

  /**
   * Check if element exists but allow continuing if not found
   * @param selector -
   * @returns Promise<boolean>
   */
  async elementExistsContinue(selector: string): Promise<boolean> {
    try {
      let element = await this.page?.$(selector)
      if (!element) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        element = await this.page?.$(selector)
        if (!element) return false
      }
    } catch {
      return false
    }
    return true
  }

  /**
   * Check if element exists or exit execution if not found
   * @param selector - CSS selector
   */
  async elementExists(selector: string): Promise<boolean | void> {
    try {
      let element = await this.page?.$(selector)
      if (!element) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        element = await this.page?.$(selector)
        if (!element) this.endExecution('Element Not Found')

        return true
      }
    } catch {
      this.endExecution('Node Exception')
    }
  }

  async clickAndNext(page: Page) {
    await page.click('button.btn-primary[type="submit"]')
  }

  /**
   * Check if element exists inside payment iframe
   * @param selector - CSS selector
   */
  async elementExistsIframe(selector: string): Promise<void> {
    try {
      let element = await this.paymentIframe?.$(selector)
      if (!element) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        element = await this.paymentIframe?.$(selector)
        if (!element) this.endExecution('Element Not Found')
      }
    } catch {
      this.endExecution('Node Exception')
    }
  }

  /**
   * Click a button and handle navigation
   * @param selector - CSS selector
   * @param clickCount - Whether to count the page as clicked
   * @param useUrl - Whether to use URL comparison for confirming page change
   * @param url - The expected URL
   */
  async clickButtonAndNext(
    selector: string,
    clickCount: boolean = true,
    useUrl: boolean = false,
    url: string = '',
  ): Promise<void> {
    await this.waitForSelector(selector)
    await this.click(selector)

    if (useUrl && url) {
      for (let x = 1; x <= 3; x++) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const samePage = await this.rightPage(url, false, true)
        if (samePage) {
          await this.click(selector)
        } else {
          break
        }
      }
    }

    if (clickCount) this.pageCount++

    this.recordStatus()
  }

  /**
   * Sleep for a random amount of time
   * @param short - Whether to use short sleep duration
   */
  async sleepRandom(short: boolean = false): Promise<void> {
    const duration = short ? this.randomInt(2, 3) : this.randomInt(8, 12)
    await new Promise((resolve) => setTimeout(resolve, duration * 1000))
    await this.waitForSelector('.spinner.in', true)
  }

  /**
   * Checks if we're on the expected page with graceful error handling
   * @param expectedUrl - The URL or partial path to match
   * @param options - Configuration options
   * @returns Promise indicating if we're on the right page
   */
  async rightPage(
    url: string,
    exact: boolean = true,
    noError: boolean = false,
  ): Promise<boolean> {
    const currentUrl = await this.page?.url()
    console.log('urk', { currentUrl }, url)
    // Quick match for non-exact cases
    if (!exact) return currentUrl?.includes(url) ?? false

    // Exact match success case
    if (currentUrl === url) return true

    // Silent mode for non-error cases
    if (noError) return false

    // Create a beautiful error mapping

    // Determine the error message
    const errorKey = Object.keys(PAGE_ERRORS).find(
      (key) => currentUrl?.endsWith(key) || currentUrl === key,
    )

    // Create a beautiful error message
    const errorMessage = errorKey
      ? PAGE_ERRORS[errorKey]
      : `Unexpected URL: ${currentUrl}`

    // Handle the error gracefully
    this.endExecution(errorMessage)
    return false
  }
  /**
   * End execution due to error
   * @param reason Optional reason for ending execution
   */
  async endExecution(reason: string = ''): Promise<void> {
    await this.screenshot()

    this.order.bot_failed_at = new Date().toISOString()
    this.order.bot_fail = 1

    let fullReason = ''
    const validationError = false // Placeholder for any future validation logic

    const currentUrl = await this.page?.url()

    if (
      !validationError &&
      (reason === 'Wrong URL' ||
        reason.startsWith('No node found for selector'))
    ) {
      fullReason = `${reason} | Page #: ${this.pageCount} | U: ${currentUrl}`
    } else if (validationError) {
      fullReason = `${validationError} | Page #: ${this.pageCount}`
    } else {
      fullReason = `${reason} | Page #: ${this.pageCount}`
    }

    this.order.bot_message = fullReason

    if (reason in END_EXECUTION_REASONS) {
      const ticketCreated = await this.createTicket(reason)
      if (ticketCreated) {
        this.order.status = 9
        this.order.reason = END_EXECUTION_REASONS[reason]
      }
    }
    if (this.order.save) await this.order.save()

    if (this.botLog) {
      const additionalMessages = [
        this.captchaMinScore !== undefined
          ? `Min captcha score: ${this.captchaMinScore}`
          : null,
        this.randomizedMouseMovements !== undefined
          ? `RMM: ${this.randomizedMouseMovements}`
          : null,
        this.userAgentId !== undefined ? `UA: ${this.userAgentId}` : null,
      ]
        .filter(Boolean)
        .join(' | ')

      this.botLog.botMessage = `${additionalMessages} | ${fullReason}`
      //  TODO: Save this botLog into DB.
      // await this.bot_log.save();
    }

    this.stop = true
  }

  /**
   * Utility: Generate a random integer between min and max
   */
  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Check if current time is after 6 PM or before 9 AM in central time
  isAfterHours(): boolean {
    const timezone = process.env.DISPLAY_TIMEZONE || 'America/Chicago'
    const now = moment().tz(timezone)
    const hour = now.hour()
    return hour >= 18 || hour < 9
  }

  // Split a date string into day/month/year
  splitTimeStamp(date: string): { day: number; month: number; year: number } {
    const parsed = moment(date)
    return {
      day: parsed.date(),
      month: parsed.month() + 1, // moment months are 0-indexed
      year: parsed.year(),
    }
  }

  // Set DOB and age check reference dates
  setDobAndMinimumAge(): void {
    const { dob_day, dob_month, dob_year } = this.order.details
    const day = dob_day.toString().padStart(2, '0')
    const month = dob_month.toString().padStart(2, '0')

    this.dob = moment(`${dob_year}-${month}-${day}`, 'YYYY-MM-DD').valueOf()
    this.minimumYears = moment().subtract(14, 'years').valueOf()
    this.minimumYears_18 = moment().subtract(18, 'years').valueOf()
  }

  // Get class name of a DOM element
  async getClassName(selector: string): Promise<string | undefined> {
    return await this.page?.$eval(selector, (el) => el?.className || '')
  }

  getCorrect2LetterCountryAbbreviation(country: string): string | false {
    const countries: Record<string, string> = {
      US: 'US',
      AF: 'AF',
      AL: 'AL',
      AG: 'DZ',
      AN: 'AD',
      AO: 'AO',
      AV: 'AI',
      AC: 'AG',
      AR: 'AR',
      AM: 'AM',
      AA: 'AW',
      AS: 'AU',
      AU: 'AT',
      AJ: 'AZ',
      BF: 'BS',
      BA: 'BH',
      BG: 'BD',
      BB: 'BB',
      BO: 'BY',
      BE: 'BE',
      BH: 'BZ',
      BN: 'BJ',
      BD: 'BM',
      BT: 'BT',
      BL: 'BO',
      BK: 'BA',
      BC: 'BW',
      BR: 'BR',
      BU: 'BG',
      UV: 'BF',
      BM: 'BU',
      BY: 'BI',
      CB: 'KH',
      CM: 'CM',
      CA: 'CA',
      CV: 'CV',
      CJ: 'KY',
      CT: 'CF',
      CD: 'TD',
      CI: 'CL',
      CH: 'CN',
      CO: 'CO',
      CW: 'CK',
      CS: 'CR',
      CU: 'CU',
      CY: 'CY',
      EZ: 'CZ',
      DA: 'DK',
      DJ: 'DJ',
      DO: 'DM',
      DR: 'DO',
      TT: 'TP',
      EC: 'EC',
      EG: 'EG',
      ES: 'SV',
      EK: 'GQ',
      ER: 'ER',
      EN: 'EE',
      ET: 'ET',
      FJ: 'FJ',
      FI: 'FI',
      FR: 'FR',
      FP: 'PF',
      GB: 'GA',
      GA: 'GM',
      GG: 'GE',
      GM: 'DE',
      GH: 'GH',
      GR: 'GR',
      GJ: 'GD',
      GT: 'GT',
      GK: 'GG',
      GV: 'GN',
      GY: 'GY',
      HA: 'HT',
      HO: 'HN',
      HK: 'HK',
      HU: 'HU',
      IC: 'IS',
      IN: 'IN',
      ID: 'ID',
      IZ: 'IQ',
      EI: 'IE',
      IM: 'IM',
      IS: 'IL',
      IT: 'IT',
      JM: 'JM',
      JA: 'JP',
      JE: 'JE',
      JO: 'JO',
      KZ: 'KZ',
      KE: 'KE',
      KR: 'KI',
      KU: 'KW',
      KG: 'KG',
      LA: 'LA',
      LG: 'LV',
      LE: 'LB',
      LT: 'LS',
      LI: 'LR',
      LY: 'LY',
      LS: 'LI',
      LH: 'LT',
      LU: 'LU',
      MK: 'MK',
      MA: 'MG',
      MI: 'MW',
      MY: 'MY',
      MV: 'MV',
      ML: 'ML',
      MT: 'MT',
      RM: 'MH',
      MR: 'MR',
      MP: 'MU',
      MX: 'MX',
      MN: 'MC',
      MG: 'MN',
      MJ: 'ME',
      MH: 'MS',
      MO: 'MA',
      MZ: 'MZ',
      WA: 'NA',
      NR: 'NR',
      NP: 'NP',
      NL: 'NL',
      NT: 'AN',
      NC: 'NC',
      NZ: 'NZ',
      NU: 'NI',
      NG: 'NE',
      NI: 'NG',
      NE: 'NU',
      NO: 'NO',
      MU: 'OM',
      PK: 'PK',
      PS: 'PW',
      PM: 'PA',
      PP: 'PG',
      PA: 'PY',
      PE: 'PE',
      RP: 'PH',
      PL: 'PL',
      PO: 'PT',
      QA: 'QA',
      RO: 'RO',
      RW: 'RW',
      SC: 'KN',
      ST: 'LC',
      WS: 'WS',
      SM: 'SM',
      TP: 'ST',
      SA: 'SA',
      SG: 'SN',
      RB: 'RS',
      SE: 'SC',
      SL: 'SL',
      SN: 'SG',
      SI: 'SI',
      BP: 'SB',
      SO: 'SO',
      SF: 'ZA',
      SP: 'ES',
      CE: 'LK',
      SU: 'SD',
      NS: 'SR',
      WZ: 'SZ',
      SW: 'SE',
      SZ: 'CH',
      SY: 'SY',
      TW: 'TW',
      TI: 'TJ',
      TH: 'TH',
      TO: 'TG',
      TN: 'TO',
      TD: 'TT',
      TS: 'TN',
      TU: 'TR',
      TX: 'TM',
      TK: 'TC',
      TV: 'TV',
      UG: 'UG',
      UP: 'UA',
      AE: 'AE',
      UK: 'GB',
      UY: 'UY',
      UZ: 'UZ',
      NH: 'VU',
      VE: 'VE',
      VM: 'VN',
      YM: 'YE',
      ZA: 'ZM',
      ZI: 'ZW',
      BX: 'BN',
      KM: 'CN',
      CF: 'CG',
      CG: 'CD',
      IV: 'CI',
      HR: 'HR',
      PU: 'GW',
      VT: 'VA',
      IR: 'IR',
      KN: 'KP',
      KS: 'KR',
      FM: 'FM',
      MD: 'MD',
      PC: 'PN',
      RS: 'RU',
      VC: 'VC',
      LO: 'SK',
      TZ: 'TZ',
    }

    return countries[country] ?? false
  }
  /**
   * Return correct month in the proper format
   */
  getCorrectMonth(month: number): string {
    const allMonths: Record<number, string> = {
      1: '01-Jan',
      2: '02-Feb',
      3: '03-Mar',
      4: '04-Apr',
      5: '05-May',
      6: '06-Jun',
      7: '07-Jul',
      8: '08-Aug',
      9: '09-Sep',
      10: '10-Oct',
      11: '11-Nov',
      12: '12-Dec',
    }

    return allMonths[month]
  }

  /**
   * Return correct country in the proper format (e.g. "1: US")
   */
  getCorrectCountryAddressAndEmployment(country: string): string | false {
    const countries = [
      '1: US',
      '2: CA',
      /* "3: MX", */ '4: AF',
      '5: AX',
      '6: AL',
      '7: DZ',
      '8: AD',
      '9: AO',
      '10: AI',
      '11: AG',
      '12: AR',
      '13: AM',
      '14: AW',
      '15: AU',
      '16: AT',
      '17: AZ',
      '18: BS',
      '19: BH',
      '20: BD',
      '21: BB',
      '22: BY',
      '23: BE',
      '24: BZ',
      '25: BJ',
      '26: BM',
      '27: BT',
      '28: BO',
      '29: BQ',
      '30: BA',
      '31: BW',
      '32: BR',
      '33: BN',
      '34: BG',
      '35: BF',
      '36: BI',
      '37: KH',
      '38: CM',
      '39: CA',
      '40: CV',
      '41: KY',
      '42: CF',
      '43: TD',
      '44: CL',
      '45: CN',
      '46: CO',
      '47: CG',
      '48: CK',
      '49: CR',
      '50: CI',
      '51: HR',
      '52: CU',
      '53: CW',
      '54: CY',
      '55: CZ',
      '56: CD',
      '57: DK',
      '58: DJ',
      '59: DM',
      '60: DO',
      '61: TP',
      '62: EC',
      '63: EG',
      '64: SV',
      '65: GQ',
      '66: ER',
      '67: EE',
      '68: ET',
      '69: FJ',
      '70: FI',
      '71: FR',
      '72: GF',
      '73: PF',
      '74: GA',
      '75: GM',
      '76: GE',
      '77: DE',
      '78: GH',
      '79: GR',
      '80: GD',
      '81: GT',
      '82: GG',
      '83: GN',
      '84: GW',
      '85: GY',
      '86: HT',
      '87: HN',
      '88: HU',
      '89: IS',
      '90: IN',
      '91: ID',
      '92: IR',
      '93: IQ',
      '94: IE',
      '95: IM',
      '96: IL',
      '97: IT',
      '98: JM',
      '99: JP',
      '100: JE',
      '101: JO',
      '102: KZ',
      '103: KE',
      '104: KI',
      '105: KP',
      '106: KR',
      '107: KV',
      '108: KW',
      '109: KG',
      '110: LA',
      '111: LV',
      '112: LB',
      '113: LS',
      '114: LR',
      '115: LY',
      '116: LI',
      '117: LT',
      '118: LU',
      '119: MO',
      '120: MK',
      '121: MG',
      '122: MW',
      '123: MY',
      '124: MV',
      '125: ML',
      '126: MT',
      '127: MH',
      '128: MQ',
      '129: MR',
      '130: MU',
      '131: MX',
      '132: FM',
      '133: MD',
      '134: MC',
      '135: MN',
      '136: ME',
      '137: MS',
      '138: MA',
      '139: MZ',
      '140: MM',
      '141: NA',
      '142: NR',
      '143: NP',
      '144: NL',
      '145: NZ',
      '146: NI',
      '147: NE',
      '148: NG',
      '149: NU',
      '150: NO',
      '151: OM',
      '152: PK',
      '153: PW',
      '154: PA',
      '155: PG',
      '156: PY',
      '157: PE',
      '158: PH',
      '159: PN',
      '160: PL',
      '161: PT',
      '162: QA',
      '163: RO',
      '164: RU',
      '165: RW',
      '166: BL',
      '167: KN',
      '168: LC',
      '169: MF',
      '170: VC',
      '171: WS',
      '172: SM',
      '173: ST',
      '174: SA',
      '175: SN',
      '176: RS',
      '177: SC',
      '178: SL',
      '179: SG',
      '180: SX',
      '181: SK',
      '182: SI',
      '183: SB',
      '184: SO',
      '185: ZA',
      '186: SS',
      '187: ES',
      '188: LK',
      '189: SD',
      '190: SR',
      '191: SZ',
      '192: SE',
      '193: CH',
      '194: SY',
      '195: TW',
      '196: TJ',
      '197: TZ',
      '198: TH',
      '199: TL',
      '200: TG',
      '201: TO',
      '202: TT',
      '203: TN',
      '204: TR',
      '205: TM',
      '206: TC',
      '207: TV',
      '208: UG',
      '209: UA',
      '210: KM',
      '211: AE',
      '212: GB',
      '213: US',
      '214: UY',
      '215: UZ',
      '216: VU',
      '217: VA',
      '218: VE',
      '219: VN',
      '220: PS',
      '221: YE',
      '222: ZM',
      '223: ZW',
    ]

    const countryCode = this.getCorrect2LetterCountryAbbreviation(country)
    const found = countries.find((c) => c.endsWith(`: ${countryCode}`))
    return found ?? false
  }

  async getCorrectCountry(
    country: string,
    selector: string,
  ): Promise<string | false> {
    const countries: string[] = [
      '1: US',
      '2: CA',
      '3: MX',
      '4: AF',
      '5: AX',
      '6: AL',
      '7: DZ',
      '8: AD',
      '9: AO',
      '10: AI',
      '11: AG',
      '12: AR',
      '13: AM',
      '14: AW',
      '15: AU',
      '16: AT',
      '17: AZ',
      '18: BS',
      '19: BH',
      '20: BD',
      '21: BB',
      '22: BY',
      '23: BE',
      '24: BZ',
      '25: BJ',
      '26: BM',
      '27: BT',
      '28: BO',
      '29: BQ',
      '30: BA',
      '31: BW',
      '32: BR',
      '33: BN',
      '34: BG',
      '35: BF',
      '36: BU',
      '37: BI',
      '38: KH',
      '39: CM',
      '40: CA',
      '41: CV',
      '42: KY',
      '43: CF',
      '44: TD',
      '45: CL',
      '46: CN',
      '47: CO',
      '48: CG',
      '49: CK',
      '50: CR',
      '51: CI',
      '52: HR',
      '53: CU',
      '54: CW',
      '55: CY',
      '56: CZ',
      '57: CD',
      '58: DK',
      '59: DJ',
      '60: DM',
      '61: DO',
      '62: TP',
      '63: EC',
      '64: EG',
      '65: SV',
      '66: GQ',
      '67: ER',
      '68: EE',
      '69: ET',
      '70: FJ',
      '71: FI',
      '72: FR',
      '73: GF',
      '74: PF',
      '75: GA',
      '76: GM',
      '77: GE',
      '78: DD',
      '79: DE',
      '80: GH',
      '81: GR',
      '82: GD',
      '83: GT',
      '84: GG',
      '85: GN',
      '86: GW',
      '87: GY',
      '88: HT',
      '89: HN',
      '90: HK',
      '91: HU',
      '92: IS',
      '93: IN',
      '94: ID',
      '95: IR',
      '96: IQ',
      '97: IE',
      '98: IM',
      '99: IL',
      '100: IT',
      '101: JM',
      '102: JP',
      '103: JE',
      '104: JO',
      '105: KZ',
      '106: KE',
      '107: KI',
      '108: KP',
      '109: KR',
      '110: KV',
      '111: KW',
      '112: KG',
      '113: LA',
      '114: LV',
      '115: LB',
      '116: LS',
      '117: LR',
      '118: LY',
      '119: LI',
      '120: LT',
      '121: LU',
      '122: MO',
      '123: MK',
      '124: MG',
      '125: MW',
      '126: MY',
      '127: MV',
      '128: ML',
      '129: MT',
      '130: MH',
      '131: MQ',
      '132: MR',
      '133: MU',
      '134: MX',
      '135: FM',
      '136: MD',
      '137: MC',
      '138: MN',
      '139: ME',
      '140: MS',
      '141: MA',
      '142: MZ',
      '143: MM',
      '144: NA',
      '145: NR',
      '146: NP',
      '147: NL',
      '148: AN',
      '149: NC',
      '150: NZ',
      '151: NI',
      '152: NE',
      '153: NG',
      '154: NU',
      '155: NO',
      '156: OM',
      '157: PK',
      '158: PW',
      '159: PA',
      '160: PG',
      '161: PY',
      '162: PE',
      '163: PH',
      '164: PN',
      '165: PL',
      '166: PT',
      '167: QA',
      '168: RO',
      '169: RU',
      '170: RW',
      '171: BL',
      '172: KN',
      '173: LC',
      '174: MF',
      '175: VC',
      '176: WS',
      '177: SM',
      '178: ST',
      '179: SA',
      '180: SN',
      '181: RS',
      '182: CS',
      '183: SC',
      '184: SL',
      '185: SG',
      '186: SX',
      '187: SK',
      '188: SI',
      '189: SB',
      '190: SO',
      '191: ZA',
      '192: SS',
      '193: ES',
      '194: LK',
      '195: SD',
      '196: SR',
      '197: SZ',
      '198: SE',
      '199: CH',
      '200: SY',
      '201: TW',
      '202: TJ',
      '203: TZ',
      '204: TH',
      '205: TL',
      '206: TG',
      '207: TO',
      '208: TT',
      '209: TN',
      '210: TM',
      '211: TC',
      '212: TV',
      '213: TR',
      '214: UG',
      '215: UA',
      '216: KM',
      '217: AE',
      '218: GB',
      '219: US',
      '220: UY',
      '221: SU',
      '222: UZ',
      '223: VU',
      '224: VA',
      '225: VE',
      '226: VN',
      '227: PS',
      '228: YE',
      '229: YU',
      '230: ZR',
      '231: ZM',
      '232: ZW',
    ]

    const countryCorrect = this.getCorrect2LetterCountryAbbreviation(country)

    const match = countries.find((c) => c.endsWith(countryCorrect as string))
    if (match) {
      return match
    }

    // Optionally fallback using page select
    const allCountriesAlt = HelperService.getCountriesAlt() as Record<
      string,
      any
    >
    const countryName = allCountriesAlt[country]

    if (countryName) {
      const countryValue = await this.page?.evaluate(
        (args) => {
          const { selector, countryName } = args
          const select = document.querySelector(selector) as HTMLSelectElement
          if (!select) return ''

          const option = Array.from(select.options).find(
            (opt) => opt.text === countryName,
          )
          return option?.value || ''
        },
        { selector, countryName },
      )

      return countryValue || false
    }

    return false
  }

  getCorrectCanadaState(state: string): string | false {
    const states: string[] = [
      '1: AB',
      '2: BC',
      '3: MB',
      '4: NB',
      '5: NL',
      '6: NT',
      '7: NS',
      '8: NU',
      '9: ON',
      '10: PE',
      '11: QC',
      '12: SK',
      '13: YT',
    ]

    const match = states.find((s) => s.endsWith(state))
    return match || false
  }

  getCorrectMexicoState(state: string): string | false {
    const states: string[] = [
      '1: AGU',
      '2: BCN',
      '3: BCS',
      '4: CAM',
      '5: CHP',
      '6: CHH',
      '7: COA',
      '8: COL',
      '9: DIF',
      '10: DUR',
      '11: GUA',
      '12: GRO',
      '13: HID',
      '14: JAL',
      '15: MEX',
      '16: MIC',
      '17: MOR',
      '18: NAY',
      '19: NLE',
      '20: OAX',
      '21: PUE',
      '22: QUE',
      '23: ROO',
      '24: SLP',
      '25: SIN',
      '26: SON',
      '27: TAB',
      '28: TAM',
      '29: TLA',
      '30: VER',
      '31: YUC',
      '32: ZAC',
    ]

    const match = states.find((s) => s.slice(-3) === state)
    return match || false
  }

  getCorrectCountryCitizenship(country: string): string | false {
    const countries: Record<string, string> = CORRECT_COUNTRY_CITIZENSHIPS

    return countries[country] ?? false
  }

  /**
   * Return correct state in the proper format
   * @return string | false
   */
  getCorrectState(state: string): string | false {
    const states: string[] = [
      '1: AL',
      '2: AK',
      '3: AS',
      '4: AZ',
      '5: AR',
      '6: CA',
      '7: CO',
      '8: CT',
      '9: DE',
      '10: DC',
      '11: FL',
      '12: GA',
      '13: GU',
      '14: HI',
      '15: ID',
      '16: IL',
      '17: IN',
      '18: IA',
      '19: KS',
      '20: KY',
      '21: LA',
      '22: ME',
      '23: MD',
      '24: MA',
      '25: MI',
      '26: MN',
      '27: MS',
      '28: MO',
      '29: MT',
      '30: NE',
      '31: NV',
      '32: NH',
      '33: NJ',
      '34: NM',
      '35: NY',
      '36: NC',
      '37: ND',
      '38: MP',
      '39: OH',
      '40: OK',
      '41: OR',
      '42: PA',
      '43: PR',
      '44: RI',
      '45: SC',
      '46: SD',
      '47: TN',
      '48: TX',
      '49: UT',
      '50: VT',
      '51: VI',
      '52: VA',
      '53: WA',
      '54: WV',
      '55: WI',
      '56: WY',
    ]

    for (const oneState of states) {
      if (oneState.slice(-2) === state) {
        return oneState
      }
    }

    return false
  }

  splitDate(dateStr: string): [string, string, string] {
    const [m, d, y] = dateStr.split('/')
    return [this.getCorrectMonth(Number(m)), this.padDay(d), y]
  }

  padDay(day: string | number): string {
    return String(day).padStart(2, '0')
  }

  isRenewal(type: number): boolean {
    return [1, 3, 5, 7, 9, 11].includes(type)
  }
}
