import { Browser, Page } from 'playwright'
import { config } from '../config'
import {
  CORRECT_COUNTRY_CITIZENSHIPS,
  Formatter,
  logger,
  sleep,
  sleepRandom,
  STATUSES,
} from '../lib'
import { BotLoginService } from './BotLogin'
import { BotPaymentService } from './BotPayment'
import { BotUtilities } from './BotUtilities'
import { HelperService } from './HelperService'
import { OrderService } from './Order'
import moment from 'moment'

export class BotSubmitApplication extends BotUtilities {
  botLoginService: BotLoginService
  botPaymentService: BotPaymentService
  orderService: OrderService

  delay: number = 0

  application_id: string = ''
  resume_application: boolean = false
  button_next = 'button#next'
  resumeApplication: boolean
  previousAddressEndedMonth: any
  previousAddressEndedYear = null
  formatter: Formatter

  previousJobEndedMonth: any
  previousJobEndedYear: any

  constructor(
    page: Page,
    order: any,
    browser: Browser,
    delay: number,
    botType: number,
    button_next: string,
    application_id: string,
    minimumYears: number,
    resumeApplication: boolean,
    previousAddressEndedMonth: any,
    previousAddressEndedYear: any,
  ) {
    super(false, page, null, browser, order)
    this.botLoginService = new BotLoginService(this)
    this.botPaymentService = new BotPaymentService({
      alreadyPaid: false,
      page,
      continueButton: '',
      botUtils: this,
    })
    this.orderService = new OrderService()
    this.delay = delay
    this.botType = botType
    this.button_next = button_next
    this.application_id = application_id
    this.minimumYears = minimumYears
    this.resumeApplication = resumeApplication
    this.formatter = new Formatter()
    this.previousAddressEndedMonth = previousAddressEndedMonth
    this.previousAddressEndedYear = previousAddressEndedYear
  }

  public async handle(): Promise<boolean> {
    if (!config('APPLICATION_BOT_ACTIVE')) return false

    // Optional delay
    if (this.delay > 0) await sleep(this.delay * 1000)

    // Check if max instances already running
    const totalInstances = await this.orderService.countRunningBots({
      botType: this.botType,
      withinMinutes: 12,
    })

    const afterHours = this.isAfterHours()
    const maxInstances = afterHours
      ? parseInt((config('APPLICATION_BOT_INSTANCES_AFTER') as string) ?? 4)
      : parseInt((config('APPLICATION_BOT_INSTANCES_NORMAL') as string) ?? 0)

    if (totalInstances >= maxInstances) return false

    // // Get order to work on
    this.order = await this.orderService.getNextOrder()

    if (!this.order) {
      console.log('No orders available to complete.')
      return false
    }

    if (this.order.botTries > 2) {
      logger.info(`${this.order.prettyId} - Too many bot attempts.`)
      await this.orderService.markAsFailed(this.order.id, {
        type: this.botType,
        message: 'Too many bot attempts.',
      })
      return false
    }

    logger.info(`${this.order.prettyId} - Started the bot for this order.`)
    await this.orderService.markAsStarted(this.order.id, {
      type: this.botType,
    })

    // Setup environment
    await this.setupEnvironment()

    try {
      // Start application
      await this.page?.goto(this.order.url, { timeout: 60000 })

      // Run all steps
      for (let p = 1; p <= 19; p++) {
        if (this.stop) break

        const pageMethod = (this as any)[`page_${p}`]
        if (typeof pageMethod === 'function') {
          await pageMethod.call(this)
        }
      }
    } catch (e: any) {
      await this.endExecution(e.message)
    }

    await this.closeBrowser()

    return true
  }

  // -------------------------------------------------------------------------------------
  // Step 1: Start Page
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/
  // -------------------------------------------------------------------------------------
  async page_1() {
    await this.botLoginService.login_page_1()
  }

  // -------------------------------------------------------------------------------------
  // Step 2: Login.gov Login Page
  // -------------------------------------------------------------------------------------
  // https://secure.login.gov/?request_id=73db2a8b-f39b-4094-a637-f500ab789a50
  // -------------------------------------------------------------------------------------
  async page_2() {
    await this.botLoginService.login_page_2()
  }

  // -------------------------------------------------------------------------------------
  // Step 3: 2-Factor Authentication Page
  // -------------------------------------------------------------------------------------
  // https://secure.login.gov/login/two_factor/authenticator
  // -------------------------------------------------------------------------------------
  async page_3() {
    await this.botLoginService.login_page_3()
  }

  // -------------------------------------------------------------------------------------
  // Step 5: Next Steps Page
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/getstarted;stepDone=3
  // -------------------------------------------------------------------------------------

  async page_4a() {
    // Sleep
    await this.sleepRandom()

    // Check if page correct
    const right_page = await this.rightPage(
      'https://ttp.cbp.dhs.gov/getstarted;stepDone=3',
    )
    if (!right_page) return false

    // Click continue
    await this.clickButtonAndNext(
      '.page-content .row-button-group button.btn-primary',
    )

    await this.page_4b()
  }

  // -------------------------------------------------------------------------------------
  // Step 6: Program Selection
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/program-selection/select-program
  // -------------------------------------------------------------------------------------
  async page_4b() {
    // Sleep
    await this.sleepRandom()

    // Check if page correct
    const right_page = await this.rightPage(
      'https://ttp.cbp.dhs.gov/program-selection/select-program',
      false,
      false,
    )
    if (!right_page) return false

    // Wait for element to load
    await this.waitForElement('label[for="areCitizenYes"]')

    // Are you a US citizen?
    if (this.order?.details?.document?.country_citizenship == 'US') {
      await this.click('label[for="areCitizenYes"]')
    } else {
      await this.click('label[for="areCitizenNo"]')
      await this.sleepRandom(true)
      let country_citizenship =
        this.order?.details?.document?.country_citizenship
      if (country_citizenship == 'HK') {
        country_citizenship = 'CH'
      }
      await this.sleepRandom(true)

      await this.select(
        '#countryOfCitizenship',
        this.getCorrectCountryCitizenship(country_citizenship) as string,
      )

      if (country_citizenship == 'CA') {
        // Are you a Lawful Permanent Resident (LPR) of the United States?
        if (this.order?.details?.document?.pr_country == 'US') {
          await this.click('label[for="areLRPYes"]')
        } else {
          await this.click('label[for="areLRPNo"]')
        }
      } else {
        if (this.order?.details?.document?.pr_country == 'US') {
          await this.click('label[for="statusLPR"]')
        } else if (this.order?.details?.document?.pr_country == 'CA') {
          await this.click('label[for="statusImmigrant"]')
        } else {
          await this.click('label[for="statusNeither"]')
        }
      }
    }

    await this.sleepRandom(true)

    // Program to Apply For: Select Global Entry, Nexus or SENTRI
    const tpp_option_exists = await this.elementExistsContinue(
      'label[for="tppOption"]',
    )
    if (tpp_option_exists) {
      await this.click('label[for="tppOption"]')

      await this.sleepRandom(true)
    }

    // Select Specific Program
    switch (await this.order?.presenter()?.serviceName) {
      case 'Global Entry':
        await this.click('label[for="globalEntry"]')

        this.sleepRandom(true)

        // Do you plan on flying internationally into the U.S. within the next 6 months?
        if (this.order?.details?.plan_flying_internationally == 1) {
          await this.click('label[for="imminentIntlTravelYes"]')
        } else {
          await this.click('label[for="imminentIntlTravelNo"]')
        }

        break

      case 'NEXUS':
        await this.click('label[for="nexus"]')
        break

      case 'SENTRI':
        await this.click('label[for="sentri"]')
        break
    }

    // Click on Next button
    await this.clickButtonAndNext(this.button_next)

    // Click on modal as well
    if (
      (await this.order?.presenter()?.serviceName) == 'Global Entry' &&
      this.order?.details?.plan_flying_internationally == 0
    ) {
      // Wait for element to load
      await this.waitForElement(
        'div.show#mdl-consider-tsa-modal-2 .row-link-group div:nth-of-type(2) .btn-primary',
      )

      await this.click(
        'div.show#mdl-consider-tsa-modal-2 .row-link-group div:nth-of-type(2) .btn-primary',
      )
    }

    await this.page_4c()
  }

  // -------------------------------------------------------------------------------------
  // Step 7: Program Selection Acknowledgement
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/program-selection/acknowledge
  // -------------------------------------------------------------------------------------
  async page_4c() {
    // Sleep
    await this.sleepRandom()

    // Check if page correct
    const right_page = await this.rightPage(
      'https://ttp.cbp.dhs.gov/program-selection/acknowledge',
      false,
      false,
    )
    if (!right_page) return false

    // Wait for element to load
    await this.waitForElement('#marketingQuestion')

    await this.select('#marketingQuestion', '7: Other')

    // Click on Next button
    await this.clickButtonAndNext(
      this.button_next,
      true,
      true,
      'https://ttp.cbp.dhs.gov/program-selection/acknowledge',
    )
  }

  // -------------------------------------------------------------------------------------
  // Renewals: Dashboard
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/dashboard
  // -------------------------------------------------------------------------------------
  async page_4d() {
    // Sleep
    await this.sleepRandom()

    // Check if page correct
    const right_page = await this.rightPage('https://ttp.cbp.dhs.gov/dashboard')
    if (!right_page) return false

    // Get button text
    const button_1 = await this.getInnerText(
      '.dashboard-card button.btn-primary:nth-of-type(1)',
    )
    const button_2 = await this.getInnerText(
      '.dashboard-card button.btn-primary:nth-of-type(2)',
    )

    if (button_1 && button_1.toLowerCase() === 'renew membership') {
      await this.page?.click(
        '.dashboard-card button.btn-primary:nth-of-type(1)',
      )
    } else if (button_2 && button_2.toLowerCase() === 'renew membership') {
      await this.page?.click(
        '.dashboard-card button.btn-primary:nth-of-type(2)',
      )
    } else {
      throw new Error('Renew Membership Button Not Found!')
    }

    await this.page_4d_1()
  }

