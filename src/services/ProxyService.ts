export class ProxyService {
  private proxyUsername: string | null

  constructor(proxyUsername: string | null) {
    this.proxyUsername = proxyUsername
  }

  //TODO: Return random Proxy Here.
  getProxyObject() {
    const proxy = {
      username: this.proxyUsername,
      ip: '192.168.1.100',
      port: 8080,
    }
    return proxy
  }
}
