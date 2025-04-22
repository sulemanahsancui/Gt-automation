export class Formatter {
  /**
   * Get a formatted string to remove special characters, only allow -, & and .
   * @param string
   * @returns string
   */
  formatBasic(string: string): string {
    string = this.replaceComma(string)
    string = string.replace('  ', ' ')
    const pattern = /[^A-Za-z0-9 \-&\.]/
    return string.replace(pattern, '')
  }

  /**
   * Get a formatted string to remove special characters, only allow - and /
   * @param string
   * @returns string
   */
  formatBasic2(string: string): string {
    const pattern = /[^A-Za-z0-9 \-\/]/
    return string.replace(pattern, '')
  }

  /**
   * Get a formatted string to remove special characters, only allow letters and numbers
   * @param string
   * @returns string
   */
  formatBasic3(string: string): string {
    const pattern = /[^A-Za-z0-9]/
    return string.replace(pattern, '')
  }

  /**
   * Get a formatted string to only allow letters and spaces
   * @param string
   * @returns string
   */
  formatAll(string: string): string {
    string = this.replaceAmpersand(string)
    string = this.replaceComma(string)
    string = this.replaceSlash(string)
    const pattern = /[^A-Za-z ]/
    return string.replace(pattern, '')
  }

  /**
   * Format address string
   * @param address
   * @returns string
   */
  formatAddress(address: string): string {
    address = address.replace('#', ' Num ')
    address = address.replace('.', ' ')
    address = address.replace('  ', ' ')
    address = this.formatBasic2(address)
    return address
  }

  /**
   * Format city string
   * @param city
   * @returns string
   */
  formatCity(city: string): string {
    city = city.replace('.', ' ')
    city = city.replace('  ', ' ')
    city = this.replaceApostrophe(city)
    city = this.removeAccentedLetters(city)
    city = this.formatBasic2(city)
    return city
  }

  /**
   * Format zip code
   * @param zip_code
   * @returns string
   */
  formatZipCode(zip_code: string): string {
    const removeSpaces = zip_code.replace(' ', '')
    const removeDashes = removeSpaces.replace('-', '')
    return removeDashes.toUpperCase()
  }

  /**
   * Replace ampersand with 'and'
   * @param string
   * @returns string
   */
  replaceAmpersand(string: string): string {
    string = string.replace('&', ' and ')
    string = string.replace('  ', ' ')
    return string
  }

  /**
   * Replace comma with space
   * @param string
   * @returns string
   */
  replaceComma(string: string): string {
    return string.replace(',', ' ')
  }

  /**
   * Replace apostrophe with space
   * @param string
   * @returns string
   */
  replaceApostrophe(string: string): string {
    string = string.replace('’', ' ')
    string = string.replace("'", ' ')
    return string
  }

  /**
   * Replace slash with space
   * @param string
   * @returns string
   */
  replaceSlash(string: string): string {
    return string.replace('/', ' ')
  }

  /**
   * Format phone number by removing leading 1 in US-based numbers
   * @param phone
   * @returns string
   */
  formatPhoneNumber(phone: string): string {
    const length = phone.length
    if (length === 11) {
      const firstCharacter = phone.charAt(0)
      if (firstCharacter === '1') {
        phone = phone.slice(1)
      }
      return phone
    }
    return phone
  }

  /**
   * Remove accented characters from string
   * @param string
   * @returns string
   */
  removeAccentedLetters(string: string): string {
    return string.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }
}
