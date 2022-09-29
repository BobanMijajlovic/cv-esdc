import {
    TInvoiceRequest,
    TPaymentType,
    TPaymentRequest,
    TInvoiceType,
    TTransactionType
} from '../fiscal/invoice/d'
import {
    ModelErrors,
    PropertyError
} from '../exception'
import moment from 'moment'
import { EXCEPTIONS } from '../exception/d'
import {
    __isString,
    __isNil,
    __isObject,
    __isEmpty,
    __isNumber,
    __isInteger
} from '../lodashLocal'
import { TItemRequest } from '../fiscal/receipt/d'

const addError = (modelError, type: string, exception) => {
    const error = new PropertyError(type)
    error.setError(`${exception.number}`)
    modelError.setError(error)
}

const addErrorRequired = (modelError, type: string) => {
    const error = new PropertyError(type)
    error.setError(`${EXCEPTIONS.invoice_2800_field_required.number}`)
    modelError.setError(error)
}

const addErrorInvalid = (modelError, type: string) => {
    const error = new PropertyError(type)
    error.setError(`${EXCEPTIONS.invoice_2805_invalidValue.number}`)
    modelError.setError(error)
}

export const paymentObject = {
    amount: (payment: TPaymentRequest, modelError: ModelErrors, index: number) => {
        const type = `payment[${index}].amount`
        const value = payment?.amount
        if (__isNil(value)) {
            addErrorRequired(modelError, type)
            return

        }

        if (__isString(value)) {
            addErrorInvalid(modelError, type)
            return
        }

        const numValue = Number(value)
        if (isNaN(numValue)) {
            addErrorInvalid(modelError, type)
            return
        }

        if (value > 999999999999.99) {
            addError(modelError, type, EXCEPTIONS.invoice_2804_outOfRange)
            return
        }
    },
    paymentType: (payment: TPaymentRequest, modelError: ModelErrors, index: number) => {
        const type = `payment[${index}].paymentType`
        const value = payment?.paymentType
        if (__isNil(value)) {
            addErrorRequired(modelError, type)
            return

        }

        if (__isString(value)) {
            addErrorInvalid(modelError, type)
            return
        }
        const numValue = Number(value)
        if (isNaN(numValue)) {
            addErrorInvalid(modelError, type)
            return
        }
        if (numValue < 0 || numValue >= Object.keys(TPaymentType).length) {
            addErrorInvalid(modelError, type)
            return
        }
    }
}

