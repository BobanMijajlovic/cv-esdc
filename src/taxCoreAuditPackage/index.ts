import {
    STORAGE,
    SUF_ESDC_AUDIT_URL,
    SUF_ESDC_AUDIT_PROF_URL,
    STORAGE_SENT,
    SYSTEM,
    STORAGE_DELETED,
    NUMBER_EMPTY_GROUP_FILES_TO_DETECT_NO_MORE
} from '../constant'
import TaxPayer from '../secureElement/TaxPayer'
import {
    readFileSync,
    fileWriteWithData,
    listDirectorySync,
    existsFileSync,
    renameSync,
    mkdirSync,
    copyFileDeleteIfPathExists,
    unlinkFileReturnBoolean,
    unlinkSync
} from '../files'
import {
    TAuditPackage,
    TAuditData,
    TAuditPayload,
    AuditPackageStatus
} from '../taxCoreAuditPackage/d'
import { throwLPFRErrorObj } from '../exception'
import { EXCEPTIONS } from '../exception/d'
import aesjs from 'aes-js'
import { Buffer } from 'buffer'
import {
    __get,
    __random,
    __isInteger,
    __orderBy,
    __pick
} from '../lodashLocal'
import SecureElement from '../secureElement/SecureElement'
import {
    bufferCopyData,
    bufferToInteger
} from '../helpers'
import NodeRSA from 'node-rsa'
import TaxCoreApi from '../taxCoreApi'
import ErrorLog from '../logs/ErrorLog'
import File from '../file/File'
import CriticalError from '../crtiticalError/CriticalError'
import Info, { INFO } from '../info/Info'
import Test from '../test/Test'
import Logger from '../logger'

class TaxCoreAuditPackage {

    getTaxCorePublicKey = async () => {
        const { buffer } = await SecureElement.getTaxCorePublicKey() as any
        const bufferModules = bufferCopyData(buffer, 0, 256)
        const exp = bufferToInteger(bufferCopyData(buffer, 256, 3))
        const key = new NodeRSA()
        key.setOptions({
            encryptionScheme: 'pkcs1'
        })
        key.importKey({
            n: bufferModules,
            e: exp,
        }, 'components-public')
        return key
    }

    generateRandomString = (len: number) => [...Array(len)].map(x => {
        return __random(0, 9)
    })
        .join('')

    createAuditPackage = async (data: TAuditData) => {

        /** audit data must be without qrCode and convert date time data to UTC */
        const keyS = this.generateRandomString(32)
        const iv = this.generateRandomString(16)

        const invoiceJSON = JSON.stringify(data)
        const textBytes = aesjs.padding.pkcs7.pad(aesjs.utils.utf8.toBytes(invoiceJSON))
        const buffKey = Buffer.from(keyS)
        const buffIV = Buffer.from(iv)
        const aesCbc = new aesjs.ModeOfOperation.cbc(buffKey, buffIV)
        const payload = Buffer.from(aesCbc.encrypt(textBytes))
            .toString('base64')

        /** 5  */
        const taxCorePublicKey = await this.getTaxCorePublicKey()

        /** 6 */
        const auditKey = taxCorePublicKey.encrypt(buffKey, 'base64')

        /** 7 */
        const auditIV = taxCorePublicKey.encrypt(buffIV, 'base64')

        /**
         * save file as {UID}-{UID}-{Ordinal_Number}.json;
         *  Ordinal number ( POS system invoice number )
         *
         * */
        const auditPackage = {
            key: auditKey,
            iv: auditIV,
            payload
        } as TAuditPackage

        return {
            invoiceNumber: __get(data.result, 'invoiceNumber'),
            auditPackage
        }
    }