  async page_4d_1(): Promise<void> {
    await this.sleepRandom()

    const rightPage = await this.rightPage(
      'https://ttp.cbp.dhs.gov/program-selection/select-program',
      false,
    )
    if (!rightPage) return

    const doc = this.order?.details?.document
    const citizenship = doc?.country_citizenship

    // Are you a US citizen?
    if (citizenship === 'US') {
      await this.page?.click('label[for="areCitizenYes"]')
    } else {
      await this.page?.click('label[for="areCitizenNo"]')
      await this.sleepRandom(true)

      const countryOption = this.getCorrectCountryCitizenship(citizenship)
      await this.page
        ?.getByLabel('#countryOfCitizenship')
        .fill(countryOption as string)

      if (citizenship === 'CA') {
        if (doc.pr_country === 'US') {
          await this.page?.click('label[for="areLRPYes"]')
        } else {
          await this.page?.click('label[for="areLRPNo"]')
        }
      } else {
        if (doc.pr_country === 'US') {
          await this.page?.click('label[for="statusLPR"]')
        } else if (doc.pr_country === 'CA') {
          await this.page?.click('label[for="statusImmigrant"]')
        } else {
          await this.page?.click('label[for="statusNeither"]')
        }
      }
    }

    await this.sleepRandom(true)

    // TPP Option
    const tppExists = await this.elementExistsContinue('label[for="tppOption"]')
    if (tppExists) {
      await this.page?.click('label[for="tppOption"]')
      await this.sleepRandom(true)
    }

    // Select Program
    const serviceName = this.order.presenter().serviceName

    switch (serviceName) {
      case 'Global Entry':
        await this.page?.click('label[for="globalEntry"]')
        await this.sleepRandom(true)

        if (this.order?.details.plan_flying_internationally === 1) {
          await this.page?.click('label[for="imminentIntlTravelYes"]')
        } else {
          await this.page?.click('label[for="imminentIntlTravelNo"]')
        }
        break

      case 'NEXUS':
        await this.page?.click('label[for="nexus"]')
        break

      case 'SENTRI':
        await this.page?.click('label[for="sentri"]')
        break
    }

    await this.clickButtonAndNext(this.button_next)

    // Modal after Global Entry -> Not Flying
    if (
      serviceName === 'Global Entry' &&
      this.order.details.plan_flying_internationally === 0
    ) {
      await this.page?.waitForSelector(
        'div.show#mdl-consider-tsa-modal-2 .row-link-group div:nth-of-type(2) .btn-primary',
        {
          state: 'visible',
        },
      )

      await this.page?.click(
        'div.show#mdl-consider-tsa-modal-2 .row-link-group div:nth-of-type(2) .btn-primary',
      )
    }

    await this.page_4d_2()
  }

  // -------------------------------------------------------------------------------------
  // Renewals: Step 2
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/program-selection/acknowledge?applicationType=RN&addProgramType=TTP&renewReapplyProgram=UP
  // -------------------------------------------------------------------------------------
  async page_4d_2() {
    // Sleep
    await this.sleepRandom()

    // Check if page correct
    const right_page = await this.rightPage(
      'https://ttp.cbp.dhs.gov/program-selection/acknowledge',
      false,
    )
    if (!right_page) return false

    // Click on Next button
    await this.clickButtonAndNext(this.button_next)

    this.page_4d_3()
  }

  // -------------------------------------------------------------------------------------
  // Renewals: Step 3
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/program-selection/membership-orientation
  // -------------------------------------------------------------------------------------
  async page_4d_3() {
    // Sleep
    await this.sleepRandom()

    // Check if page correct
    const right_page = await this.rightPage(
      'https://ttp.cbp.dhs.gov/program-selection/membership-orientation',
    )
    if (!right_page) return false

    // Click on Next button
    await this.clickButtonAndNext(this.button_next)

    await this.page_4d_4()
  }

  // -------------------------------------------------------------------------------------
  // Renewals: Step 4
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/application/110549121/final-review?userId=6c79008b-7e27-4c3b-9738-b40da844a273
  // -------------------------------------------------------------------------------------
  async page_4d_4() {
    // Sleep
    await this.sleepRandom()

    // Check if page correct
    const right_page = await this.rightPage(
      'https://ttp.cbp.dhs.gov/application/',
      false,
    )
    if (!right_page) return false

    // Click on Personal tab
    await this.click('.progress-sub-level ul li:nth-child(1) a')
  }

