import { BROWSER_ARGS, newBrowser } from './lib'
import { myDataSource } from './lib/db'

async function run() {
  console.info('Starting Bot...')

  // establish database connection
  myDataSource
    .initialize()
    .then(() => {
      console.log('Data Source has been initialized!')
    })
    .catch((err) => {
      console.error('Error during Data Source initialization:', err)
    })

  const browser = await newBrowser({
    // headless: config('NODE_ENV') == 'development' ? false : true,
    headless: false,
    args: BROWSER_ARGS,
  })
  const context = await browser.newContext()
  const page = await context.newPage()

  // const botApp = new BotSubmitApplication({ page })

  // await page.setViewportSize(botApp.getRandomScreenSize())

  // page.on('dialog', async (dialog) => await dialog.accept())

  // console.log({ botApp })ø

  console.log('FINISHED...')
}

run()