    auditFileNotSentParent = (uid?: string) => {
        if (!uid && !TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        return `${STORAGE}/${uid || TaxPayer.UID}`
    }

    auditFileSentParent = (uid?: string) => {
        if (!uid && !TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        return `${STORAGE_SENT}/${uid || TaxPayer.UID}`
    }

    auditFileSentDeleted = (uid?: string) => {
        if (!uid && !TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        return `${STORAGE_DELETED}/${uid || TaxPayer.UID}`
    }

    writeSignedToStore = async (auditPackage: TAuditPackage, invoiceNumber: string) => {
        if (!TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        const _path = this.auditFileNotSentParent()

        try {
            await fileWriteWithData(_path, `${invoiceNumber}.json`, JSON.stringify(auditPackage))
        } catch (e) {
            console.log(e)
        }
    }

    pathFileAudit = (name) => {
        const _parent = this.auditFileNotSentParent()
        return `${_parent}/${name}`
    }

    pathFileSendAuditByNumber = (order: number, uid: string) => {
        const f = `${uid}-${uid}-${order}.json`
        const pathSrc = [this.auditFileSentParent(uid), f].join('/')
        return pathSrc
    }

    fileBackFromSent = async (file, uid) => {
        const pathSrc = [this.auditFileSentParent(uid), file].join('/')
        const pathDest = [this.auditFileNotSentParent(uid), file].join('/')
        return renameSync(pathSrc, pathDest)
    }

    /** read file audit from storage for sending */

    readFileAudit = async (name) => {
        const _path = this.pathFileAudit(name)
        const data = await readFileSync(_path)
        return JSON.parse(data)
    }

    numberOfFileByName = (f: string) => {
        if (!f.endsWith('.json')) {
            return 0
        }
        const _f = f.replace(/\.json/, '')
        const arr = _f.split('-')
        if (arr.length !== 3) {
            return 0
        }
        if (arr[0] !== arr[1]) {
            return 0
        }
        if (arr[0].toUpperCase() !== TaxPayer.UID.toUpperCase()) {
            return 0
        }

        const order = Number(arr[2])
        if (!__isInteger(order)) {
            return 0
        }

        return order
    }

    deleteFileConfirmByAuditProof = async (order: number, uid: string) => {
        const f = `${uid}-${uid}-${order}.json`
        const path = [this.auditFileSentParent(uid), f].join('/')

        if (Test.isTestNotDeleteAudit) {
            const pathDel = [this.auditFileSentDeleted(uid), f].join('/')
            await copyFileDeleteIfPathExists(path, pathDel)
        }
        return await unlinkFileReturnBoolean(path)
    }

    copySentFileConfirmByAuditProof = async (order: number, uid: string) => {
        const f = `${uid}-${uid}-${order}.json`
        const pathSrc = [this.auditFileNotSentParent(uid), f].join('/')
        const pathDest = [this.auditFileSentParent(uid), f].join('/')
        if (!await existsFileSync(pathSrc)) {
            return
        }
        if (await existsFileSync(pathDest)) {
            await unlinkSync(pathDest)
        }
        await renameSync(pathSrc, pathDest)
    }

    isNeedToProof = async () => {
        const sent = await Info.getLastNumberByType(INFO.lastReceipt)
        if (sent === 0) {
            return true
        }
        const lastProof = await Info.getLastNumberByType(INFO.proofStart)
        return (sent - lastProof) > 0
    }

    copyFilesAuditConfirmed = async () => {
        let numberInProof = +await this.readStoredAuditProofNumber()
        if (numberInProof < 0) {
            numberInProof = 0
        }
        const uid = TaxPayer.UID
        if (!numberInProof || !uid) {
            return
        }

        await Info.writeLogs(INFO.auditSent, numberInProof)

        let array = []
        let isNoMore = NUMBER_EMPTY_GROUP_FILES_TO_DETECT_NO_MORE
        while (numberInProof > 0 && isNoMore > 0) {
            array.push(numberInProof--)
            if (array.length < 50 && numberInProof !== 0) {
                continue
            }
            const prms = array.map(n => this.copySentFileConfirmByAuditProof(n, uid))
            const pRes = await Promise.all(prms)
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            const isAllEmpty = pRes.every(p => !p)
            if (isAllEmpty) {
                isNoMore--
            } else {
                isNoMore = NUMBER_EMPTY_GROUP_FILES_TO_DETECT_NO_MORE
            }
            array = []
        }

    }

    deleteFilesAuditConfirmed = async () => {
        let numberInProof = +await this.readStoredAuditProofNumber()
        const numberToWrite = numberInProof
        numberInProof--
        if (numberInProof < 0) {
            numberInProof = 0
        }
        const uid = TaxPayer.UID
        if (!numberInProof || !uid) {
            return
        }
        await Info.writeLogs(INFO.proofDone, numberToWrite)
        if (Test.isTestNotDeleteAudit) {
            await mkdirSync(this.auditFileSentDeleted())
        }
        let array = []
        let isNoMore = NUMBER_EMPTY_GROUP_FILES_TO_DETECT_NO_MORE
        while (numberInProof > 0 && isNoMore > 0) {
            array.push(numberInProof--)
            if (array.length < 50 && numberInProof !== 0) {
                continue
            }
            const prms = array.map(n => this.deleteFileConfirmByAuditProof(n, uid))
            const pRes = await Promise.all(prms)
            const isAllEmpty = pRes.every(p => !p)
            if (isAllEmpty) {
                isNoMore--
            } else {
                isNoMore = NUMBER_EMPTY_GROUP_FILES_TO_DETECT_NO_MORE
            }
            array = []
        }
    }

    orderFiles = async (sent = false) => {
        const files = await listDirectorySync(sent ? this.auditFileSentParent() : this.auditFileNotSentParent())
        const _files = __orderBy(files.map(f => {
            const order = this.numberOfFileByName(f)
            if (!order) {
                return false
            }
            return {
                name: f,
                order
            }
        })
            .filter(x => !!x), 'order')
        return _files
    }

    getLastNumberFileAudit = async (sent = false) => {
        const files = await this.orderFiles(sent)
        if (files.length === 0) {
            return 0
        }
        return files[files.length - 1].order
    }

    getLastNumberFileAuditSent = async () => Info.getLastNumberSendAudit()

    filterFilesAudit = async (sent = false) => {
        const f = await this.orderFiles(sent)
        return f.map(x => (x as any).name)
    }

    /** we read all but try to send 100 at most in one crone */
    listFilesAudit = async () => this.filterFilesAudit()

    listFilesAuditSent = async () => this.filterFilesAudit(true)

    createFoldersAuditPackage = async (uid: string) => {
        await mkdirSync(this.auditFileNotSentParent(uid))
        await mkdirSync(this.auditFileSentParent(uid))
    }

    movePackageToSent = async (file: string) => {
        /**
         * in last we have to delete file
         * now just save for security issues
         */
        const _parentPath = this.auditFileNotSentParent()
        const _parentSent = this.auditFileSentParent()
        if (!await existsFileSync(_parentSent)) {
            await mkdirSync(_parentSent)
        }
        const _srcP = `${_parentPath}/${file}`
        const _dstP = `${_parentSent}/${file}`
        return renameSync(_srcP, _dstP)
    }

    sendAuditPackage = async (auditPackage: TAuditPackage, file: string) => {
        await CriticalError.clearError(EXCEPTIONS.audit_command_failed_2180)
        const data = await TaxCoreApi.requestByMethod(SUF_ESDC_AUDIT_URL, 'POST', auditPackage)

        switch (data.status) {
            case AuditPackageStatus.INVOICE_IS_VERIFIED:
                await this.movePackageToSent(file)
                await Info.writeLogs(INFO.auditSent, this.numberOfFileByName(file))
                break
            default:
                CriticalError.writeLogsSync(EXCEPTIONS.audit_command_failed_2180)
                ErrorLog.writeLogsSync(EXCEPTIONS.audit_command_failed_2180, data)
                break
        }
        return data

    }

    lastNumberForProof = async () => {
        const lastSent = await this.getLastNumberFileAuditSent()
        const lastNotSent = await this.getLastNumberFileAudit()
        if (lastNotSent !== 0 && lastNotSent < lastSent) {
            return 0
        }
        const res = Math.max(lastNotSent, lastSent)
        return res
    }

    writeFileAuditProfPoint = async (lastFileNumber: number, packageObj: any) => {
        const file = this.fileStorage
        await file.write({
            uid: TaxPayer.UID,
            invoice: lastFileNumber,
            time: (new Date()).toLocaleString(),
            ...__pick(packageObj, ['sum', 'limit'])
        })
    }

    get fileStorage () {
        return new File(SYSTEM, [TaxPayer.UID, '.prf'].join(''), true)
    }

    readObjectAuditProofPoint = async (): Promise<Record<string, any>> => {
        try {
            const file = this.fileStorage
            const obj = await file.read()
            if (!obj || obj.uid !== TaxPayer.UID) {
                return {}
            }
            return obj

        } catch (e) {
            return {}
        }
    }

    readStoredAuditProofNumber = async (): Promise<number> => {
        try {
            const obj = await this.readObjectAuditProofPoint()
            return (obj as any)?.invoice || 0
        } catch (e) {
            return 0
        }
    }

    readAuditProof = async () => {
        const { buffer } = await SecureElement.startAudit() as any
        const auditRequestBytes = bufferCopyData(buffer, 4, buffer.length - 6)
        const auditRequestPayload = auditRequestBytes.toString('base64')
        const { totalAmount, maxLimit } = await SecureElement.amountStatus() as any
        const payloadPackage = {
            auditRequestPayload,
            sum: totalAmount,
            limit: maxLimit
        } as TAuditPayload

        return payloadPackage
    }

    readAuditProofLocalStorage = async () => {
        const { buffer } = await SecureElement.startAudit() as any
        return bufferCopyData(buffer, 4, buffer.length - 6)
    }

    sendAuditProof = async () => {
        try {
            const lastNumber = await this.lastNumberForProof()
            const payloadPackage = await this.readAuditProof()
            const response = await TaxCoreApi.requestByMethodFullResponse(SUF_ESDC_AUDIT_PROF_URL, 'POST', payloadPackage)
            const { status } = response as any
            Logger.log(`send audit sent  ${status} `)
            if (status === 200) {
                await this.writeFileAuditProfPoint(lastNumber, payloadPackage)
                await Info.writeLogs(INFO.proofStart, lastNumber)
            }
        } catch (e) {
            throwLPFRErrorObj(EXCEPTIONS.audit_proof_command_failed_2180)
        }
    }

}

const instance = new TaxCoreAuditPackage()
export default instance
