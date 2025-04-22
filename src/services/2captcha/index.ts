import { Page } from 'playwright'
// import { logger } from '../..'

export const resolveCaptcha = async (page: Page, captchasID: string) => {
  console.info('Solving captchas..')

  await page.solveRecaptchas()
  await Promise.all([
    page.waitForURL(page.url(), { waitUntil: 'networkidle', timeout: 0 }),
    page.click(captchasID),
  ])
  const content = await page.content()
  const isSuccess = content.includes('Verification Success')
  console.log('Done', { isSuccess })

  if (isSuccess) return true

  return false
}
