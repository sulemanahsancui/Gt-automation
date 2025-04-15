export interface JSON {
  [key: string]: any
}

export type waitUntil = 'load' | 'domcontentloaded' | 'networkidle0' | 'commit'