  async page_5(): Promise<void> {
    await this.sleepRandom()

    const isCorrectPage = await this.rightPage(
      'https://ttp.cbp.dhs.gov/application/',
      false,
    )
    if (!isCorrectPage) return

    // Extract Application ID from URL
    const currentUrl = this.page?.url()
    const match = currentUrl?.match(/application\/(\d+)\/personal-info/)

    if (match && match[1]) {
      const applicationId = match[1]
      this.application_id = applicationId
      this.order.application_id = applicationId
      await this.order.save() // Assuming save is async
    } else {
      return this.endExecution(
        'Error occurred. Application ID could not be parsed.',
      )
    }

    await this.page?.waitForSelector('label#male_label')

    // Gender
    const gender = this.order.details.gender
    await this.page?.click(
      gender === 'male' ? 'label#male_label' : 'label#female_label',
    )

    // Eye color
    const eyeColors: Record<string, string> = {
      black: 'BK',
      blue: 'BL',
      bluish_green: 'BG',
      brown: 'BR',
      green: 'GR',
      hazel: 'HA',
      red: 'RD',
      gray: 'GY',
    }
    const eyeCode = eyeColors[this.order.details.eye_color]
    await this.page?.selectOption('#eyeColor', eyeCode)

    // Height
    await this.page?.fill(
      'input[name="heightFeet"]',
      this.order.details.height_ft.toString(),
    )
    await this.page?.waitForTimeout(1000)
    const heightIn = this.order.details.height_in || '0'
    await this.page?.fill('input[name="heightInches"]', heightIn.toString())
    await this.page?.waitForTimeout(1000)

    // Other names
    const otherFirst = this.order.details.other_first_name
    if (otherFirst) {
      await this.page?.click('label#aliasYes_label')
      await this.page?.fill(
        '#aliasFirstName_0',
        this.order.details.other_first_name,
      )
      await this.page?.fill(
        '#aliasLastName_0',
        this.order.details.other_last_name,
      )
    } else {
      await this.page?.click('label#aliasNo_label')
    }

    // Child application logic
    const childTypes = [2, 3, 6, 7, 10, 11]
    if (childTypes.includes(this.order.type)) {
      // Guardian Name
      await this.page?.fill(
        '#g_lastname',
        this.order.details.guardian_last_name,
      )
      await this.page?.fill(
        '#g_firstname',
        this.order.details.guardian_first_name,
      )
      await this.page?.fill(
        '#g_middlename',
        this.order.details.guardian_middle_name,
      )

      // Guardian DOB
      const guardianMonth = this.getCorrectMonth(
        this.order.details.guardian_dob_month,
      )
      const guardianDay = this.order.details.guardian_dob_day
        .toString()
        .padStart(2, '0')
      await this.page?.selectOption('#g_dateOfBirth_month', {
        label: guardianMonth,
      })
      await this.page?.fill('#g_dateOfBirth_day', guardianDay)
      await this.page?.fill(
        '#g_dateOfBirth_year',
        this.order.details.guardian_dob_year.toString(),
      )

      // Guardian gender
      const guardianGender = this.order.details.guardian_gender
      await this.page?.click(
        `label[for="${guardianGender === 'male' ? 'maleLgGender' : 'femaleLgGender'}"]`,
      )

      const textToCheck =
        'If the Legal Guardian has a current TTP membership or has a TTP application in progress, provide the PASSID or Application ID below.'
      const isTextVisible = await this.page?.evaluate((text: string) => {
        const elements = Array.from(document.querySelectorAll('body *'))
        const el = elements.find((e) =>
          e.textContent?.includes(text),
        ) as HTMLElement
        return el
          ? getComputedStyle(el).visibility !== 'hidden' &&
              el?.offsetParent !== null
          : false
      }, textToCheck)

      if (isTextVisible) {
        const hasApp = this.order.details.guardian_has_application
        const applicationId = this.order.details.application_id

        if (hasApp === 1) {
          await this.page?.click('#aid_label')
          await this.page?.fill('#g_applicationId', applicationId)
        } else if (hasApp === 2) {
          await this.page?.click('#pid_label')
          await this.page?.fill('#g_passId', applicationId)
        } else {
          await this.page?.click('#none_label')
        }
      }
    }

    await this.clickButtonAndNext(this.button_next)

    if (childTypes.includes(this.order.type)) {
      if (!this.order.details.guardian_has_application) {
        await this.page?.waitForTimeout(5000)
        const modalShown =
          await this.elementExistsContinue('.show .btn-primary')
        if (modalShown) {
          await this.page?.click('.show .btn-primary')
        }
      }

      const guardianModal = await this.elementExistsContinue('#alertModal.show')
      if (guardianModal) {
        return this.endExecution('Unable to verify guardian info')
      }
    }
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

  // -------------------------------------------------------------------------------------
  // Step 9: Documents - Passport
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/application/110394684/documents
  // -------------------------------------------------------------------------------------

  async page_6() {
    const baseUrl = `https://ttp.cbp.dhs.gov/application/${this.application_id}/documents`
    await sleepRandom()

    if (!(await this.rightPage(baseUrl))) return

    await this.page?.waitForSelector('#ddlDocType')

    if (this.isRenewal(this.order?.type) || this.resume_application) {
      const deletionSelectors = [
        'ng-component > .row:nth-of-type(1) .card-panel > .row:nth-of-type(3) #card1_C .card-btns a:nth-of-type(2)',
        'ng-component > .row:nth-of-type(1) .card-panel > .row:nth-of-type(3) #card0_C .card-btns a:nth-of-type(2)',
        'ng-component > .row:nth-of-type(3) #card1_A .card-btns a:nth-of-type(2)',
        'ng-component > .row:nth-of-type(3) #card0_A .card-btns a:nth-of-type(2)',
        'ng-component > .row:nth-child(2) .ttpcard .card-btns a:nth-of-type(2)',
      ]

      for (const selector of deletionSelectors) {
        if (await this.elementExists(selector)) {
          await this.page?.click(selector)
          await sleepRandom(true)
          await this.page?.click('#confirmModal.show .btn-primary')
          await sleepRandom(true)
        }
      }
    }

    await this.page?.selectOption('#ddlDocType', { value: 'PT' })
    await this.page?.click(
      '#app-main-content .row:nth-child(1) .card-panel .row:nth-child(3) .add-card button.btn-primary',
    )
    await sleepRandom(true)

    await this.page?.waitForSelector('div#notifyInfo.show #notifyBtn')
    await this.page?.click('div#notifyInfo.show #notifyBtn')
    await sleepRandom(true)

    const doc = this.order?.details?.document

    await this.page?.fill('#txtLastName0_C', doc.passport_last_name)
    await this.page?.fill('#txtGivenName0_C', doc.passport_first_name)
    await this.page?.fill('#txtMiddleName0_C', doc.passport_middle_name)

    const dobMonth = this.getCorrectMonth(this.order?.details?.dob_month)
    const dobDay = this.padDay(this.order?.details?.dob_day)
    const dobYear = this.order?.details?.dob_year

    await this.page?.selectOption('#dateOfBirthMonth0_C', { label: dobMonth })
    await this.page?.fill('#dateOfBirthDay0_C', dobDay)
    await this.page?.fill('#dateOfBirthYear0_C', dobYear)

    await this.page?.fill(
      '#txtDocNumber0_C',
      await HelperService.decrypt(doc.passport_number),
    )

    const [issuanceMonth, issuanceDay, issuanceYear] = this.splitDate(
      doc.passport_issuance_date,
    )
    const [expirationMonth, expirationDay, expirationYear] = this.splitDate(
      doc.passport_expiration_date,
    )

    await this.page?.selectOption('#dateOfIssuanceMonth0_C', {
      label: issuanceMonth,
    })
    await this.page?.fill('#dateOfIssuanceDay0_C', issuanceDay)
    await this.page?.fill('#dateOfIssuanceYear0_C', issuanceYear)

    await this.page?.selectOption('#expirationMonth0_C', {
      label: expirationMonth,
    })
    await this.page?.fill('#expirationDay0_C', expirationDay)
    await this.page?.fill('#expirationYear0_C', expirationYear)

    if (!['US', 'CA'].includes(doc.country_citizenship)) {
      if (await this.elementExists('#machineReadibleYes')) {
        if (doc.pr_machine_readable === 1) {
          await this.page?.click('#machineReadibleYes')
        } else {
          throw new Error('PR Card does not have a machine readable zone.')
        }
      }

      await sleepRandom(true)
      await this.page?.click(
        '#app-main-content > ng-component > .row:nth-child(2) .add-card button.btn-primary',
      )
      await sleepRandom(true)

      if (await this.elementExists('div#notifyInfo.show #notifyBtn')) {
        await this.page?.click('div#notifyInfo.show #notifyBtn')
        await sleepRandom(true)
      }

      await this.page?.fill('#txtLastName0_L', doc.pr_last_name)
      await this.page?.fill('#txtGivenName0_L', doc.pr_first_name)
      await this.page?.fill('#txtMiddleName0_L', doc.pr_middle_name)

      await this.page?.selectOption('#dateOfBirthMonth0_L', { label: dobMonth })
      await this.page?.fill('#dateOfBirthDay0_L', dobDay)
      await this.page?.fill('#dateOfBirthYear0_L', dobYear)

      await this.page?.fill(
        '#txtDocNumber0_L',
        await HelperService.decrypt(doc.pr_card_number),
      )

      const [prMonth, prDay, prYear] = this.splitDate(doc.pr_expiration_date)

      await this.page?.selectOption('#expirationMonth0_L', { label: prMonth })
      await this.page?.fill('#expirationDay0_L', prDay)
      await this.page?.fill('#expirationYear0_L', prYear)
    }

    await this.clickAndNext(this.page as Page)

    await sleepRandom(true)

    if (await this.rightPage(baseUrl, true)) {
      if (await this.elementExists('#alertModal.show')) {
        await this.page?.click('#alertModal.show .btn-primary')
        await sleepRandom(true)
      }

      if (await this.elementExists('.error-summary')) {
        await this.page?.click('#acceptCitDocument')
      }

      await this.clickAndNext(this.page as Page)
    }
  }

  // -------------------------------------------------------------------------------------
  // Step 10: Documents - Driver's License
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/application/110394684/drivers-license
  // -------------------------------------------------------------------------------------
  // Step 10: Documents - Driver's License
  async page_7() {
    await sleepRandom()

    const isChild =
      [2, 3, 6, 7, 10, 11].includes(this.order?.type) &&
      (((this.dob as number) > this.minimumYears) as any)
    if (isChild) return true

    const url = `https://ttp.cbp.dhs.gov/application/${this.application_id}/drivers-license`
    if (this.page?.url() !== url) {
      await this.page?.goto(url)
      await this.page?.waitForLoadState('domcontentloaded')
    }

    await this.page?.waitForSelector('label[for="haveLicenseYes"]')

    const doc = this.order?.details?.document

    if (doc.dl_number) {
      await this.page?.click('label[for="haveLicenseYes"]')

      // DL Number
      await this.page?.fill(
        '#licenseNumber',
        await HelperService.decrypt(doc.dl_number),
      )

      // Country selection
      const selectedCountry =
        doc.dl_country === 'HK'
          ? this.getCorrectCountryAddressAndEmployment('CH')
          : this.getCorrectCountryAddressAndEmployment(doc.dl_country)

      await this.page?.selectOption(
        '#countryOfIssuance',
        selectedCountry as string,
      )

      // State selection logic
      switch (doc.dl_country) {
        case 'US':
          await this.page?.selectOption(
            '#stateOfIssuance',
            this.getCorrectState(doc.dl_state as any) as any,
          )
          break
        case 'CA':
          await this.page?.selectOption(
            '#stateOfIssuance',
            this.getCorrectCanadaState(doc.dl_state) as any,
          )
          break
        case 'MX':
          const state = doc.dl_state === 'CMX' ? 'MEX' : doc.dl_state
          await this.page?.selectOption(
            '#stateOfIssuance',
            this.getCorrectMexicoState(state) as any,
          )
          break
        default:
          await this.page?.fill('#stateOfIssuance', doc.dl_state)
      }

      // Expiration Date
      const [month, day, year] = doc.dl_expiration_date.split('/')
      await this.page?.selectOption('#DLE_month', this.getCorrectMonth(month))
      await this.page?.fill('#DLE_day', day.padStart(2, '0'))
      await this.page?.fill('#DLE_year', year)

      // DL Name
      await this.page?.fill('#lastName', doc.dl_last_name)
      await this.page?.fill('#firstName', doc.dl_first_name)
      await this.page?.fill('#middleName', doc.dl_middle_name || '')

      // DL DOB
      await this.page?.selectOption(
        '#DLDOB_month',
        this.getCorrectMonth(this.order?.details.dob_month),
      )
      await this.page?.fill(
        '#DLDOB_day',
        String(this.order?.details?.dob_day).padStart(2, '0'),
      )
      await this.page?.fill('#DLDOB_year', this.order?.details?.dob_year)

      // Additional for US & CA
      if (['US', 'CA'].includes(doc.dl_country)) {
        doc.dl_edl == 1
          ? await this.page?.click('label[for="isEDLYes"]')
          : await this.page?.click('label[for="isEDLNo"]')

        if (doc.dl_country === 'US') {
          if (doc.dl_cdl == 1) {
            await this.page?.click('label[for="isCDLYes"]')

            doc.dl_hazmat == 1
              ? await this.page?.click('label[for="isHazmatYes"]')
              : await this.page?.click('label[for="isHazmatNo"]')
          } else {
            await this.page?.click('label[for="isCDLNo"]')
          }
        }
      }
    } else {
      await this.page?.click('label[for="haveLicenseNo"]')
    }

    await this.clickButtonAndNext(
      this.button_next,
      true,
      true,
      `https://ttp.cbp.dhs.gov/application/${this.application_id}/drivers-license`,
    )
  }

  /**
   * Step 11: Vehicle
   * @returns {Promise<void>}
   */
  async page_8(): Promise<void> {
    // Sleep
    await this.sleepRandom()

    // If child application
    if (
      [2, 3, 6, 7, 10, 11].includes(this.order.type) &&
      (this.dob as number) > this.minimumYears
    ) {
      return
    }

    // If NEXUS, skip vehicle
    if (this.order.presenter().serviceName === 'NEXUS') {
      return
    }

    // Check if page correct
    const rightPage = await this.rightPage(
      `https://ttp.cbp.dhs.gov/application/${this.application_id}/vehicle-info`,
    )
    if (!rightPage) {
      return
    }

    // Wait for element to load
    await this.waitForElement('label[for="driveBorderYes"]')

    // Do you plan to drive across the border from Mexico to the United States?
    if (
      this.order.details.vehicle.drive_across_mexico_border &&
      this.order.details.vehicle.register_vehicle
    ) {
      const vehicle = this.order.details.vehicle

      await this.click('label[for="driveBorderYes"]')
      await this.sleepRandom(true)

      await this.click(
        vehicle.vehicle_already_registered
          ? 'label[for="vehicleAlreadyRegisteredYes"]'
          : 'label[for="vehicleAlreadyRegisteredNo"]',
      )

      // Check if the customer already registered
      if (vehicle.vehicle_already_registered) {
        await this.clickButtonAndNext(
          this.button_next,
          true,
          true,
          `https://ttp.cbp.dhs.gov/application/${this.application_id}/vehicle-info`,
        )
        return
      }

      await this.sleepRandom(true)

      if (vehicle.register_vehicle) {
        await this.click('label[for="vehicleRegisterNowYes"]')
      } else {
        await this.click('label[for="vehicleRegisterNowNo"]')
      }

      // check if the customer wants to register the vehicle now
      if (!vehicle.register_vehicle) {
        await this.clickButtonAndNext(
          this.button_next,
          true,
          true,
          `https://ttp.cbp.dhs.gov/application/${this.application_id}/vehicle-info`,
        )
        return
      }

      // If renewal
      if (
        [1, 3, 5, 7, 9, 11].includes(this.order.type) ||
        this.resume_application
      ) {
        // If vehicle
        const selector = '#card0'
        const exists = await this.elementExistsContinue(selector)

        if (exists) {
          // Delete vehicle #1
          await this.click('#card0 .card-btns a:nth-of-type(2)')
          await this.sleepRandom(true)

          await this.click('#confirmModal.show .btn-primary')
        }
      }

      await this.sleepRandom(true)

      await this.click('.add-card .btn-primary')
      await this.sleepRandom(true)

      // Enter Vehicle Details
      const vehicleElements: { [key: string]: string } = {
        make_0: vehicle.vehicle_make,
        model_0: vehicle.vehicle_model,
        year_0: vehicle.vehicle_year,
        color_0: vehicle.vehicle_color,
        vin_0: vehicle.vehicle_vin,
        licensePlateNumber_0: vehicle.vehicle_plate_number,
      }

      for (const [key, value] of Object.entries(vehicleElements)) {
        await this.type(`#${key}`, value)
      }

      await this.select(
        '#licenseCountryOfIssuance_0',
        this.getCorrectCountryAddressAndEmployment(
          vehicle?.vehicle_country,
        ) as string,
      )

      // Government-issued plate question
      if (vehicle.vehicle_country === 'US') {
        await this.click(
          vehicle.vehicle_gov_license_plate
            ? 'label[for="vehicle0GovtLicensePlateYes"]'
            : 'label[for="vehicle0GovtLicensePlateNo"]',
        )

        if (vehicle.vehicle_state) {
          await this.select(
            '#vehicleStateProvinceOfIssuance_0',
            this.getCorrectState(vehicle.vehicle_state) as string,
          )
        }
      } else {
        await this.type(
          '#vehicleStateProvinceOfIssuance_0',
          vehicle.vehicle_state,
        )
      }

      // Vehicle Owner Selection
      const ownerType = ['Applicant', 'Individual', 'Business'][
        vehicle.vehicle_owner
      ]

      await this.click(`label[for="vehicle0WhoOwnsVehicle${ownerType}"]`)

      await this.sleepRandom(true)

      if (ownerType === 'Applicant') {
        await this.clickButtonAndNext(
          this.button_next,
          true,
          true,
          `https://ttp.cbp.dhs.gov/application/${this.application_id}/vehicle-info`,
        )
        return
      }

      let ownerTypeElements: { [key: string]: string }
      if (ownerType === 'Individual') {
        let date: any = this.splitTimeStamp(vehicle.vehicle_owner_dob)
        date.day =
          date.day?.toString()?.length === 1 ? `0${date.day}` : date.day

        ownerTypeElements = {
          ownerFirstName_0: vehicle.vehicle_owner_first_name,
          ownerMiddleName_0: vehicle.vehicle_owner_middle_name,
          ownerLastName_0: vehicle.vehicle_owner_last_name,
          vehicleOwnerDateOfBirthMonth_0: await this.getCorrectMonth(
            date.month,
          ),
          ownerDateOfBirthDay_0: date.day,
          vehicleOwnerDateOfBirthYear_0: date.year,
          vehicleOwnerPhoneNumber_0: HelperService.removeNonNumeric(
            vehicle.vehicle_owner_phone,
          ),
        }
      } else {
        ownerTypeElements = {
          businessName_0: vehicle.vehicle_owner_business_name,
          addressLine1_0: vehicle.vehicle_owner_address,
          city_0: vehicle.vehicle_owner_city,
          postalCode_0: HelperService.formatZipCode(
            vehicle.vehicle_owner_zip_code,
          ),
          vehicleOwnerPhoneNumber_0: HelperService.removeNonNumeric(
            vehicle.vehicle_owner_business_phone,
          ),
        }
      }

      if (ownerType === 'Individual') {
        if (vehicle.vehicle_owner_gender === 'male') {
          await this.click('label[for="vehicle0OwnerGenderMale"]')
        } else {
          await this.click('label[for="vehicle0OwnerGenderFemale"]')
        }
      }

      if (ownerType === 'Business') {
        await this.select(
          '#country_0',
          (await this.getCorrectCountry(
            vehicle.vehicle_owner_country,
            '#country_0',
          )) as string,
        )

        if (vehicle.vehicle_owner_country === 'US') {
          await this.select(
            '#state_0',
            this.getCorrectState(vehicle.vehicle_owner_state) as string,
          )
        } else {
          await this.click('#state_0', vehicle.vehicle_owner_state)
        }
      }

      if (['US', 'CA'].includes(vehicle.vehicle_owner_country)) {
        await this.select('#ownerPhoneNumberFormat_0', 'N')
      } else if (vehicle.vehicle_owner_country === 'MX') {
        await this.select('#ownerPhoneNumberFormat_0', 'M')
      } else {
        await this.select('#ownerPhoneNumberFormat_0', 'I')
      }

      for (const [key, value] of Object.entries(ownerTypeElements)) {
        await this.type(`#${key}`, value)
      }
    } else {
      await this.click('label[for="driveBorderNo"]')
    }

    // Click on Next button
    await this.clickButtonAndNext(
      this.button_next,
      true,
      true,
      `https://ttp.cbp.dhs.gov/application/${this.application_id}/vehicle-info`,
    )
  }

  async page_9() {
    let addressIndex = 0

    // Wait and check if the page is correct
    const rightPage = this.rightPage(
      `https://ttp.cbp.dhs.gov/application/${this.order?.application_id}/address-history`,
    )
    if (!rightPage) return false

    // If renewal or resumption of application
    if (
      [1, 3, 5, 7, 9, 11].includes(this.order?.type) ||
      this.resumeApplication
    ) {
      await this.page?.waitForSelector('#card_0')

      for (let x = 9; x >= 1; x--) {
        const cardSelector = `#card_${x}`
        const exists = await this.page?.isVisible(cardSelector)
        if (exists) {
          await this.page?.click(`${cardSelector} .card-btns a:nth-child(2)`)
          await sleepRandom(true)

          const confirmModal = await this.page?.isVisible(
            '#confirmModal.show #confirmBtn',
          )
          if (confirmModal) {
            await this.page?.click('#confirmModal.show #confirmBtn')
            await sleepRandom(true)
          }
        }
      }
      await sleepRandom(true)
      await this.page?.click('#card_0 .card-btns a:nth-child(1)')
      await sleepRandom(true)
    } else {
      await this.page?.waitForSelector('#startMonth_0')
    }

    // -----------------------------
    // Address 1 - Current/Present
    // -----------------------------
    const [addressMonth1, addressYear1] =
      this.order?.details?.address_from_date_1.split('/')
    const addressCountry1 =
      this.order?.details?.address_country_1 === 'HK'
        ? 'CH'
        : this.order?.details?.address_country_1

    await this.page?.selectOption('#startMonth_0', {
      label: this.getCorrectMonth(addressMonth1),
    })
    await this.page?.fill('#startYear_0', addressYear1)
    await this.page?.click('#card_0 .card-btns a:nth-child(1)')
    await this.page?.selectOption(
      '#country_0',
      (await this.getCorrectCountry(addressCountry1, '#country_0')) as any,
    )
    await this.page?.fill(
      '#addressLine1_0',
      this.formatter.formatAddress(this.order?.details?.address_street_1),
    )
    await this.page?.fill(
      '#city_0',
      this.formatter.formatCity(this.order?.details?.address_city_1),
    )
    await this.page?.fill(
      '#zip_0',
      this.formatter.formatZipCode(this.order?.details?.address_zip_code_1),
    )

    // Handle state based on the country
    switch (this.order?.details?.address_country_1) {
      case 'US':
        await this.page?.selectOption('#state_0', {
          label: this.getCorrectState(
            this.order?.details?.address_state_1,
          ) as any,
        })
        break
      case 'CA':
        await this.page?.selectOption('#state_0', {
          label: this.getCorrectCanadaState(
            this.order?.details?.address_state_1,
          ) as any,
        })
        break
      case 'MX':
        await this.page?.selectOption('#state_0', {
          label: this.getCorrectMexicoState(
            this.order?.details?.address_state_1,
          ) as any,
        })
        break
      default:
        await this.page?.fill('#state_0', this.order?.details?.address_state_1)
    }
    addressIndex++

    // --------------------------
    // Address 2
    // --------------------------
    if (this.order?.details?.address_street_2) {
      await this.page?.click('.add-card button.btn-primary')
      await sleepRandom(true)

      const [addressMonth2, addressYear2] =
        this.order?.details?.address_from_date_2.split('/')
      const addressCountry2 =
        this.order?.details?.address_country_2 === 'HK'
          ? 'CH'
          : this.order?.details?.address_country_2

      await this.page?.selectOption(`#startMonth_${addressIndex}`, {
        label: this.getCorrectMonth(addressMonth2),
      })
      await this.page?.fill(`#startYear_${addressIndex}`, addressYear2)

      // End month and year from the previous address
      await this.page?.selectOption(`#endMonth_${addressIndex}`, {
        label: this.previousAddressEndedMonth,
      })
      await this.page?.fill(
        `#endYear_${addressIndex}`,
        this.previousAddressEndedYear as any,
      )
      await this.page?.click(`#card_${addressIndex} .card-btns a:nth-child(1)`)

      await this.page?.selectOption(`#country_${addressIndex}`, {
        label: this.getCorrectCountry(
          addressCountry2,
          `#country_${addressIndex}`,
        ) as any,
      })
      await this.page?.fill(
        `#addressLine1_${addressIndex}`,
        this.formatter.formatAddress(this.order?.details?.address_street_2),
      )
      await this.page?.fill(
        `#city_${addressIndex}`,
        this.formatter.formatCity(this.order?.details?.address_city_2),
      )
      await this.page?.fill(
        `#zip_${addressIndex}`,
        this.formatter.formatZipCode(this.order?.details?.address_zip_code_2),
      )

      // Handle state based on the country
      switch (this.order?.details?.address_country_2) {
        case 'US':
          await this.page?.selectOption(`#state_${addressIndex}`, {
            label: this.getCorrectState(
              this.order?.details?.address_state_2,
            ) as any,
          })
          break
        case 'CA':
          await this.page?.selectOption(`#state_${addressIndex}`, {
            label: this.getCorrectCanadaState(
              this.order?.details?.address_state_2,
            ) as any,
          })
          break
        case 'MX':
          await this.page?.selectOption(`#state_${addressIndex}`, {
            label: this.getCorrectMexicoState(
              this.order?.details?.address_state_2,
            ) as any,
          })
          break
        default:
          await this.page?.fill(
            `#state_${addressIndex}`,
            this.order?.details?.address_state_2,
          )
      }
      addressIndex++
    }

    // Repeat similar steps for Address 3, 4, 5 as needed...

    // --------------------------
    // Mailing Address
    // --------------------------
    if (this.order?.details?.mailing_street) {
      await this.page?.click('label[for="mailingEqCurrentNo2"]')

      const [mailingMonth, mailingYear] =
        this.order?.details?.mailing_from_date.split('/')
      const mailingCountry =
        this.order?.details?.mailing_country === 'HK'
          ? 'CH'
          : this.order?.details?.mailing_country

      await this.page?.selectOption('select[name="m_startMonth"]', {
        label: this.getCorrectMonth(mailingMonth),
      })
      await this.page?.fill('input[name="m_startYear"]', mailingYear)
      await this.page?.selectOption('#m_country', {
        label: this.getCorrectCountry(mailingCountry, '#m_country') as any,
      })
      await this.page?.fill(
        '#m_addressLine1',
        this.formatter.formatAddress(this.order?.details?.mailing_street),
      )
      await this.page?.fill(
        '#m_city',
        this.formatter.formatCity(this.order?.details?.mailing_city),
      )
      await this.page?.fill(
        '#m_zip',
        this.formatter.formatZipCode(this.order?.details?.mailing_zip_code),
      )

      // Handle state for mailing address
      switch (this.order?.details?.mailing_country) {
        case 'US':
          await this.page?.selectOption('#m_state', {
            label: this.getCorrectState(
              this.order?.details?.mailing_state,
            ) as any,
          })
          break
        case 'CA':
          await this.page?.selectOption('#m_state', {
            label: this.getCorrectCanadaState(
              this.order?.details?.mailing_state,
            ) as any,
          })
          break
        case 'MX':
          await this.page?.selectOption('#m_state', {
            label: this.getCorrectMexicoState(
              this.order?.details?.mailing_state,
            ) as any,
          })
          break
        default:
          await this.page?.fill('#m_state', this.order?.details?.mailing_state)
      }
    } else {
      await this.page?.click('label[for="mailingEqCurrentYes2"]')
    }

    await sleepRandom(true)

    // Proceed to next step
    await this.page?.click(this.button_next)
    await sleepRandom(true)

    // Wait for modal and click confirm
    await this.page?.waitForSelector('div#notifyInfo.show #notifyBtn')
    await this.page?.click('div#notifyInfo.show #notifyBtn')
    await sleepRandom(true)

    // Check for address verification if applicable
    const addressVerificationExists = await this.page?.isVisible('#acceptOptCa')
    if (addressVerificationExists) {
      // Address verification logic here...
    }
  }

  /**
   * Search for occupation name and return status if found
   */
  getEmploymentStatusFromOccupation(occupation: string): number {
    const statuses: Record<number, string> = {
      0: 'employed',
      1: 'selfemployed',
      2: 'retired',
      3: 'unemployed',
      4: 'student',
    }

    // Remove non-alphabet characters and convert to lowercase
    const sanitizedOccupation = occupation.replace(/[^a-z]/gi, '').toLowerCase()

    // Check if occupation exists in statuses
    const statusIndex = Object.values(statuses).indexOf(sanitizedOccupation)

    // If found, return the index, else return 0
    return statusIndex !== -1 ? statusIndex : 0
  }

  /**
   * Select correct employment status
   * @param status - Current employment status
   * @param occupation - Occupation name
   * @returns Correct employment status
   */
  selectCorrectEmploymentStatus(status: number, occupation: string): number {
    // Get the employment status from the occupation
    const occupationStatus = this.getEmploymentStatusFromOccupation(occupation)

    // Return status if it's not 0, otherwise check the occupation status
    if (status !== 0) {
      return status
    } else if (status !== occupationStatus) {
      return occupationStatus
    } else {
      return status
    }
  }

  isChildApplication(
    orderType: number,
    dob: number,
    minimumYears: number,
  ): boolean {
    const childTypes = [2, 3, 6, 7, 10, 11]

    if (
      childTypes.includes(orderType) &&
      moment(dob).isAfter(moment(minimumYears))
    ) {
      return true
    }

    return false
  }

  async fillEmployment2Details(
    order: any,
    employmentIndex: number,
  ): Promise<void> {
    // Employment 2
    if (order?.details?.employment?.employer_from_date_2) {
      employmentIndex++
      await this.click('#addEmploymentButton')
      await this.sleepRandom(true)

      await this.click(`label#current${employmentIndex}`)

      // Select correct employee status
      let employmentStatus2 = this.selectCorrectEmploymentStatus(
        order?.details?.employment?.employment_status_2,
        order?.details?.employment?.employer_occupation_2,
      )
      employmentStatus2 = STATUSES[employmentStatus2] as any
      await this.select(`#status${employmentIndex}`, employmentStatus2 as any)
      await this.sleepRandom(true)

      const employerFrom2 =
        order?.details?.employment?.employer_from_date_2.split('/')
      const employerFromMonth2 = this.getCorrectMonth(employerFrom2[0])
      const employerFromYear2 = employerFrom2[1]

      this.previousJobEndedMonth = employerFromMonth2
      this.previousJobEndedYear = employerFromYear2

      await this.selectByLabel(
        `#startMonth${employmentIndex}`,
        employerFromMonth2,
      )
      await this.sleepRandom(true)

      await this.click(`#editEmployment_${employmentIndex}`)
      await this.type(`#startYear${employmentIndex}`, employerFromYear2)
      await this.click(`#editEmployment_${employmentIndex}`)
      await this.sleepRandom(true)

      await this.selectByLabel(
        `#endMonthDiv${employmentIndex} select[name='endMonth']`,
        this.previousJobEndedMonth,
      )
      await this.click(`#editEmployment_${employmentIndex}`)
      await this.sleepRandom(true)

      await this.type(
        `#endMonthDiv${employmentIndex} input[name='endYear']`,
        this.previousJobEndedYear,
      )
      await this.click(`#editEmployment_${employmentIndex}`)
      await this.sleepRandom(true)

      // If employed or self-employed, we need all the details
      if ([0, 1].includes(order?.details?.employment?.employment_status_2)) {
        let employerCountry2 = ''

        if (order?.details?.employment?.employer_country_5 === 'HK') {
          employerCountry2 = (await this.getCorrectCountryAddressAndEmployment(
            'CH',
          )) as string
        } else {
          employerCountry2 = (await this.getCorrectCountryAddressAndEmployment(
            order?.details?.employment?.employer_country_2,
          )) as string
        }

        await this.select(`#country${employmentIndex}`, employerCountry2)
        await this.sleepRandom(true)

        await this.type(
          `#addressLine1${employmentIndex}`,
          this.formatter.formatAddress(
            order?.details?.employment?.employer_street_2,
          ),
        )
        await this.sleepRandom(true)

        await this.type(
          `#city${employmentIndex}`,
          this.formatter.formatCity(
            order?.details?.employment?.employer_city_2,
          ),
        )
        await this.sleepRandom(true)

        await this.type(
          `#zip${employmentIndex}`,
          this.formatter.formatZipCode(
            order?.details?.employment?.employer_zip_code_2,
          ),
        )
        await this.sleepRandom(true)

        switch (order?.details?.employment?.employer_country_2) {
          case 'US':
            await this.select(
              `#state${employmentIndex}`,
              this.getCorrectState(
                order?.details?.employment?.employer_state_2 as string,
              ) as string,
            )
            break

          case 'CA':
            await this.select(
              `#state${employmentIndex}`,
              this.getCorrectCanadaState(
                order?.details?.employment?.employer_state_2,
              ) as string,
            )
            break

          case 'MX':
            const employerState =
              order?.details?.employment?.employer_state_2 === 'CMX'
                ? 'MEX'
                : order?.details?.employment?.employer_state_2
            await this.select(
              `#state${employmentIndex}`,
              this.getCorrectMexicoState(employerState) as string,
            )
            break

          default:
            await this.type(
              `#stateName${employmentIndex}`,
              order?.details?.employment?.employer_state_2,
              true,
            )
        }

        await this.sleepRandom(true)

        let phoneFormat2 = 'I' // Default
        if (
          order?.details?.employment?.employer_country_2 === 'US' ||
          order?.details?.employment?.employer_country_2 === 'CA'
        ) {
          phoneFormat2 = 'N'
        } else if (order?.details?.employment?.employer_country_2 === 'MX') {
          phoneFormat2 = 'M'
        }

        await this.type(
          `#occupation${employmentIndex}`,
          this.formatter.formatBasic(
            order?.details?.employment?.employer_occupation_2,
          ),
        )
        await this.sleepRandom(true)

        await this.type(
          `#employer${employmentIndex}`,
          this.formatter.formatBasic(
            order?.details?.employment?.employer_employer_2,
          ),
        )
        await this.sleepRandom(true)

        // If international calling code
        if (phoneFormat2 === 'I') {
          const callingCode = (
            HelperService.getCountryCallingCodes() as Record<string, number>
          )[order?.details?.employment?.employer_country_2 as string]
          await this.type(`#countryCode${employmentIndex}`, callingCode)
        }

        await this.sleepRandom(true)
      }
    }
  }

  async fillEmploymentDetails(order: any): Promise<void> {
    // If employed or self-employed, we need all the details
    if ([0, 1].includes(order?.details?.employment?.employment_status_1)) {
      let employerCountry1 = ''

      if (order.details.employment.employer_country_1 === 'HK') {
        employerCountry1 = (await this.getCorrectCountryAddressAndEmployment(
          'CH',
        )) as string
      } else {
        employerCountry1 = (await this.getCorrectCountryAddressAndEmployment(
          order?.details?.employment?.employer_country_1,
        )) as string
      }

      await this.select('#country0', employerCountry1)
      await this.sleepRandom(true)

      await this.type(
        '#addressLine10',
        this.formatter.formatAddress(
          order?.details?.employment?.employer_street_1,
        ),
      )
      await this.sleepRandom(true)

      await this.type(
        '#city0',
        this.formatter.formatCity(order?.details?.employment?.employer_city_1),
      )
      await this.sleepRandom(true)

      await this.type(
        '#zip0',
        this.formatter.formatZipCode(
          order?.details?.employment?.employer_zip_code_1,
        ),
      )
      await this.sleepRandom(true)

      switch (order?.details?.employment?.employer_country_1) {
        case 'US':
          await this.select(
            '#state0',
            this.getCorrectState(
              order?.details?.employment?.employer_state_1,
            ) as string,
          )
          break

        case 'CA':
          await this.select(
            '#state0',
            this.getCorrectCanadaState(
              order?.details?.employment?.employer_state_1,
            ) as string,
          )
          break

        case 'MX':
          const employerState =
            order?.details?.employment?.employer_state_1 === 'CMX'
              ? 'MEX'
              : order?.details?.employment?.employer_state_1
          await this.select(
            '#state0',
            this.getCorrectMexicoState(employerState) as string,
          )
          break

        default:
          await this.type(
            '#stateName0',
            order?.details?.employment?.employer_state_1,
            true,
          )
      }

      await this.sleepRandom(true)

      let phoneFormat1 = 'I' // Default
      if (
        order?.details?.employment?.employer_country_1 === 'US' ||
        order?.details?.employment?.employer_country_1 === 'CA'
      ) {
        phoneFormat1 = 'N'
      } else if (order?.details?.employment?.employer_country_1 === 'MX') {
        phoneFormat1 = 'M'
      }

      await this.type(
        '#occupation0',
        this.formatter.formatBasic(
          order?.details?.employment?.employer_occupation_1,
        ),
      )
      await this.sleepRandom(true)

      await this.type(
        '#employer0',
        this.formatter.formatBasic(
          order?.details?.employment?.employer_employer_1,
        ),
      )
      await this.sleepRandom(true)

      await this.select('#phoneFormat0', phoneFormat1)
      await this.sleepRandom(true)

      await this.type(
        '#phoneNumber0',
        HelperService.removeNonNumeric(
          order?.details?.employment?.employer_phone_number_1,
        ),
      )
      await this.sleepRandom(true)

      // If international calling code
      if (phoneFormat1 === 'I') {
        const callingCode = (
          HelperService.getCountryCallingCodes() as Record<string, number>
        )[order?.details?.employment?.employer_country_1]
        await this.type('#countryCode0', callingCode)
      }
    }
  }

  async fillEmployment5Details(
    order: any,
    employmentIndex: number,
  ): Promise<void> {
    // Employment 5
    if (order.details.employment.employer_from_date_5) {
      await this.click('#addEmploymentButton')
      employmentIndex++ // Increment the employment index

      if (
        !(await this.elementExistsContinue(`label#current${employmentIndex}`))
      ) {
        // If employment modal isn't open, click on 'Add employment' button to open it
        await this.click('#addEmploymentButton')
      }

      await this.sleepRandom(true)
      await sleep(30)

      await this.click(`label#current${employmentIndex}`)
      await sleep(10)

      // Select correct employee status
      let employmentStatus5 = this.selectCorrectEmploymentStatus(
        order.details.employment.employment_status_5,
        order.details.employment.employer_occupation_5,
      )
      employmentStatus5 = STATUSES[employmentStatus5] as any
      await this.select(`#status${employmentIndex}`, employmentStatus5 as any)

      await sleep(10)

      const employerFrom5 =
        order.details.employment.employer_from_date_5.split('/')
      const employerFromMonth5 = this.getCorrectMonth(employerFrom5[0])
      const employerFromYear5 = employerFrom5[1]

      await this.selectByLabel(
        `#startMonth${employmentIndex}`,
        employerFromMonth5,
      )
      await sleep(10)

      await this.click(`#editEmployment_${employmentIndex}`)
      await sleep(10)

      await this.type(`#startYear${employmentIndex}`, employerFromYear5)
      await sleep(10)

      await this.click(`#editEmployment_${employmentIndex}`)
      await sleep(10)

      await this.selectByLabel(
        `#endMonthDiv${employmentIndex} select[name='endMonth']`,
        this.previousJobEndedMonth,
      )
      await sleep(10)

      await this.click(`#editEmployment_${employmentIndex}`)
      await sleep(10)

      await this.type(
        `#endMonthDiv${employmentIndex} input[name='endYear']`,
        this.previousJobEndedYear,
      )
      await sleep(10)

      await this.click(`#editEmployment_${employmentIndex}`)
      await sleep(10)

      let employerCountry5 = ''

      // If employed or self-employed, we need all the details
      if ([0, 1].includes(order.details.employment.employment_status_5)) {
        if (order.details.employment.employer_country_5 === 'HK') {
          employerCountry5 = (await this.getCorrectCountryAddressAndEmployment(
            'CH',
          )) as string
        } else {
          employerCountry5 = (await this.getCorrectCountryAddressAndEmployment(
            order.details.employment.employer_country_5,
          )) as string
        }

        await this.select(`#country${employmentIndex}`, employerCountry5)
        await sleep(10)

        await this.type(
          `#addressLine1${employmentIndex}`,
          this.formatter.formatAddress(
            order.details.employment.employer_street_5,
          ),
        )
        await sleep(10)

        await this.type(
          `#city${employmentIndex}`,
          this.formatter.formatCity(order.details.employment.employer_city_5),
        )
        await sleep(10)

        await this.type(
          `#zip${employmentIndex}`,
          this.formatter.formatZipCode(
            order.details.employment.employer_zip_code_5,
          ),
        )
        await sleep(10)

        switch (order.details.employment.employer_country_5) {
          case 'US':
            await this.select(
              `#state${employmentIndex}`,
              this.getCorrectState(
                order.details.employment.employer_state_5,
              ) as string,
            )
            break
          case 'CA':
            await this.select(
              `#state${employmentIndex}`,
              this.getCorrectCanadaState(
                order.details.employment.employer_state_5,
              ) as string,
            )
            break
          case 'MX':
            if (order.details.employment.employer_state_5 === 'CMX') {
              await this.select(
                `#state${employmentIndex}`,
                this.getCorrectMexicoState('MEX') as string,
              )
            } else {
              await this.select(
                `#state${employmentIndex}`,
                this.getCorrectMexicoState(
                  order.details.employment.employer_state_5,
                ) as string,
              )
            }
            break
          default:
            await this.type(
              `#stateName${employmentIndex}`,
              order.details.employment.employer_state_5,
              true,
            )
        }

        await sleep(10)

        let phoneFormat5 = 'I' // Default format
        if (
          order.details.employment.employer_country_5 === 'US' ||
          order.details.employment.employer_country_5 === 'CA'
        ) {
          phoneFormat5 = 'N'
        } else if (order.details.employment.employer_country_5 === 'MX') {
          phoneFormat5 = 'M'
        }

        await sleep(10)

        await this.click(`#editEmployment_${employmentIndex}`)
        await sleep(10)

        await this.type(
          `#occupation${employmentIndex}`,
          this.formatter.formatBasic(
            order.details.employment.employer_occupation_5,
          ),
        )
        await this.type(
          `#employer${employmentIndex}`,
          this.formatter.formatBasic(
            order.details.employment.employer_employer_5,
          ),
        )
        await sleep(10)

        // If international calling code
        // if (phoneFormat5 === 'I') {
        //   const callingCode = await this.getCountryCallingCode(order.details.employment.employer_country_5);
        //   await this.type(`#countryCode${employmentIndex}`, callingCode);
        // }
      }
    }
  }

  async fillEmployment4Details(
    order: any,
    employmentIndex: number,
  ): Promise<void> {
    // Employment 4
    if (order.details.employment.employer_from_date_4) {
      await this.click('#addEmploymentButton')
      employmentIndex++ // Increment the employment index

      await this.sleepRandom(true)

      if (
        !(await this.elementExistsContinue(`label#current${employmentIndex}`))
      ) {
        // If employment modal isn't open, click on 'Add employment' button to open it
        await this.click('#addEmploymentButton')
      }
      await this.click(`label#current${employmentIndex}`)

      await this.sleepRandom(true)

      // Select correct employee status
      let employmentStatus4 = this.selectCorrectEmploymentStatus(
        order.details.employment.employment_status_4,
        order.details.employment.employer_occupation_4,
      )
      employmentStatus4 = STATUSES[employmentStatus4] as any
      await this.select(`#status${employmentIndex}`, employmentStatus4 as any)

      await this.sleepRandom(true)

      const employerFrom4 =
        order.details.employment.employer_from_date_4.split('/')
      const employerFromMonth4 = this.getCorrectMonth(employerFrom4[0])
      const employerFromYear4 = employerFrom4[1]

      await this.selectByLabel(
        `#startMonth${employmentIndex}`,
        employerFromMonth4,
      )
      await this.click(`#editEmployment_${employmentIndex}`)

      await this.sleepRandom(true)

      await this.type(`#startYear${employmentIndex}`, employerFromYear4)
      await this.sleepRandom(true)

      await this.click(`#editEmployment_${employmentIndex}`)
      await this.sleepRandom(true)

      await this.selectByLabel(
        `#endMonthDiv${employmentIndex} select[name='endMonth']`,
        this.previousJobEndedMonth,
      )
      await this.click(`#editEmployment_${employmentIndex}`)
      await this.sleepRandom(true)

      await this.type(
        `#endMonthDiv${employmentIndex} input[name='endYear']`,
        this.previousJobEndedYear,
      )
      await this.click(`#editEmployment_${employmentIndex}`)
      await this.sleepRandom(true)

      this.previousJobEndedMonth = employerFromMonth4
      this.previousJobEndedYear = employerFromYear4

      // If employed or self-employed, we need all the details
      if ([0, 1].includes(order.details.employment.employment_status_4)) {
        let employerCountry4 = await this.getCorrectCountryAddressAndEmployment(
          order.details.employment.employer_country_4,
        )
        let employerCountry5 = ''

        if (order.details.employment.employer_country_4 === 'HK') {
          employerCountry5 = (await this.getCorrectCountryAddressAndEmployment(
            'CH',
          )) as string
        } else {
          employerCountry5 = (await this.getCorrectCountryAddressAndEmployment(
            order.details.employment.employer_country_4,
          )) as string
        }

        await this.select(
          `#country${employmentIndex}`,
          employerCountry4 as string,
        )
        await this.sleepRandom(true)

        await this.type(
          `#addressLine1${employmentIndex}`,
          this.formatter.formatAddress(
            order.details.employment.employer_street_4,
          ),
        )
        await this.sleepRandom(true)

        await this.type(
          `#city${employmentIndex}`,
          this.formatter.formatCity(order.details.employment.employer_city_4),
        )
        await this.sleepRandom(true)

        await this.type(
          `#zip${employmentIndex}`,
          this.formatter.formatZipCode(
            order.details.employment.employer_zip_code_4,
          ),
        )
        await this.sleepRandom(true)

        switch (order.details.employment.employer_country_4) {
          case 'US':
            await this.select(
              `#state${employmentIndex}`,
              this.getCorrectState(
                order.details.employment.employer_state_4,
              ) as string,
            )
            break
          case 'CA':
            await this.select(
              `#state${employmentIndex}`,
              this.getCorrectCanadaState(
                order.details.employment.employer_state_4,
              ) as string,
            )
            break
          case 'MX':
            if (order.details.employment.employer_state_4 === 'CMX') {
              await this.select(
                `#state${employmentIndex}`,
                this.getCorrectMexicoState('MEX') as string,
              )
            } else {
              await this.select(
                `#state${employmentIndex}`,
                this.getCorrectMexicoState(
                  order.details.employment.employer_state_4,
                ) as string,
              )
            }
            break
          default:
            await this.type(
              `#stateName${employmentIndex}`,
              order.details.employment.employer_state_4,
              true,
            )
        }

        await this.sleepRandom(true)

        let phoneFormat4 = 'I' // Default format
        if (
          order.details.employment.employer_country_4 === 'US' ||
          order.details.employment.employer_country_4 === 'CA'
        ) {
          phoneFormat4 = 'N'
        } else if (order.details.employment.employer_country_4 === 'MX') {
          phoneFormat4 = 'M'
        }

        await this.sleepRandom(true)

        await this.click(`#editEmployment_${employmentIndex}`)
        await this.sleepRandom(true)

        await this.type(
          `#occupation${employmentIndex}`,
          this.formatter.formatBasic(
            order.details.employment.employer_occupation_4,
          ),
        )
        await this.sleepRandom(true)

        await this.type(
          `#employer${employmentIndex}`,
          this.formatter.formatBasic(
            order.details.employment.employer_employer_4,
          ),
        )
        await this.sleepRandom(true)

        // If international calling code
        // if (phoneFormat4 === 'I') {
        //   const callingCode = await this.getCountryCallingCode(order.details.employment.employer_country_4);
        //   await this.type(`#countryCode${employmentIndex}`, callingCode);
        //   await this.sleepRandom(true);
        // }
      }
    }
  }

  // -------------------------------------------------------------------------------------
  // Step 13: Employment
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/application/110394684/employment-history
  // -------------------------------------------------------------------------------------
  async page_10() {
    // Sleep
    await this.sleepRandom()
    let employmentIndex = 0
    // If child application
    // if (in_array($this->order->type, [2, 3, 6, 7, 10, 11]) && $this->dob->greaterThan($this->minimum_years)) {
    // return true;
    // }
    if (
      this.isChildApplication(
        this.order.type,
        this.dob as any,
        this.minimumYears,
      )
    )
      return true

    // Check if page correct
    const right_page = await this.rightPage(
      `https://ttp.cbp.dhs.gov/application/${this.application_id}/employment-history`,
    )
    if (!right_page) return false

    // Wait for element to load
    await this.waitForElement('#addEmploymentButton')

    if (
      [1, 3, 5, 7, 9, 11].includes(this.order.type) ||
      this.resumeApplication
    ) {
      for (let x = 9; x >= 0; x--) {
        const selector = `#card${x}`
        const exists = await this.elementExistsContinue(selector)

        if (exists) {
          await this.click(`${selector} .card-btns a:nth-child(2)`)
          await this.page?.waitForTimeout(10000) // Equivalent of sleep(10)

          const confirmExists = await this.elementExistsContinue(
            '#confirmModal.show #confirmBtn',
          )
          if (confirmExists) {
            await this.click('#confirmModal.show #confirmBtn')
            await this.sleepRandom(true)
          }
        }
      }
    }

    // -------------------------------
    // Employment 1 - Current/Present
    // -------------------------------
    await this.click('#addEmploymentButton')

    await this.sleepRandom(true)

    const statuses: Record<number, string> = {
      0: 'E', // Employed
      1: 'F', // Self-Employed
      2: 'R', // Retired
      3: 'U', // Unemployed
      4: 'S', // Student
    }
    // Select correct employee status
    const employment_status = this.selectCorrectEmploymentStatus(
      this.order?.details?.employment?.employment_status_1,
      this?.order?.details?.employment?.employer_occupation_1,
    )
    const employment_status_1 = statuses[employment_status]
    await this.select('#status0', employment_status_1)
    await sleep(10)
    const employer_from_1 =
      this.order?.details?.employment?.employer_from_date_1.split('/')
    const employer_from_month_1 = this.getCorrectMonth(employer_from_1[0])
    const employer_from_year_1 = employer_from_1[1]

    await this.selectByLabel('#startMonth0', employer_from_month_1)
    await sleep(10)

    await this.type('#startYear0', employer_from_year_1)
    await sleep(10)

    this.previousJobEndedMonth = employer_from_month_1
    this.previousJobEndedYear = employer_from_year_1

    await this.fillEmploymentDetails(this.order)

    // --------------------------
    // Employment 2
    // --------------------------
    await this.fillEmployment2Details(this.order, employmentIndex)

    // --------------------------
    // Employment 3
    // --------------------------
    if (this.order?.details?.employment?.employer_from_date_3) {
      await this.click('#addEmploymentButton')
      employmentIndex++ // Increment the employment index

      await this.sleepRandom(true)
      if (
        !(await this.elementExistsContinue('label#current{$employmentIndex}'))
      ) {
        //If employment modal isn't open, click on 'Add employment' button to open it
        await this.click('#addEmploymentButton')
      }
      await this.click(`label#current${employmentIndex}`)
      await sleep(10)

      // Select correct employee status
      let employment_status_3: string | number =
        this.selectCorrectEmploymentStatus(
          this?.order?.details?.employment?.employment_status_3,
          this.order?.details?.employment?.employer_occupation_3,
        )
      employment_status_3 = STATUSES[employment_status_3]
      await this.select('#status{$employmentIndex}', employment_status_3)

      let employer_from_3: string[] | number[] =
        this?.order?.details?.employment?.employer_from_date_3.split('/')
      const employer_from_month_3 = this.getCorrectMonth(
        employer_from_3[0] as number,
      )
      const employer_from_year_3 = employer_from_3[1]
      await sleep(10)
      await this.selectByLabel(
        `#startMonth${employmentIndex}`,
        employer_from_month_3,
      )
      sleep(10)

      await this.click(`#editEmployment_${employmentIndex}`)
      await sleep(10)
      await this.type(`#startYear${employmentIndex}`, employer_from_year_3)
      await sleep(10)

      await this.click(`#editEmployment_${employmentIndex}`)
      await sleep(10)
      await this.selectByLabel(
        `#endMonthDiv${employmentIndex} select[name='endMonth']`,
        this.previousJobEndedMonth,
      )
      await sleep(10)

      await this.click(`#editEmployment_${employmentIndex}`)
      await sleep(10)
      await this.type(
        `#endMonthDiv${employmentIndex} input[name='endYear']`,
        this.previousJobEndedYear,
      )
      await sleep(10)

      await this.click(`#editEmployment_${employmentIndex}`)
      await sleep(10)

      this.previousJobEndedMonth = employer_from_month_3
      this.previousJobEndedYear = employer_from_year_3

      // If employed or self-employed, we need all the details
      if (
        [0, 1].includes(this?.order?.details?.employment?.employment_status_3)
      ) {
        let employer_country_3: string | undefined | false = ''
        if (this.order.details?.employment?.employer_country_3 === 'HK') {
          employer_country_3 = this.getCorrectCountryAddressAndEmployment(
            'CH',
          ) as string
        } else {
          employer_country_3 = this.getCorrectCountryAddressAndEmployment(
            this.order.details?.employment?.employer_country_3,
          )
        }
        await this.select(
          `#country${employmentIndex}`,
          employer_country_3 as string,
        )
        await sleep(10)
        await this.type(
          `#addressLine1${employmentIndex}`,
          this.formatter.formatAddress(
            this.order.details?.employment?.employer_street_3,
          ),
        )
        await sleep(10)
        await this.type(
          `#city${employmentIndex}`,
          this.formatter.formatCity(
            this.order.details?.employment?.employer_city_3,
          ),
        )
        await sleep(10)
        await this.type(
          `#zip${employmentIndex}`,
          this.formatter.formatZipCode(
            this.order?.details?.employment?.employer_zip_code_3,
          ),
        )
        await sleep(10)

        switch (this.order?.details?.employment?.employer_country_3) {
          case 'US':
            await this.select(
              `#state${employmentIndex}`,
              this.getCorrectState(
                this.order?.details?.employment?.employer_state_3,
              ) as string,
            )
            break
          case 'CA':
            await this.select(
              `#state${employmentIndex}`,
              this.getCorrectCanadaState(
                this.order?.details?.employment?.employer_state_3,
              ) as string,
            )
            break
          case 'MX':
            if (this.order?.details?.employment?.employer_state_3 == 'CMX') {
              await this.select(
                `#state${employmentIndex}`,
                this.getCorrectMexicoState('MEX') as string,
              )
            } else {
              await this.select(
                `#state${employmentIndex}`,
                this.getCorrectMexicoState(
                  this.order?.details?.employment?.employer_state_3,
                ) as string,
              )
            }
            break
          default:
            await this.type(
              `#stateName${employmentIndex}`,
              this.order?.details?.employment?.employer_state_3,
              true,
            )
        }
        let phone_format_3 = ''
        await sleep(10)
        if (
          this.order?.details.employment.employer_country_3 == 'US' ||
          this.order?.details?.employment?.employer_country_3 == 'CA'
        ) {
          phone_format_3 = 'N'
        } else if (
          this.order?.details?.employment?.employer_country_3 == 'MX'
        ) {
          phone_format_3 = 'M'
        } else {
          phone_format_3 = 'I'
        }

        await this.type(
          `#occupation${employmentIndex}`,
          this.formatter.formatBasic(
            this.order?.details?.employment?.employer_occupation_3,
          ),
        )
        await sleep(10)
        this.type(
          `#employer${employmentIndex}`,
          this.formatter.formatBasic(
            this.order?.details?.employment?.employer_employer_3,
          ),
        )
        await sleep(10)

        // If international calling code
        // if ($phone_format_3 == 'I') {
        //     $calling_code = $this?.getCountryCallingCode($this->order->details->employment->employer_country_3);
        //     $this->type("#countryCode{$employmentIndex}", $calling_code);
        // }
        await sleep(10)
      }
    }

    // --------------------------
    // Employment 4
    // --------------------------
    await this.fillEmployment4Details(this.order, employmentIndex)
    // --------------------------
    // Employment 5
    // --------------------------

    await this.fillEmployment5Details(this.order, employmentIndex)

    // Click on next button
    await this.click(this.button_next)

    await this.sleepRandom(true)

    let modal_exists = await this.elementExistsContinue(
      'div#notifyInfo.show #notifyBtn',
    )
    if (modal_exists) {
      await this.waitForElement('div#notifyInfo.show #notifyBtn')
      await this.click('div#notifyInfo.show #notifyBtn')

      await this.sleepRandom(true)
      // Click on Next button
    }
    const same_page = await this.rightPage(
      `https://ttp.cbp.dhs.gov/application/${this.application_id}/employment-history`,
      true,
      true,
    )

    const modal = await this.elementExistsContinue(
      'div#notifyInfo.show #notifyBtn',
    )
    if (!modal && same_page) {
      await this.clickButtonAndNext(
        this.button_next,
        false,
        true,
        `https://ttp.cbp.dhs.gov/application/${this.application_id}/employment-history`,
      )
      await this.sleepRandom(true)
    }

    await this.sleepRandom(true)
    const same_page2 = await this.rightPage(
      `https://ttp.cbp.dhs.gov/application/${this.application_id}/employment-history`,
      true,
      true,
    )

    // If still on same page due to error
    if (same_page2) {
      modal_exists = await this.elementExistsContinue(
        'div#notifyInfo.show #notifyBtn',
      )

      if (modal_exists) {
        // Click OK to verify address on modal
        await this.click('div#notifyInfo.show #notifyBtn')

        await this.sleepRandom(true)
      }

      // If error occured
      const error_exists = await this.elementExistsContinue('.error-summary')

      if (error_exists) {
        await this.click('.error-summary label')

        await this.sleepRandom(true)

        // Click on next button
        await this.click(this.button_next)

        await this.sleepRandom(true)

        modal_exists = await this.elementExistsContinue(
          'div#notifyInfo.show #notifyBtn',
        )

        if (modal_exists) {
          // Click OK to verify address on modal
          await this.click('div#notifyInfo.show #notifyBtn')

          await this.sleepRandom(true)

          // Click on Next button
          await this.clickButtonAndNext(this.button_next)
        }
      } else {
        // Click on Next button
        await this.clickButtonAndNext(this.button_next, false)
      }
    }

    // If still on same page, click next button again
    const element_exists = await this.elementExistsContinue(
      '#addEmploymentButton',
    )

    if (element_exists) {
      // Click on Next button
      await this.clickButtonAndNext(this.button_next, false)
    }
  }

  // -------------------------------------------------------------------------------------
  // Step 14: Travel History
  // https://ttp.cbp.dhs.gov/application/110394684/travel-history
  // -------------------------------------------------------------------------------------

  async page_11(): Promise<boolean> {
    await sleepRandom()

    const url = `https://ttp.cbp.dhs.gov/application/${this.application_id}/travel-history`
    const onRightPage = await this.rightPage(url)
    if (!onRightPage) return false

    await this.waitForElement('label[for="haveYouTraveledYes"]')

    const countriesVisitedRaw = this.order?.details?.countries_visited

    if (countriesVisitedRaw) {
      await this.page?.click('label[for="haveYouTraveledYes"]')

      const countries: string[] = JSON.parse(countriesVisitedRaw as any)
      const allCountries = HelperService.getCountriesAlt() as Record<
        string,
        string
      >

      for (const country of countries) {
        const countryName = allCountries[country]
        if (!countryName) continue

        const selector = `//selectmore//button[normalize-space()="${countryName}"]`
        const elements = await this.page?.$$(selector)
        if ((elements?.length as number) > 0) {
          await elements?.[0].click()
          await sleepRandom(true)
        }
      }
    } else {
      await this.page?.click('label[for="haveYouTraveledNo"]')
    }

    await this.clickButtonAndNext(this.button_next, true, true, url)

    return true
  }

  // -------------------------------------------------------------------------------------
  // Step 15: Additional Information
  // https://ttp.cbp.dhs.gov/application/110394684/additional-info
  // -------------------------------------------------------------------------------------

  async page_12(): Promise<boolean> {
    await sleepRandom()

    const url = `https://ttp.cbp.dhs.gov/application/${this.application_id}/additional-info`
    const isCorrectPage = await this.rightPage(url)
    if (!isCorrectPage) return false

    await this.waitForElement('label#question_0_yes_label')

    const details = this.order?.details

    // Question 0: Criminal offense
    if (details.convicted_criminal === 1) {
      await this.page?.click('label#question_0_yes_label')

      const countryFieldExists = await this.elementExists('#question_0_country')
      if (countryFieldExists) {
        const correctCountry = await this.getCorrectCountry(
          details.convicted_criminal_country,
          '#question_0_country',
        )
        await this.page?.selectOption(
          '#question_0_country',
          correctCountry as string,
        )
      }

      await this.page?.fill(
        '#question_0_required_details',
        details.convicted_criminal_details ?? '',
      )
    } else {
      await this.page?.click('label#question_0_no_label')
    }

    // Question 1: Waiver of inadmissibility
    if (details.waiver_inadmissibility === 1) {
      await this.page?.click('label#question_1_yes_label')
      await this.page?.fill(
        '#question_1_required_details',
        details.waiver_inadmissibility_details ?? '',
      )
    } else {
      await this.page?.click('label#question_1_no_label')
    }

    // Question 2: Violation of customs laws
    if (details.violation_customs_laws === 1) {
      await this.page?.click('label#question_2_yes_label')
      await this.page?.fill(
        '#question_2_required_details',
        details.violation_customs_laws_details ?? '',
      )
    } else {
      await this.page?.click('label#question_2_no_label')
    }

    // Question 3: Violation of immigration laws
    if (details.violation_immigration_laws === 1) {
      await this.page?.click('label#question_3_yes_label')
      await this.page?.fill(
        '#question_3_required_details',
        details.violation_immigration_laws_details ?? '',
      )
    } else {
      await this.page?.click('label#question_3_no_label')
    }

    await this.clickButtonAndNext(this.button_next, true, true, url)
    return true
  }

  // -------------------------------------------------------------------------------------
  // Step 16: Final Review
  // https://ttp.cbp.dhs.gov/application/110394684/final-review
  // -------------------------------------------------------------------------------------

  async page_13(): Promise<boolean> {
    await sleepRandom()

    const url = `https://ttp.cbp.dhs.gov/application/${this.application_id}/final-review`
    const isCorrectPage = await this.rightPage(url)
    if (!isCorrectPage) return false

    await this.waitForElement('#confirmPersonal')

    await this.page?.click('#confirmPersonal')
    await sleepRandom(true)

    await this.page?.click('#confirmDocuments')
    await sleepRandom(true)

    const isAdult = (this.dob as unknown as number) < this.minimumYears

    if (isAdult) {
      await this.page?.click('#confirmLicense')
      await sleepRandom(true)
    }

    const isNexusOrGE =
      isAdult &&
      ['Global Entry', 'SENTRI'].includes(this.order?.presenter()?.serviceName)
    if (isNexusOrGE) {
      await this.page?.click('#confirmVehicle')
      await sleepRandom(true)
    }

    await this.page?.click('#confirmAddress')
    await sleepRandom(true)

    if (isAdult) {
      await this.page?.click('#confirmEmployment')
      await sleepRandom(true)
    }

    await this.page?.click('#confirmTravel')
    await sleepRandom(true)

    await this.page?.click('#confirmAdditional')
    await sleepRandom(true)

    await this.clickButtonAndNext(this.button_next, true, true, url)

    return true
  }

  // -------------------------------------------------------------------------------------
  // Step 17: Certify and Pay
  // https://ttp.cbp.dhs.gov/application/110394684/program-certification
  // -------------------------------------------------------------------------------------

  async page_14(): Promise<boolean> {
    await sleepRandom()

    const url = `https://ttp.cbp.dhs.gov/application/${this.application_id}/program-certification`
    const isCorrectPage = await this.rightPage(url)
    if (!isCorrectPage) return false

    await this.waitForElement('label[for="acknowledgeFBI"]')

    await this.page?.click('label[for="acknowledgeFBI"]')
    await sleepRandom(true)

    await this.page?.click('label[for="accepted_yes"]')
    await sleepRandom(true)

    await this.clickButtonAndNext(this.button_next, true, true, url)

    return true
  }

  // -------------------------------------------------------------------------------------
  // Step 18: Purchase Summary
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/purchase-summary
  // -------------------------------------------------------------------------------------
  async page_15() {
    await this.botPaymentService.payment_page_1()
  }

  // -------------------------------------------------------------------------------------
  // Step 19: Payment Method Page
  // -------------------------------------------------------------------------------------
  // https://www.pay.gov/tcsonline/payment.do?execution=e1s1
  // -------------------------------------------------------------------------------------
  async page_16() {
    await this.botPaymentService.payment_page_2()
  }

  // -------------------------------------------------------------------------------------
  // Step 20: Payment Method Page
  // -------------------------------------------------------------------------------------
  // https://www.pay.gov/tcsonline/payment.do?execution=e1s2
  // -------------------------------------------------------------------------------------
  async page_17() {
    // await this.botPaymentService.payment_page_3()
    await this.botPaymentService.paymentPage3()
  }

  // -------------------------------------------------------------------------------------
  // Step 21: Payment Method Page
  // -------------------------------------------------------------------------------------
  // https://www.pay.gov/tcsonline/payment.do?execution=e1s3
  // -------------------------------------------------------------------------------------
  async page_18() {
    await this.botPaymentService.paymentPage4()
  }

  // -------------------------------------------------------------------------------------
  // Step 22: Dashboard
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/dashboard
  // -------------------------------------------------------------------------------------
  async page_19() {
    await this.botPaymentService.paymentPage5()
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

  /**
   * Return correct state in the proper format
   * @return string | false
   */
  private getCorrectState(state: string): string | false {
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

  getCorrectCountryCitizenship(country: string): string | false {
    const countries: Record<string, string> = CORRECT_COUNTRY_CITIZENSHIPS

    return countries[country] ?? false
  }
}
