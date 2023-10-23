export const SOCKET_CARD_VERSION = true

export const CURRENT_SOFTWARE_VERSION = '0.0.1'

export const SUF_ESDC_TOKEN_URL = '/api/v3/sdc/token'
export const SUF_ESDC_AUDIT_URL = '/api/v3/sdc/audit'
export const SUF_ESDC_GET_COMMANDS = '/api/v3/sdc/commands'
export const SUF_ESDC_NOTIFY_STATUS = '/api/v3/sdc/status'
export const SUF_ESDC_AUDIT_PROF_URL = '/api/v3/sdc/audit-proof'

export const ROOT_DATA = 'WAPPDATA'
export const STORAGE = `${ROOT_DATA}/STORAGE`
export const SYSTEM = `${ROOT_DATA}/SYSTEM`
export const SYSTEM_ERRORS = `${ROOT_DATA}/SYSTEM/ERRORS`
export const SETTINGS = `${ROOT_DATA}/SETTINGS`
export const STORAGE_LAST_INVOICE = `${ROOT_DATA}/STORAGE_LAST_INVOICE`
export const STORAGE_SENT = `${ROOT_DATA}/STORAGE_SENT`
export const STORAGE_DELETED = `${ROOT_DATA}/STORAGE_DELETED`
export const LICENCE = `${ROOT_DATA}/LICENCE`
export const DEFAULT_REQUEST_ID = '8939750258jfga87h4t8ijffs8ik34f89'

export const CRON_JOB_REQ = '89432849324-4u389-JKLO-478392'

export const LICENSE_NUMBER_RECEIPT = 250

export const CERTIFICATE_CUSTOM_ATTRIBUTE_ID = '1.3.6.1.4.1.49952.'
export const CERTIFICATE_TAX_CORE_URL_ID = '5'
export const CERTIFICATE_TAX_PAYER_ID = '6'

export const MULTIPLY_FOR_SIGN_DATA = 10000

export const ONE_MIN = 60 * 1000
export const ONE_HOUR = 60 * ONE_MIN

export const NUMBER_EMPTY_GROUP_FILES_TO_DETECT_NO_MORE = 250 // ** number of files * 50 that should be empty to stop copy

export const NTP_CRON__MIN_TIME_CRITIC_ERROR = 3 * ONE_MIN
export const NTP_CRON__NEXT_TIME_ALLOWED = 4 * ONE_HOUR

export const _AUDIT_PROOF_CRON__NEXT_TIME_ALLOWED = 8 * ONE_HOUR
export const _AUDIT_SEND_CRON__NEXT_TIME_ALLOWED = 5 * ONE_MIN

export const LAST_RECEIPT_ALLOWED_TIME_INCONSISTENCY = -3 * ONE_MIN
