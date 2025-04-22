/****** Auth steps Selectors */
export const LOGIN_BUTTON_SELECTOR = 'input.login-button'
export const LOGIN_MODEL_FOOTER_SELECTOR = '.modal-footer button.btn-primary'
export const USER_EMAIL_INPUT_SELECTOR = 'input.email'
export const USER_PASSWORD_INPUT_SELECTOR = 'input.password'
export const BUTTON_USA_SELECTOR = 'button.usa-button'
export const BUTTON_USA_WIDE_SELECTOR =
  'form button.usa-button.usa-button--wide'
export const RULES_OF_SE_FORM_TERMS_SELECTOR =
  'label[for="rules_of_use_form_terms_accepted"]'
export const ONE_TIME_CODE_INPUT_SELECTOR = '.one-time-code-input__input'
export const SECOND_MFA_PAGE_BUTTON_SELECTOR =
  'div.grid-row form:nth-of-type(2) button.usa-button'

/** payment page selector */

export const PAYMENTNOTICE_EXISTS_SELECTOR = 'label[for="paymentNotice"]'
export const PAY_BUTTOnN_PART_SELECTOR = '.pay-button-part button'
export const COMFIRM_BTN_SELECTOR = '#confirmBtn'
export const CHOOSE_PC_SELECTOR = 'label[for="choosePC"]'
export const ACCOUNT_HOLDER_SELECTOR = '#accountHolderName'
export const BILLING_ADDRESS_SELECTOR = '#billingAddress'
export const CITY_SELECTOR = '#city'
export const COUNTRY_SELECTOR = '#country'
export const ZIP_CODE_SELECTOR = '#zipPostalCode'
export const ACCOUNT_NUMBER_SELECTOR = '#accountNumber'
export const EXPIRATION_MONTH_SELECTOR = '#expirationMonth'
export const EXPIRATION_YEAR_SELECTOR = '#expirationYear'
export const CVV_SELECTOR = '#cardSecurityCode'

// selector for page_4b

export const PAGE_4B_SELECTORS = {
  areCitizenYes: 'label[for="areCitizenYes"]',
  areCitizenNo: 'label[for="areCitizenNo"]',
  countryOfCitizenship: '#countryOfCitizenship',
  areLRPYes: 'label[for="areLRPYes"]',
  areLRPNo: 'label[for="areLRPNo"]',
  statusLPR: 'label[for="statusLPR"]',
  statusImmigrant: 'label[for="statusImmigrant"]',
  statusNeither: 'label[for="statusNeither"]',
  tppOption: 'label[for="tppOption"]',
  globalEntry: 'label[for="globalEntry"]',
  imminentIntlTravelYes: 'label[for="imminentIntlTravelYes"]',
  imminentIntlTravelNo: 'label[for="imminentIntlTravelNo"]',
  nexus: 'label[for="nexus"]',
  sentri: 'label[for="sentri"]',
  tsaModalButton:
    'div.show#mdl-consider-tsa-modal-2 .row-link-group div:nth-of-type(2) .btn-primary',
}

// selector for page_4c
export const PAGE_4C_SELECTORS = {
  marketingQuestion: '#marketingQuestion',
}

//selector for page_4d

export const PAGE_4D_SELECTORS = {
  dashboardButton1: '.dashboard-card button.btn-primary:nth-of-type(1)',
  dashboardButton2: '.dashboard-card button.btn-primary:nth-of-type(2)',
}

// selector for page_4D_1

export const PAGE_4D_1_SELECTORS = {
  selectProgramPageUrl:
    'https://ttp.cbp.dhs.gov/program-selection/select-program',
  areCitizenYes: 'label[for="areCitizenYes"]',
  areCitizenNo: 'label[for="areCitizenNo"]',
  countryOfCitizenship: '#countryOfCitizenship',
  areLRPYes: 'label[for="areLRPYes"]',
  areLRPNo: 'label[for="areLRPNo"]',
  statusLPR: 'label[for="statusLPR"]',
  statusImmigrant: 'label[for="statusImmigrant"]',
  statusNeither: 'label[for="statusNeither"]',
  tppOption: 'label[for="tppOption"]',
  globalEntry: 'label[for="globalEntry"]',
  nexus: 'label[for="nexus"]',
  sentri: 'label[for="sentri"]',
  imminentIntlTravelYes: 'label[for="imminentIntlTravelYes"]',
  imminentIntlTravelNo: 'label[for="imminentIntlTravelNo"]',
  tsaModalButton:
    'div.show#mdl-consider-tsa-modal-2 .row-link-group div:nth-of-type(2) .btn-primary',
}

