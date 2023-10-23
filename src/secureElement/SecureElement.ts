import CardReaders from './CardReaders'
import { throwLPFRErrorObj } from '../exception'
import { EXCEPTIONS } from '../exception/d'
import CardReader from './CardReader'

class SecureElement {

    cardReaders = null

    initSecureElement = () => {
        this.cardReaders = new CardReaders()
        this.cardReaders.init()
    }

    tryToInitCert = async () => this.cardReaders.initCardsFirstTime()

    checkPin = async (pin: string) => this.getActiveReaderThrowError.checkPin(pin)

    get getPin () {
        return this.getActiveReaderThrowError.getPin
    }

    get CardReaders () {
        return this.cardReaders.systemReaders
    }

    get getActiveReaderThrowError (): CardReader {
        const c = this.cardReaders.activeReader
        if (!c) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        return c
    }

    get getActiveReader (): CardReader {
        return this.cardReaders.activeReader
    }

    get isPinRequired () {
        const c = this.getActiveReaderThrowError
        return c.isPinRequired
    }

    get isInWorkingCondition (): boolean {
        const c = this.cardReaders.activeReader
        return !!c
    }

    getSecureElementVersion = async () => this.getActiveReaderThrowError.getSecureElementVersion()

    checkIsWorkingCertificateGotThrowException = (checkPin = true) => this.getActiveReaderThrowError.checkPinValidThrowException(checkPin)

    amountStatus = async () => this.getActiveReaderThrowError.amountStatus()

    endAudit = async (buffer: any) => this.getActiveReaderThrowError.endAudit(buffer)

    getTaxCorePublicKey = async () => this.getActiveReaderThrowError.getTaxCorePublicKey()

    startAudit = async () => this.getActiveReaderThrowError.startAudit()

    getInternalData = async () => this.getActiveReaderThrowError.getInternalData()

    signInvoice = async (bytes: any) => this.getActiveReaderThrowError.signInvoice(bytes)

}

const instance = new SecureElement()
export default instance
