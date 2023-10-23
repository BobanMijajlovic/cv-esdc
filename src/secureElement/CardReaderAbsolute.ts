import Logger from '../logger'
import TaxPayerCard from './TaxPayerCard'
import { guid } from '../utils'
import { throwLPFRErrorObj } from '../exception'
import { EXCEPTIONS } from '../exception/d'
import CriticalError from '../crtiticalError/CriticalError'

import { CommandApdu } from '../smartcardHwt'
import {
    SELECT_APPLET_COMMAND,
    GET_CERTIFICATE,
    GET_AMOUNT_STATUS,
    GET_SECURE_ELEMENT_VERSION,
    END_AUDIT,
    GET_TAX_CORE_PUBLIC_KEY,
    START_AUDIT,
    EXPORT_INTERNAL_DATA,
    SIGN_INVOICE
} from './commands'
import { TCertificateParse } from './d'
import {
    asn1,
    pki
} from 'node-forge'
import utf8 from 'utf8'
import {
    CERTIFICATE_CUSTOM_ATTRIBUTE_ID,
    CERTIFICATE_TAX_CORE_URL_ID,
    CERTIFICATE_TAX_PAYER_ID
} from '../constant'
import {
    cronJobCheckCheckCardInit,
    cronJobCheckCheckOverFlowLimit,
    cronJobCheckCheckCardInitOnce
} from '../cron'
import {
    bufferToLong,
    bufferCopyData,
    bufferToInteger
} from '../helpers'
import {
    __round,
    __multiply,
    __divide
} from '../lodashLocal'
import Info, { INFO } from '../info/Info'

class CardReader {
    guid: string
    device: any
    pin: string
    taxPayer: TaxPayerCard
    selected: boolean

    constructor (device: any) {
        this.pin = null
        this.selected = false
        this.device = device
        this.on()
    }

    get isSelected () {
        return this.selected
    }

    get Device () {
        return this.device
    }

    get isPinRequired () {
        return !this.pin
    }

    get getPin () {
        return this.pin
    }

    get UID () {
        return this.taxPayer?.UID
    }

    get Name () {
        return this.Device?.name
    }

    setSelected = (val: boolean) => {
        this.selected = val
    }

    get isSelectedInitiated () {
        return this.isSelected && !!this.taxPayer
    }

    get isInWorkingCondition (): boolean {
        return !!this.device?.card
    }

    get TaxPayer () {
        return this.taxPayer
    }

    initCardFirstTime = async () => {
        if (this.taxPayer) {
            return
        }
        if (!this.device?.card) {
            return
        }
        try {

            const data = await this.readCertificate()
            this.taxPayer = new TaxPayerCard(data)
        } catch (e) { /**  */ }
    }

    on () {
        this.guid = guid()
        this.device.on('card-inserted', async ({ card }: any) => {
            this.pin = null
            this.taxPayer = null
            Logger.log('card is inserted')
            cronJobCheckCheckCardInitOnce.start()
            cronJobCheckCheckCardInit.start()
            return
        })

        this.device.on('error', (err) => {
            console.log('err', err)
        })

        this.device.on('card-removed', (data: any) => {
            this.pin = null
            this.taxPayer = null
            this.selected = false
            Logger.log('card is removed')
            cronJobCheckCheckCardInitOnce.start()
            cronJobCheckCheckCardInit.start()
        })

    }

  /** * functions **/
    async getSecureElementVersion () {
        await this.checkCardAvailable()
        Logger.logCardCommandStart('GET_SECURE_ELEMENT_VERSION')
        const { buffer } = await this.doCommand(new CommandApdu(GET_SECURE_ELEMENT_VERSION))
        let position = 0
        const first = bufferToInteger(bufferCopyData(buffer, position, 4))
        const sec = bufferToInteger(bufferCopyData(buffer, position += 4, 4))
        const third = bufferToInteger(bufferCopyData(buffer, position += 4, 4))
        return [first, sec, third].join('.')
    }

    async checkPin (pin: string) {
        this.pin = null
        await this.initCommand(pin)
        this.pin = pin
    }

