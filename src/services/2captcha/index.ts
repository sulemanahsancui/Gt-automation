import { Page } from 'playwright'
import { logger } from '../../lib'

export const resolveCaptcha = async (page: Page, captchasID: string) => {
  logger.info('Solving captchas..')
  try {
    await page.solveRecaptchas()
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 0 }),
      page.click(captchasID),
    ])
    const content = await page.content()
    const isSuccess = content.includes('Verification Success')
    console.log('Done', { isSuccess })
    if (isSuccess) return true
    else return false
  } catch (error) {
    throw error
  }
}
