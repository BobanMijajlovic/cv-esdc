import {
    TInvoiceType,
    TSignedInvoiceResponse,
    TTransactionType
} from './d'
import {
    __add,
    __isString
} from '../../lodashLocal'
import { Buffer } from 'buffer'
import md5 from 'md5'
import crypto from 'crypto'
import {
    bufferBytesFromInteger,
    bufferBytesFromLong,
    bufferCopyData,
    bufferIntLE,
    bufferLongLE,
    bufferToInteger,
    bufferToLong,
    bufferToStringTrim,
    bufferToIntegerLE
} from '../../helpers'
import TaxPayer from '../../secureElement/TaxPayer'

export const convertDateToUTC = (date: string | Date) => {
    const dateVal = __isString(date) ? new Date(date) : date
    return __add(dateVal.getTime(), dateVal.getTimezoneOffset())
}

/** parse invoice signed data */

export const invoiceSignedResponseParse = (responseBuffer: Buffer): TSignedInvoiceResponse => {
    let position = 0
    const totalSize = responseBuffer.length
    const sizeOfEncData = totalSize > 600 ? 512 : 256
    return {
        dateAndTimeOfIssue: bufferToLong(bufferCopyData(responseBuffer, position, 8)),
        taxPayerId: bufferToStringTrim(bufferCopyData(responseBuffer, position += 8, 20)),
        buyerId: bufferToStringTrim(bufferCopyData(responseBuffer, position += 20, 20)),
        invoiceType: bufferToInteger(bufferCopyData(responseBuffer, position += 20, 1)),
        transactionType: bufferToInteger(bufferCopyData(responseBuffer, position += 1, 1)),
        totalAmount: bufferToLong(bufferCopyData(responseBuffer, position += 1, 7)),
        transactionTypeCounter: bufferToInteger(bufferCopyData(responseBuffer, position += 7, 4)),
        totalCounter: bufferToInteger(bufferCopyData(responseBuffer, position += 4, 4)),
        encryptedInternalData: bufferCopyData(responseBuffer, position += 4, sizeOfEncData),
        signature: bufferCopyData(responseBuffer, position += sizeOfEncData, 256)
    }
}

export const invoiceInternalData = (responseBuffer: Buffer): TSignedInvoiceResponse => {
    let position = 0
    const totalSize = responseBuffer.length
    const sizeOfEncData = totalSize > 600 ? 512 : 256
    return {
        dateAndTimeOfIssue: bufferToLong(bufferCopyData(responseBuffer, position, 8)),
        transactionTypeCounter: bufferToIntegerLE(bufferCopyData(responseBuffer, position += 8, 4)),
        encryptedInternalData: bufferCopyData(responseBuffer, position += 4, sizeOfEncData),
        taxPayerId: bufferToStringTrim(bufferCopyData(responseBuffer, position += sizeOfEncData, 20)),
        buyerId: bufferToStringTrim(bufferCopyData(responseBuffer, position += 20, 20)),
        invoiceType: bufferToInteger(bufferCopyData(responseBuffer, position += 20, 1)),
        transactionType: bufferToInteger(bufferCopyData(responseBuffer, position += 1, 1)),
        totalAmount: bufferToLong(bufferCopyData(responseBuffer, position += 1, 7)),
        signature: bufferCopyData(responseBuffer, position += 7, 256),
        totalCounter: 1

    /*  dateAndTimeOfIssue: bufferToLong(bufferCopyData(responseBuffer, position, 8)),
      totalCounter: bufferToInteger(bufferCopyData(responseBuffer, position += 4, 4)),*/
    } as TSignedInvoiceResponse
}

/** generate invoice verification url */
export const generateVerificationURL = (data: TSignedInvoiceResponse, taxCoreUrl: string) => {

    const { serialName: UID } = TaxPayer.dataSettings
    const buffer = Buffer.concat([
        Buffer.from([0x03]), // current version
        Buffer.from(UID), // requestedBy
        Buffer.from(UID), // signedBy
        bufferIntLE(data.totalCounter),
        bufferIntLE(data.transactionTypeCounter),
        bufferLongLE(data.totalAmount),
        bufferBytesFromLong(data.dateAndTimeOfIssue, 8),
        bufferBytesFromInteger(data.invoiceType),
        bufferBytesFromInteger(data.transactionType),
        bufferBytesFromInteger(data.buyerId.length),
        Buffer.from(data.buyerId),
    // bufferBytesFromStringPaddingStart(`${data.buyerId || ''}`, 20),
        data.encryptedInternalData as Buffer,
        data.signature as Buffer,
    ]) as any
    const hash = crypto.createHash('md5').update(Buffer.from(buffer))
        .digest()
    const buff = Buffer.concat([buffer, hash])
    const base64 = buff.toString('base64')
    return `${taxCoreUrl}${base64}`
}

/** get invoice extension */
export const getInvoiceExtension = (invoiceType: TInvoiceType, transactionType: TTransactionType) => {
    let type = ''
    let transaction = ''
    switch (invoiceType) {
        case TInvoiceType.Training:
            type = 'О'
            break
        case TInvoiceType.Copy:
            type = 'К'
            break
        case TInvoiceType.Advance:
            type = 'А'
            break
        case TInvoiceType.Proforma:
            type = 'Р'
            break
        default:
            type = 'П'
            break
    }
    switch (transactionType) {
        case TTransactionType.Refund:
            transaction = 'Р'
            break
        default:
            transaction = 'П'
            break
    }
    return `${type}${transaction}`
}

