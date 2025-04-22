import { Page } from 'playwright'
import { config } from '../config'
import {
  BotConstructorParams,
  Formatter,
  logger,
  PAGE_13_SELECTORS,
  PAGE_4B_SELECTORS,
  PAGE_4C_SELECTORS,
  PAGE_4D_1_SELECTORS,
  PAGE_4D_SELECTORS,
  PAGE_5_SELECTORS,
  PAGE_6_SELECTORS,
  PAGE_7_SELECTORS,
  PAGE_8_SELECTORS,
  sleep,
  sleepRandom,
} from '../lib'
import { SELECT_PROGRAM_PAGE_URL, STEP_THREE_DONE_URL } from '../lib/constants'
import { BotLoginService } from './BotLogin'
import { BotPaymentService } from './BotPayment'
import { BotUtilities } from './BotUtilities'
import { HelperService } from './HelperService'
import { OrderService } from './Order'

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

  constructor({
    page,
    order,
    browser,
    delay,
    botType,
    button_next,
    application_id,
    minimumYears,
    resumeApplication,
    previousAddressEndedMonth,
    previousAddressEndedYear,
  }: BotConstructorParams) {
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
      ? parseInt(config('APPLICATION_BOT_INSTANCES_AFTER') || '4')
      : parseInt(config('APPLICATION_BOT_INSTANCES_NORMAL') || '0')

    if (totalInstances >= maxInstances) return false

    // Get order to work on
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
    const right_page = await this.rightPage(STEP_THREE_DONE_URL)
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
    await this.sleepRandom()

    const right_page = await this.rightPage(
      SELECT_PROGRAM_PAGE_URL,
      false,
      false,
    )
    if (!right_page) return false

    await this.waitForElement(PAGE_4B_SELECTORS.areCitizenYes)

    if (this.order?.details?.document?.country_citizenship == 'US') {
      await this.click(PAGE_4B_SELECTORS.areCitizenYes)
    } else {
      await this.click(PAGE_4B_SELECTORS.areCitizenNo)
      await this.sleepRandom(true)

      let country_citizenship =
        this.order?.details?.document?.country_citizenship
      if (country_citizenship == 'HK') {
        country_citizenship = 'CH'
      }

      await this.sleepRandom(true)
      await this.select(
        PAGE_4B_SELECTORS.countryOfCitizenship,
        this.getCorrectCountryCitizenship(country_citizenship) as string,
      )

      if (country_citizenship == 'CA') {
        if (this.order?.details?.document?.pr_country == 'US') {
          await this.click(PAGE_4B_SELECTORS.areLRPYes)
        } else {
          await this.click(PAGE_4B_SELECTORS.areLRPNo)
        }
      } else {
        const pr_country = this.order?.details?.document?.pr_country
        if (pr_country == 'US') {
          await this.click(PAGE_4B_SELECTORS.statusLPR)
        } else if (pr_country == 'CA') {
          await this.click(PAGE_4B_SELECTORS.statusImmigrant)
        } else {
          await this.click(PAGE_4B_SELECTORS.statusNeither)
        }
      }
    }

    await this.sleepRandom(true)

    const tpp_option_exists = await this.elementExistsContinue(
      PAGE_4B_SELECTORS.tppOption,
    )
    if (tpp_option_exists) {
      await this.click(PAGE_4B_SELECTORS.tppOption)
      await this.sleepRandom(true)
    }

    switch (await this.order?.presenter()?.serviceName) {
      case 'Global Entry':
        await this.click(PAGE_4B_SELECTORS.globalEntry)
        this.sleepRandom(true)

        if (this.order?.details?.plan_flying_internationally == 1) {
          await this.click(PAGE_4B_SELECTORS.imminentIntlTravelYes)
        } else {
          await this.click(PAGE_4B_SELECTORS.imminentIntlTravelNo)
        }
        break

      case 'NEXUS':
        await this.click(PAGE_4B_SELECTORS.nexus)
        break

      case 'SENTRI':
        await this.click(PAGE_4B_SELECTORS.sentri)
        break
    }

    await this.clickButtonAndNext(this.button_next)

    if (
      (await this.order?.presenter()?.serviceName) == 'Global Entry' &&
      this.order?.details?.plan_flying_internationally == 0
    ) {
      await this.waitForElement(PAGE_4B_SELECTORS.tsaModalButton)
      await this.click(PAGE_4B_SELECTORS.tsaModalButton)
    }

    await this.page_4c()
  }

  // -------------------------------------------------------------------------------------
  // Step 7: Program Selection Acknowledgement
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/program-selection/acknowledge
  // -------------------------------------------------------------------------------------
  async page_4c() {
    await this.sleepRandom()

    const right_page = await this.rightPage(
      'https://ttp.cbp.dhs.gov/program-selection/acknowledge',
      false,
      false,
    )
    if (!right_page) return false

    await this.waitForElement(PAGE_4C_SELECTORS.marketingQuestion)

    await this.select(PAGE_4C_SELECTORS.marketingQuestion, '7: Other')

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
    await this.sleepRandom()

    const right_page = await this.rightPage('https://ttp.cbp.dhs.gov/dashboard')
    if (!right_page) return false

    const button_1 = await this.getInnerText(PAGE_4D_SELECTORS.dashboardButton1)
    const button_2 = await this.getInnerText(PAGE_4D_SELECTORS.dashboardButton2)

    if (button_1 && button_1.toLowerCase() === 'renew membership') {
      await this.page?.click(PAGE_4D_SELECTORS.dashboardButton1)
    } else if (button_2 && button_2.toLowerCase() === 'renew membership') {
      await this.page?.click(PAGE_4D_SELECTORS.dashboardButton2)
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

    if (citizenship === 'US') {
      await this.page?.click(PAGE_4D_1_SELECTORS.areCitizenYes)
    } else {
      await this.page?.click(PAGE_4D_1_SELECTORS.areCitizenNo)
      await this.sleepRandom(true)

      const countryOption = this.getCorrectCountryCitizenship(citizenship)
      await this.page
        ?.getByLabel(PAGE_4D_1_SELECTORS.countryOfCitizenship)
        .fill(countryOption as string)

      if (citizenship === 'CA') {
        if (doc.pr_country === 'US') {
          await this.page?.click(PAGE_4D_1_SELECTORS.areLRPYes)
        } else {
          await this.page?.click(PAGE_4D_1_SELECTORS.areLRPNo)
        }
      } else {
        if (doc.pr_country === 'US') {
          await this.page?.click(PAGE_4D_1_SELECTORS.statusLPR)
        } else if (doc.pr_country === 'CA') {
          await this.page?.click(PAGE_4D_1_SELECTORS.statusImmigrant)
        } else {
          await this.page?.click(PAGE_4D_1_SELECTORS.statusNeither)
        }
      }
    }

    await this.sleepRandom(true)

    const tppExists = await this.elementExistsContinue(
      PAGE_4D_1_SELECTORS.tppOption,
    )
    if (tppExists) {
      await this.page?.click(PAGE_4D_1_SELECTORS.tppOption)
      await this.sleepRandom(true)
    }

    const serviceName = this.order.presenter().serviceName

    switch (serviceName) {
      case 'Global Entry':
        await this.page?.click(PAGE_4D_1_SELECTORS.globalEntry)
        await this.sleepRandom(true)

        if (this.order.details.plan_flying_internationally === 1) {
          await this.page?.click(PAGE_4D_1_SELECTORS.imminentIntlTravelYes)
        } else {
          await this.page?.click(PAGE_4D_1_SELECTORS.imminentIntlTravelNo)
        }
        break

      case 'NEXUS':
        await this.page?.click(PAGE_4D_1_SELECTORS.nexus)
        break

      case 'SENTRI':
        await this.page?.click(PAGE_4D_1_SELECTORS.sentri)
        break
    }

    await this.clickButtonAndNext(this.button_next)

    if (
      serviceName === 'Global Entry' &&
      this.order.details.plan_flying_internationally === 0
    ) {
      await this.page?.waitForSelector(PAGE_4D_1_SELECTORS.tsaModalButton, {
        state: 'visible',
      })
      await this.page?.click(PAGE_4D_1_SELECTORS.tsaModalButton)
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

    const currentUrl = this.page?.url()
    const match = currentUrl?.match(/application\/(\d+)\/personal-info/)

    if (match && match[1]) {
      const applicationId = match[1]
      this.application_id = applicationId
      this.order.application_id = applicationId
      await this.order.save()
    } else {
      return this.endExecution(
        'Error occurred. Application ID could not be parsed.',
      )
    }

    await this.page?.waitForSelector(PAGE_5_SELECTORS.gender.male)

    const gender = this.order.details.gender
    await this.page?.click(
      gender === 'male'
        ? PAGE_5_SELECTORS.gender.male
        : PAGE_5_SELECTORS.gender.female,
    )

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
    await this.page?.selectOption(PAGE_5_SELECTORS.eyeColor, eyeCode)

    await this.page?.fill(
      PAGE_5_SELECTORS.heightFeet,
      this.order.details.height_ft.toString(),
    )
    await this.page?.waitForTimeout(1000)
    const heightIn = this.order.details.height_in || '0'
    await this.page?.fill(PAGE_5_SELECTORS.heightInches, heightIn.toString())
    await this.page?.waitForTimeout(1000)

    const otherFirst = this.order.details.other_first_name
    if (otherFirst) {
      await this.page?.click(PAGE_5_SELECTORS.alias.yes)
      await this.page?.fill(PAGE_5_SELECTORS.alias.firstName, otherFirst)
      await this.page?.fill(
        PAGE_5_SELECTORS.alias.lastName,
        this.order.details.other_last_name,
      )
    } else {
      await this.page?.click(PAGE_5_SELECTORS.alias.no)
    }

    const childTypes = [2, 3, 6, 7, 10, 11]
    if (childTypes.includes(this.order.type)) {
      await this.page?.fill(
        PAGE_5_SELECTORS.guardian.lastName,
        this.order.details.guardian_last_name,
      )
      await this.page?.fill(
        PAGE_5_SELECTORS.guardian.firstName,
        this.order.details.guardian_first_name,
      )
      await this.page?.fill(
        PAGE_5_SELECTORS.guardian.middleName,
        this.order.details.guardian_middle_name,
      )

      const guardianMonth = this.getCorrectMonth(
        this.order.details.guardian_dob_month,
      )
      const guardianDay = this.order.details.guardian_dob_day
        .toString()
        .padStart(2, '0')
      await this.page?.selectOption(PAGE_5_SELECTORS.guardian.dobMonth, {
        label: guardianMonth,
      })
      await this.page?.fill(PAGE_5_SELECTORS.guardian.dobDay, guardianDay)
      await this.page?.fill(
        PAGE_5_SELECTORS.guardian.dobYear,
        this.order.details.guardian_dob_year.toString(),
      )

      const guardianGender = this.order.details.guardian_gender
      await this.page?.click(
        guardianGender === 'male'
          ? PAGE_5_SELECTORS.guardian.gender.male
          : PAGE_5_SELECTORS.guardian.gender.female,
      )

      const isTextVisible = await this.page?.evaluate((text: string) => {
        const elements = Array.from(document.querySelectorAll('body *'))
        const el = elements.find((e) =>
          e.textContent?.includes(text),
        ) as HTMLElement
        return el
          ? getComputedStyle(el).visibility !== 'hidden' &&
              el?.offsetParent !== null
          : false
      }, PAGE_5_SELECTORS.guardianMembershipText)

      if (isTextVisible) {
        const hasApp = this.order.details.guardian_has_application
        const applicationId = this.order.details.application_id

        if (hasApp === 1) {
          await this.page?.click(PAGE_5_SELECTORS.guardian.aidOption)
          await this.page?.fill(
            PAGE_5_SELECTORS.guardian.applicationId,
            applicationId,
          )
        } else if (hasApp === 2) {
          await this.page?.click(PAGE_5_SELECTORS.guardian.pidOption)
          await this.page?.fill(PAGE_5_SELECTORS.guardian.passId, applicationId)
        } else {
          await this.page?.click(PAGE_5_SELECTORS.guardian.noneOption)
        }
      }
    }

    await this.clickButtonAndNext(this.button_next)

    if (childTypes.includes(this.order.type)) {
      if (!this.order.details.guardian_has_application) {
        await this.page?.waitForTimeout(5000)
        const modalShown = await this.elementExistsContinue(
          PAGE_5_SELECTORS.modalButton,
        )
        if (modalShown) {
          await this.page?.click(PAGE_5_SELECTORS.modalButton)
        }
      }

      const guardianModal = await this.elementExistsContinue(
        PAGE_5_SELECTORS.guardianAlertModal,
      )
      if (guardianModal) {
        return this.endExecution('Unable to verify guardian info')
      }
    }
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

    await this.page?.waitForSelector(PAGE_6_SELECTORS.ddlDocType)

    if (this.isRenewal(this.order?.type) || this.resume_application) {
      const deletionSelectors = [
        PAGE_6_SELECTORS.deletionSelector1,
        PAGE_6_SELECTORS.deletionSelector2,
        PAGE_6_SELECTORS.deletionSelector3,
        PAGE_6_SELECTORS.deletionSelector4,
        PAGE_6_SELECTORS.deletionSelector5,
      ]

      for (const selector of deletionSelectors) {
        if (await this.elementExists(selector)) {
          await this.page?.click(selector)
          await sleepRandom(true)
          await this.page?.click(PAGE_6_SELECTORS.confirmModalBtn)
          await sleepRandom(true)
        }
      }
    }

    await this.page?.selectOption(PAGE_6_SELECTORS.ddlDocType, { value: 'PT' })
    await this.page?.click(PAGE_6_SELECTORS.addCardBtn)
    await sleepRandom(true)

    await this.page?.waitForSelector(PAGE_6_SELECTORS.notifyInfo)
    await this.page?.click(PAGE_6_SELECTORS.notifyBtn)
    await sleepRandom(true)

    const doc = this.order?.details?.document

    await this.page?.fill(
      PAGE_6_SELECTORS.lastNameInput,
      doc.passport_last_name,
    )
    await this.page?.fill(
      PAGE_6_SELECTORS.firstNameInput,
      doc.passport_first_name,
    )
    await this.page?.fill(
      PAGE_6_SELECTORS.middleNameInput,
      doc.passport_middle_name,
    )

    const dobMonth = this.getCorrectMonth(this.order?.details?.dob_month)
    const dobDay = this.padDay(this.order?.details?.dob_day)
    const dobYear = this.order?.details?.dob_year

    await this.page?.selectOption(PAGE_6_SELECTORS.dobMonthSelect, {
      label: dobMonth,
    })
    await this.page?.fill(PAGE_6_SELECTORS.dobDayInput, dobDay)
    await this.page?.fill(PAGE_6_SELECTORS.dobYearInput, dobYear)

    await this.page?.fill(
      PAGE_6_SELECTORS.docNumberInput,
      await HelperService.decrypt(doc.passport_number),
    )

    const [issuanceMonth, issuanceDay, issuanceYear] = this.splitDate(
      doc.passport_issuance_date,
    )
    const [expirationMonth, expirationDay, expirationYear] = this.splitDate(
      doc.passport_expiration_date,
    )

    await this.page?.selectOption(PAGE_6_SELECTORS.issuanceMonthSelect, {
      label: issuanceMonth,
    })
    await this.page?.fill(PAGE_6_SELECTORS.issuanceDayInput, issuanceDay)
    await this.page?.fill(PAGE_6_SELECTORS.issuanceYearInput, issuanceYear)

    await this.page?.selectOption(PAGE_6_SELECTORS.expirationMonthSelect, {
      label: expirationMonth,
    })
    await this.page?.fill(PAGE_6_SELECTORS.expirationDayInput, expirationDay)
    await this.page?.fill(PAGE_6_SELECTORS.expirationYearInput, expirationYear)

    if (!['US', 'CA'].includes(doc.country_citizenship)) {
      if (await this.elementExists(PAGE_6_SELECTORS.machineReadibleYes)) {
        if (doc.pr_machine_readable === 1) {
          await this.page?.click(PAGE_6_SELECTORS.machineReadibleYes)
        } else {
          throw new Error('PR Card does not have a machine readable zone.')
        }
      }

      await sleepRandom(true)
      await this.page?.click(PAGE_6_SELECTORS.addCardBtn2)
      await sleepRandom(true)

      if (await this.elementExists(PAGE_6_SELECTORS.notifyInfo)) {
        await this.page?.click(PAGE_6_SELECTORS.notifyBtn)
        await sleepRandom(true)
      }

      await this.page?.fill(PAGE_6_SELECTORS.lastNameInputPR, doc.pr_last_name)
      await this.page?.fill(
        PAGE_6_SELECTORS.firstNameInputPR,
        doc.pr_first_name,
      )
      await this.page?.fill(
        PAGE_6_SELECTORS.middleNameInputPR,
        doc.pr_middle_name,
      )

      await this.page?.selectOption(PAGE_6_SELECTORS.dobMonthSelectPR, {
        label: dobMonth,
      })
      await this.page?.fill(PAGE_6_SELECTORS.dobDayInputPR, dobDay)
      await this.page?.fill(PAGE_6_SELECTORS.dobYearInputPR, dobYear)

      await this.page?.fill(
        PAGE_6_SELECTORS.docNumberInputPR,
        await HelperService.decrypt(doc.pr_card_number),
      )

      const [prMonth, prDay, prYear] = this.splitDate(doc.pr_expiration_date)

      await this.page?.selectOption(PAGE_6_SELECTORS.expirationMonthSelectPR, {
        label: prMonth,
      })
      await this.page?.fill(PAGE_6_SELECTORS.expirationDayInputPR, prDay)
      await this.page?.fill(PAGE_6_SELECTORS.expirationYearInputPR, prYear)
    }

    await this.clickAndNext(this.page as Page)

    await sleepRandom(true)

    if (await this.rightPage(baseUrl, true)) {
      if (await this.elementExists(PAGE_6_SELECTORS.alertModal)) {
        await this.page?.click(PAGE_6_SELECTORS.alertModalBtn)
        await sleepRandom(true)
      }

      if (await this.elementExists(PAGE_6_SELECTORS.errorSummary)) {
        await this.page?.click(PAGE_6_SELECTORS.acceptCitDocument)
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

    await this.page?.waitForSelector(PAGE_7_SELECTORS.dlYesLabel)

    const doc = this.order?.details?.document

    if (doc.dl_number) {
      await this.page?.click(PAGE_7_SELECTORS.dlYesLabel)

      // DL Number
      await this.page?.fill(
        PAGE_7_SELECTORS.dlNumberInput,
        await HelperService.decrypt(doc.dl_number),
      )

      // Country selection
      const selectedCountry =
        doc.dl_country === 'HK'
          ? this.getCorrectCountryAddressAndEmployment('CH')
          : this.getCorrectCountryAddressAndEmployment(doc.dl_country)

      await this.page?.selectOption(
        PAGE_7_SELECTORS.countryOfIssuanceSelect,
        selectedCountry as string,
      )

      // State selection logic
      switch (doc.dl_country) {
        case 'US':
          await this.page?.selectOption(
            PAGE_7_SELECTORS.stateOfIssuanceSelect,
            this.getCorrectState(doc.dl_state as any) as any,
          )
          break
        case 'CA':
          await this.page?.selectOption(
            PAGE_7_SELECTORS.stateOfIssuanceSelect,
            this.getCorrectCanadaState(doc.dl_state) as any,
          )
          break
        case 'MX':
          const state = doc.dl_state === 'CMX' ? 'MEX' : doc.dl_state
          await this.page?.selectOption(
            PAGE_7_SELECTORS.stateOfIssuanceSelect,
            this.getCorrectMexicoState(state) as any,
          )
          break
        default:
          await this.page?.fill(
            PAGE_7_SELECTORS.stateOfIssuanceInput,
            doc.dl_state,
          )
      }

      // Expiration Date
      const [month, day, year] = doc.dl_expiration_date.split('/')
      await this.page?.selectOption(
        PAGE_7_SELECTORS.dlExpirationMonthSelect,
        this.getCorrectMonth(month),
      )
      await this.page?.fill(
        PAGE_7_SELECTORS.dlExpirationDayInput,
        day.padStart(2, '0'),
      )
      await this.page?.fill(PAGE_7_SELECTORS.dlExpirationYearInput, year)

      // DL Name
      await this.page?.fill(PAGE_7_SELECTORS.dlLastNameInput, doc.dl_last_name)
      await this.page?.fill(
        PAGE_7_SELECTORS.dlFirstNameInput,
        doc.dl_first_name,
      )
      await this.page?.fill(
        PAGE_7_SELECTORS.dlMiddleNameInput,
        doc.dl_middle_name || '',
      )

      // DL DOB
      await this.page?.selectOption(
        PAGE_7_SELECTORS.dlDobMonthSelect,
        this.getCorrectMonth(this.order?.details.dob_month),
      )
      await this.page?.fill(
        PAGE_7_SELECTORS.dlDobDayInput,
        String(this.order?.details?.dob_day).padStart(2, '0'),
      )
      await this.page?.fill(
        PAGE_7_SELECTORS.dlDobYearInput,
        this.order?.details?.dob_year,
      )

      // Additional for US & CA
      if (['US', 'CA'].includes(doc.dl_country)) {
        doc.dl_edl == 1
          ? await this.page?.click(PAGE_7_SELECTORS.dlEdlYesLabel)
          : await this.page?.click(PAGE_7_SELECTORS.dlEdlNoLabel)

        if (doc.dl_country === 'US') {
          if (doc.dl_cdl == 1) {
            await this.page?.click(PAGE_7_SELECTORS.dlCdlYesLabel)

            doc.dl_hazmat == 1
              ? await this.page?.click(PAGE_7_SELECTORS.dlHazmatYesLabel)
              : await this.page?.click(PAGE_7_SELECTORS.dlHazmatNoLabel)
          } else {
            await this.page?.click(PAGE_7_SELECTORS.dlCdlNoLabel)
          }
        }
      }
    } else {
      await this.page?.click(PAGE_7_SELECTORS.dlNoLabel)
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
    await this.sleepRandom()

    if (
      [2, 3, 6, 7, 10, 11].includes(this.order.type) &&
      (this.dob as number) > this.minimumYears
    ) {
      return
    }

    if (this.order.presenter().serviceName === 'NEXUS') {
      return
    }

    const rightPage = await this.rightPage(
      `https://ttp.cbp.dhs.gov/application/${this.application_id}/vehicle-info`,
    )
    if (!rightPage) return

    await this.waitForElement(PAGE_8_SELECTORS.driveBorderYes)

    if (
      this.order.details.vehicle.drive_across_mexico_border &&
      this.order.details.vehicle.register_vehicle
    ) {
      const vehicle = this.order.details.vehicle

      await this.click(PAGE_8_SELECTORS.driveBorderYes)
      await this.sleepRandom(true)

      await this.click(
        vehicle.vehicle_already_registered
          ? PAGE_8_SELECTORS.vehicleAlreadyRegisteredYes
          : PAGE_8_SELECTORS.vehicleAlreadyRegisteredNo,
      )

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

      await this.click(
        vehicle.register_vehicle
          ? PAGE_8_SELECTORS.vehicleRegisterNowYes
          : PAGE_8_SELECTORS.vehicleRegisterNowNo,
      )

      if (!vehicle.register_vehicle) {
        await this.clickButtonAndNext(
          this.button_next,
          true,
          true,
          `https://ttp.cbp.dhs.gov/application/${this.application_id}/vehicle-info`,
        )
        return
      }

      if (
        [1, 3, 5, 7, 9, 11].includes(this.order.type) ||
        this.resume_application
      ) {
        const exists = await this.elementExistsContinue(PAGE_8_SELECTORS.card0)

        if (exists) {
          await this.click(PAGE_8_SELECTORS.deleteCard0Btn)
          await this.sleepRandom(true)
          await this.click(PAGE_8_SELECTORS.confirmModalPrimaryBtn)
        }
      }

      await this.sleepRandom(true)
      await this.click(PAGE_8_SELECTORS.addVehicleBtn)
      await this.sleepRandom(true)

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
        PAGE_8_SELECTORS.licenseCountryOfIssuance,
        this.getCorrectCountryAddressAndEmployment(
          vehicle?.vehicle_country,
        ) as string,
      )

      if (vehicle.vehicle_country === 'US') {
        await this.click(
          vehicle.vehicle_gov_license_plate
            ? PAGE_8_SELECTORS.vehicleGovPlateYes
            : PAGE_8_SELECTORS.vehicleGovPlateNo,
        )

        if (vehicle.vehicle_state) {
          await this.select(
            PAGE_8_SELECTORS.vehicleStateDropdown,
            this.getCorrectState(vehicle.vehicle_state) as string,
          )
        }
      } else {
        await this.type(
          PAGE_8_SELECTORS.vehicleStateDropdown,
          vehicle.vehicle_state,
        )
      }

      const ownerType = ['Applicant', 'Individual', 'Business'][
        vehicle.vehicle_owner
      ]
      await this.click(PAGE_8_SELECTORS.ownerType(ownerType))
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
        const date: any = this.splitTimeStamp(vehicle.vehicle_owner_dob)
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

        await this.click(
          vehicle.vehicle_owner_gender === 'male'
            ? PAGE_8_SELECTORS.genderMale
            : PAGE_8_SELECTORS.genderFemale,
        )
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

        await this.select(
          PAGE_8_SELECTORS.countryDropdown,
          (await this.getCorrectCountry(
            vehicle.vehicle_owner_country,
            PAGE_8_SELECTORS.countryDropdown,
          )) as string,
        )

        if (vehicle.vehicle_owner_country === 'US') {
          await this.select(
            PAGE_8_SELECTORS.stateDropdown,
            this.getCorrectState(vehicle.vehicle_owner_state) as string,
          )
        } else {
          await this.click(
            PAGE_8_SELECTORS.stateDropdown,
            vehicle.vehicle_owner_state,
          )
        }
      }

      const phoneFormat =
        vehicle.vehicle_owner_country === 'US' ||
        vehicle.vehicle_owner_country === 'CA'
          ? 'N'
          : vehicle.vehicle_owner_country === 'MX'
            ? 'M'
            : 'I'

      await this.select(PAGE_8_SELECTORS.phoneNumberFormatDropdown, phoneFormat)

      for (const [key, value] of Object.entries(ownerTypeElements)) {
        await this.type(`#${key}`, value)
      }
    } else {
      await this.click(PAGE_8_SELECTORS.driveBorderNo)
    }

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

    await this.waitForElement(PAGE_13_SELECTORS.personal)

    await this.page?.click(PAGE_13_SELECTORS.personal)
    await sleepRandom(true)

    await this.page?.click(PAGE_13_SELECTORS.documents)
    await sleepRandom(true)

    const isAdult = (this.dob as unknown as number) < this.minimumYears

    if (isAdult) {
      await this.page?.click(PAGE_13_SELECTORS.license)
      await sleepRandom(true)
    }

    const isNexusOrGE =
      isAdult &&
      ['Global Entry', 'SENTRI'].includes(this.order?.presenter()?.serviceName)

    if (isNexusOrGE) {
      await this.page?.click(PAGE_13_SELECTORS.vehicle)
      await sleepRandom(true)
    }

    await this.page?.click(PAGE_13_SELECTORS.address)
    await sleepRandom(true)

    if (isAdult) {
      await this.page?.click(PAGE_13_SELECTORS.employment)
      await sleepRandom(true)
    }

    await this.page?.click(PAGE_13_SELECTORS.travel)
    await sleepRandom(true)

    await this.page?.click(PAGE_13_SELECTORS.additional)
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
}
