import fetch from 'node-fetch'
import { Page } from 'playwright'
import { config } from '../config'
import { Formatter, sleepRandom } from '../lib'
import { BotUtilities } from './BotUtilities'
import { HelperService } from './HelperService'

export class BotPaymentService extends BotUtilities {
  alreadyPaid: boolean
  continueButton: string
  paymentNotRequired?: boolean
  formatter: Formatter

  constructor(props: {
    alreadyPaid: boolean
    page: Page
    continueButton: string
  }) {
    super(false, props?.page, null, null)
    this.alreadyPaid = props.alreadyPaid
    this.continueButton = props.continueButton
    this.page = props.page
    this.formatter = new Formatter()
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
    if (!(await this.rightPage('https://ttp.cbp.dhs.gov/purchase-summary')))
      return false

    // Check if payment is requirement
    const paymentNoticeExists = await this.elementExistsContinue(
      'label[for="paymentNotice"]',
    )

    if (!paymentNoticeExists) {
      await this.click('.pay-button-part button')
      this.paymentNotRequired = true
      await this.sleepRandom(true)
      return true
    }

    // Wait for element to load
    await this.waitForElement('label[for="paymentNotice"]')

    await this.click('label[for="paymentNotice"]')
    await this.sleepRandom(true)

    await this.click('.pay-button-part button')
    await this.sleepRandom(true)

    // Click on Confirm button
    await this.clickButtonAndNext('#confirmBtn')
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
    await this.sleepRandom()

    // Check if page correct
    const right_page = await this.rightPage(
      'https://www.pay.gov/tcsonline/payment.do?execution=e1s1',
    )
    if (!right_page) return false

    await this.sleepRandom()

    // Wait for element to load
    await this.waitForElement('label[for="choosePC"]')

    await this.click('label[for="choosePC"]')
    await this.sleepRandom(true)

    // Click on Continue button
    await this.clickButtonAndNext(this.continueButton)
  }

  async paymentPage3(): Promise<boolean> {
    if (this.paymentNotRequired || this.alreadyPaid) {
      return true
    }

    await this.sleepRandom()

    const rightPage = await this.rightPage(
      'https://www.pay.gov/tcsonline/payment.do',
      false,
    )
    if (!rightPage) return false

    await this.waitForElement('#accountHolderName')

    let randomCard: any
    if (this.order.sourceUrl === 'ge.govassist.com') {
      const allCards = config('fulfillment')
      const randomNumber = Math.floor(Math.random() * 5) + 1
      randomCard =
        randomNumber === 2
          ? allCards?.[6]
          : allCards?.[Math.floor(Math.random() * allCards.length)]

      if (!randomCard.address) {
        const updated = await this.updateCreditCardAddress(randomCard.id)
        if (!updated) {
          this.endExecution('Credit card address could not be updated.')
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
      this.order.payment?.billing_address &&
      this.order.sourceUrl !== 'ge.govassist.com'
    ) {
      ;({
        billing_address: address,
        billing_city: city,
        billing_state: state,
        billing_zip_code: zipCode,
        billing_country: country,
      } = this.order.payment)
    } else if (
      this.order.details.address_country_1 !== 'US' &&
      this.order.sourceUrl === 'ge.govassist.com' &&
      !randomCard?.address
    ) {
      address = '4530 S Orange Blossom Trl Num 543'
      city = 'Orlando'
      state = 'FL'
      zipCode = '32839'
      country = 'US'
    } else if (
      this.order.sourceUrl === 'ge.govassist.com' &&
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
      } = this.order.details)
    }

    const allCountries: Record<string, string> =
      HelperService.getCountries3LetterCode()

    let cardholderName = this.order.payment
      ? HelperService.decrypt(this.order.payment.cardholder_name)
      : this.order.name
    if (!isNaN(Number(cardholderName))) {
      cardholderName = this.order.name
    }

    await this.type('#accountHolderName', cardholderName)
    await this.type('#billingAddress', this.formatter.formatAddress(address))
    await this.type('#city', this.formatter.formatCity(city))
    await this.select('#country', allCountries[country] as unknown as string)
    await this.type('#zipPostalCode', this.formatter.formatZipCode(zipCode))

    switch (country) {
      case 'US':
        await this.select('#statesUSA', state)
        break
      case 'CA':
        await this.select('#statesCAN', state)
        break
      default:
        await this.type('#stateText', state)
        break
    }

    // Credit Card Info
    let creditCard: string,
      expirationMonth: string,
      expirationYear: string,
      cvv: string

    if (this.order.sourceUrl === 'ge.govassist.com') {
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
        await HelperService.decrypt(this.order.payment.cc_number)
      ).replace(/[- ]/g, '')
      const [month, year] = (
        await HelperService.decrypt(this.order.payment.cc_expiration)
      ).split('/')
      expirationMonth = month
      expirationYear = '20' + year
      cvv = await HelperService.decrypt(this.order.payment.cc_cvv)
    }