export const PAGE_5_SELECTORS = {
  gender: {
    male: 'label#male_label',
    female: 'label#female_label',
  },
  eyeColor: '#eyeColor',
  heightFeet: 'input[name="heightFeet"]',
  heightInches: 'input[name="heightInches"]',
  alias: {
    yes: 'label#aliasYes_label',
    no: 'label#aliasNo_label',
    firstName: '#aliasFirstName_0',
    lastName: '#aliasLastName_0',
  },
  guardian: {
    lastName: '#g_lastname',
    firstName: '#g_firstname',
    middleName: '#g_middlename',
    dobMonth: '#g_dateOfBirth_month',
    dobDay: '#g_dateOfBirth_day',
    dobYear: '#g_dateOfBirth_year',
    gender: {
      male: 'label[for="maleLgGender"]',
      female: 'label[for="femaleLgGender"]',
    },
    aidOption: '#aid_label',
    pidOption: '#pid_label',
    noneOption: '#none_label',
    applicationId: '#g_applicationId',
    passId: '#g_passId',
  },
  guardianMembershipText:
    'If the Legal Guardian has a current TTP membership or has a TTP application in progress, provide the PASSID or Application ID below.',
  modalButton: '.show .btn-primary',
  guardianAlertModal: '#alertModal.show',
}

export const PAGE_6_SELECTORS = {
  // Document type dropdown
  ddlDocType: '#ddlDocType',

  // Deletion selectors
  deletionSelector1:
    'ng-component > .row:nth-of-type(1) .card-panel > .row:nth-of-type(3) #card1_C .card-btns a:nth-of-type(2)',
  deletionSelector2:
    'ng-component > .row:nth-of-type(1) .card-panel > .row:nth-of-type(3) #card0_C .card-btns a:nth-of-type(2)',
  deletionSelector3:
    'ng-component > .row:nth-of-type(3) #card1_A .card-btns a:nth-of-type(2)',
  deletionSelector4:
    'ng-component > .row:nth-of-type(3) #card0_A .card-btns a:nth-of-type(2)',
  deletionSelector5:
    'ng-component > .row:nth-child(2) .ttpcard .card-btns a:nth-of-type(2)',

  // Modal & confirmation
  confirmModalBtn: '#confirmModal.show .btn-primary',
  notifyInfo: 'div#notifyInfo.show',
  notifyBtn: 'div#notifyInfo.show #notifyBtn',

  // Form fields
  lastNameInput: '#txtLastName0_C',
  firstNameInput: '#txtGivenName0_C',
  middleNameInput: '#txtMiddleName0_C',
  dobMonthSelect: '#dateOfBirthMonth0_C',
  dobDayInput: '#dateOfBirthDay0_C',
  dobYearInput: '#dateOfBirthYear0_C',
  docNumberInput: '#txtDocNumber0_C',
  issuanceMonthSelect: '#dateOfIssuanceMonth0_C',
  issuanceDayInput: '#dateOfIssuanceDay0_C',
  issuanceYearInput: '#dateOfIssuanceYear0_C',
  expirationMonthSelect: '#expirationMonth0_C',
  expirationDayInput: '#expirationDay0_C',
  expirationYearInput: '#expirationYear0_C',

  // For non-US/CA
  machineReadibleYes: '#machineReadibleYes',
  addCardBtn2:
    '#app-main-content > ng-component > .row:nth-child(2) .add-card button.btn-primary',

  // PR card fields
  lastNameInputPR: '#txtLastName0_L',
  firstNameInputPR: '#txtGivenName0_L',
  middleNameInputPR: '#txtMiddleName0_L',
  dobMonthSelectPR: '#dateOfBirthMonth0_L',
  dobDayInputPR: '#dateOfBirthDay0_L',
  dobYearInputPR: '#dateOfBirthYear0_L',
  docNumberInputPR: '#txtDocNumber0_L',
  expirationMonthSelectPR: '#expirationMonth0_L',
  expirationDayInputPR: '#expirationDay0_L',
  expirationYearInputPR: '#expirationYear0_L',

  // Alert and error handling
  alertModal: '#alertModal.show',
  alertModalBtn: '#alertModal.show .btn-primary',
  errorSummary: '.error-summary',
  acceptCitDocument: '#acceptCitDocument',

  // Add Card Button
  addCardBtn:
    '#app-main-content .row:nth-child(1) .card-panel .row:nth-child(3) .add-card button.btn-primary',
}

