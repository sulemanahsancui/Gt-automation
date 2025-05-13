import { Page } from 'puppeteer'
import { BotSubmitApplication } from './services'
import { launchProfile } from './services/kameleo.service'

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
  await botApp.page_4()
  // page.on('dialog', async (dialog) => await dialog.accept())

  // console.log({ botApp })ø
  //
  console.log('FINISHED...')
}

run()
