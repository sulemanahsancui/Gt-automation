import { BROWSER_ARGS, newBrowser } from './lib'
import { myDataSource } from './lib/db'
import { BotSubmitApplication } from './services'
import * as OTPAuth from 'otpauth'

async function run() {
  console.info('Starting Bot...')
  // establish database connection
  // await myDataSource.initialize().catch((err) => {
  //   console.error('Error during Data Source initialization:', err)
  //   console.log('Exiting gracefull.')
  //   process.exit(0)
  // })

  console.log('Data Source has been initialized!')

  const browser = await newBrowser({
    // headless: config('NODE_ENV') == 'development' ? false : true,
    headless: false,
    args: BROWSER_ARGS,
  })
  const context = await browser.newContext()
  const page = await context.newPage()

  const botApp = new BotSubmitApplication({
    page,
    order: {},
    browser,
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

  await botApp.page_1()
  await botApp.page_2()
  await botApp.page_3()
  await botApp.page_4a()
  // page.on('dialog', async (dialog) => await dialog.accept())

  // console.log({ botApp })ø

  console.log('FINISHED...')
}

run()
