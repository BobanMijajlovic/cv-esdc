import { SYSTEM_ERRORS } from '../constant'
import File from '../file/File'
import TaxPayer from '../secureElement/TaxPayer'
import {
    TExceptionObject,
    EXCEPTIONS
} from '../exception/d'
import { __isString } from '../lodashLocal'
import { throwLPFRErrorObj } from '../exception'

const TOTAL_NUM = 30000
const DAYS = 30

class ErrorLog {

    monitor: boolean

    constructor () {
        this.monitor = false
    }

    get currentPath () {
        if (!TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        return `${TaxPayer.UID}_error_logs.err`
    }

    readLogs = async () => {
        const file = new File(SYSTEM_ERRORS, this.currentPath, false)
        try {
            await file.init()
            const data = await file.read() || []
            return data
        } catch (e) { /** */
        }
        return []
    }

    writeLogs = async (error: TExceptionObject, description: string | object) => {
        if (!TaxPayer.UID || this.monitor) {
            return
        }
        try {
            this.monitor = true
            const logs = await this.readLogs()
            const file = new File(SYSTEM_ERRORS, this.currentPath, false)
            description = (() => {
                if (!description) {
                    return undefined
                }
                if (__isString(description)) {
                    return description
                }
                try {
                    return JSON.stringify(description)
                } catch (e) {
                    return undefined
                }
            })()
            const _err = {
                ...error,
                description
            }
            const date = new Date()
            const obj = {
                error: _err,
                time: date.toISOString()
            }

            let array = [...logs, obj]
            if (array.length > TOTAL_NUM) {
                array = array.slice(TOTAL_NUM * -1)
            }

            const dateTime = new Date().getTime()
            const max = 1000 * 60 * 60 * 24 * DAYS
            const fnNeedToDelete = (a) => {
                try {
                    const t = new Date(a.time).getTime()
                    if (t + max > dateTime) {
                        return false
                    }
                    return true
                } catch (e) {
                    return true
                }
            }

            const findIndex = array.findIndex((a, index) => !fnNeedToDelete(a) || index > 1000)
            if (findIndex != -1) {
                array = array.slice(findIndex)
            }
            await file.write(array)
        } finally {
            this.monitor = false
        }
    }

    writeLogsSync = (error: TExceptionObject, description?: string) => {
        this.writeLogs(error, description)
            .then()
    }

}

const instance = new ErrorLog()
export default instance
