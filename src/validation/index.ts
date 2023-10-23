import {
    TInvoiceRequest,
    TPaymentRequest
} from '../fiscal/invoice/d'
import { ModelErrors } from '../exception'
import {
    receiptValidation,
    paymentObject,
    validateItem,
} from '../constants/ReceiptType'
import Tax from '../fiscal/tax/Tax'
import {
    __uniq,
    __isObject,
    __isString
} from '../lodashLocal'
import { TItemRequest } from '../fiscal/receipt/d'

const itemsFields = ['gtin', 'name', 'quantity', 'unitPrice', 'labels', 'totalAmount']
const paymentsTypesString = ['Other', 'Cash', 'Card', 'Check', 'WireTransfer', 'Voucher', 'MobileMoney']
const invoiceTypeString = [/^Normal$/i, /^Proforma$/i, /^Copy$/i, /^Training$/i, /^Advance$/i]
const transactionTypeString = [/^Sale$/i, /^Refund$/i]

export const validateReceipt = async (receipt: TInvoiceRequest): Promise<TInvoiceRequest> => {

    const filterFields = <T> (object, fields) => Object.entries(object)
        .reduce((acc, [key, value]) => {
            const isField = fields.includes(key)
            return !isField ? acc : {
                ...acc,
                [key]: value
            }
        }, {} as T)

    receipt = filterFields<TInvoiceRequest>(receipt, Object.keys(receiptValidation))

    const keys = Object.keys(receipt)

    if (keys.includes('invoiceType')) {
        const indx = invoiceTypeString.findIndex(s => s.test(receipt.invoiceType as any))
        receipt.invoiceType = indx === -1 ? receipt.invoiceType : indx as any
    }

    if (keys.includes('transactionType')) {
        const indx = transactionTypeString.findIndex(s => s.test(receipt.transactionType as any))
        receipt.transactionType = indx === -1 ? receipt.transactionType :  indx as any
    }

    const modelErrors = new ModelErrors('Bad Request')

    if (receipt.items && Array.isArray(receipt.items)) {
        receipt.items = receipt.items.map(item => filterFields<TItemRequest>(item, itemsFields))
        receipt.items = receipt.items.map(i => {
            if (i.labels && Array.isArray(i.labels)) {
                return {
                    ...i,
                    labels: i.labels.map(lab => __isString(lab) ? lab.toUpperCase() : lab)
                }
            }
            return i
        })
    }

    if (receipt.payment && Array.isArray(receipt.payment)) {
        receipt.payment = receipt.payment.map(item => filterFields<TPaymentRequest>(item, Object.keys(paymentObject)))
    // / we expect only numbers
        receipt.payment = receipt.payment.map(x => {
            const keys = Object.keys(x)
            if (!keys.includes('paymentType')) {
                return x
            }
            let paymentType = paymentsTypesString.findIndex(y => y === x.paymentType as any)
            if (paymentType === -1) {
                paymentType = x.paymentType as any
            }
            return {
                ...x,
                paymentType
            } as any as TPaymentRequest
        })
    }

    if (receipt.options && __isObject(receipt.options)) {
        receipt.options = filterFields<any>(receipt.options, ['omitQRCodeGen', 'omitTextualRepresentation'])
    }

  /** * after these steps we have recept that is tottally prepared for more validationa and consist only allowed fields */

    const tax = new Tax()

    const { currentTaxRates } = await tax.getCurrentAndAllTax()
    const { taxCategories } = currentTaxRates
    const taxCoreLabels = __uniq(taxCategories.reduce((acc, x) => [...acc, ...x.taxRates.map(x => x.label)], []))

    Object.keys(receiptValidation)
        .map(validObj => receiptValidation[validObj](receipt, modelErrors));
    (receipt.items || []).map((item, index) => validateItem(item, modelErrors, index, taxCoreLabels))
    if (modelErrors.isError()) {
        throw modelErrors
    }

    if (!receipt.dateAndTimeOfIssue) {
        receipt.dateAndTimeOfIssue = new Date().toISOString()
    }
    receipt.items = receipt.items.map(item => ({
        ...item,
        labels: __uniq(item.labels)
    }))

    return receipt as TInvoiceRequest
}
