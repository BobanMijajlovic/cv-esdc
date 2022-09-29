export type TExceptionObject = {
    type: EXCEPTIONS_SECTIONS,
    number: string | number,
    description?: string
}

export enum EXCEPTIONS_SECTIONS {
    SECURE_ELEMENT = 'SECURE_ELEMENT',
    INVOICE_ERRORS = 'INVOICE_ERRORS',
    WARNINGS_ERRORS = 'WARNINGS_ERRORS',
    INFO_ERRORS = 'INFO_ERRORS',
    LOCAL_ERRORS = 'LOCAL_ERRORS'
}

export const INFO_EXCEPTIONS = {

    infoErrors_0000_pinOk: {
        type: EXCEPTIONS_SECTIONS.INFO_ERRORS,
        number: '0000',
        label: 'All OK',
        description: 'Command is executed without warnings or errors'
    },

    infoErrors_0100_pinOk: {
        type: EXCEPTIONS_SECTIONS.INFO_ERRORS,
        number: '0100',
        label: 'Pin OK',
        description: 'This code indicates that the provided PIN code is correct'
    },

    infoErrors_0210_internetAvailable: {
        type: EXCEPTIONS_SECTIONS.INFO_ERRORS,
        number: '0210',
        label: 'Internet Available',
        description: 'Internet Connection is available (optional)'
    },

    infoErrors_0220_internetUnavailable: {
        type: EXCEPTIONS_SECTIONS.INFO_ERRORS,
        number: '0220',
        label: 'Internet Unavailable',
        description: 'Internet Connection is not available (optional)'
    },
}

export const WARNINGS_EXCEPTIONS = {
    warningError_1100_storageNearFull: {
        type: EXCEPTIONS_SECTIONS.WARNINGS_ERRORS,
        number: 1100,
        label: 'Storage 90% Full',
        description: 'Storage used to store audit packages is 90% percent full. It is time to perform the audit.'
    },

    warningError_1300_smartCardNotPresent: {
        type: EXCEPTIONS_SECTIONS.WARNINGS_ERRORS,
        number: 1300,
        label: 'Smart Card is not present',
        description: 'Secure element card is not inserted in the E-SDC smart card reader'
    },

    warningError_1400_auditRequired: {
        type: EXCEPTIONS_SECTIONS.WARNINGS_ERRORS,
        number: 1400,
        label: 'Audit Required',
        description: 'Total Sale and Refund amount reached 75% of the SE limit. It is time to perform the audit.'
    },

    warningError_1500_pinCodeReq: {
        type: EXCEPTIONS_SECTIONS.WARNINGS_ERRORS,
        number: 1500,
        label: 'Pin Code Required',
        description: 'Indicates that POS must provide the PIN code'
    },

    warningError_1999_undefinedWarning: {
        type: EXCEPTIONS_SECTIONS.WARNINGS_ERRORS,
        number: 1999,
        label: 'Undefined Warning',
        description: 'Something is wrong but specific warning is not defined for that situation. Manufacturer can use manufacturer-specific codes to describe warning in more details'
    },
}

