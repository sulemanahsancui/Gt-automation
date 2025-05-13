import { BROWSER_ARGS, newBrowser } from './lib'
import { BotSubmitApplication } from './services'
import { decrypt } from './services/kms.service'
import dotenv from 'dotenv'

dotenv.config()

async function run() {
  console.info('Starting Bot...')
  // establish database connection
  // await myDataSource.initialize().catch((err) => {
  //   console.error('Error during Data Source initialization:', err)
  //   console.log('Exiting gracefull.')
  //   process.exit(0)
  // })

  console.log('Data Source has been initialized!')
  // HutpWhg9nN6YNG8Z5CpT
  // WNOPYIDPAVOYBHXZOSBIVHODNDNJSYUA
  // fbyzz1nu8v0w@trusted-traveler-assist.com

  const password = await decrypt(
    'AQICAHgWJGV+nBkRB0+pbei2mnL3dZAPKqPKtHrGaSLTrm7ynQFGi7glaW6HxVSyablYfATqAAAAcjBwBgkqhkiG9w0BBwagYzBhAgEAMFwGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMOOtLLPOOnG/KlBazAgEQgC+kgfgw4GOF7XLavfyR7s05JZyPULdrCjjSvdTpnZJ1gqHQcGE8oiG2CjqSdraukQ==',
  )

  const login_auth_key = await decrypt(
    'AQICAHgWJGV+nBkRB0+pbei2mnL3dZAPKqPKtHrGaSLTrm7ynQGGDTr3qAQmObKlCdOA2MxeAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMxt/mFmaLgGyuDTbgAgEQgDtBBzWvLnz+01pYIhBP3AfGwTLbsNjjfW3YkionBV+p0wClQI3XfBk0tXQ/qYgVuuQA574s5+ImBrS7dA==',
  )

  console.log({ password, login_auth_key })

  // const browser = await newBrowser({
  //   // headless: config('NODE_ENV') == 'development' ? false : true,
  //   headless: false,
  //   args: BROWSER_ARGS,
  // })
  // const context = await browser.newContext()
  // const page = await context.newPage()

  // const botApp = new BotSubmitApplication({
  //   page,
  //   order: {},
  //   browser,
  // delay,
  // botType,
  // button_next,
  // application_id,
  // minimumYears,
  // resumeApplication,
  // previousAddressEndedMonth,
  // previousAddressEndedYear,
  // })

  // await page.setViewportSize(botApp.getRandomScreenSize())

  // await botApp.page_1()
  // await botApp.page_2()
  // await botApp.page_3()
  // await botApp.page_4()
  // page.on('dialog', async (dialog) => await dialog.accept())

  // console.log({ botApp })ø
  //
  console.log('FINISHED...')
}

run()
