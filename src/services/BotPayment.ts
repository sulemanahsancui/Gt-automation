import fetch from 'node-fetch'
import { Page } from 'playwright'
import { config } from '../config'
import {
  ACCOUNT_HOLDER_SELECTOR,
  ACCOUNT_NUMBER_SELECTOR,
  BILLING_ADDRESS_SELECTOR,
  CHOOSE_PC_SELECTOR,
  CITY_SELECTOR,
  COMFIRM_BTN_SELECTOR,
  COUNTRY_SELECTOR,
  CVV_SELECTOR,
  EXPIRATION_MONTH_SELECTOR,
  EXPIRATION_YEAR_SELECTOR,
  PAY_BUTTOnN_PART_SELECTOR,
  PAYMENTNOTICE_EXISTS_SELECTOR,
  sleepRandom,
  ZIP_CODE_SELECTOR,
} from '../lib'
import {
  DASHBOARD_PAGE_URL,
  PAYMENt_PAGE_1_URL,
  PAYMENT_PAGE_2_URL,
  PAYMENT_PAGE_3_URL,
  PAYMENT_PAGE_4_URL,
} from '../lib/constants'
import { BotUtilities } from './BotUtilities'
import { HelperService } from './Helper'
import { Formatter } from './formatter'

export class BotPaymentService {
  alreadyPaid: boolean
  continueButton: string
  paymentNotRequired?: boolean

  formatter: Formatter
  botUtils: BotUtilities

  constructor(props: {
    alreadyPaid: boolean
    page: Page
    continueButton: string
    botUtils: BotUtilities
  }) {
    this.alreadyPaid = props.alreadyPaid
    this.continueButton = props.continueButton
    this.formatter = new Formatter()
    this.botUtils = props.botUtils
  }

  // -------------------------------------------------------------------------------------
  // Step 1: Purchase Summary
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/purchase-summary
  // -------------------------------------------------------------------------------------
  async payment_page_1() {
    // If already paid
    if (this.alreadyPaid) return true

    // Sleep
    await sleepRandom()

    // Check if page correct
    if (!(await this.botUtils.rightPage(PAYMENt_PAGE_1_URL))) return false

    // Check if payment is requirement
    const paymentNoticeExists = await this.botUtils.elementExistsContinue(
      PAYMENTNOTICE_EXISTS_SELECTOR,
    )

    if (!paymentNoticeExists) {
      await this.botUtils.click(PAY_BUTTOnN_PART_SELECTOR)
      this.paymentNotRequired = true
      await this.botUtils.sleepRandom(true)
      return true
    }

    // Wait for element to load
    await this.botUtils.waitForElement(PAYMENTNOTICE_EXISTS_SELECTOR)

    await this.botUtils.click(PAYMENTNOTICE_EXISTS_SELECTOR)
    await this.botUtils.sleepRandom(true)

    await this.botUtils.click(PAY_BUTTOnN_PART_SELECTOR)
    await this.botUtils.sleepRandom(true)

    // Click on Confirm button
    await this.botUtils.clickButtonAndNext(COMFIRM_BTN_SELECTOR)
  }

  // -------------------------------------------------------------------------------------
  // Step 2: Payment Method Page
  // -------------------------------------------------------------------------------------
  // https://www.pay.gov/tcsonline/payment.do?execution=e1s1
  // -------------------------------------------------------------------------------------
  async payment_page_2() {
    // If payment not required
    if (this.paymentNotRequired || this.alreadyPaid) {
      return true
    }

    // Sleep
    await this.botUtils.sleepRandom()

    // Check if page correct
    const right_page = await this.botUtils.rightPage(PAYMENT_PAGE_2_URL)
    if (!right_page) return false

    await this.botUtils.sleepRandom()

    // Wait for element to load
    await this.botUtils.waitForElement(CHOOSE_PC_SELECTOR)

    await this.botUtils.click(CHOOSE_PC_SELECTOR)
    await this.botUtils.sleepRandom(true)

    // Click on Continue button
    await this.botUtils.clickButtonAndNext(this.continueButton)
  }

