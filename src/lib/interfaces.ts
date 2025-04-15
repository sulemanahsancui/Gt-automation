export interface JSON {
  [key: string]: any
}

export type waitUntil = 'load' | 'domcontentloaded' | 'networkidle0' | 'commit'

export interface ProxyCredentials {
  username: string
  password: string
  host: string
  port: number
  id?: number
}

export interface BotLogEntry {
  command: number
  ipaddress: string
  proxyUsername?: string | null
  orderId: number
  proxyDetails?: string
  botMessage?: string
}

export interface IScreenResolution {
  id: number
  width: number
  height: number
}

export type ServiceType = 'ge' | 'nexus' | 'sentri' | 'pretsa' | string
