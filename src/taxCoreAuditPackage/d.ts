import {
    TAuditRequest,
    TInvoiceResponse
} from '../fiscal/invoice/d'
import { TTaxCoreCommand } from '../taxCoreApi/d'

export enum AuditPackageStatus {
    INVOICE_NOT_VERIFIED = 0, // Invoice is not verified yet
    SIGNATURE_VALID = 1, // Signature is valid
    SIGNATURE_INVALID = 2, // Signature is invalid
    INTERNAL_DATA_ENCRYPTED_WRONG = 3,// Invoice internal data was encrypted in a wrong way
    INVOICE_IS_VERIFIED = 4, // Invoice is verified
    TAX_RATES_GROUP_NOT_EXIST = 5, // Taxes on this invoice were calculated using a tax rates group which does not exist or is obsolete
    INVOICE_SIGN_CERTIFICATE_REVOKED = 6, // At the moment of invoice signing, the certificate was already revoked
}

/** format of audit package */
export type TAuditPackage = {
    key: string // One-time symmetric key (256Bit long) encrypted using RSA with TaxCore public key
    iv: string // Initialization vector Key encrypted using RSA and TaxCore public key
    payload: string // Base64Encoded JSON format of an invoice, as described in section Json Representation of the Invoice, encrypted with key and iv using AES256 algorithm.
}

/** this is the response of function audit package send */
export type TAuditResponse = {
    status: AuditPackageStatus // returned after TaxCore.API unpacks and verifies audit packages. If all verifications are successful, status should have the value 4. ( Invoice is verified )
    commands: TTaxCoreCommand[]
}

/** this object must be encrypted for audit package function */
export type TAuditData = {
    request: TAuditRequest
    result: TInvoiceResponse
}

export type TAuditPayload = {
    auditRequestPayload: string // Byte array obtained from the secure element operation Start Audit, encoded as Base64 string
    sum: number // Sum of SALE and REFUND of Secure Element, as per Amount Status command in Fiscalization
    limit: number // The Limit Amount of the Secure Element, as per Amount Status command in Fiscalization
}
