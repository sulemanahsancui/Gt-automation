export class OrderService {
  async countRunningBots({
    botType,
    withinMinutes,
  }: {
    botType: number
    withinMinutes: number
  }) {
    console.log({ botType, withinMinutes })
    return Promise.resolve(1)
  }

  async getNextOrder() {
    return Promise.resolve()
  }

  async markAsFailed(id: number, args: { type: number; message: string }) {
    console.log({ id, args })
    return Promise.resolve()
  }

  async markAsStarted(id: number, { type }: { type: number }) {
    console.log({ id, type })
  }
}