export const validateItem = (_item: TItemRequest, modelError: ModelErrors, index: number, taxCoreLabels: string[]) => {
    const item = __isEmpty(_item) ? {} : _item
    const itemValidation = {
        gtin: (item: TItemRequest, modelError: ModelErrors) => {
            const type = `items[${index}].gtin`
            const value = item?.gtin
            if (__isNil(value)) {
                return
            }
            if (!__isString(value)) {
                addErrorInvalid(modelError, type)
                return
            }

            if (value.length < 8 || value.length > 14) {
                addErrorInvalid(modelError, type)
                return
            }
        },
        name: (item: TItemRequest, modelError: ModelErrors) => {
            const type = `items[${index}].name`
            const value = item?.name
            if (__isNil(value)) {
                addErrorRequired(modelError, type)
                return
            }

            if (!__isString(value) || !value.length) {
                addErrorInvalid(modelError, type)
                return
            }

            if (value?.length > 2048) {
                addError(modelError, type, EXCEPTIONS.invoice_2803_invalidLength)
                return
            }

        },
        quantity: (item: TItemRequest, modelError: ModelErrors) => {
            const type = `items[${index}].quantity`
            const value = item?.quantity

            if (__isNil(value)) {
                addErrorRequired(modelError, type)
                return
            }

            if (__isString(value)) {
                addErrorInvalid(modelError, type)
                return
            }

            const valueN = Number(value)

            if (isNaN(valueN)) {
                addErrorInvalid(modelError, type)
                return
            }

            const str = `${value}`.split('.')

            if (str[0].length > 14 || str[1]?.length > 3) {
                addError(modelError, type, EXCEPTIONS.invoice_2804_outOfRange)
                return
            }

      /** if we send string ???  invalid value ??? */

      /** min value and max value for Decimal(14,3)*/
            if (value < 0.001 || value > 99999999999.999) {
                addError(modelError, type, EXCEPTIONS.invoice_2804_outOfRange)
            }

        },
        unitPrice: (item: TItemRequest, modelError: ModelErrors) => {
            const type = `items[${index}].unitPrice`
            const value = item?.unitPrice

            if (__isNil(value)) {
                addErrorRequired(modelError, type)
                return
            }

            if (__isString(value)) {
                addErrorInvalid(modelError, type)
                return
            }

            const valueN = Number(value)

            if (isNaN(valueN)) {
                addErrorInvalid(modelError, type)
                return
            }

            const str = `${value}`.split('.')

            if (str[0].length > 12 || str[1]?.length > 2) {
                addError(modelError, type, EXCEPTIONS.invoice_2804_outOfRange)
                return
            }
        },
        labels: (item: TItemRequest, modelError: ModelErrors) => {
            const labels = item?.labels
            const type = `items[${index}].labels`

            if (__isNil(labels)) {
                addErrorRequired(modelError, type)
                return
            }

            if (!Array.isArray(labels)) {
                addErrorInvalid(modelError, type)
                return
            }

            if (!labels.length) {
                addErrorRequired(modelError, type)
                return
            }

            labels.forEach((label, ind) => {
                const type = `items[${index}].labels[${ind}]`

                if (!__isString(label) || label.length !== 1) {
                    addError(modelError, type, EXCEPTIONS.invoice_2310_invalidTaxLabels)
                    return
                }
                const labelObj = taxCoreLabels.find(t => t === label)
                if (!labelObj) {
                    addError(modelError, type, EXCEPTIONS.invoice_2310_invalidTaxLabels)
                }
            })

        },
        totalAmount: (item: TItemRequest, modelError: ModelErrors) => {
            const type = `items[${index}].totalAmount`
            const value = item?.totalAmount

            if (__isNil(value)) {
                addErrorRequired(modelError, type)
                return
            }

            if (__isString(value)) {
                addErrorInvalid(modelError, type)
                return
            }

            const valueN = Number(value)

            if (isNaN(valueN)) {
                addErrorInvalid(modelError, type)
                return
            }
            const str = `${value}`.split('.')

            if (str[0].length > 12 || str[1]?.length > 2) {
                addError(modelError, type, EXCEPTIONS.invoice_2804_outOfRange)
                return
            }

        }
    }

    Object.keys(itemValidation)
        .forEach(key => {
            itemValidation[key](item, modelError)
        })
}

