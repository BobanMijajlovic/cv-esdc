import File from '../file/File'
import { SYSTEM_ERRORS } from '../constant'

import TaxPayer from '../secureElement/TaxPayer'
import {
    TExceptionObject,
    EXCEPTIONS
} from '../exception/d'

const errorsFilter = [
    EXCEPTIONS.infoErrors_0220_internetUnavailable.number,
    EXCEPTIONS.secureElem_2110_cardLocked.number,
    EXCEPTIONS.warningError_1100_storageNearFull.number,
    EXCEPTIONS.warningError_1400_auditRequired.number,
    EXCEPTIONS.audit_command_failed_2180.number,
    EXCEPTIONS.audit_proof_command_failed_2180.number,
    EXCEPTIONS.localError_90100_ntpFailedTimeDiff.number
]

class CriticalErrors {

    monitor: boolean

    constructor () {
        this.monitor = false
    }

    get currentPath () {
        return `${TaxPayer.UID}_error_critic_logs.err`
    }

    readLogs = async (): Promise<any> => {
        if (!TaxPayer.UID) {
            return []
        }
        const file = new File(SYSTEM_ERRORS, this.currentPath)
        try {
            const data = await file.read() || []
            return data
        } catch (e) { /** */
        }
        return []
    }

    writeLogs = async (error: TExceptionObject) => {
        if (!error?.number || !TaxPayer.UID || this.monitor) {
            return
        }
        try {
            this.monitor = true
            let logs = await this.readLogs()
            const file = new File(SYSTEM_ERRORS, this.currentPath)
            logs = logs.filter(x => x.error.number !== error.number)
            logs = [...logs, { error: error, time: (new Date()).toISOString() }]
            await file.write(logs)
        } catch (e) {
            throw e
        } finally {
            this.monitor = false
        }
    }

    clearError = async (error: TExceptionObject) => {
        if (!TaxPayer.UID || this.monitor) {
            return
        }
        try {
            this.monitor = true
            const data = await this.readLogs()
            const logs = data.filter(x => x.error.number !== error.number)
            if (logs.length === data.length) {
                return
            }
            const file = new File(SYSTEM_ERRORS, this.currentPath)
            await file.write(logs)
        } catch (e) {
            throw e
        } finally {
            this.monitor = false
        }
    }

    getErrorNtp = async () => {
        const data = await  this.readLogs()
        return data.find(f => f.error.number === EXCEPTIONS.localError_90100_ntpFailedTimeDiff.number)
    }

    writeLogsSync = (data: TExceptionObject) => {
        const isForWrite = errorsFilter.find(x => x === data.number)
        if (!isForWrite) {
            return
        }
        this.writeLogs(data).then()
    }

}

const instance = new CriticalErrors()
export default instance
