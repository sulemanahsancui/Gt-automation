import { Page } from 'puppeteer'
import { BotSubmitApplication } from './services'
import { launchProfile } from './services/kameleo.service'

import { decrypt } from './services/kms.service'

async function run() {
  console.info('Starting Bot...')
  // establish database connection
  // await myDataSource.initialize().catch((err) => {
  //   console.error('Error during Data Source initialization:', err)
  //   console.log('Exiting gracefull.')
  //   process.exit(0)
  // })

  console.log('Data Source has been initialized!')

  // const browser = await newBrowser({
  //   // headless: config('NODE_ENV') == 'development' ? false : true,
  //   headless: false,
  //   args: BROWSER_ARGS,
  // })
  // const context = await browser.newContext()
  // const page = await context.newPage()

  const { page, browser } = await launchProfile(
    '2a14fb2f-b64d-4967-b5d5-4ddef1729309',
    // ' aa5e8a28-0290-4f44-ad7c-7f3142e590da'
  )

  const data = {
    id: 294443,
    pretty_id: 'EPYYFMUPMP0U',
    type: 0,
    name: 'Alexander Tiches',
    email: 'megasaleko@gmail.com',
    phone_number: 3019919148,
    phone_number_type: 0,
    status: 9,
    reason: 2,
    amount: 149.95,
    refunded: 0.0,
    source: 'Global Entry US Pass',
    source_url: 'ge.global-entry-us-pass.com',
    referer: 159896,
    transaction_id: '10661291225',
    refund_id: null,
    payment_intent_id: '',
    payment_captured: 0,
    user_id: 93,
    ready_for_payment_user_id: null,
    ready_for_payment_date: null,
    checked_user_id: null,
    checked_out_at: '2025-05-01 16:19:43',
    checked_in_at: '2025-05-01 17:44:39',
    detail_id: 484184,
    coupon_id: null,
    payment_id: 290428,
    marketing: 0,
    marketing_sms: 0,
    mid: 'nmi-1',
    screenshot: null,
    login_email: 'epyyfmupmp0u@trusted-traveler-assist.com',
    login_pass:
      'AQICAHgWJGV+nBkRB0+pbei2mnL3dZAPKqPKtHrGaSLTrm7ynQEVyZ0rnhneoBVenSV1TQh4AAAAcjBwBgkqhkiG9w0BBwagYzBhAgEAMFwGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMcIxuOUXvhjKZ8yHHAgEQgC++TyyBtYxoCPleWbjPpWgbaI2wS1mP6OLhFfggRdEO1jYe6c760n8e8PvmtRKznQ==',
    login_codes: null,
    login_auth_key:
      'AQICAHgWJGV+nBkRB0+pbei2mnL3dZAPKqPKtHrGaSLTrm7ynQFEIXzJgc3/kFuzbkaHualfAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM0hyM6c0RdHyxXdKJAgEQgDudRFP7x2d3l27KsAcTIEb7N0RpT3kcimxffi7PgrQ64dDgjA51iuAcQzqWo/EpmRHJc4zBYvaZFKgwKw==',
    membership_number: null,
    application_id: 131084395,
    bot_try: 1,
    bot_fail: 1,
    bot_type: 3,
    bot_screenshot: '68139e2c7bc930.92245681.png',
    bot_message:
      'Wrong URL | Page #: 3 | U: https://secure.login.gov/sign_in_security_check_failed',
    bot_started_at: '2025-05-01 16:13:14',
    bot_failed_at: '2025-05-01 16:15:41',
    bot_tries: 1,
    bot_completed_at: null,
    walk_through: 0,
    walk_through_at: null,
    reminders_sent: 0,
    submitted_notifications_sent: 0,
    refunded_at: null,
    chargebacked_at: null,
    completed_at: null,
    submitted_at: null,
    interview_at: null,
    enrollment_center_id: null,
    proxy_username:
      'brd-customer-hl_b23992c1-zone-residential_1-session-EPYYFMUPMP0U',
    created_at: '2025-04-30 17:29:32',
    updated_at: '2025-05-01 17:50:55',
  }

  const email = data.email
  // fbyzz1nu8v0w@trusted-traveler-assist.com
  const password = await decrypt(
    data.login_pass,
    // 'AQICAHgWJGV+nBkRB0+pbei2mnL3dZAPKqPKtHrGaSLTrm7ynQFGi7glaW6HxVSyablYfATqAAAAcjBwBgkqhkiG9w0BBwagYzBhAgEAMFwGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMOOtLLPOOnG/KlBazAgEQgC+kgfgw4GOF7XLavfyR7s05JZyPULdrCjjSvdTpnZJ1gqHQcGE8oiG2CjqSdraukQ==',
  )

  const login_auth_key = await decrypt(
    data.login_auth_key,
    // 'AQICAHgWJGV+nBkRB0+pbei2mnL3dZAPKqPKtHrGaSLTrm7ynQGGDTr3qAQmObKlCdOA2MxeAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMxt/mFmaLgGyuDTbgAgEQgDtBBzWvLnz+01pYIhBP3AfGwTLbsNjjfW3YkionBV+p0wClQI3XfBk0tXQ/qYgVuuQA574s5+ImBrS7dA==',
  )

  console.log({ email, password, authKey: login_auth_key })

  const botApp = new BotSubmitApplication({
    page,
    order: {},
    browser,
    email,
    password,
    authKey: login_auth_key,

    // delay,
    // botType,
    // button_next,
    // application_id,
    // minimumYears,
    // resumeApplication,
    // previousAddressEndedMonth,
    // previousAddressEndedYear,
  })

  // await page.setViewportSize(botApp.getRandomScreenSize())

  process.on('SIGINT', async () => {
    await page.close()
    await browser.close()
  })

  await botApp.page_1()
  await botApp.page_2()
  await botApp.page_3()
  await botApp.page_4()
  // page.on('dialog', async (dialog) => await dialog.accept())

  // console.log({ botApp })ø
  //

  console.log('FINISHED...')
}

run()
