import {
    LABEL_VALUE_MAP,
    RECEIPT_HEADER_STRING,
    RECEIPT_INVOICE_TYPE_STRING,
    RECEIPT_PAYMENTS_LABELS,
    RECEIPT_TRANSACTION_TYPE_STRING,
    SeparatorLine,
    SERBIAN_LABELS,
    TItemRequest,
    TReceiptStringData
} from './d'
import moment from 'moment'
import {
    blank,
    printCenterText,
    printCenterTextCeil,
    printLabelValue,
    printLabelValueAlignRight,
    printLineSeparator,
    printRows,
    printTextLeft
} from './helpers'
import { TTaxItemResponse } from '../tax/d'
import {
    formatPrice,
    formatQuantity
} from '../../utils'
import {
    __add,
    __flatten,
    __round
} from '../../lodashLocal'
import {
    TInvoiceType,
    TTransactionType
} from '../invoice/d'

const firstReceiptLine = (type: TInvoiceType) => RECEIPT_HEADER_STRING.find(ff => ff.type === type).value
const endReceiptLine = (type: TInvoiceType) => RECEIPT_HEADER_STRING.find(ff => ff.type === type).footer

const typeReceiptString = (type: TInvoiceType, transaction: TTransactionType) => {
    const invType = RECEIPT_INVOICE_TYPE_STRING.find(t => t.type === type).value
    const tType = RECEIPT_TRANSACTION_TYPE_STRING.find(tt => tt.type === transaction).value
    return `${invType} ${tType}`
}

class Receipt {

    currentReceiptData: TReceiptStringData & { totalTaxAmount?: number } = null

    constructor (r: TReceiptStringData) {
        this.currentReceiptData = { ...r }
    }

    private getValueByLabel = (array: string[]) => {
        return array.map(label => {
            const f = LABEL_VALUE_MAP.find(f => f.label === label)
            if (!f) {
                return null
            }
            let value = this.currentReceiptData[f.field] || ''
            if (!value && !f.required) {
                return null
            }
            switch (label) {
                case SERBIAN_LABELS.PFR_DATETIME:
                    value = moment(new Date()).format('DD.MM.YYYY. H:mm:ss')
                    break

                case SERBIAN_LABELS.ESIR_TIME:
                case SERBIAN_LABELS.REFERENT_DATE_TIME:
                    value = moment(new Date(value)).format('DD.MM.YYYY. H:mm:ss')
                    break
                default:
                    break
            }
            return printLabelValue(label, value)
        }).filter(x => x)
    }

    journal = () => this.journalArray().join('\r\n')

