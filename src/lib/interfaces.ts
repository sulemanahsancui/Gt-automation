export interface JSON {
  [key: string]: any
}

export type WAIT_UNTIL = 'load' | 'domcontentloaded' | 'networkidle0' | 'commit'

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



export interface Order {
  // Define the Order interface
  login_email: string
  login_pass: string
  login_auth_key: string
  // Add other order properties as needed
}

export type ServiceType = 'ge' | 'nexus' | 'sentri' | 'pretsa' | string