export const PAGE_7_SELECTORS = {
  // Drivers License Yes/No
  dlYesLabel: 'label[for="haveLicenseYes"]',
  dlNoLabel: 'label[for="haveLicenseNo"]',

  // DL Number
  dlNumberInput: '#licenseNumber',

  // Country of Issuance
  countryOfIssuanceSelect: '#countryOfIssuance',

  // State of Issuance
  stateOfIssuanceSelect: '#stateOfIssuance',
  stateOfIssuanceInput: '#stateOfIssuance',

  // Expiration Date
  dlExpirationMonthSelect: '#DLE_month',
  dlExpirationDayInput: '#DLE_day',
  dlExpirationYearInput: '#DLE_year',

  // DL Name
  dlLastNameInput: '#lastName',
  dlFirstNameInput: '#firstName',
  dlMiddleNameInput: '#middleName',

  // DL Date of Birth
  dlDobMonthSelect: '#DLDOB_month',
  dlDobDayInput: '#DLDOB_day',
  dlDobYearInput: '#DLDOB_year',

  // US & CA Specific
  dlEdlYesLabel: 'label[for="isEDLYes"]',
  dlEdlNoLabel: 'label[for="isEDLNo"]',
  dlCdlYesLabel: 'label[for="isCDLYes"]',
  dlCdlNoLabel: 'label[for="isCDLNo"]',
  dlHazmatYesLabel: 'label[for="isHazmatYes"]',
  dlHazmatNoLabel: 'label[for="isHazmatNo"]',
}

export const PAGE_8_SELECTORS = {
  driveBorderYes: 'label[for="driveBorderYes"]',
  driveBorderNo: 'label[for="driveBorderNo"]',
  vehicleAlreadyRegisteredYes: 'label[for="vehicleAlreadyRegisteredYes"]',
  vehicleAlreadyRegisteredNo: 'label[for="vehicleAlreadyRegisteredNo"]',
  vehicleRegisterNowYes: 'label[for="vehicleRegisterNowYes"]',
  vehicleRegisterNowNo: 'label[for="vehicleRegisterNowNo"]',
  card0: '#card0',
  deleteCard0Btn: '#card0 .card-btns a:nth-of-type(2)',
  confirmModalPrimaryBtn: '#confirmModal.show .btn-primary',
  addVehicleBtn: '.add-card .btn-primary',
  licenseCountryOfIssuance: '#licenseCountryOfIssuance_0',
  vehicleGovPlateYes: 'label[for="vehicle0GovtLicensePlateYes"]',
  vehicleGovPlateNo: 'label[for="vehicle0GovtLicensePlateNo"]',
  vehicleStateDropdown: '#vehicleStateProvinceOfIssuance_0',
  ownerType: (type: string) => `label[for="vehicle0WhoOwnsVehicle${type}"]`,
  genderMale: 'label[for="vehicle0OwnerGenderMale"]',
  genderFemale: 'label[for="vehicle0OwnerGenderFemale"]',
  countryDropdown: '#country_0',
  stateDropdown: '#state_0',
  phoneNumberFormatDropdown: '#ownerPhoneNumberFormat_0',
}

// selector for page_13

// selectors.ts

export const PAGE_13_SELECTORS = {
  personal: '#confirmPersonal',
  documents: '#confirmDocuments',
  license: '#confirmLicense',
  vehicle: '#confirmVehicle',
  address: '#confirmAddress',
  employment: '#confirmEmployment',
  travel: '#confirmTravel',
  additional: '#confirmAdditional',
}
