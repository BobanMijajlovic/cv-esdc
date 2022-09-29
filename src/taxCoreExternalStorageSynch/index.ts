import SecureElement from '../secureElement/SecureElement'
import {
    existsFileSync,
    fileWriteWithData,
    readFileSync,
    unlinkSync,
    mkdirSync,
    copyFileDeleteIfPathExists
} from '../files'
import { throwLPFRErrorObj } from '../exception'
import { EXCEPTIONS } from '../exception/d'
import TaxCoreAuditPackage from '../taxCoreAuditPackage'
import TaxPayer from '../secureElement/TaxPayer'
import TaxCoreCommands from '../taxCoreCommands'
import {
    __pick,
    __isString,
    __isInteger
} from '../lodashLocal'
import { CommandsType } from '../taxCoreApi/d'
import Info, { INFO } from '../info/Info'
import { TAuditPayload } from '../taxCoreAuditPackage/d'

class TaxCoreExternalStorageSynch {

    checkUSBPermissionPath = async (path: string) => {
        SecureElement.checkIsWorkingCertificateGotThrowException(true)
        if (!TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        if (!await existsFileSync(path)) {
            throwLPFRErrorObj(EXCEPTIONS.localError_80300_pathIsNotValid)
        }
        const parentPackage = [path, TaxPayer.UID].join('//')
        if (!await existsFileSync(parentPackage)) {
            await mkdirSync(parentPackage)
        }
        return {
            parentPackage,
            commandFile: [parentPackage, `${TaxPayer.UID}.commands`].join('//'),
            commandResult: [parentPackage, `${TaxPayer.UID}.results`].join('//'),
            commandResultName: `${TaxPayer.UID}.results`
        }
    }

    copyAuditArpFileUSB = async (path: string) => {
        const lastNumber = await TaxCoreAuditPackage.lastNumberForProof()
        const { parentPackage } = await this.checkUSBPermissionPath(path)
        const pathOfCommand = [parentPackage, `${TaxPayer.UID}.arp`].join('\\')
        if (await existsFileSync(pathOfCommand)) {
            await unlinkSync(pathOfCommand)
        }
        const auditRequestBytes = await TaxCoreAuditPackage.readAuditProofLocalStorage()

        const auditRequestPayload = auditRequestBytes.toString('base64')
        const { totalAmount, maxLimit } = await SecureElement.amountStatus() as any
        const payloadPackage = {
            auditRequestPayload,
            sum: totalAmount,
            limit: maxLimit
        } as TAuditPayload

        await fileWriteWithData(parentPackage, `${TaxPayer.UID}.arp`, auditRequestBytes)
        await TaxCoreAuditPackage.writeFileAuditProfPoint(lastNumber, payloadPackage)
        await Info.writeLogs(INFO.proofStart, lastNumber)

    }

    _copyOneFile = async (order: number, uid: string, srcRoot: string, destRoot: string) => {
        const f = `${uid}-${uid}-${order}.json`
        const destPath = [destRoot, f].join('//')
        const srcPath = [srcRoot, f].join('//')
        return copyFileDeleteIfPathExists(srcPath, destPath)
    }

    _copyFiles = async (sent: boolean, order: number, destRoot: string) => {
        let array = []
        const uid = TaxPayer.UID
        if (!uid) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        const srcRoot = sent ? TaxCoreAuditPackage.auditFileSentParent(uid) : TaxCoreAuditPackage.auditFileNotSentParent(uid)
        while (order > 0) {
            array.push(order--)
            if (array.length < 50 && order !== 0) {
                continue
            }
            const prms = array.map(n => this._copyOneFile(n, uid, srcRoot, destRoot))
            await Promise.all(prms)
            array = []
        }
    }

    copyAuditFilesUSB = async (path: string) => {
        const { parentPackage } = await this.checkUSBPermissionPath(path)
        const number = (+await Info.getLastNumberReceipt() || 2000000) + 10
        await this._copyFiles(false, number, parentPackage)
        await this._copyFiles(true, number, parentPackage)
    }

    executeCommandFileUSB = async (_path) => {
        const { commandFile, commandResult, commandResultName,parentPackage } = await this.checkUSBPermissionPath(_path)

        if (!await existsFileSync(commandFile)) {
            return
        }

        let prevResults = []
        const pathRes = `${parentPackage}/${commandResultName}`
        if (await existsFileSync(pathRes)) {
            try {
                const _resultData = await readFileSync(pathRes)
                prevResults = JSON.parse(_resultData)
            } catch (e) {  /** */ }
        }

        const data = await readFileSync(commandFile)
        let array = JSON.parse(data)
        if (!Array.isArray(array)) {
            return
        }

        const fields = ['commandId', 'type', 'payload', 'uid']
        array = array.map(p => __pick(p, fields))
            .filter(x => Object.keys(x).length === 4)
        array = array.filter(x => {
            if (!__isString(x.commandId) || !__isString(x.payload) || !__isString(x.uid)) {
                return false
            }
            if (x.uid.toUpperCase() !== TaxPayer.UID.toUpperCase()) {
                return false
            }
            if (!__isInteger(x.type) || !Object.values(CommandsType).includes(x.type)) {
                return false
            }
            return !prevResults.find(cx => cx.commandId === x.commandId)
        })

        if (!array.length) {
            return
        }

        if (await existsFileSync(commandResult)) {
            await unlinkSync(commandResult)
        }

        let commandsExecuted = await TaxCoreCommands.processCommandsUseSemaphores(array, false, true)
        commandsExecuted = commandsExecuted.map(x => __pick(x, ['commandId', 'success', 'dateAndTime']))
        await fileWriteWithData(parentPackage, commandResultName, JSON.stringify(commandsExecuted))
    }

}

const instance = new TaxCoreExternalStorageSynch()
export default instance