export const ERRORS_EXCEPTIONS = {
    secureElem_2100: {
        type: EXCEPTIONS_SECTIONS.SECURE_ELEMENT,
        number: 2100,
        label: 'Pin Not OK',
        description: 'PIN code sent by the POS is invalid'
    },

    secureElem_failed_2150: {
        type: EXCEPTIONS_SECTIONS.SECURE_ELEMENT,
        number: 2150,
        label: 'Command to secure elem',
        description: 'Command to secure element failed'
    },

    secureElem_audit_no_valid_2160: {
        type: EXCEPTIONS_SECTIONS.SECURE_ELEMENT,
        number: 2160,
        label: 'Audit Identification is not valid',
        description: 'Audit Identification is not valid'
    },

    audit_command_failed_2180: {
        type: EXCEPTIONS_SECTIONS.SECURE_ELEMENT,
        number: 2180,
        label: 'Audit command',
        description: 'Audit command failed'
    },

    audit_proof_command_failed_2180: {
        type: EXCEPTIONS_SECTIONS.SECURE_ELEMENT,
        number: 2190,
        label: 'Audit proof command',
        description: 'Audit proof command failed'
    },

    secureElem_2110_cardLocked: {
        type: EXCEPTIONS_SECTIONS.SECURE_ELEMENT,
        number: 2110,
        label: 'Card Locked',
        description: 'The number of allowed PIN entries exceeded. The card is locked for use'
    },

    secureElem_2210_seLocked: {
        type: EXCEPTIONS_SECTIONS.SECURE_ELEMENT,
        number: 2210,
        label: 'SE Locked',
        description: 'Secure Element is locked. No additional invoices can be signed before the audit is completed'
    },

    secureElem_2220_seCommunicationFailed: {
        type: EXCEPTIONS_SECTIONS.SECURE_ELEMENT,
        number: 2220,
        label: 'SE Communication Failed',
        description: 'Secure Element does not support requested protocol version (reserved for later use)'
    },

    secureElem_2230_seProtocolMismatch: {
        type: EXCEPTIONS_SECTIONS.SECURE_ELEMENT,
        number: 2230,
        label: 'SE Protocol Mismatch',
        description: 'E-SDC cannot connect to the Secure Element applet'
    },

    invoice_2310_invalidTaxLabels: {
        type: EXCEPTIONS_SECTIONS.INVOICE_ERRORS,
        number: 2310,
        label: 'Invalid tax labels',
        description: 'Tax Labels sent by the POS are not defined'
    },

    secureElem_2400_notConfig: {
        type: EXCEPTIONS_SECTIONS.SECURE_ELEMENT,
        number: 2400,
        label: 'Not config',
        description: 'SDC device is not fully configured for invoice signing (i.e. tax rates or verification URL are missing etc.)'
    },

    invoice_2800_field_required: {
        type: EXCEPTIONS_SECTIONS.INVOICE_ERRORS,
        number: 2800,
        label: 'Field Required',
        description: 'A field is required'
    },
    invoice_2801_valueToLong: {
        type: EXCEPTIONS_SECTIONS.INVOICE_ERRORS,
        number: 2801,
        label: 'Field Value Too Long',
        description: 'Field Value Too Long'
    },
    invoice_2802_valueToShort: {
        type: EXCEPTIONS_SECTIONS.INVOICE_ERRORS,
        number: 2802,
        label: 'Field Value Too Short',
        description: 'The length of the field value is shorter than expected'
    },
    invoice_2803_invalidLength: {
        type: EXCEPTIONS_SECTIONS.INVOICE_ERRORS,
        number: 2803,
        label: 'Invalid Field Length',
        description: 'The length of the field value is shorter or longer than expected'
    },
    invoice_2804_outOfRange: {
        type: EXCEPTIONS_SECTIONS.INVOICE_ERRORS,
        number: 2804,
        label: 'Field Out Of Range',
        description: 'A field value out of expected range'
    },
    invoice_2805_invalidValue: {
        type: EXCEPTIONS_SECTIONS.INVOICE_ERRORS,
        number: 2805,
        label: 'Invalid Field Value',
        description: 'A field contains an invalid value'
    },
    invoice_2806_invalidDataFormat: {
        type: EXCEPTIONS_SECTIONS.INVOICE_ERRORS,
        number: 2806,
        label: 'Invalid Data Format',
        description: 'The data format is invalid'
    },
    invoice_2807_listToShort: {
        type: EXCEPTIONS_SECTIONS.INVOICE_ERRORS,
        number: 2807,
        label: 'List Too Short',
        description: 'The list of items or the list of tax labels in the invoice request does not contain at least one element (item/label).'
    },
    invoice_2808_listToLong: {
        type: EXCEPTIONS_SECTIONS.INVOICE_ERRORS,
        number: 2808,
        label: 'List Too Long',
        description: 'The list of items or the list of tax labels in the invoice request exceeds the maximum allowed number of elements (items/labels) or byte size. The maximum values depend on an SDC\'s capacity for processing invoice requests and can be manufacturer-specific.'
    },

}

export const LOCAL_ERRORS = {

    localError_80100_taxNotDefined: {
        type: EXCEPTIONS_SECTIONS.LOCAL_ERRORS,
        number: 80100,
        label: 'Tax not defined '
    },
    localError_80200_itemTaxInvalid: {
        type: EXCEPTIONS_SECTIONS.LOCAL_ERRORS,
        number: 80200,
        label: 'Item not valid tax '
    },

    localError_80300_pathIsNotValid: {
        type: EXCEPTIONS_SECTIONS.LOCAL_ERRORS,
        number: 80300,
        label: 'Path is not valid '
    },

    localError_80400_pathMustBeEmpty: {
        type: EXCEPTIONS_SECTIONS.LOCAL_ERRORS,
        number: 80400,
        label: 'Path must be empty'
    },

    localError_90100_ntpFailedTimeDiff: {
        type: EXCEPTIONS_SECTIONS.LOCAL_ERRORS,
        number: 90100,
        label: 'Ntp time diff too much'
    },

    localError_90200_prev_Receipt_Time: {
        type: EXCEPTIONS_SECTIONS.LOCAL_ERRORS,
        number: 90200,
        label: 'Previous receipt has bigger time ( Receipt time inconsistency)'
    },

    localError_90300_not_valid_license: {
        type: EXCEPTIONS_SECTIONS.LOCAL_ERRORS,
        number: 90300,
        label: 'Not valid license'
    }

}

export const EXCEPTIONS = {
    ...INFO_EXCEPTIONS,
    ...WARNINGS_EXCEPTIONS,
    ...ERRORS_EXCEPTIONS,
    ...LOCAL_ERRORS
}