  async paymentPage3(): Promise<boolean> {
    if (this.paymentNotRequired || this.alreadyPaid) {
      return true
    }

    await this.botUtils.sleepRandom()

    const rightPage = await this.botUtils.rightPage(PAYMENT_PAGE_3_URL, false)
    if (!rightPage) return false

    await this.botUtils.waitForElement(ACCOUNT_HOLDER_SELECTOR)

    let randomCard: any
    if (this.botUtils.order?.sourceUrl === 'ge.govassist.com') {
      const allCards = config('fulfillment')
      const randomNumber = Math.floor(Math.random() * 5) + 1
      randomCard =
        randomNumber === 2
          ? allCards?.[6]
          : allCards?.[Math.floor(Math.random() * allCards.length)]

      if (!randomCard.address) {
        const updated = await this.updateCreditCardAddress(randomCard.id)
        if (!updated) {
          this.botUtils.endExecution(
            'Credit card address could not be updated.',
          )
          return false
        }
      }
    }

    let address: string,
      city: string,
      state: string,
      zipCode: string,
      country: string

    if (
      this.botUtils.order.payment?.billing_address &&
      this.botUtils.order?.sourceUrl !== 'ge.govassist.com'
    ) {
      ;({
        billing_address: address,
        billing_city: city,
        billing_state: state,
        billing_zip_code: zipCode,
        billing_country: country,
      } = this.botUtils.order?.payment)
    } else if (
      this.botUtils?.order?.details?.address_country_1 !== 'US' &&
      this.botUtils.order.sourceUrl === 'ge.govassist.com' &&
      !randomCard?.address
    ) {
      address = '4530 S Orange Blossom Trl Num 543'
      city = 'Orlando'
      state = 'FL'
      zipCode = '32839'
      country = 'US'
    } else if (
      this.botUtils.order?.sourceUrl === 'ge.govassist.com' &&
      randomCard?.address
    ) {
      ;({ address, city, state, zip: zipCode, country } = randomCard)
    } else {
      ;({
        address_street_1: address,
        address_city_1: city,
        address_state_1: state,
        address_zip_code_1: zipCode,
        address_country_1: country,
      } = this.botUtils.order?.details)
    }

    const allCountries: Record<string, string> =
      HelperService.getCountries3LetterCode()

    let cardholderName = this.botUtils.order?.payment
      ? HelperService.decrypt(this.botUtils.order?.payment.cardholder_name)
      : this.botUtils.order?.name
    if (!isNaN(Number(cardholderName))) {
      cardholderName = this.botUtils.order?.name
    }

    await this.botUtils.type(ACCOUNT_HOLDER_SELECTOR, cardholderName)
    await this.botUtils.type(
      BILLING_ADDRESS_SELECTOR,
      this.formatter.formatAddress(address),
    )
    await this.botUtils.type(CITY_SELECTOR, this.formatter.formatCity(city))
    await this.botUtils.select(
      COUNTRY_SELECTOR,
      allCountries[country] as unknown as string,
    )
    await this.botUtils.type(
      ZIP_CODE_SELECTOR,
      this.formatter.formatZipCode(zipCode),
    )

    switch (country) {
      case 'US':
        await this.botUtils.select('#statesUSA', state)
        break
      case 'CA':
        await this.botUtils.select('#statesCAN', state)
        break
      default:
        await this.botUtils.type('#stateText', state)
        break
    }

    // Credit Card Info
    let creditCard: string,
      expirationMonth: string,
      expirationYear: string,
      cvv: string

    if (this.botUtils.order?.sourceUrl === 'ge.govassist.com') {
      creditCard = (await HelperService.decrypt(randomCard.number)).replace(
        /[- ]/g,
        '',
      )
      const [month, year] = (
        await HelperService.decrypt(randomCard.expiration)
      ).split('/')
      expirationMonth = month
      expirationYear = '20' + year
      cvv = await HelperService.decrypt(randomCard.cvv)
    } else {
      creditCard = (
        await HelperService.decrypt(this.botUtils.order?.payment?.cc_number)
      ).replace(/[- ]/g, '')
      const [month, year] = (
        await HelperService.decrypt(this.botUtils.order?.payment?.cc_expiration)
      ).split('/')
      expirationMonth = month
      expirationYear = '20' + year
      cvv = await HelperService.decrypt(this.botUtils.order?.payment?.cc_cvv)
    }

    await this.botUtils.type(ACCOUNT_NUMBER_SELECTOR, creditCard)
    await this.botUtils.select(EXPIRATION_MONTH_SELECTOR, expirationMonth)
    await this.botUtils.select(EXPIRATION_YEAR_SELECTOR, expirationYear)
    await this.botUtils.type(CVV_SELECTOR, cvv)

    await this.botUtils.clickButtonAndNext(this.continueButton)

    return true
  }