    checkPinValidThrowException (checkPin = true) {
        if (checkPin && !this.pin) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1500_pinCodeReq)
        }
    }

    async amountStatus () {
        await this.checkCardAvailable()
        Logger.logCardCommandStart('GET_AMOUNT_STATUS')
        const { buffer } = await this.doCommand(new CommandApdu(GET_AMOUNT_STATUS))
        const totalAmount = bufferToLong(bufferCopyData(buffer, 0, 7))
        const maxLimit = bufferToLong(bufferCopyData(buffer, 7, 7))

        const limitFull = __round(__multiply(__divide(maxLimit, 10), 9))
        const limitAudit = __round(__multiply(__divide(maxLimit, 100), 75))

        Logger.logLimits(limitAudit, limitFull, totalAmount, maxLimit)

        if (limitFull < totalAmount) {
            await CriticalError.writeLogs(EXCEPTIONS.warningError_1100_storageNearFull)
        } else {
            await CriticalError.clearError(EXCEPTIONS.warningError_1100_storageNearFull)
        }

        if (limitAudit < totalAmount) {
            await CriticalError.writeLogs(EXCEPTIONS.warningError_1400_auditRequired)
        } else {
            await CriticalError.clearError(EXCEPTIONS.warningError_1400_auditRequired)
        }
        const data = {
            totalAmount,
            maxLimit
        }

        if (totalAmount >= maxLimit) {
            cronJobCheckCheckOverFlowLimit.start()
        } else {
            cronJobCheckCheckOverFlowLimit.stop()
        }

        await Info.writeLogs(INFO.limits, data)
        return data
    }

    async checkCardAvailable () {
        Logger.logCardCommandStart('SELECT_APPLET')
        return this.doCommand(new CommandApdu(SELECT_APPLET_COMMAND))
    }

    async getCertificate () {
        await this.checkCardAvailable()
        Logger.logCardCommandStart('GET_CERTIFICATE')
        const { buffer } = await this.doCommand(new CommandApdu(GET_CERTIFICATE)) as any
        return buffer
    }

    async getTaxCorePublicKey () {
        await this.initCommand()
        Logger.logCardCommandStart('GET_TAX_CORE_PUBLIC_KEY')
        return this.doCommand(new CommandApdu(GET_TAX_CORE_PUBLIC_KEY))
    }

    readCertificate = async (): Promise<TCertificateParse> => {
        const buffer = await this.getCertificate()
        const data = buffer.toString('binary')
        const certificate = asn1.fromDer(data)
        const cer = pki.certificateFromAsn1(certificate as any)
        const attributes = cer.subject.attributes.reduce((acc, x) => ({
            ...acc,
            [x.name]: x.value && utf8.decode(x.value as string)
        }), {})
        const regexURL = new RegExp(`^([${CERTIFICATE_CUSTOM_ATTRIBUTE_ID}])(.\\d.\\d)*\\.${CERTIFICATE_TAX_CORE_URL_ID}$`, 'gi')
        const regexTaxPayerId = new RegExp(`^([${CERTIFICATE_CUSTOM_ATTRIBUTE_ID}])(.\\d.\\d)*\\.${CERTIFICATE_TAX_PAYER_ID}$`, 'gi')

        const extensions = {
            taxCoreUrl: cer.extensions.find(x => regexURL.test(x.id))?.value,
            taxPayerId: cer.extensions.find(x => regexTaxPayerId.test(x.id))?.value
        }

        if (!extensions.taxPayerId || !extensions.taxCoreUrl) {
            throwLPFRErrorObj(EXCEPTIONS.secureElem_2400_notConfig)
        }

        return {
            ...attributes,
            ...extensions
        } as TCertificateParse
    }

    async initCommand (_pin?: string) {
        await this.checkCardAvailable()
        const pin = _pin || this.pin
        if (!pin) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1500_pinCodeReq)
        }
        const pinBuffer = [0x88, 0x11, 0x04, 0x00, 0x04]
        const bytes = [...pinBuffer, ...pin.split('').map(x => Number(x))]
        try {
            await this.doCommand(new CommandApdu({ bytes }))
        } catch (e) {
            this.pin = null
            throw e
        }
    }

    static mapStatus = (status: number | string) => {
        const obj = {
            '6302': 2100,
            '6310': 2110,
            '6a80': 2160,
        }

        return obj[status] || status
    }
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
    async doCommand (command: CommandApdu): any {
        throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
    }

    async signInvoice (bytes: any) {
        await this.initCommand()
        return this.doCommand(new CommandApdu({
            ...SIGN_INVOICE,
            data: bytes
        }))
    }

    async getInternalData () {
        await this.initCommand()
        Logger.logCardCommandStart('INTERNAL_DATA')
        return this.doCommand(new CommandApdu(EXPORT_INTERNAL_DATA))
    }

    async startAudit () {
        await this.initCommand()
    /**
     * this will be return some bytes array
     * this data will be send to TaxCore API
     * */
        Logger.logTaxRequest('START_AUDIT')
        return await this.doCommand(new CommandApdu(START_AUDIT))
    }

    async endAudit (buffer: any) {
        const array = []

        for (const value of buffer) {
            array.push(value)
        }
        await this.initCommand()
        Logger.logCardCommandStart('END_AUDIT')
        const data = await this.doCommand(new CommandApdu({
            bytes: [...END_AUDIT.bytes, ...[0x0, 0x1, 0x0], ...array]
        }))
        return data
    }

}

export default CardReader
