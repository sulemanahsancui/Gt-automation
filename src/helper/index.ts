import { TOTP } from 'otpauth'
import TwoCaptcha from '2captcha'
import { Page } from 'puppeteer' // Import Page type
import * as config from '../config'
//  Helper functions (simulated - you'll need to adapt these)
const Helper = {
  decrypt: (encrypted: string): string => {
    //  Replace with your actual decryption logic (AES, etc.)
    if (!encrypted) return ''
    try {
      // Example:  Base64 decode (INSECURE - REPLACE WITH REAL DECRYPTION)
      return Buffer.from(encrypted, 'base64').toString('utf-8')
    } catch (e) {
      console.error('Decryption Error', e)
      return ''
    }
  },
  sleep: (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms)),
  random: (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min,
}

interface Order {
  // Define the Order interface
  login_email: string
  login_pass: string
  login_auth_key: string
  // Add other order properties as needed
}

const BotLogin = {
  captcha_min_score: 0,
  button_usa: 'button.usa-button',
  button_usa_wide: 'form button.usa-button.usa-button--wide',
  randomized_mouse_movements: 0,
  page: null as Page | null,
  order: null as Order | null,

  /**
   * Initializes the BotLogin module with the Puppeteer page object.
   * @param {puppeteer.Page} page - The Puppeteer page object.
   * @param {object} order - the order object.
   */
  async init(page: Page, order: Order): Promise<void> {
    // Specify types
    this.page = page
    this.order = order
  },

  // -------------------------------------------------------------------------------------
  // Utility Methods (from PHP Trait)
  // -------------------------------------------------------------------------------------

  /**
   * Sleeps for a random amount of time.
   * @param {boolean} longSleep - If true, uses a longer sleep range.
   */
  async sleepRandom(longSleep: boolean = false): Promise<void> {
    // Use boolean
    if (longSleep) {
      await Helper.sleep(Helper.random(2000, 5000)) //  Adjust these values
    } else {
      await Helper.sleep(Helper.random(1000, 3000))
    }
  },

  /**
   * Checks if the current page URL matches the expected URL.
   * @param {string} expectedUrl - The expected URL.
   * @param {boolean} partialMatch - If true, checks if the current URL contains the expected URL.
   * @param {boolean} allowRedirect - if true, checks the final url after redirects
   * @returns {boolean} - True if the URLs match, false otherwise.
   */
  async rightPage(
    expectedUrl: string,
    partialMatch: boolean = false,
    allowRedirect: boolean = false,
  ): Promise<boolean> {
    try {
      if (allowRedirect) {
        await this.page!.waitForNavigation({ waitUntil: 'networkidle2' }) // Use non-null assertion
      }
      const currentUrl = this.page!.url() // Use non-null assertion
      if (partialMatch) {
        return currentUrl.includes(expectedUrl)
      } else {
        return currentUrl === expectedUrl
      }
    } catch (error) {
      console.error(
        `Error checking page URL. Expected: ${expectedUrl}, Current: ${this.page!.url()}`,
        error,
      ) // Use non-null assertion
      return false //  Return false on error to prevent further actions
    }
  },

  /**
   * Waits for an element to load on the page.
   * @param {string} selector - The CSS selector of the element to wait for.
   */
  async waitForElement(selector: string): Promise<void> {
    try {
      await this.page!.waitForSelector(selector, { timeout: 10000 }) //  Increased timeout, non-null
    } catch (error) {
      console.error(
        `Element with selector "${selector}" not found after 10 seconds.`,
        error,
      )
      //  Consider throwing an error or returning a specific value (e.g., null)
      throw error // rethrow
    }
  },

  /**
   * Adds an action (click) to the page.  (Simplified for Node.js)
   * @param {string} selector - The CSS selector of the element to click.
   */
  async add(selector: string): Promise<void> {
    try {
      await this.page!.click(selector)
    } catch (error) {
      console.error(
        `Error clicking on element with selector "${selector}"`,
        error,
      )
      throw error
    }
  },

  /**
   * Clicks a button and navigates to the next page.
   * @param {string} selector - The CSS selector of the button to click.
   */
  async clickButtonAndNext(selector: string): Promise<void> {
    try {
      await this.page!.click(selector)
      await this.page!.waitForNavigation({ waitUntil: 'networkidle2' })
    } catch (error) {
      console.error(
        `Error clicking button and navigating. Selector: ${selector}`,
        error,
      )
      throw error
    }
  },

  /**
   * Clicks on an element
   * @param {string} selector - The CSS selector of the element to click.
   */
  async click(selector: string): Promise<void> {
    try {
      await this.page!.click(selector)
    } catch (error) {
      console.error(
        `Error clicking on element with selector: ${selector}`,
        error,
      )
      throw error
    }
  },

  /**
   * Types text into an input field.
   * @param {string} selector - The CSS selector of the input field.
   * @param {string} text - The text to type.
   */
  async type(selector: string, text: string): Promise<void> {
    try {
      await this.page!.type(selector, text)
    } catch (error) {
      console.error(
        `Error typing text into element with selector "${selector}"`,
        error,
      )
      throw error
    }
  },

  /**
   * Executes randomized mouse movements.
   */
  async randomizedMouseMovements(): Promise<void> {
    if (Math.random() < 0.5) {
      //  Simplified the rand(0,1)
      this.randomized_mouse_movements = 1
      const moveTimes = Helper.random(3, 10)

      for (let i = 0; i <= moveTimes; i++) {
        try {
          // const x = Helper.random(5, 320);
          // const y = Helper.random(400, 820);
          // await this.page.mouse.move({x:x, y:y}); // Typescript
          await this.page!.mouse.move(
            Helper.random(5, 320),
            Helper.random(400, 820),
          )
          await Helper.sleep(Helper.random(100, 600))
        } catch (error) {
          console.error('Error during mouse movement', error)
          //  Should we throw here?  Depends on your error handling strategy
          // throw error;  //  Optionally re-throw
        }
      }
    }
  },

  // -------------------------------------------------------------------------------------
  // Step 1: Start Page
  // -------------------------------------------------------------------------------------
  // https://ttp.cbp.dhs.gov/
  // -------------------------------------------------------------------------------------
  async login_page_1(): Promise<boolean> {
    // Sleep
    await this.sleepRandom()

    // Check if page correct
    const rightPage = await this.rightPage('https://ttp.cbp.dhs.gov/')
    if (!rightPage) return false

    // Wait for element to load
    await this.waitForElement('input.login-button')

    // Click on Login button
    await this.add('input.login-button')

    await this.sleepRandom(true)

    // Click on Consent and Continue
    await this.clickButtonAndNext('.modal-footer button.btn-primary')
    return true
  },

  // -------------------------------------------------------------------------------------
  // Step 2: Login.gov Login Page
  // -------------------------------------------------------------------------------------
  // https://secure.login.gov/?request_id=73db2a8b-f39b-4094-a637-f500ab789a50
  // -------------------------------------------------------------------------------------
  async login_page_2(): Promise<boolean> {
    // Sleep
    await this.sleepRandom()

    // Check if page correct
    const rightPage = await this.rightPage('https://secure.login.gov/', false)
    if (!rightPage) return false

    // Wait for element to load
    await this.waitForElement('input.email')

    // Randomized mouse movements
    await this.randomizedMouseMovements()

    // Enter login info
    await this.type('input.email', this.order!.login_email) // Use non-null assertion
    await this.type('input.password', this.order!.login_pass) // Decrypt, non-null assertion

    // try to get a valid captcha token
    const client = new TwoCaptcha(config.twoCaptchaApiKey) // Use the API key from your config
    this.captcha_min_score = Math.random() * (1.0 - 0.4) + 0.4 // Score between 0.4 and 1.0

    try {
      const result = await client.solveRecaptcha({
        sitekey: '6LcWWqwnAAAAAL1B9WtNWT8nwwPy_0KiGMEeT3gl',
        url: 'https://secure.login.gov/',
        version: 'v3',
        action: 'sign_in',
        min_score: this.captcha_min_score,
      })

      // try to update the captcha token
      await this.page!.evaluate((code: string) => {
        // Type the code parameter
        const captchaElement: any = document.querySelector(
          '.g-recaptcha-response',
        )
        if (captchaElement) {
          captchaElement.value = code
        }
      }, result.response) // Pass the token string
    } catch (error) {
      console.error('TwoCaptcha Error:', error)
      //  Important:  Handle the error.  For example, you might want to:
      //  1.  Retry the captcha
      //  2.  Fail the login attempt
      //  3.  Use a different captcha solving method
      return false //  Consider if you want to stop the login process here.
    }

    // Click on Login button
    await this.clickButtonAndNext(this.button_usa)
    return true
  },

  // -------------------------------------------------------------------------------------
  // Step 3: 2-Factor Authentication Page
  // -------------------------------------------------------------------------------------
  // https://secure.login.gov/login/two_factor/authenticator
  // -------------------------------------------------------------------------------------
  async login_page_3(): Promise<boolean> {
    // Sleep
    await this.sleepRandom(true)

    // Check if terms have changed
    const termsPage = await this.rightPage(
      'https://secure.login.gov/rules_of_use',
      true,
      true,
    )
    if (termsPage) {
      // Click checkbox
      await this.click('label[for="rules_of_use_form_terms_accepted"]')
      // Click continue
      await this.clickButtonAndNext('.usa-button')
      // Sleep
      await this.sleepRandom(true)
    }

    // Check if page correct
    const rightPage = await this.rightPage(
      'https://secure.login.gov/login/two_factor/authenticator',
    )
    if (!rightPage) return false

    // Wait for element to load
    await this.waitForElement('.one-time-code-input__input')

    // Generate login code
    const totp = new TOTP({
      secret: this.order!.login_auth_key, // Make sure this is the *secret*, not the whole URL, non-null
      digits: 6, //  Most TOTP codes are 6 digits
      algorithm: 'SHA1', //  Check the correct algorithm
    })
    const loginCode = totp.now()

    // Enter 2 Factor Code
    await this.type('.one-time-code-input__input', loginCode)

    // Don't remember this browser
    // await this.click('label[for="remember_device"]');  // Removed, no equivalent

    // Click continue
    await this.clickButtonAndNext(this.button_usa)

    // Sleep
    await this.sleepRandom(true)

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
      await this.sleepRandom(true)
    }

    // If sign up completed page
    const signUpCompletedPage = await this.rightPage(
      'https://secure.login.gov/sign_up/completed',
      true,
      true,
    )
    if (signUpCompletedPage) {
      // Click continue
      await this.clickButtonAndNext(this.button_usa_wide)
    }
    return true
  },
}

export = BotLogin
