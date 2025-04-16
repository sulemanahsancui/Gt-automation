import { Page } from 'playwright'
import { BotLoginService } from './BotLogin'
import { BotPaymentService } from './BotPayment'
import { BotUtilities } from './BotUtilities'

export class BotSubmitApplication extends BotUtilities {
  botLoginService: BotLoginService
  botPaymentService: BotPaymentService

  constructor(page: Page, order: any) {
    super(false, page, null, null, order)
    this.botLoginService = new BotLoginService(page, order)
    this.botPaymentService = new BotPaymentService({
      alreadyPaid: false,
      page,
      continueButton: '',
    })
  }
}
