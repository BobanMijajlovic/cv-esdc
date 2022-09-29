import {
    TInvoiceRequest,
    TInvoiceResponse,
    TInvoiceType,
    TPaymentType,
    TTransactionType
} from '../invoice/d'
import { TaxCategoryType } from '../tax/d'

export type TItemRequest = {
    gtin?: string
    name: string
    quantity: number,
    unitPrice: number
    labels: string[]
    totalAmount: number
}

export type TCalculatedTax = {
    label: string,
    categoryType: TaxCategoryType | number,
    rate: number,
    orderId?: number,
    categoryName?: string;
    amount: number
}

export type TAuditItemRequest = {
    gtin?: string
    name: string
    quantity: number,
    unitPrice: number
    labels: string[]
    totalAmount: number
}

export type TItemResponse = {
    GTIN?: string
    Name: string
    Quantity: number,
    UnitPrice: number
    Labels: string[]
    TotalAmount: number,
    Tax: TCalculatedTax[]
}

export enum SeparatorLine {
    none = '\x20',
    blank = '\x20',
    single = '-',
    double = '='
}

export enum SERBIAN_LABELS {
    FISCAL_RECEIPT = ' ФИСКАЛНИ РАЧУН ',
    FISCAL_NOT_RECEIPT = ' ОВО НИЈЕ ФИСКАЛНИ РАЧУН ',
    TIN = 'ПИБ:',
    BUSINESS_NAME = 'Предузеће:',
    LOCATION_NAME = 'Место продаје:',
    ADDRESS = 'Адреса:',
    DISTRICT = 'Општина:',
    CASHIER = 'Касир:',
    BUYER_ID = 'ИД купца:',
    BUYER_COST_CENTER_ID = 'Опционо поље купца:',
    ESIR_NUMBER = 'ЕСИР број:',
    ESIR_TIME = 'ЕСИР време:',
    REFERENT_NUMBER = 'Реф. број:',
    REFERENT_DATE_TIME = 'Реф. време:',
    TRAFFIC = 'ПРОМЕТ',
    PROFORMA = 'ПРОФОРМА',
    TRANING = 'ТРЕНИНГ',
    COPY = 'КОПИЈА',
    SALE = 'ПРОДАЈА',
    REFUND = 'РЕФУНДАЦИЈА',
    ADVANCE = 'АВАНС',
    ARTICLES = 'Артикли',
    ITEM_NAME = 'Назив',
    PRICE = 'Цена',
    QTY = 'Кол.',
    TOTAL = 'Укупно',
    TOTAL_COSTS = 'Укупан износ:',
    TOTAL_ADVANCE = 'Плаћено авансом:',
    VAT_ADVANCE = 'ПДВ на аванс:',
    SUBTOTAL_ADVANCE = 'Преостало за плаћање:',
    TOTAL_REFUND = 'Укупна рефундација:',
    CASH = 'Готовина:',
    CARD = 'Платна картица:',
    CHECK = 'Чек:',
    OTHER = 'Друго безготовинско плаћање:',
    CHANGE = 'Преостало за плаћање:',
    WIRE_TRANSFER = 'Пренос на рачун:',
    VOUCHER = 'Ваучер:',
    MOBILE_MONEY = 'Инстант плаћање:',
    MARK = 'Ознака',
    TAX_NAME = 'Име',
    TAX_VALUE = 'Стопа',
    TAX_FINANCE = 'Порез',
    TAX_FINANCE_TOTAL = 'Укупан износ пореза:',
    PFR_DATETIME = 'ПФР време:',
    PFR_RECEIPT_NUMBER = 'ПФР број рачуна:',
    RECEIPT_COUNTER = 'Бројач рачуна:',
    END_FISCAL_RECEIPT = ' КРАЈ ФИСКАЛНОГ РАЧУНА '
}

export type TReceiptStringData = TInvoiceRequest & TInvoiceResponse

