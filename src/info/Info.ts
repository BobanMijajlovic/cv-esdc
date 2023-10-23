import TaxPayer from '../secureElement/TaxPayer'
import File from '../file/File'
import { SYSTEM } from '../constant'

export const enum INFO {
    auditSent = 'auditSent',
    proofDone = 'proofDone',
    proofStart = 'proofStart',
    proofFailed = 'proofFailed',
    firstLog = 'firstLog',
    lastReceipt = 'lastReceipt',
    ntpDiff = 'ntpDiff',
    limits = 'limits'
}

export type TInfoLog = {
    type: INFO,
    time: string,
    data?: string | object
}

class Info {

    get currentPath () {
        return `${TaxPayer.UID}.info`
    }

    readLogs = async (): Promise<any> => {
        if (!TaxPayer.UID) {
            return []
        }
        const file = new File(SYSTEM, this.currentPath)
        try {
            const data = await file.read() || []
            return data
        } catch (e) { /** */
        }
        return []
    }

    writeLogs = async (type: INFO, data?: string | number | object) => {

        let arr = await this.readLogs()
        arr = arr.filter(d => d.type !== type)
        arr = [
            ...arr,
            {
                type,
                time: (new Date()).toISOString(),
                data
            }
        ]
        const file = new File(SYSTEM, this.currentPath)
        await file.write(arr)
    }

    firstLog = async () => {
        const arr = await this.readLogs()
        const f = arr.find(ff => ff.type === INFO.firstLog)
        if (f) {
            return
        }
        return this.writeLogs(INFO.firstLog)
    }

    getLastTime = async (type: INFO) => {
        const data = await this.readLogs()
        const f = data.find(ff => ff.type === type)
        if (!f?.time) {
            return 0
        }
        try {
            const dd = new Date(f.time)
            return dd.getTime()
        } catch (e) {
            return 0
        }
    }

    getLastNumberByType = async (type: INFO) => {
        const data = await this.readLogs()
        const f = data.find(ff => ff.type === type)
        if (!f?.time) {
            return 0
        }
        try {
            const num = Number(f.data)
            return num || 0
        } catch (e) {
            return 0
        }
    }

    getLastNumberReceipt = async () => {
        const data = await this.readLogs()
        const f = data.find(ff => ff.type === INFO.lastReceipt)
        if (!f?.time) {
            return 0
        }
        try {
            const num = Number(f.data)
            return num || 0
        } catch (e) {
            return 0
        }
    }

    getLastNumberSendAudit = async () => {
        const data = await this.readLogs()
        const f = data.find(ff => ff.type === INFO.auditSent)
        if (!f?.time) {
            return 0
        }
        try {
            const num = Number(f.data)
            return num || 0
        } catch (e) {
            return 0
        }
    }

    getCardLimits = async () => {
        const data = await this.readLogs()
        const f = data.find(ff => ff.type === INFO.limits)
        return f
    }

}

const instance = new Info()
export default instance