export const receiptValidation = {

    dateAndTimeOfIssue: (receipt: TInvoiceRequest, modelError: ModelErrors) => {

        const type = 'dateAndTimeOfIssue'
        const value = receipt.dateAndTimeOfIssue
        if (__isNil(value)) {
            return
        }
  
        if (!__isString(value) || /^\s*\d+\s*$/.test(value)) {
            addErrorInvalid(modelError, type)
            return
        }

        try {
            if (!moment(value)
                .isValid()) {
                addErrorInvalid(modelError, type)
                return
            }
        } catch (e) {
            addErrorInvalid(modelError, type)
            return
        }

    },

    invoiceType: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        const type = 'invoiceType'
        const value = receipt.invoiceType

        if (__isNil(value)) {
            addErrorRequired(modelError, type)
            return
        }

        if (!__isNumber(value) || value < 0 || value >= Object.keys(TInvoiceType).length) {
            addErrorInvalid(modelError, type)
            return
        }
    },

    transactionType: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        const value = receipt.transactionType
        const type = 'transactionType'
        if (__isNil(value)) {
            addErrorRequired(modelError, type)
            return
        }
        if (!__isNumber(value) || value < 0 || value >= Object.keys(TTransactionType).length) {
            addErrorInvalid(modelError, type)
            return
        }
    },

    cashier: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        const value = receipt.cashier

        if (__isNil(value)) {
            return
        }
        if (!__isString(value) && !__isInteger(value)) {
            addErrorInvalid(modelError, 'cashier')
            return
        }

        if ((__isString(value) && value.length > 50) || (__isInteger(value) && Number(value) < 0)) {
            addError(modelError, 'cashier', EXCEPTIONS.invoice_2803_invalidLength)
            return
        }

    },

    buyerId: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        const type = 'buyerId'
        const value = `${receipt.buyerId}`

        if (!value && receipt.invoiceType === TInvoiceType.Advance) {
            addErrorRequired(modelError, type)
            return
        }

        if (__isNil(value)) {
            return
        }

        if (!__isString(value) && !__isInteger(value)) {
            addErrorInvalid(modelError, type)
            return
        }

        if (__isString(value)) {
            if (value.length > 20) {
                addError(modelError, type, EXCEPTIONS.invoice_2803_invalidLength)
                return
            }
            if (!value.length) {
                addErrorInvalid(modelError, type)
                return
            }
        }

        if (__isInteger(value)) {
            if (Number(value) < 1) {
                addError(modelError, type, EXCEPTIONS.invoice_2803_invalidLength)
                return
            }
        }

    },

    buyerCostCenterId: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        const type = 'buyerCostCenterId'
        const value = receipt.buyerCostCenterId

        if (__isNil(value)) {
            return
        }

        if (!__isString(value)) {
            addErrorInvalid(modelError, type)
            return
        }

        if (value.length > 50) {
            addError(modelError, type, EXCEPTIONS.invoice_2801_valueToLong)
            return
        }

        if (!value.length) {
            addErrorInvalid(modelError, type)
            return
        }

        if (__isNil(receipt.buyerId)) {
            addErrorInvalid(modelError, 'buyerId')
        }

    },

    invoiceNumber: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        const type = 'invoiceNumber'
        const value = receipt.invoiceNumber
        if (__isNil(value)) {
            return
        }

        if (!__isString(value) || !value.length) {
            addErrorInvalid(modelError, type)
            return
        }

        if (value.length > 60) {
            addError(modelError, type, EXCEPTIONS.invoice_2803_invalidLength)
        }
    },

    referentDocumentNumber: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        const type = 'referentDocumentNumber'
        const value = receipt.referentDocumentNumber

        if ((receipt.transactionType === TTransactionType.Refund || receipt.invoiceType === TInvoiceType.Copy)) {
            if (__isNil(value)) {
                addErrorRequired(modelError, type)
                return
            }
        } else {
            if (__isNil(value)) {
                return
            }
        }

        if (!__isString(value)) {
            addErrorInvalid(modelError, type)
            return
        }

        if (!value.length) {
            addErrorRequired(modelError, type)
            return
        }

        if (value.length > 50) {
            addError(modelError, type, EXCEPTIONS.invoice_2803_invalidLength)
            return
        }

        if (!/^\w{8,}-\w{8,}-\d+$/.test(value)) {
            addError(modelError, type, EXCEPTIONS.invoice_2806_invalidDataFormat)
            return
        }
        const val = value.split('-')[2]
        if (!/^\d+$/.test(val) || val.startsWith('0')) {
            addError(modelError, type, EXCEPTIONS.invoice_2804_outOfRange)
            return
        }

    },

    referentDocumentDT: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        const type = 'referentDocumentDT'
        const value = receipt.referentDocumentDT
        if ((receipt.transactionType === TTransactionType.Refund || receipt.invoiceType === TInvoiceType.Copy)) {
            if (__isNil(value)) {
                addErrorRequired(modelError, type)
                return
            }
        } else {
            if (__isNil(value)) {
                return
            }
        }
        if (!__isString(value) || /^\s*\d+\s*$/.test(value) || !moment(value)
            .isValid()) {
            addErrorInvalid(modelError, type)
            return
        }
    },

    options: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        const type = 'options'
        const options = receipt.options
        if (__isNil(options)) {
            return
        }
        if (!__isObject(options)) {
            addErrorInvalid(modelError, type)
            return
        }

        const omitQr = options.omitQRCodeGen as any

        if (omitQr !== undefined) {
            if (!['0', '1', 0, 1].includes(omitQr)) {
                addErrorInvalid(modelError, 'options.omitQRCodeGen')
            }
        }

        const OmitTextualRepresentation = options.omitTextualRepresentation as any
        if (OmitTextualRepresentation !== undefined) {
            if (!['0', '1', 0, 1].includes(OmitTextualRepresentation)) {
                addErrorInvalid(modelError, 'options.omitTextualRepresentation')
            }
        }

    },

    items: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        if (__isNil(receipt.items)) {
            addErrorRequired(modelError, 'items')
            return
        }
        if (!Array.isArray(receipt.items)) {
            addErrorInvalid(modelError, 'items')
            return
        }
    },
    payment: (receipt: TInvoiceRequest, modelError: ModelErrors) => {
        if (__isNil(receipt.payment)) {
            addErrorRequired(modelError, 'payment')
            return
        }
        if (!Array.isArray(receipt.payment)) {
            addErrorInvalid(modelError, 'payment')
            return
        }
        receipt.payment.forEach((pay, index) => {
            Object.keys(paymentObject)
                .forEach((key) => paymentObject[key](pay, modelError, index))
        })
    }

}

