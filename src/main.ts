import { newBrowser } from './lib'
import { BotSubmitApplication } from './services'

async function run() {
  console.info('Starting Bot...')
  const args = [
    '--incognito',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--window-position=0,0',
    '--disable-dev-shm-usage',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--lang=en-US',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    //'--user-agent=' . $profile.user_agent
  ]

  const browser = await newBrowser({
    // headless: config('NODE_ENV') == 'development' ? false : true,
    headless: false,
    args,
  })

  const context = await browser.newContext()
  const page = await context.newPage()

  await page.setViewportSize({
    width: 1280,
    height: 743,
  })

  page.on('dialog', async (dialog) => await dialog.accept())

  const botApp = new BotSubmitApplication(page, null)

  console.log('FINISHED...')
}

run()
