import TaxPayer from '../secureElement/TaxPayer'
import { throwLPFRErrorObj } from '../exception'
import { EXCEPTIONS } from '../exception/d'
import {
    fileWriteWithData,
    existsFileSync,
    readFileSync,
    mkdirSync,
    listDirectorySync,
    unlinkSync
} from '../files'
import { TInvoiceResponse } from '../fiscal/invoice/d'
import { __orderBy } from '../lodashLocal'
import { STORAGE_LAST_INVOICE } from '../constant'

const MAX_PER_UID = 3

class TaxCoreLastInvoice {

    constructor () {
        mkdirSync(STORAGE_LAST_INVOICE)
            .then()
    }

    get parentPath () {
        return STORAGE_LAST_INVOICE
    }

    fileName = (requestId: string) => {
        const time = (new Date()).getTime()
        return `${TaxPayer.UID}_${requestId}_${time}.json`
    }

    deleteSecureFilesByUid = async () => {
        const listFiles = await this.listFiles()
        const files = listFiles.filter(l => {
            const arr = l.split('_')
            if (arr.length !== 3) {
                return false
            }
            return arr[0] === TaxPayer.UID
        })
        if (files.length <= MAX_PER_UID) {
            return
        }

        const _files = __orderBy(files.map(f => {
            const _f = f.replace(/\.json/, '')
            const arr = _f.split('_')
            if (arr.length !== 3) {
                return false
            }
            const time = Number(arr[2])
            if (isNaN(time)) {
                return { order: 0, path: f }
            }
            return {
                path: f,
                order: time
            }
        }), 'order')

        const filesToDelete = _files.slice(0, _files.length - MAX_PER_UID)
        return Promise.all(filesToDelete.map(f => unlinkSync(`${this.parentPath}/${f}`)))
    }

    listFiles = async () => {
        if (!TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        const _parentPath = `${this.parentPath}`
        return listDirectorySync(_parentPath)
    }

    deletePrevFile = async (requestId: string) => {
        const listFiles = await this.listFiles()
        const filesToDelete = listFiles.filter(l => {
            const arr = l.split('_')
            if (arr.length !== 3) {
                return false
            }
            return arr[0] === TaxPayer.UID && arr[1] === requestId
        })
        if (!filesToDelete.length) {
            return
        }
        return Promise.all(filesToDelete.map(f => unlinkSync(`${this.parentPath}/${f}`)))
    }

    findLastByUID = async () => {
        const listFiles = await this.listFiles()
        const files = __orderBy(listFiles.filter(l => {
            const arr = l.split('_')
            if (arr.length !== 3) {
                return false
            }
            return arr[0] === TaxPayer.UID
        }).map(f => {
            const _f = f.replace(/\.json/, '')
            const arr = _f.split('_')
            if (arr.length !== 3) {
                return false
            }
            const time = Number(arr[2])
            if (isNaN(time)) {
                return { order: 0, path: f }
            }
            return {
                path: f,
                order: time
            }
        }), 'order')
        if (!files.length) {
            return undefined
        }
        files.reverse()
        const path = `${this.parentPath}/${files[0].path}`
        try {
            if (!await existsFileSync(path)) {
                return {}
            }
            const dd = await readFileSync(path)
            return !dd ? {} : JSON.parse(dd)
        } catch (e) {
      /** error to log */
        }
        return {}
    }

    findLastByReqId = async (requestId) => {
        const listFiles = await this.listFiles()
        const files = __orderBy(listFiles.filter(l => {
            const _f = l.replace(/\.json/, '')
            const arr = _f.split('_')
            if (arr.length !== 3) {
                return false
            }
            return arr[0] === TaxPayer.UID && arr[1] === requestId && !isNaN(Number(arr[2]))
        })
            .map(f => {
                const _f = f.replace(/\.json/, '')
                const arr = _f.split('_')
                if (arr.length !== 3) {
                    return false
                }
                const time = Number(arr[2])
                return {
                    path: f,
                    order: time
                }
            }), 'order')

        if (!files.length) {
            return undefined
        }
        files.reverse()
        return files[0].path

    }

    saveToFile = async (data: TInvoiceResponse, requestId: string) => {
        if (!TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        try {
            await this.deletePrevFile(requestId)
        } catch (e) { /** */ }
        try {
            await fileWriteWithData(this.parentPath, this.fileName(requestId), JSON.stringify(data))
        } catch (e) { /** */
        }

        try {
            await this.deleteSecureFilesByUid()
        } catch (e) { /** */ }
    }

    readFile = async (requestId: string) => {
        if (!TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        const _path = await this.findLastByReqId(requestId)
        const path = `${this.parentPath}/${_path}`
        try {
            if (!await existsFileSync(path)) {
                return null
            }
            const dd = await readFileSync(path)
            return !dd ? null : JSON.parse(dd)
        } catch (e) {
      /** error to log */
        }
        return null
    }

}

const instance = new TaxCoreLastInvoice()
export default instance
