import { Browser, LaunchOptions, Page } from 'playwright'
import { chromium } from 'playwright-extra'
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { config } from '../config'

chromium.use(StealthPlugin())

const TWOCAPTCHA_TOKEN = config('TWOCAPTCHA_TOKEN')
if (TWOCAPTCHA_TOKEN)
  chromium.use(
    RecaptchaPlugin({
      provider: {
        id: '2captcha',
        token: config('TWOCAPTCHA_TOKEN'),
      },
    }),
  )

/**
 *
 * @param proxy
 * @param cookies
 * @param userId
 * @returns
 */
export const newBrowser = async (options: LaunchOptions) => {
  try {
    const browser = await chromium.launch(options)

    return browser
  } catch (error) {
    return Promise.reject(error)
  }
}

/**
 *
 * @param browser
 * @param url
 * @param cookies
 * @returns
 */

export const newPage = async (
  browser: Browser,
  url?: string,
): Promise<Page> => {
  if (!browser) throw new Error('Browser is not initialized!')

  // Create a new page inside context.
  const page = await browser.newPage()

  await page.setDefaultTimeout(60000)

  if (url) await page.goto(url, { waitUntil: 'networkidle' })

  return page
}

/**
 *
 * @param browser
 */
export const closeSession = async (browser: Browser) => {
  try {
    if (!browser) throw new Error('Browser is required!')
    await browser.close()
  } catch (error) {
    return Promise.reject(error)
  }
}
