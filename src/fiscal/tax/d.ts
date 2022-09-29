export enum TaxCategoryType {
    TaxOnNet = 'TaxOnNet',
    TaxOnTotal = 'TaxOnTotal',
    AmountPerQuantity = 'AmountPerQuantity'
}

export enum TaxCategoryTypeByNumber {
    TaxOnNet = 0,
    TaxOnTotal= 1,
    AmountPerQuantity = 2
}

export type TTaxServerStatus = {
    currentTaxRates?: TTaxServerDefinition,
    allTaxRates?: TTaxServerDefinition[]
}

export type TTaxServerDefinition = {
    validFrom: string,
    validFromLong?: number
    groupId: number,
    taxCategories: TTaxCategory[]
}

export type TTaxRate = {
    rate: number
    label: string
}

export type TTaxCategory = {
    name: string
    categoryType: TaxCategoryType
    taxRates: TTaxRate[]
    orderId: number
}

export type TTaxItemResponse = {
    categoryType: number,
    label: string
    amount: number,
    rate: number,
    categoryName: string
}

export type TTaxDefinitionPerLabel = {
    categoryType: TaxCategoryType
    label: string
    rate: number,
    categoryName: string,
    orderId: number
}

export type TTaxPerLabel = {
    [key in string]: TTaxDefinitionPerLabel
}
