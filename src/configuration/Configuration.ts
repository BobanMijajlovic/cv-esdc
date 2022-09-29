import File from '../file/File'
import {
    SETTINGS,
    ONE_HOUR,
    _AUDIT_SEND_CRON__NEXT_TIME_ALLOWED,
    _AUDIT_PROOF_CRON__NEXT_TIME_ALLOWED
} from '../constant'
import { TConfiguration } from './d'
import { __merge } from '../lodashLocal'

const DEFAULT_SETTINGS = {
    PORT: 5555,
    logOut: true,
    NUM_PRINTER_CHARS: 40,
    TIME_AUDIT_SEND: 2 * ONE_HOUR,
    TIME_PROOF_SEND: 8 * ONE_HOUR,
    LPFR: {
        protocolVersion: '1.0.0.0',
        hardwareVersion: '0.0.1',
        softwareVersion: '0.0.1',
        deviceSerialNumber: '42-0001-99999999',
        make: 'Hardworking Technology',
        model: 'LPFR-HWT1',
        mrcPrefix: '42-0001'
    }
} as TConfiguration

class Configuration {

    file: File
    currentSettings: TConfiguration

    constructor () {
        this.file = new File(SETTINGS, 'settings.set')
        this.currentSettings = { ...DEFAULT_SETTINGS }
    }

    reloadSettings = async () => {
        try {
            const data = await this.file.read()
            if (data.PORT || data.NUM_PRINTER_CHARS) {
                this.currentSettings = data
            }
        } catch (e) {

        }
    }

    get isLogOut () {
        return this.currentSettings?.logOut
    }

    newSettings = async (data = {}) => {
        const newData = __merge(this.currentSettings, data)
        await this.saveSetting(newData)
        await this.reloadSettings()
    }

    saveSetting = async (data = DEFAULT_SETTINGS) => {
        try {
            await this.file.write(data)
        } catch (e) {

        }
    }

    get timeAllowToAuditSend () {
        return this.currentSettings?.TIME_AUDIT_SEND || _AUDIT_SEND_CRON__NEXT_TIME_ALLOWED
    }

    get timeAllowToProofSend () {
        return this.currentSettings?.TIME_PROOF_SEND || _AUDIT_PROOF_CRON__NEXT_TIME_ALLOWED
    }

    get isConfigurationValid () {

        const numChar = +this.currentSettings?.NUM_PRINTER_CHARS

        if (!numChar || numChar > 50 || numChar < 30) {
            return false
        }
        if (!this.currentSettings.LPFR) {
            return false
        }
        const isValid = ['protocolVersion',
            'hardwareVersion',
            'softwareVersion',
            'deviceSerialNumber',
            'make',
            'model',
            'mrcPrefix'].every(x => !!this.currentSettings?.LPFR?.[x])
        return isValid && !!this.currentSettings?.PORT
    }

    init = async () => {
        try {
            const data = await this.file.read()
            if (!data) {
                await this.saveSetting()
            }
            await this.reloadSettings()

        } catch (e) {

        }
    }

    get CONFIG () {
        return this.currentSettings
    }

    get NUM_PRINTER_CHARS () {
        return this.currentSettings?.NUM_PRINTER_CHARS || 40
    }

    get SERVER_PORT () {
        return this.currentSettings?.PORT
    }

    get TAX_CORE_PORT () {
        return this.currentSettings?.CPORT
    }

}

const instance = new Configuration()
export default instance
