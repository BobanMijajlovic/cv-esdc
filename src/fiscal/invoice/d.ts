import {
    TAuditItemRequest,
    TItemRequest
} from '../receipt/d'
import { TTaxItemResponse } from '../tax/d'
import { Buffer } from 'buffer'

export enum TPaymentType {
    OTHER,
    CASH,
    CARD,
    CHECK,
    WIRE_TRANSFER,
    VOUCHER,
    MOBILE_MONEY
}

export type TTaxCategorySignInvoice = {
    amount: number,
    orderId: number
}

export type TPaymentRequest = {
    amount: number,
    paymentType: TPaymentType
}

export type TInvoiceRequestOptions = {
    omitTextualRepresentation: '0' | '1' | 0 | 1,
    omitQRCodeGen: '0' | '1' | 0 | 1
}

export type TAuditPayments = {
    amount: number,
    paymentType: number
}

export type TAuditRequestOptions = {
    omitTextualRepresentation: number,
    omitQRCodeGen: number
}

export enum TInvoiceType {
    Normal,
    Proforma,
    Copy,
    Training,
    Advance
}

export enum TTransactionType {
    Sale,
    Refund
}

export type TInvoiceRequest = {
    dateAndTimeOfIssue?: Date | string
    cashier?: string
    buyerId?: string | number //
    buyerCostCenterId?: string | null //
    payment: TPaymentRequest[]
    invoiceNumber?: string
    referentDocumentDT?: Date | string // document referent date time for refund invoice
    referentDocumentNumber?: string | null // pfr broj ( broj racuna )
    options?: TInvoiceRequestOptions // opcije vezano za qrCode
    items: TItemRequest[]
    invoiceType: TInvoiceType
    transactionType: TTransactionType
}

export type TAuditRequest = {
    dateAndTimeOfIssue?: Date | string
    cashier?: string
    buyerId?: string | number | null //
    buyerCostCenterId?: string | null //
    payment: TAuditPayments[]
    invoiceNumber?: string
    referentDocumentDT?: Date | string // document referent date time for refund invoice
    referentDocumentNumber?: string | null // pfr broj ( broj racuna )
    options?: TAuditRequestOptions // opcije vezano za qrCode
    items: TAuditItemRequest[]
    invoiceType: TInvoiceType
    transactionType: TTransactionType
}

export type TSignedInvoiceResponse = {
    encryptedInternalData: string | Buffer
    signature: string | Buffer
    totalCounter: number
    transactionTypeCounter: number
    totalAmount: number
    taxPayerId: string
    buyerId: string
    dateAndTimeOfIssue: number
    invoiceType: number,
    transactionType: number
}

export type TInvoiceResponse = {
    requestedBy: string // means UID
    sdcDateTime: Date | string
    invoiceCounter: string // 4/27NS example ( transactionTypeCounter/totalCounter/extension )
    invoiceCounterExtension: string // NS - Normal Sale , NR - Normal Refund
    invoiceNumber: string // requestedBy-signedBy-totalCounter
    taxItems: TTaxItemResponse[] // calculated tax
    verificationUrl: string // this is url for preview receipt on the web
    verificationQRCode?: string // qrCode base64
    journal: string // string for journal
    messages: string // Success
    signedBy: string // UID of card
    encryptedInternalData: string  // internal data from smartcard
    signature: string // signature data from smartcard
    totalCounter: number  // total invoice counter
    transactionTypeCounter: number // transaction type counter
    totalAmount: number,  // invoice finance
    taxGroupRevision: number //
    businessName: string
    tin: string
    locationName: string
    address: string
    district: string
    mrc: string
}
