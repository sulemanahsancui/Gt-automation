import * as OTPAuth from 'otpauth'
import { Page } from 'playwright'

import {
  BUTTON_USA_SELECTOR,
  BUTTON_USA_WIDE_SELECTOR,
  LOGIN_BUTTON_SELECTOR,
  LOGIN_MODEL_FOOTER_SELECTOR,
  ONE_TIME_CODE_INPUT_SELECTOR,
  Order,
  SECOND_MFA_PAGE_BUTTON_SELECTOR,
  sleepRandom,
  USER_EMAIL_INPUT_SELECTOR,
  USER_PASSWORD_INPUT_SELECTOR,
} from '../lib'
import {
  LOGIN_PAGE_1_URL,
  LOGIN_PAGE_2_URL,
  LOGIN_PAGE_3_URL,
  LOGIN_PAGE_COMPLETED_URL,
  SECOND_MFA_PAGE_URL,
  TWO_FACTOR_AUTHENTICATION_URL,
} from '../lib/constants'
import { BotUtilities } from './BotUtilities'

export class BotLoginService {
  captcha_min_score = 0
  private botUtils: BotUtilities

  /**
   * Initializes the BotLogin module with the Playwright page object.
   * @param {BotUtilities} botUtils
   */
  constructor(botUtils: BotUtilities) {
    // super(false, page, null, null, order)
    this.botUtils = botUtils
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
    const rightPage = await this.botUtils.rightPage(LOGIN_PAGE_1_URL)
    if (!rightPage) return false

    // Wait for element to load
    await this.botUtils.waitForElement(LOGIN_BUTTON_SELECTOR)

    // Click on Login button
    await this.botUtils.add(LOGIN_BUTTON_SELECTOR)

    await sleepRandom(true)

    // Click on Consent and Continue
    await this.botUtils.clickButtonAndNext(LOGIN_MODEL_FOOTER_SELECTOR)
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
    const rightPage = await this.botUtils.rightPage(LOGIN_PAGE_2_URL, false)
    if (!rightPage) return false

    // Wait for element to load
    await this.botUtils.waitForElement(USER_EMAIL_INPUT_SELECTOR)

    // Randomized mouse movements
    await this.botUtils.randomizedMouseMovements()

    // Enter login info
    await this.botUtils.type(
      USER_EMAIL_INPUT_SELECTOR,
      this.botUtils.order?.login_email as string,
    )
    await this.botUtils.type(
      USER_PASSWORD_INPUT_SELECTOR,
      this.botUtils.order?.login_pass as string,
    )
    //TODO:IF STEALTH PLUGIN DIDNT WORK USE THIRD PARTY

    // Click on Login button
    await this.botUtils.clickButtonAndNext(BUTTON_USA_SELECTOR)
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
    const termsPage = await this.botUtils.rightPage(
      LOGIN_PAGE_3_URL,
      true,
      true,
    )
    if (termsPage) {
      await this.botUtils.click('label[for="rules_of_use_form_terms_accepted"]')
      await this.botUtils.clickButtonAndNext(BUTTON_USA_SELECTOR)
      await sleepRandom(true)
    }

    // Check if page correct
    const rightPage = await this.botUtils.rightPage(
      TWO_FACTOR_AUTHENTICATION_URL,
    )
    if (!rightPage) return false

    // Wait for element to load
    await this.botUtils.waitForElement(ONE_TIME_CODE_INPUT_SELECTOR)

    // Generate login code
    const totp = new OTPAuth.TOTP({
      secret: this.botUtils.order?.login_auth_key,
      digits: 6,
      algorithm: 'SHA1',
    })
    const loginCode = totp.generate()

    // Enter 2 Factor Code
    await this.botUtils.type(ONE_TIME_CODE_INPUT_SELECTOR, loginCode)

    // Don't remember this browser
    // await this.click('label[for="remember_device"]');

    // Click continue
    await this.botUtils.clickButtonAndNext(BUTTON_USA_SELECTOR)

    // Sleep
    await sleepRandom(true)

    // Check if second MFA reminder page
    const secondMfaPage = await this.botUtils.rightPage(
      SECOND_MFA_PAGE_URL,
      true,
      true,
    )
    if (secondMfaPage) {
      // Click continue
      await this.botUtils.clickButtonAndNext(SECOND_MFA_PAGE_BUTTON_SELECTOR)
      // Sleep
      await sleepRandom(true)
    }

    // If sign up completed page
    const signUpCompletedPage = await this.botUtils.rightPage(
      LOGIN_PAGE_COMPLETED_URL,
      true,
      true,
    )
    if (signUpCompletedPage) {
      // Click continue
      await this.botUtils.clickButtonAndNext(BUTTON_USA_WIDE_SELECTOR)
    }
    return true
  }
}
