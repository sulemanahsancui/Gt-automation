import moment from 'moment-timezone'
import { Browser, Page } from 'puppeteer'
import { ProfileService, ProxyService, TicketService } from '.'
import { config } from '../config'
import {
  BotLogEntry,
  END_EXECUTION_REASONS,
  IScreenResolution,
  newBrowser,
  PAGE_ERRORS,
  ProxyCredentials
} from '../lib'
import { IP_CHECK_URL } from '../lib/constants'

export class BotUtilities {
  // Basic properties
  protected order: any = null
  protected page: Page | null = null
  protected puppeteer: Browser | null = null
  protected browser: Browser | null = null
  protected stop = false
  protected pageCount = 1
  protected botType: any
  // Keep track of crawl variables
  protected proxy: ProxyCredentials | null = null
  protected profile: any | null = null
  protected userAgent: string | undefined | null = null
  protected userAgentId: number | undefined | null = null
  protected screenResolution: IScreenResolution | null = null
  protected captchaMinScore = 0
  protected randomizedMouseMovements = null

  // DOB / Years variables
  protected dob: number | null = null
  protected minimumYears: number | null = null
  protected minimumYears_18: number | null = null
  useProxy: boolean
  test: boolean = false
  protected botLog: BotLogEntry | null = null
  protected paymentIframe: any

  constructor(useProxy = false, proxy: ProxyCredentials | null = null) {
    this.useProxy = useProxy
    this.proxy = proxy

    this.setupEnvironment()
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
      '--disable-features=IsolateOrigins,site-per-process'
      //'--user-agent=' . $this.profile.user_agent
    ]

    if (this.useProxy && this.proxy) {
      args.push(`--proxy-server=${this?.proxy?.host}:${this.proxy?.port}`)
    }

    this.browser = await newBrowser({
      headless: config('NODE_ENV') == 'development' ? false : true,
      args
    })

    const context = this.browser.defaultBrowserContext()
    this.page = await context.newPage()

    if (this.useProxy) {
      await this.page.authenticate({
        username: this.proxy?.username as string,
        password: this.proxy?.password as string
      })
    }
    await this.page.setViewport({
      width: 1280,
      height: 743,
      deviceScaleFactor: 1
    })

    this.page.on('dialog', async (dialog) => await dialog.accept())
  }

  getInnerText(selector: string): Promise<string> | undefined {
    return this.page?.$eval(selector, (el) => el.textContent?.trim() || '')
  }

  async saveBotLog(): Promise<void> {
    try {
      await this?.page?.goto(IP_CHECK_URL, {
        timeout: 10000,
        waitUntil: 'domcontentloaded'
      })

      const json = await this.getInnerText('pre')
      const out = JSON.parse(json as string)

      const botLog: BotLogEntry = {
        command: this.botType,
        ipaddress: out.query,
        proxyUsername: this?.proxy?.username,
        orderId: this?.order?.id,
        proxyDetails: json
      }

      console.log('Saving BotLog:', botLog)

      this.botLog = botLog

      //TODO: ADD THIS TO BOT LOG TABLE...
    } catch (error) {
      console.error('Error saving bot log:', error)
    }
  }

  async authenticateProxy(): Promise<void> {
    if (
      this.useProxy &&
      this.proxy &&
      this.proxy.username &&
      this.proxy.password
    ) {
      await this?.page?.authenticate({
        username: this.proxy.username,
        password: this.proxy.password
      })
    }

    await this.saveBotLog() // You'd implement this method or stub it
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
      { id: 6, width: 1280, height: 800 }
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
   * Click on an element
   * @param selector
   * @param clickCount
   */
  async click(selector: string, clickCount: number = 1): Promise<void> {
    await this.elementExists(selector)
    try {
      await this.page?.click(selector, {
        clickCount,
        delay: Math.floor(Math.random() * (50 - 20 + 1)) + 20
      })
    } catch (error) {
      this.endExecution('Node Exception')
    }
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
    overwrite: boolean = false
  ): Promise<boolean | void> {
    if (text === undefined || text === null || text === '') return false

    await this.elementExists(selector)

    if (overwrite) {
      await this.click(selector, 3)
    }

    try {
      await this.page?.type(selector, String(text), {
        delay: Math.floor(Math.random() * (50 - 20 + 1)) + 20
      })
    } catch (error) {
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
      await this.page?.select(selector, value)
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
      (sel, lbl) => {
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
      selector,
      label
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
   * Wait until the selector is visible or hidden
   * @param selector - CSS selector
   * @param hidden - Whether to wait for the element to be hidden
   * @returns Promise<boolean>
   */
  async waitForSelector(
    selector: string,
    hidden: boolean = false
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
      fullPage: ![3, 4, 5].includes(this.botType)
    })

    await this.order.save()
  }

  /**
   * Check if element exists but allow continuing if not found
   * @param selector - CSS selector
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
  async elementExists(selector: string): Promise<void> {
    try {
      let element = await this.page?.$(selector)
      if (!element) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        element = await this.page?.$(selector)
        if (!element) this.endExecution('Element Not Found')
      }
    } catch {
      this.endExecution('Node Exception')
    }
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
    url: string = ''
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
    noError: boolean = false
  ): Promise<boolean> {
    const currentUrl = await this.page?.url()

    // Quick match for non-exact cases
    if (!exact) return currentUrl?.includes(url) ?? false

    // Exact match success case
    if (currentUrl === url) return true

    // Silent mode for non-error cases
    if (noError) return false

    // Create a beautiful error mapping

    // Determine the error message
    const errorKey = Object.keys(PAGE_ERRORS).find(
      (key) => currentUrl?.endsWith(key) || currentUrl === key
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

    await this.order.save()

    if (this.botLog) {
      const additionalMessages = [
        this.captchaMinScore !== undefined
          ? `Min captcha score: ${this.captchaMinScore}`
          : null,
        this.randomizedMouseMovements !== undefined
          ? `RMM: ${this.randomizedMouseMovements}`
          : null,
        this.userAgentId !== undefined ? `UA: ${this.userAgentId}` : null
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
      year: parsed.year()
    }
  }

  // Set DOB and age check reference dates
  setDobAndMinimumAge(): void {
    const { dob_day, dob_month, dob_year } = this.order.details
    const day = dob_day.toString().padStart(2, '0')
    const month = dob_month.toString().padStart(2, '0')

    this.dob = moment(`${dob_year}-${month}-${day}`, 'YYYY-MM-DD').valueOf()
    this.minimumYears = moment()
      .subtract(14, 'years')
      .valueOf()
    this.minimumYears_18 = moment()
      .subtract(18, 'years')
      .valueOf()
  }

  // Get class name of a DOM element
  async getClassName(selector: string): Promise<string | undefined> {
    return await this.page?.$eval(selector, (el) => el?.className || '')
  }
}
