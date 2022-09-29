import { TCertificateParse } from './d'
import Configuration from '../configuration/Configuration'

class TaxPayerCard {
    private taxPayerData: TCertificateParse = null

    constructor (cert: TCertificateParse) {
        this.taxPayerData = cert
    }

    get isInitiated (): boolean {
        return !!this.taxPayerData
    }

    reset = () => {
        this.taxPayerData = null
    }

    get taxMRC () {
        return this.taxPayerData ? `${Configuration.CONFIG.LPFR.mrcPrefix}-${this.taxPayerData?.taxPayerId}` : undefined
    }

    get TIN () {
        return this.taxPayerData?.taxPayerId
    }

    get UID () {
        return this.taxPayerData?.serialName
    }

    setCertificate = (d: TCertificateParse) => {
        this.taxPayerData = d
    }

    get TaxPayerData () {
        return this.taxPayerData
    }
}

export default TaxPayerCard
