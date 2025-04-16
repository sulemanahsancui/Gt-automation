import * as OTPAuth from 'otpauth'
import { Page } from 'playwright'

import {
  BUTTON_USA_SELECTOR,
  BUTTON_USA_WIDE,
  LOGIN_BUTTON_SELECTOR,
  LOGIN_MODEL_FOOTER_SELECTOR,
  Order,
  sleepRandom,
  USER_EMAIL_INPUT_SELECTOR,
  USER_PASSWORD_INPUT_SELECTOR,
} from '../lib'
import { BotUtilities } from './BotUtilities'

export class BotLoginService extends BotUtilities {
  captcha_min_score = 0

  /**
   * Initializes the BotLogin module with the Playwright page object.
   * @param {playwright.Page} page
   * @param {object} order
   */
  constructor(page: Page, order: Order) {
    super(false, page, null, null, order)
  }

  // -------------------------------------------------------------------------------------
  // Step 1: Start Page
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/
  // -------------------------------------------------------------------------------------
  async login_page_1(): Promise<boolean> {
    // Sleep
    await sleepRandom()

    // Check if page correct
    const rightPage = await this.rightPage('https://ttp.cbp.dhs.gov/')
    if (!rightPage) return false

    // Wait for element to load
    await this.waitForElement(LOGIN_BUTTON_SELECTOR)

    // Click on Login button
    await this.add(LOGIN_BUTTON_SELECTOR)

    await sleepRandom(true)

    // Click on Consent and Continue
    await this.clickButtonAndNext(LOGIN_MODEL_FOOTER_SELECTOR)
    return true
  }

  // -------------------------------------------------------------------------------------
  // Step 2: Login.gov Login Page
  // -------------------------------------------------------------------------------------
  // https://secure.login.gov/?request_id=73db2a8b-f39b-4094-a637-f500ab789a50
  // -------------------------------------------------------------------------------------
  async login_page_2(): Promise<boolean> {
    // Sleep
    await sleepRandom()

    // Check if page correct
    const rightPage = await this.rightPage('https://secure.login.gov/', false)
    if (!rightPage) return false

    // Wait for element to load
    await this.waitForElement(USER_EMAIL_INPUT_SELECTOR)

    // Randomized mouse movements
    await this.randomizedMouseMovements()

    // Enter login info
    await this.type(
      USER_EMAIL_INPUT_SELECTOR,
      this.order?.login_email as string,
    )
    await this.type(
      USER_PASSWORD_INPUT_SELECTOR,
      this.order?.login_pass as string,
    )
    //TODO:IF STEALTH PLUGIN DIDNT WORK USE THIRD PARTY

    // Click on Login button
    await this.clickButtonAndNext(BUTTON_USA_SELECTOR)
    return true
  }

  // -------------------------------------------------------------------------------------
  // Step 3: 2-Factor Authentication Page
  // -------------------------------------------------------------------------------------
  // https://secure.login.gov/login/two_factor/authenticator
  // -------------------------------------------------------------------------------------
  async login_page_3(): Promise<boolean> {
    // Sleep
    await sleepRandom(true)

    // Check if terms have changed
    const termsPage = await this.rightPage(
      'https://secure.login.gov/rules_of_use',
      true,
      true,
    )
    if (termsPage) {
      await this.click('label[for="rules_of_use_form_terms_accepted"]')
      await this.clickButtonAndNext('.usa-button')
      await sleepRandom(true)
    }

    // Check if page correct
    const rightPage = await this.rightPage(
      'https://secure.login.gov/login/two_factor/authenticator',
    )
    if (!rightPage) return false

    // Wait for element to load
    await this.waitForElement('.one-time-code-input__input')

    // Generate login code
    const totp = new OTPAuth.TOTP({
      secret: this.order?.login_auth_key,
      digits: 6,
      algorithm: 'SHA1',
    })
    const loginCode = totp.generate()

    // Enter 2 Factor Code
    await this.type('.one-time-code-input__input', loginCode)

    // Don't remember this browser
    // await this.click('label[for="remember_device"]');

    // Click continue
    await this.clickButtonAndNext(BUTTON_USA_SELECTOR)

    // Sleep
    await sleepRandom(true)

    // Check if second MFA reminder page
    const secondMfaPage = await this.rightPage(
      'https://secure.login.gov/second_mfa_reminder',
      true,
      true,
    )
    if (secondMfaPage) {
      // Click continue
      await this.clickButtonAndNext(
        'div.grid-row form:nth-of-type(2) button.usa-button',
      )
      // Sleep
      await sleepRandom(true)
    }

    // If sign up completed page
    const signUpCompletedPage = await this.rightPage(
      'https://secure.login.gov/sign_up/completed',
      true,
      true,
    )
    if (signUpCompletedPage) {
      // Click continue
      await this.clickButtonAndNext(BUTTON_USA_WIDE)
    }
    return true
  }
}
