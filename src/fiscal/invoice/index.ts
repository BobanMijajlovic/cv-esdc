import {
    TInvoiceRequest,
    TInvoiceResponse,
    TInvoiceType,
    TTransactionType
} from './d'
import Tax from '../tax/Tax'
import {
    __add,
    __divide,
    __multiply,
    __round
} from '../../lodashLocal'
import {
    convertDateToUTC,
    generateVerificationURL,
    getInvoiceExtension,
    invoiceInternalData,
    invoiceSignedResponseParse
} from '../invoice/helpers'

import { Buffer } from 'buffer'
import SecureElement from '../../secureElement/SecureElement'
import {
    bufferBytesFromInteger,
    bufferBytesFromLong,
    bufferBytesFromStringPaddingStart
} from '../../helpers'
import { MULTIPLY_FOR_SIGN_DATA } from '../../constant'
import TaxPayer from '../../secureElement/TaxPayer'
import Receipt from '../receipt/Receipt'
import { throwLPFRErrorObj } from '../../exception'
import { EXCEPTIONS } from '../../exception/d'
import TaxCoreCommands from '../../taxCoreCommands'

const SUCCESS_MESSAGE = 'Success'


export const invoiceSignInvoice = async (requestInvoice: TInvoiceRequest): Promise<TInvoiceResponse> => {

    SecureElement.checkIsWorkingCertificateGotThrowException()
    if (!TaxPayer.isInitiated) {
        throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
    }
    const _verificationURL = await TaxCoreCommands.getVerificationURL()
    if (!_verificationURL) {
        throwLPFRErrorObj(EXCEPTIONS.secureElem_2400_notConfig)
    }

    const {
        serialName: UID,
        taxPayerId,
        stateOrProvinceName,
        organizationalUnitName,
        organizationName,
        streetAddress
    } = TaxPayer.dataSettings

    const tax = new Tax()

    const referentDate = () => {
        if (requestInvoice.invoiceType === TInvoiceType.Copy || requestInvoice.transactionType === TTransactionType.Refund) {
            return new Date(requestInvoice.referentDocumentDT)
        }
        return undefined
    }

    const { taxItems, taxByOrderId, groupId } = await tax.taxForReceiptRequest(requestInvoice.items, referentDate())
  //* * if tax itams no values throw error */
    const invoiceAmount = __round(requestInvoice.items.reduce((acc, i) => __add(acc, i.totalAmount), 0), 4)

    const _buffers = taxByOrderId.reduce((acc, d) => {
        return [
            ...acc,
            Buffer.concat([bufferBytesFromInteger(d.orderId), bufferBytesFromLong(d.amount, 7)], 8)
        ]
    }, [
        bufferBytesFromLong(convertDateToUTC(requestInvoice.dateAndTimeOfIssue), 8),
        bufferBytesFromStringPaddingStart(taxPayerId, 20),
        bufferBytesFromStringPaddingStart(`${requestInvoice.buyerId || ''}`, 20),
        bufferBytesFromInteger(requestInvoice.invoiceType),
        bufferBytesFromInteger(requestInvoice.transactionType),
        bufferBytesFromLong(__round(__multiply(invoiceAmount, MULTIPLY_FOR_SIGN_DATA)), 7),
        bufferBytesFromInteger(taxByOrderId.length),
    ])

    const buffers = Buffer.concat(_buffers as any) as any
    const array = []

    for (const value of buffers) {
        array.push(value)
    }

    const { buffer } = await SecureElement.signInvoice(array) as any
    const signedResponse = invoiceSignedResponseParse(buffer)
  /** create verification url **/

    const verificationUrl = generateVerificationURL(signedResponse, _verificationURL)

  /** generate esdc response */
    const {
        encryptedInternalData,
        signature,
        totalAmount,
        invoiceType,
        transactionType,
        totalCounter,
        transactionTypeCounter
    } = signedResponse

    const invoiceCounterExtension = getInvoiceExtension(invoiceType, transactionType)

    const isJournalOmit = requestInvoice.options?.omitTextualRepresentation == 1
  /** invoice response */
    const responseInvoice = {
        requestedBy: UID,
        sdcDateTime: new Date(convertDateToUTC(requestInvoice.dateAndTimeOfIssue)).toISOString(),
        invoiceCounter: `${transactionTypeCounter}/${totalCounter}${invoiceCounterExtension}`,
        invoiceCounterExtension,
        invoiceNumber: `${UID}-${UID}-${totalCounter}`, // requestedBy - signedBy - totalCounter
        taxItems,
        verificationUrl,
        messages: SUCCESS_MESSAGE,
        signedBy: UID,
        encryptedInternalData: encryptedInternalData.toString('base64'),
        signature: signature.toString('base64'),
        totalCounter,
        transactionTypeCounter,
        totalAmount: __round(__divide(totalAmount, MULTIPLY_FOR_SIGN_DATA), 2),
        taxGroupRevision: groupId,
        businessName: organizationName,
        tin: taxPayerId,
        locationName: organizationalUnitName,
        address: streetAddress,
        district: stateOrProvinceName,
        mrc: TaxPayer.taxMRC,
    } as any

    if (!isJournalOmit) {
        responseInvoice.journal = (new Receipt({
            ...requestInvoice,
            ...responseInvoice
        })).journal()
    }
    return responseInvoice
}
