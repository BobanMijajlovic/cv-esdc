import {
    __camelCase,
    __random
} from '../lodashLocal'
import moment from 'moment-timezone'

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const formatPrice = (value: (number | string)): string => {
    const valNumber = typeof value === 'number' ? value : Number(value)
    const formatter = new Intl.NumberFormat('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
    return formatter.format(valNumber)
}

export const guid = () => {
    return `${__random(100000, 9999999)}-${__random(100000, 9999999)}-${__random(100000, 9999999)}`
}

export const formatQuantity = (value: (number | string), minimumFractionDigits = 0): string => {
    const valNumber = typeof value === 'number' ? value : Number(value)
    const formatter = new Intl.NumberFormat('sr-RS', {
        minimumFractionDigits,
        maximumFractionDigits: 3
    })
    return formatter.format(valNumber)
}

export const camelizeKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => camelizeKeys(v))
    } else if (obj != null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => ({
            ...result,
            [__camelCase(key)]: camelizeKeys(obj[key]),
        }),
      {},)
    }
    return obj
}

export const formatDateTime = (value?: string | Date): string => moment(value || new Date()).tz('Europe/Belgrade')
    .format('YYYY-MM-DDTHH:mm:ssZ')