    private journalArray = () => {
        const headerPart = this.getValueByLabel([
            SERBIAN_LABELS.TIN, // ПИБ:                           107112543
            SERBIAN_LABELS.BUSINESS_NAME, // Предузеће:        Hardworking Technology
            SERBIAN_LABELS.LOCATION_NAME, // Место продаје:    Hardworking Technology
            SERBIAN_LABELS.ADDRESS, // Адреса:                   Jasicki put 9A
            SERBIAN_LABELS.DISTRICT, // Општина:                        Крушевац
            SERBIAN_LABELS.CASHIER, // Касир:                               HWT
            SERBIAN_LABELS.BUYER_ID, // ИД купца:                   10:123456789
            SERBIAN_LABELS.BUYER_COST_CENTER_ID, // Опционо поље купца:         10:099999999
            SERBIAN_LABELS.ESIR_NUMBER, // ЕСИР број:                     11-2021-1
            SERBIAN_LABELS.ESIR_TIME, // ЕСИР време:          04.11.2021. 9:38:03
            SERBIAN_LABELS.REFERENT_NUMBER, // Реф. број:           DA3RDVCK-Dt1Ov1o0-5
            SERBIAN_LABELS.REFERENT_DATE_TIME // Реф. време:         19.08.2021. 11:42:13
        ])

        const footerPart = this.getValueByLabel([
            SERBIAN_LABELS.PFR_DATETIME,  // ПФР време:          04.11.2021. 10:38:04
            SERBIAN_LABELS.PFR_RECEIPT_NUMBER, // ПФР број рачуна:   DA3RDVCK-Dt1Ov1o0-197
            SERBIAN_LABELS.RECEIPT_COUNTER, // Бројач рачуна:                 181/197ПП
        ])

        const data = this.currentReceiptData

        data.totalTaxAmount = __round(data.taxItems.reduce((acc: number, x) => __round(__add(acc, x.amount), 2), 0), 2)

        const taxLine = (item: TTaxItemResponse) => {
            const firstBlank = 17 - item.label.length - item.categoryName.length
            let str = [item.label, blank(firstBlank > 0 ? firstBlank : 1), item.categoryName].join('')
            const taxValueStr = [formatPrice(item.rate), item.categoryType === 2 ? 'RSD' : '%'].join('')
            const secondBlank = 26 - str.length - taxValueStr.length
            str = [str, blank(secondBlank > 0 ? secondBlank : 1), taxValueStr].join('')
            return printLabelValueAlignRight(str, formatPrice(item.amount))
        }

        const itemLine = (item: TItemRequest) => {
            const nameStr = [item.name, blank(1), `(${item.labels.join(', ')})`].join('')
            let priceStr = formatPrice(item.unitPrice)
            if (priceStr.length < 13) {
                priceStr = [blank(13), priceStr].join('').substr(-13)
            }
            const lenPrice = priceStr.length
            let quantityStr = [blank(1), formatQuantity(item.quantity, __round(item.quantity) !== item.quantity ? 3 : 0)].join('')
            const lenQuantity = quantityStr.length
            if (lenQuantity + lenPrice < 24) {
                quantityStr = [blank(24 - lenQuantity - lenPrice), quantityStr].join('')
            }
            const rowPriceQt = [priceStr, quantityStr].join('')
            const totalStr = [data.transactionType === TTransactionType.Refund ? '-' : '', formatPrice(item.totalAmount)].join('')
            return __flatten([printRows(nameStr), printLabelValueAlignRight(rowPriceQt, totalStr)])
        }

        const taxLines = __flatten(data.taxItems.map(item => taxLine(item)))
        const itemLines = __flatten(data.items.map(item => itemLine(item)))

        const notFiscalText = [TInvoiceType.Copy, TInvoiceType.Training, TInvoiceType.Proforma].includes(data.invoiceType) ? [
            printCenterText(SERBIAN_LABELS.FISCAL_NOT_RECEIPT, SeparatorLine.blank),
            printLineSeparator(SeparatorLine.double)
        ] : []

        const fnFirstLastLine = [TInvoiceType.Copy, TInvoiceType.Training].includes(data.invoiceType) ? printCenterTextCeil : printCenterText

        const dataForPrint = __flatten([
            fnFirstLastLine(firstReceiptLine(data.invoiceType), SeparatorLine.double), // ============ ФИСКАЛНИ РАЧУН ============
            ...headerPart, // print header with all possible values
            printCenterText(typeReceiptString(data.invoiceType, data.transactionType), SeparatorLine.single), // -------------АВАНС ПРОДАЈА--------------
            printTextLeft(SERBIAN_LABELS.ARTICLES), // Артикли
            printLineSeparator(SeparatorLine.double), // ========================================

            printLabelValue([SERBIAN_LABELS.ITEM_NAME, blank(3), SERBIAN_LABELS.PRICE, blank(9), SERBIAN_LABELS.QTY].join(''), SERBIAN_LABELS.TOTAL)[0],
            itemLines,  // Article 2 (A, P) \r\n     120,00         10        1.200,00
      /** ******  Payments part */
            printLineSeparator(SeparatorLine.single), // ------------------------------------------------------------------------------
            printLabelValueAlignRight(data.transactionType === TTransactionType.Refund ? SERBIAN_LABELS.TOTAL_REFUND : SERBIAN_LABELS.TOTAL_COSTS, formatPrice(data.totalAmount)), // Укупан износ:                  81.190,47
            ...data.payment.map(payment => {  //   all payments from receipt
                const label = RECEIPT_PAYMENTS_LABELS.find(f => f.type === payment.paymentType).label
                return printLabelValueAlignRight(label, formatPrice(payment.amount))
            }),
            printLineSeparator(SeparatorLine.double), // ========================================
      /** ****** end payments part *****/
            notFiscalText,
      /** tax values */
            printLabelValue([SERBIAN_LABELS.MARK, blank(7), SERBIAN_LABELS.TAX_NAME, blank(6), SERBIAN_LABELS.TAX_VALUE].join(''), SERBIAN_LABELS.TAX_FINANCE)[0],   //  Ознака       Име      Стопа        Порез
            taxLines,   // A             VAT    9,00%        193,08   all lines

      /** *  total tax part */
            printLineSeparator(SeparatorLine.single),
            printLabelValueAlignRight(SERBIAN_LABELS.TAX_FINANCE_TOTAL, formatPrice(data.totalTaxAmount)), // Укупан износ пореза:                0,83
            printLineSeparator(SeparatorLine.double), // ========================================

            ...footerPart,
            printLineSeparator(SeparatorLine.double), // ========================================
      // QRCode here
            fnFirstLastLine(endReceiptLine(data.invoiceType), SeparatorLine.double), // ======== КРАЈ ФИСКАЛНОГ РАЧУНА =========
        ]).filter(x => !!x.length)

        return dataForPrint

    }

}

export default Receipt
