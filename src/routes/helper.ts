import Tax from '../fiscal/tax/Tax'
import { TGetStatusResponse } from './d'
import TaxPayer from '../secureElement/TaxPayer'
import SecureElement from '../secureElement/SecureElement'
import {
    __omit,
    __round,
    __multiply
} from '../lodashLocal'
import TaxCoreCommands from '../taxCoreCommands'
import TaxCoreLastInvoice from '../taxCoreLastInvoice'
import { getErrors } from '../exception'
import { formatDateTime } from '../utils'
import Configuration from '../configuration/Configuration'
import { CURRENT_SOFTWARE_VERSION } from '../constant'

export const createStatus = async (): Promise<TGetStatusResponse> => {

    const tax = new Tax()
    const { protocolVersion, hardwareVersion, deviceSerialNumber, model, make } = Configuration.CONFIG.LPFR

    const { currentTaxRates: _currentTaxRates, allTaxRates: _allTaxRates } = await tax.getCurrentAndAllTax()

    const currentTaxRates = {
        ...__omit(_currentTaxRates, 'validFromLong'),
        taxCategories: _currentTaxRates.taxCategories.map(x => ({
            ...x,
            taxRates: x.taxRates.map(taxRate => ({ rate: taxRate.rate, label: taxRate.label }))
        }))
    }
    const allTaxRates = _allTaxRates.map(tax => ({
        ...__omit(tax, 'validFromLong'),
        taxCategories: _currentTaxRates.taxCategories.map(x => ({
            ...x,
            taxRates: x.taxRates.map(taxRate => ({ rate: taxRate.rate, label: taxRate.label }))
        }))
    }))
    const { supportedLanguages, endpoints } = await TaxCoreCommands.getTaxCoreConfig()

    const secureElementVersion = await SecureElement.getSecureElementVersion()
    const { totalAmount, maxLimit } = await SecureElement.amountStatus()
    const isAuditRequired = totalAmount >= __round(__multiply(maxLimit, 0.75))
    const { invoiceNumber } = await TaxCoreLastInvoice.findLastByUID() || {}

    const { mssc, gsc } = getErrors()
    return {
        isPinRequired: SecureElement.isPinRequired,
        auditRequired: isAuditRequired,
        sdcDateTime: formatDateTime(),
        lastInvoiceNumber: invoiceNumber ? invoiceNumber : '',
        protocolVersion,
        secureElementVersion,
        hardwareVersion,
        softwareVersion: CURRENT_SOFTWARE_VERSION,
        deviceSerialNumber,
        model,
        make,
        mssc,
        gsc,
        supportedLanguages,
        uid: TaxPayer.UID,
        taxCoreApi: endpoints.taxCoreApi,
        currentTaxRates,
        allTaxRates,
    }
}

