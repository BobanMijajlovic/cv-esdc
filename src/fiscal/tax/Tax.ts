import {
    TaxCategoryType,
    TaxCategoryTypeByNumber,
    TTaxCategory,
    TTaxDefinitionPerLabel,
    TTaxPerLabel,
    TTaxServerStatus
} from './d'
import { EXCEPTIONS } from '../../exception/d'
import {
    __add,
    __divide,
    __get,
    __multiply,
    __omit,
    __round,
    __sortBy,
    __subtract,
    __uniq,
    __orderBy
} from '../../lodashLocal'
import { throwLPFRErrorObj } from '../../exception'
import { MULTIPLY_FOR_SIGN_DATA } from '../../constant'
import {
    TCalculatedTax,
    TItemRequest
} from '../receipt/d'
import TaxCoreCommands from '../../taxCoreCommands'

const formatTTaxCategory = (entry?: TTaxCategory) => {
    if (!entry?.taxRates || !Array.isArray(entry.taxRates)) {
        return {}
    }
    return entry.taxRates.reduce((acc, x) => {
        return {
            ...acc,
            [x.label]: {
                rate: x.rate,
                categoryType: entry.categoryType,
                label: x.label,
                categoryName: entry.name,
                orderId: entry.orderId
            }
        }
    }, {})
}

const formatDefinitionPerLabel = (entry: TTaxCategory[]) => entry.reduce((acc, x) => {
    const obj = formatTTaxCategory(x)
    return {
        ...acc,
        ...obj
    }
}, {})

/** calculate tax for one item
 *
 *
 *  return array of     {
 *    orderId: 9,
      categoryType: 2,
      label: "P",
      amount: 4.5,
      rate: 0.5,
      categoryName: "PBL"
    }
 *
 * */

class Tax {

    private lastValidTaxPerLabel: TTaxPerLabel = null
    private lastValidTax = null

    getCurrentAndAllTax = async (): Promise<TTaxServerStatus> => {
        let taxs = await TaxCoreCommands.getValidTaxes()
        if (!taxs || !Array.isArray(taxs) || taxs.length === 0) {
            return throwLPFRErrorObj(EXCEPTIONS.localError_80100_taxNotDefined)
        }
        const currentTime = new Date().getTime()
        taxs = __sortBy(taxs.map(t => ({
            ...t,
            validFromLong: new Date(t.validFrom).getTime()
        })), 'validFromLong').filter(t => t.validFromLong <= currentTime)

        if (taxs.length === 0) {
            return throwLPFRErrorObj(EXCEPTIONS.localError_80100_taxNotDefined)
        }
        const lastValidTime = taxs[taxs.length - 1].validFromLong
        taxs = __sortBy(taxs.filter(t => t.validFromLong === lastValidTime), 'groupId')
        return {
            currentTaxRates: taxs[taxs.length - 1],
            allTaxRates: taxs
        }
    }

    private getValidTaxForDate = async (date: Date) => {
        const _tax = await this.getCurrentAndAllTax()
        if (!date) {
            return _tax.currentTaxRates
        }
        const time = date.getTime()
        const taxs = __orderBy(_tax.allTaxRates.filter(x => x.validFromLong <= time),'validFromLong').reverse()
        return taxs[0] || _tax.currentTaxRates
    }

    private prepareTaxForReceipt = async (date?: Date) => {
        this.lastValidTax = await  this.getValidTaxForDate(date)
        if (!this.lastValidTax) {
            return throwLPFRErrorObj(EXCEPTIONS.localError_80100_taxNotDefined)
        }
        return formatDefinitionPerLabel(this.lastValidTax.taxCategories)
    }

    taxItemCalculate = (item: TItemRequest) => {
        const tax: TCalculatedTax[] = __uniq(item.labels).map(label => {
            const v: TTaxDefinitionPerLabel = __get(this.lastValidTaxPerLabel, label)
            if (!v) {
                return throwLPFRErrorObj(EXCEPTIONS.localError_80200_itemTaxInvalid)
            }
            return {
                label,
                orderId: v.orderId,
                rate: v.rate,
                categoryType: v.categoryType,
                categoryName: v.categoryName,
                amount: 0
            }
        })

        let finance = item.totalAmount

        const taxAmountPerQuantity = tax.filter(t => t.categoryType === TaxCategoryType.AmountPerQuantity || t.categoryType === TaxCategoryTypeByNumber.AmountPerQuantity).map(p => {
            const amount = __round(__multiply(p.rate, item.quantity), 4)
            return {
                ...p,
                amount
            }
        })

        if (taxAmountPerQuantity.length) {
            const sum = taxAmountPerQuantity.reduce((acc, p) => __round(__add(acc, p.amount), 4), 0)
            finance = __round(__subtract(finance, sum), 4)
        }

        const fnTax = (taxArray: TCalculatedTax[]) => {
            if (taxArray.length === 0) {
                return []
            }
            const sumTaxRate = taxArray.reduce((acc, t) => __add(acc, t.rate), 0)
            const div = __add(100, sumTaxRate)
            taxArray = taxArray.map(p => {
                const amount = __round(__divide(__multiply(finance, p.rate), div), 4)
                return {
                    ...p,
                    amount
                }
            })

            const sum = taxArray.reduce((acc, p) => __add(acc, p.amount), 0)
            finance = __round(__subtract(finance, sum), 4)
            return taxArray
        }

        const taxOnTotal = fnTax(tax.filter(t => t.categoryType === TaxCategoryType.TaxOnTotal || t.categoryType === TaxCategoryTypeByNumber.TaxOnTotal))
        const taxOnNet = fnTax(tax.filter(t => t.categoryType === TaxCategoryType.TaxOnNet || t.categoryType === TaxCategoryTypeByNumber.TaxOnNet))

        return [...taxAmountPerQuantity, ...taxOnTotal, ...taxOnNet]
    }

    taxForReceiptRequest = async (items: TItemRequest[], referentDate?: Date) => {
        this.lastValidTaxPerLabel = await this.prepareTaxForReceipt(referentDate) as any
        let hash = new Map()
        items.forEach(item => {
            const tax = this.taxItemCalculate(item)
            tax.forEach(tx => {
                const instance = hash.get(tx.label)
                if (!instance) {
                    hash.set(tx.label, tx)
                    return
                } else {
                    hash.set(tx.label, {
                        ...tx,
                        amount: __round(__add(tx.amount, instance.amount), 4)
                    })
                }
            })
        })

        let taxItems = __sortBy(Array.from(hash.values()), 'label')

        hash = new Map()
        taxItems.forEach(t => {
            const tx = hash.get(t.orderId)
            if (!tx) {
                hash.set(t.orderId, t)
            } else {
                hash.set(t.orderId, {
                    ...tx,
                    amount: __round(__add(tx.amount, t.amount), 4)
                })
            }
        })

        const taxByOrderId = __sortBy(Array.from(hash.values()), 'orderId').map(x => ({
            ...x,
            amount: __round(__multiply(x.amount, MULTIPLY_FOR_SIGN_DATA), 0)
        }))

        taxItems = taxItems.map(t => {
            const tt = __omit(t, ['orderId'])
            if (isNaN(+t.categoryType)) {
                tt.categoryType = TaxCategoryTypeByNumber[t.categoryType]
            }
            return tt
        })

        return {
            taxItems,
            taxByOrderId,
            groupId: this.lastValidTax.groupId
        }

    }
}

export default Tax
