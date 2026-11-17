export class EmptyPoolError extends Error {
  constructor(readonly week: number) {
    super(`第 ${week} 周：卡池为空，没有可抽取的卡`)
    this.name = 'EmptyPoolError'
  }
}
