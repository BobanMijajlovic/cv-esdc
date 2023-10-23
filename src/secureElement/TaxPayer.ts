import SecureElement from './SecureElement'

class TaxPayer {

    get TaxPayer () {
        const c = SecureElement.getActiveReader
        if (!c) {
            return undefined
        }
        return c.TaxPayer

    }

    get isInitiated (): boolean {
        return !!this.TaxPayer?.isInitiated
    }

    get taxMRC () {
        return this.TaxPayer?.taxMRC
    }

    get TIN () {
        return this.TaxPayer?.TIN
    }

    get UID () {
        return this.TaxPayer?.UID
    }

    get dataSettings () {
        return this.TaxPayer?.TaxPayerData
    }
}

const instance = new TaxPayer()
export default instance
