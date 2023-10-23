import {
    SeparatorLine,
    TReceiptStringData,
    SERBIAN_LABELS
} from './d'
import Configuration from '../../configuration/Configuration'
import {
    TInvoiceType,
    TTransactionType
} from '../invoice/d'
import {
    __subtract,
    __add,
    __round,
    __multiply,
    __divide
} from '../../lodashLocal'
import { formatPrice } from '../../utils'

export const createLine = (length: number, char: string) => Array.from(Array(length).fill(char)).join('')

export const printLineSeparator = (type: SeparatorLine, _printerChars = 32): string => {
    const printerChars = Configuration.NUM_PRINTER_CHARS
    switch (type) {
        default:
            return createLine(printerChars, SeparatorLine.blank)
        case SeparatorLine.single:
            return createLine(printerChars, SeparatorLine.single)
        case SeparatorLine.double:
            return createLine(printerChars, SeparatorLine.double)
    }
}

const BLANKS = printLineSeparator(SeparatorLine.blank, 48)
export const blank = (num: number) => BLANKS.substr(0, num)

/** *     new functions */
export const printCenterText = (text: string, separator: SeparatorLine) => {
    const printerChars = Configuration.NUM_PRINTER_CHARS
    const num = Math.floor((printerChars - text.length) / 2)
    const line = createLine(num, separator)
    return [line, text, createLine(printerChars, separator)].join('').substr(0, printerChars)
}

export const printCenterTextCeil = (text: string, separator: SeparatorLine) => {
    const printerChars = Configuration.CONFIG.NUM_PRINTER_CHARS || 40
    const num = Math.ceil((printerChars - text.length) / 2)
    const line = createLine(num, separator)
    return [line, text, createLine(printerChars, separator)].join('').substr(0, printerChars)
}

export const printTextLeft = (text: string) => {
    const printerChars = Configuration.NUM_PRINTER_CHARS
    const line = createLine(printerChars, SeparatorLine.blank)
    return [text, line].join('').substr(0, printerChars)
}

/** function will align label on left and value on rigth if there is no space to be in one line
 * the will return two lines.
 * @param label
 * @param value
 */
export const printLabelValueAlignRight = (label: string, value: string) => {
    const printerChars = Configuration.NUM_PRINTER_CHARS
    const total = label.length + value.length
    if (total < printerChars) {
        return [[label, blank(printerChars - total), value].join('')]
    }

    return [
        [label, blank(printerChars)].join('').substr(0, printerChars),
        [blank(printerChars - value.length), value].join('')
    ]

}

export const printRows = (str: string): string[] => {
    const printerChars = Configuration.NUM_PRINTER_CHARS
    const array = []
    while (str.length) {
        let s = str.substr(0, printerChars)
        str = str.substr(s.length)
        if (s.length < printerChars) {
            s = [s, BLANKS].join('').substr(0, printerChars)
        }
        array.push(s)
    }
    return array
}

export const printLabelValue = (label: string, value: string): string[] => {
    const printerChars = Configuration.NUM_PRINTER_CHARS
    const total = label.length + value.length
    if (total < printerChars) {
        return [[label, blank(printerChars - total), value].join('')]
    }
    return printRows([label, ' ', value].join(''))
}

