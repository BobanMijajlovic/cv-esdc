import { TTaxServerDefinition } from "../fiscal/tax/d";

export type TGetStatusResponse = {
    isPinRequired: boolean
    auditRequired: boolean
    sdcDateTime?: string
    lastInvoiceNumber?: string
    protocolVersion: string
    secureElementVersion: string
    hardwareVersion: string
    softwareVersion: string
    deviceSerialNumber: string
    make: string
    model: string
    mssc?: string[] | number[] // Manufacturer-specific Errors, Warnings and info messages
    gsc?: string[] | number[]  // General Errors, Warnings and info messages defined in the Status and Error Codes section
    supportedLanguages: string[]
    uid: string
    taxCoreApi: string
    allTaxRates: TTaxServerDefinition[]
    currentTaxRates: TTaxServerDefinition

}