  async updateCreditCardAddress(ccId: string): Promise<boolean> {
    const isUS = this.botUtils.order?.details?.address_country_1 === 'US'

    const billingAddress = {
      billing_address: {
        address_1: isUS
          ? this.botUtils.order?.details?.address_street_1
          : '4530 S Orange Blossom Trl',
        address_2: isUS ? '' : 'Num 543',
        city: isUS ? this.botUtils.order?.details?.address_city_1 : 'Orlando',
        state: isUS ? this.botUtils.order?.details?.address_state_1 : 'FL',
        zip_code: isUS
          ? this.botUtils.order?.details?.address_zip_code_1
          : '32839',
      },
    }

    const token = `Token ${config('EMBURSE_TOKEN')}`
    const endpoint = `https://api.emburse.com/v1/cards/${ccId}`

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify(billingAddress),
      })

      return response.status === 200
    } catch (error) {
      console.error('Error updating card address:', error)
      return false
    }
  }

  async paymentPage4(): Promise<boolean> {
    if (this.paymentNotRequired || this.alreadyPaid) {
      return true
    }

    await this.botUtils.sleepRandom()

    const rightPage = await this.botUtils.rightPage(PAYMENT_PAGE_4_URL, false)
    if (!rightPage) return false

    await this.botUtils.waitForElement('label[for="authCheck"]')
    await this.botUtils.click('label[for="authCheck"]')
    await this.botUtils.clickButtonAndNext(this.continueButton)

    return true
  }

  async paymentPage5(): Promise<void> {
    // Wait for navigation if not already paid
    if (!this.alreadyPaid) {
      await this.botUtils.page
        ?.waitForURL(this.botUtils.page.url(), {
          waitUntil: 'domcontentloaded',
          timeout: 0,
        })
        .catch(() => {})
    }

    // Sleep for 30 seconds (consider replacing with smarter waits if possible)
    await this.botUtils.page?.waitForTimeout(30_000)

    // Ensure we are on the correct dashboard page
    const rightPage = await this.botUtils.rightPage(DASHBOARD_PAGE_URL)
    if (!rightPage) return

    // Get message
    const message = await this.botUtils.page?.evaluate(() => {
      const element = document.querySelector(
        '.dashboard-alert .alert-content p',
      )
      return element ? (element.textContent?.trim() ?? '') : ''
    })

    // Get Pass ID
    const passId = await this.botUtils.page?.evaluate(() => {
      const element = document.querySelector(
        '.user-menu .user-info:nth-child(3) b',
      )
      return element ? (element.textContent?.trim() ?? '') : ''
    })

    const normalizedMessage = message?.toLowerCase() ?? ''
    const isPaymentAccepted =
      normalizedMessage ===
      'your payment was accepted and your application has been submitted.'

    if (
      (!this.paymentNotRequired && isPaymentAccepted) ||
      this.paymentNotRequired ||
      this.alreadyPaid
    ) {
      if (!passId) {
        await this.botUtils.endExecution(
          'Pass ID could not be saved from the page.',
        )
        return
      }

      if (
        passId.toLowerCase() !== 'not yet assigned' &&
        !isNaN(Number(passId)) &&
        this.botUtils.order
      ) {
        this.botUtils.order.membership_number = passId
        this.botUtils.order.status = 1 // completed
        this.botUtils.order.completed_at = new Date()
        this.botUtils.order.bot_message = 'Application completed'
      } else {
        this.botUtils.order.status = 6 // submitted
        this.botUtils.order.submitted_at = new Date()
        this.botUtils.order.bot_message = 'Application submitted'
      }

      // Check if message is "Complete But Not Submitted"
      const completeButNotSubmitted = await this.botUtils.getInnerText(
        '.dashboard-card .title-in-progress',
      )
      if (completeButNotSubmitted === 'Complete But Not Submitted') {
        this.botUtils.order.status = 7
        this.botUtils.order.submitted_at = null
        this.botUtils.order.completed_at = null
        this.botUtils.order.bot_started_at = null
        this.botUtils.order.bot_message =
          'Application moved to Ready for payment'
      }

      await this.botUtils.order.save()
    } else {
      this.botUtils.order.status = 9
      this.botUtils.order.reason = 2
      this.botUtils.order.bot_message = 'Payment was not accepted.'
    }

    // Take screenshot for record
    await this.botUtils.screenshot(true)

    // Finalize bot state
    this.botUtils.order.bot_fail = 0
    this.botUtils.order.bot_completed_at = new Date()
    this.botUtils.order.bot_type = this.botUtils.botType
    await this.botUtils.order.save()

    this.botUtils.stop = true
  }
}
