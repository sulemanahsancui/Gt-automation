import * as OTPAuth from 'otpauth'

// Generate login code
const totp = new OTPAuth.TOTP({
  secret: 'WNOPYIDPAVOYBHXZOSBIVHODNDNJSYUA',
  digits: 6,
  algorithm: 'SHA1',
})
const loginCode = totp.generate()
console.log(loginCode)