    await this.type('#accountNumber', creditCard)
    await this.select('#expirationMonth', expirationMonth)
    await this.select('#expirationYear', expirationYear)
    await this.type('#cardSecurityCode', cvv)

    await this.clickButtonAndNext(this.continueButton)

    return true
  }

  async updateCreditCardAddress(ccId: string): Promise<boolean> {
    const isUS = this.order?.details?.address_country_1 === 'US'

    const billingAddress = {
      billing_address: {
        address_1: isUS
          ? this.order?.details?.address_street_1
          : '4530 S Orange Blossom Trl',
        address_2: isUS ? '' : 'Num 543',
        city: isUS ? this.order?.details?.address_city_1 : 'Orlando',
        state: isUS ? this.order?.details?.address_state_1 : 'FL',
        zip_code: isUS ? this.order?.details?.address_zip_code_1 : '32839',
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

    await this.sleepRandom()

    const rightPage = await this.rightPage(
      'https://www.pay.gov/tcsonline/payment.do',
      false,
    )
    if (!rightPage) return false

    await this.waitForElement('label[for="authCheck"]')
    await this.click('label[for="authCheck"]')
    await this.clickButtonAndNext(this.continueButton)

    return true
  }

  async paymentPage5(): Promise<void> {
    // Wait for navigation if not already paid
    if (!this.alreadyPaid) {
      await this.page
        ?.waitForURL(this.page.url(), {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        })
        .catch(() => {})
    }

    // Sleep for 30 seconds (consider replacing with smarter waits if possible)
    await this.page?.waitForTimeout(30_000)

    // Ensure we are on the correct dashboard page
    const rightPage = await this.rightPage('https://ttp.cbp.dhs.gov/dashboard')
    if (!rightPage) return

    // Get message
    const message = await this.page?.evaluate(() => {
      const element = document.querySelector(
        '.dashboard-alert .alert-content p',
      )
      return element ? (element.textContent?.trim() ?? '') : ''
    })

    // Get Pass ID
    const passId = await this.page?.evaluate(() => {
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
        await this.endExecution('Pass ID could not be saved from the page.')
        return
      }

      if (
        passId.toLowerCase() !== 'not yet assigned' &&
        !isNaN(Number(passId))
      ) {
        this.order.membership_number = passId
        this.order.status = 1 // completed
        this.order.completed_at = new Date()
        this.order.bot_message = 'Application completed'
      } else {
        this.order.status = 6 // submitted
        this.order.submitted_at = new Date()
        this.order.bot_message = 'Application submitted'
      }

      // Check if message is "Complete But Not Submitted"
      const completeButNotSubmitted = await this.getInnerText(
        '.dashboard-card .title-in-progress',
      )
      if (completeButNotSubmitted === 'Complete But Not Submitted') {
        this.order.status = 7
        this.order.submitted_at = null
        this.order.completed_at = null
        this.order.bot_started_at = null
        this.order.bot_message = 'Application moved to Ready for payment'
      }

      await this.order.save()
    } else {
      this.order.status = 9
      this.order.reason = 2
      this.order.bot_message = 'Payment was not accepted.'
    }

    // Take screenshot for record
    await this.screenshot(true)

    // Finalize bot state
    this.order.bot_fail = 0
    this.order.bot_completed_at = new Date()
    this.order.bot_type = this.botType
    await this.order.save()

    this.stop = true
  }
}
