import { DecryptCommand, EncryptCommand, KMSClient } from '@aws-sdk/client-kms'
import { fromEnv } from '@aws-sdk/credential-providers'
import { Request } from 'express'
import fs from 'fs'
import path from 'path'
import { config } from '../config'
import {
  CANANDIAN_STATES,
  COUNTRIES,
  COUNTRIES_3_LETTERCODES,
  COUNTRIES_ALT,
  COUNTRY_CALLING_CODES,
  ISSUES,
  MEXICAN_STATES,
  MONTHS,
  ServiceType,
  STATES,
  STATUSES,
  UNWANTED_CHARS,
} from '../lib'

export class HelperService {
  static bodyClass(requestPath: string[]): string {
    const bodyClasses: string[] = []
    let className = ''

    for (const segment of requestPath) {
      if (!segment || !isNaN(+segment)) continue
      className += className ? `-${segment}` : segment
      bodyClasses.push(className)
    }

    return requestPath.includes('home') ? 'home' : bodyClasses.join(' ')
  }

  static setActive(
    path: string,
    currentPath: string,
    exact = false,
    active = 'active',
  ): string {
    if (exact) return currentPath === path ? active : ''
    return currentPath.startsWith(path) ? active : ''
  }

  static convertCommasToArray(input: string): string[] {
    return input.split(',').map((str) => str.trim())
  }

  static formatSSN(value: string): string {
    return value.replace(/^(\d{3})(\d{2})(\d{4})$/, '$1-$2-$3')
  }

  static formatPhone(value: string): string {
    return value.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')
  }

  static removeNonNumeric(value: string): string {
    return value.replace(/\D/g, '')
  }

  /**
   * Format zip code
   * @param {string} zip_code
   * @returns {string}
   */
  static formatZipCode(zip_code: string): string {
    const removeSpaces = zip_code.replace(/\s+/g, '')
    const removeDashes = removeSpaces.replace(/-/g, '')
    const toUpperCase = removeDashes.toUpperCase()

    return toUpperCase
  }

  static async encrypt(value: string, kmsKeyId: string): Promise<string> {
    const client = new KMSClient({ credentials: fromEnv() })
    const command = new EncryptCommand({
      KeyId: kmsKeyId,
      Plaintext: new TextEncoder().encode(value),
    })

    try {
      const response = await client.send(command)
      return Buffer.from(response.CiphertextBlob as Uint8Array).toString(
        'base64',
      )
    } catch (err) {
      console.error('Encryption failed:', err)
      return value
    }
  }