export const RECEIPT_PAYMENTS_LABELS = [
    {
        index: 0,
        type: TPaymentType.OTHER,
        label: SERBIAN_LABELS.OTHER
    },
    {
        index: 1,
        type: TPaymentType.CASH,
        label: SERBIAN_LABELS.CASH
    },
    {
        index: 2,
        type: TPaymentType.CARD,
        label: SERBIAN_LABELS.CARD
    },
    {
        index: 3,
        type: TPaymentType.CHECK,
        label: SERBIAN_LABELS.CHECK
    },
    {
        index: 4,
        type: TPaymentType.WIRE_TRANSFER,
        label: SERBIAN_LABELS.WIRE_TRANSFER
    },
    {
        index: 5,
        type: TPaymentType.VOUCHER,
        label: SERBIAN_LABELS.VOUCHER
    },
    {
        index: 5,
        type: TPaymentType.MOBILE_MONEY,
        label: SERBIAN_LABELS.MOBILE_MONEY
    },
]

export const RECEIPT_INVOICE_TYPE_STRING = [
    {
        type: TInvoiceType.Normal,
        value: SERBIAN_LABELS.TRAFFIC,
    },
    {
        type: TInvoiceType.Copy,
        value: SERBIAN_LABELS.COPY,
    },
    {
        type: TInvoiceType.Advance,
        value: SERBIAN_LABELS.ADVANCE
    },
    {
        type: TInvoiceType.Proforma,
        value: SERBIAN_LABELS.PROFORMA
    },
    {
        type: TInvoiceType.Training,
        value: SERBIAN_LABELS.TRANING
    }
]

export const RECEIPT_TRANSACTION_TYPE_STRING = [
    {
        type: TTransactionType.Sale,
        value: SERBIAN_LABELS.SALE,
    },
    {
        type: TTransactionType.Refund,
        value: SERBIAN_LABELS.REFUND,
    }
]

export const RECEIPT_HEADER_STRING = [
    {
        type: TInvoiceType.Normal,
        value: SERBIAN_LABELS.FISCAL_RECEIPT,
        footer: SERBIAN_LABELS.END_FISCAL_RECEIPT,
    },
    {
        type: TInvoiceType.Copy,
        value: SERBIAN_LABELS.FISCAL_NOT_RECEIPT,
        footer: SERBIAN_LABELS.FISCAL_NOT_RECEIPT,
    },
    {
        type: TInvoiceType.Advance,
        value: SERBIAN_LABELS.FISCAL_RECEIPT,
        footer: SERBIAN_LABELS.END_FISCAL_RECEIPT,
    },
    {
        type: TInvoiceType.Proforma,
        value: SERBIAN_LABELS.FISCAL_NOT_RECEIPT,
        footer: SERBIAN_LABELS.FISCAL_NOT_RECEIPT,
    },

    {
        type: TInvoiceType.Training,
        value: SERBIAN_LABELS.FISCAL_NOT_RECEIPT,
        footer: SERBIAN_LABELS.FISCAL_NOT_RECEIPT,
    }
]

export const LABEL_VALUE_MAP = [
    {
        label: SERBIAN_LABELS.TIN,
        field: 'tin'
    },
    {
        label: SERBIAN_LABELS.BUSINESS_NAME,
        field: 'businessName'
    },
    {
        label: SERBIAN_LABELS.LOCATION_NAME,
        field: 'locationName'
    },
    {
        label: SERBIAN_LABELS.ADDRESS,
        field: 'address'
    },
    {
        label: SERBIAN_LABELS.DISTRICT,
        field: 'district'
    },
    {
        label: SERBIAN_LABELS.CASHIER,
        field: 'cashier',
        required: true
    },
    {
        label: SERBIAN_LABELS.BUYER_ID,
        field: 'buyerId'
    },
    {
        label: SERBIAN_LABELS.BUYER_COST_CENTER_ID,
        field: 'buyerCostCenterId'
    },
    {
        label: SERBIAN_LABELS.ESIR_NUMBER,
        field: 'InvoiceNumber',
    },
    {
        label: SERBIAN_LABELS.ESIR_TIME,
        field: 'dateAndTimeOfIssue',
    },
    {
        label: SERBIAN_LABELS.REFERENT_NUMBER,
        field: 'referentDocumentNumber'
    },
    {
        label: SERBIAN_LABELS.REFERENT_DATE_TIME,
        field: 'referentDocumentDT'
    },
    {
        label: SERBIAN_LABELS.PFR_DATETIME,
        field: 'sdcDateTime',
    },
    {
        label: SERBIAN_LABELS.PFR_RECEIPT_NUMBER,
        field: 'invoiceNumber'
    },
    {
        label: SERBIAN_LABELS.RECEIPT_COUNTER,
        field: 'invoiceCounter'
    }
]