  static async decrypt(value: string): Promise<string> {
    const client = new KMSClient({ credentials: fromEnv() })
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(value, 'base64'),
    })

    try {
      const response = await client.send(command)
      return new TextDecoder().decode(response.Plaintext as Uint8Array)
    } catch (err) {
      console.error('Decryption failed:', err)
      return value
    }
  }

  static calculatePercentage(val1: number, val2: number): number {
    if (!val1 || !val2) return 0
    return Math.round((val1 / val2) * 10000) / 100
  }

  static getFieldValue(order: any, label: string): string {
    for (const val of order.values || []) {
      if (val.field?.label === label) return val.value
    }
    return ''
  }

  // === GET STATE ABBREVIATION ===
  static getStateAbbreviation(state: string): string | false {
    const states: any = this.getStates()
    if (state.length === 2) {
      const upper = state.toUpperCase()
      return states[upper] ? upper : false
    } else {
      const formatted = this.titleCase(state)
      const found = Object.entries(states).find(
        // eslint-disable-next-line
        ([_, name]) => name === formatted,
      )
      return found ? found[0] : false
    }
  }

  // === GET STATE NAME ===
  static getStateName(state: string): boolean {
    const states: any = this.getStates()
    if (state.length === 2) {
      return states[state.toUpperCase()] ?? false
    } else {
      const formatted = this.titleCase(state)
      const found = Object.values(states).find((name) => name === formatted)
      return found as boolean
    }
  }

  // === GET COUNTRY NAME ===
  static getCountryName(code: string): string | false {
    const countries: any = this.getCountries()
    if (code.length === 2) {
      const name = countries[code.toUpperCase()]
      return name ? this.titleCase(name) : false
    } else {
      return this.titleCase(code)
    }
  }

  // === GET COUNTRY ABBREVIATION ===
  static getCountryAbbreviation(name: string): string | false {
    const countries: any = this.getCountries()
    if (name.length === 2) {
      return countries[name.toUpperCase()] ? name.toUpperCase() : false
    } else {
      const upper = name.toUpperCase()
      const found = Object.entries(countries).find(
        // eslint-disable-next-line
        ([_, full]) => (full as string)?.toUpperCase() === upper,
      )
      return found ? found[0] : false
    }
  }

  // === UTILITY ===
  private static titleCase(input: string): string {
    return input
      .toLowerCase()
      .split(' ')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ')
  }

  /**
   * Get an array of countries with 3-letter code
   */
  public static getCountries3LetterCode() {
    return COUNTRIES_3_LETTERCODES
  }

  /**
   * Get an array of countries with names formatted to DHS website
   */
  public static getCountriesAlt() {
    return COUNTRIES_ALT
  }

  /**
   * Get an array of countries and abbreviations
   */
  public static getCountries() {
    return COUNTRIES
  }

  /**
   * Get an array of country calling codes
   */
  public static getCountryCallingCodes() {
    return COUNTRY_CALLING_CODES
  }

  public static getGuardianApplication() {
    return {
      None: 0,
      'Application ID': 1,
      'Membership Number/PASSID': 2,
    }
  }

  /**
   * Get an array of states and abbreviations
   */
  public static getStates() {
    return STATES
  }

  /**
   * Get an array of Canadian states and abbreviations
   */
  public static getCanadianStates() {
    return CANANDIAN_STATES
  }

  /**
   * Get an array of Mexican states and abbreviations
   */
  public static getMexicanStates() {
    return MEXICAN_STATES
  }

  /**
   * Get month number from month name
   * @param month - Full month name (e.g. "January")
   * @returns Month number as string (e.g. "1") or undefined if not found
   */
  static getMonthNumber(month: string): string | undefined {
    const normalizedMonth = month.toLowerCase()
    const match = Object.entries(MONTHS).find(
      ([, name]) => name === normalizedMonth,
    )

    return match ? match[0] : undefined
  }

  /**
   * Get environment-aware storage path
   * @returns Absolute storage path string
   */
  static getStoragePath(): string {
    const folder =
      config('NODE_ENV') === 'development'
        ? 'simple-ss-filings'
        : 'app.simplessfilings.com'

    const rootStoragePath = path.resolve(__dirname, '..', '..')
    return path.join(rootStoragePath, folder, 'storage', 'app')
  }

  /**
   * Check if PDF file is encrypted
   * @param filePath Full path to the PDF file
   * @returns true if the file contains "/Encrypt", false otherwise
   */
  static pdfFileEncrypted(filePath: string): boolean {
    const buffer = fs.readFileSync(filePath)
    return buffer.includes('/Encrypt')
  }

  /**
   * Get service type based on subdomain and BUSINESS_NAME env
   * @param host hostname from request (e.g., req.hostname)
   */
  static getServiceType(host: string): ServiceType {
    const serviceType = host.split('.')[0]

    const geRoutes = ['global', 'global-entry', 'ge']
    const businessName = config('BUSINESS_NAME')

    switch (businessName) {
      case 'Global Entry':
        return 'ge'
      case 'NEXUS':
        return 'nexus'
      case 'SENTRI':
        return 'sentri'
      case 'TSA Pre-Check':
        return 'pretsa'
    }

    return geRoutes.includes(serviceType) ? 'ge' : serviceType
  }

  /**
   * Get service name from service type
   */
  static getServiceName(serviceType: ServiceType): string {
    switch (serviceType) {
      case 'ge':
      case 'global':
        return 'Global Entry'
      case 'nexus':
        return 'NEXUS'
      case 'sentri':
        return 'SENTRI'
      case 'pretsa':
        return 'TSA Pre-Check'
      default:
        return serviceType
    }
  }

  /**
   * Get service price
   */
  static getServicePrice(serviceType: ServiceType): number {
    switch (serviceType.toLowerCase()) {
      case 'ge':
      case 'global':
      case 'global entry':
        return 120
      case 'nexus':
        return 120
      case 'sentri':
        return 122.25
      case 'pretsa':
        return 85
      default:
        return 0
    }
  }

  /**
   * Get Query String Value for 'industry'
   */
  static getIndustryValue(req: Request): string {
    return (req.query.industry as string) || ''
  }

  /**
   * Get Active Industry based on the query string and loop object
   */
  static getActiveIndustry(key: string, loop: any, req: Request): string {
    const industry = req.query.industry as string

    if (industry && industry === key) {
      return 'active'
    }

    if (loop.first && !industry) {
      return 'active'
    }

    return ''
  }

  /**
   * Remove Accented Letters from a string
   */
  static removeAccentedLetters(string: string): string {
    return string
      .split('')
      .map((char) => UNWANTED_CHARS[char] || char)
      .join('')
  }

  /**
   * Get the user's IP address, considering proxies and forwarding headers
   */
  static getIp(req: Request): string {
    const headers = req.headers
    const forwardedFor = headers['x-forwarded-for'] as string
    const clientIp = forwardedFor
      ? forwardedFor.split(',')[0]
      : headers['client-ip'] || req.connection.remoteAddress

    if (this.isValidIp(clientIp as string)) {
      return clientIp as string
    }
    return req.ip as string
  }

  /**
   * Check if a string is a valid IP address (non-private and non-reserved)
   */
  static isValidIp(ip: string): boolean {
    const regex =
      /^(?!10\.\d{1,3}\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|0\.\d{1,3}\.\d{1,3}\.\d{1,3})(\d{1,3}\.){3}\d{1,3}$/
    return regex.test(ip)
  }

  /**
   * Get status name based on status ID
   */
  static statusName(statusId: number): string {
    return STATUSES[statusId] || 'n/a'
  }

  /**
   * Get issue name based on issue ID
   */
  static issueName(issueId: number): string {
    return ISSUES[issueId] || 'n/a'
  }

  /**
   * Get the next element in an array based on the given value
   */
  static getNextElementInArray(value: string, array: string[]): string | false {
    const index = array.indexOf(value)
    if (index === -1 || array.length === 1) return false

    const nextIndex = index + 1
    return array[nextIndex] || array[0]
  }
}
