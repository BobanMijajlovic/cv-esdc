import express, {
    NextFunction,
    Request,
    Response
} from 'express'
import {
    __isString,
    __omit
} from '../lodashLocal'
import { throwLPFRErrorObj } from '../exception'
import { EXCEPTIONS } from '../exception/d'
import SecureElement from '../secureElement/SecureElement'
import bodyParser from 'body-parser'
import { createStatus } from '../routes/helper'
import Semaphore from '../semaphore'
import TaxCoreApi from '../taxCoreApi'
import { validateReceipt } from '../validation'
import TaxCoreCommands from '../taxCoreCommands'
import TaxCoreAuditPackage from '../taxCoreAuditPackage'
import TaxCoreLastInvoice from '../taxCoreLastInvoice'
import TaxCoreExternalStorageSync from '../taxCoreExternalStorageSynch'
import {
    DEFAULT_REQUEST_ID,
    ROOT_DATA,
    NTP_CRON__MIN_TIME_CRITIC_ERROR,
    NTP_CRON__NEXT_TIME_ALLOWED,
    CRON_JOB_REQ,
    LAST_RECEIPT_ALLOWED_TIME_INCONSISTENCY,
    LICENSE_NUMBER_RECEIPT,
    ONE_MIN
} from '../constant'
import {
    listDirectorySync,
    existsFileSync,
    isPathDirectory,
    readFileSync,
    resolvePath
} from '../files'
import { fiscalizationOfInvoice } from '../fiscal'
import CriticalError from '../crtiticalError/CriticalError'
import ErrorLog from '../logs/ErrorLog'
import Configuration from '../configuration/Configuration'
import Info, { INFO } from '../info/Info'
//import Sntp from '@hapi/sntp'
import TaxPayer from '../secureElement/TaxPayer'
import License from '../license'
import {
    cronJobCheckCheckOverFlowLimit,
    cronJobCheckCheckCardInitOnce
} from '../cron'
import Logger from '../logger'

const router = express.Router()

const enum STATUS_TYPES {
    critic = 'critic',
    error = 'error',
    settings = 'settings',
    status = 'status',
    info = 'info',
    license = 'license',
    payer = 'payer'
}

export const verifyPin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let pin = req.body || ''
        if (!__isString(pin)) {
            throwLPFRErrorObj(EXCEPTIONS.secureElem_2100)
        }
        pin = pin.replace(/[^0-9]/g, '')
        if (pin.length !== 4) {
            throwLPFRErrorObj(EXCEPTIONS.secureElem_2100)
        }
        await Semaphore.lock()
        await SecureElement.checkPin(pin)
        Semaphore.unlock()
        await Info.firstLog()
        res.status(200)
            .send('0100')
    } catch (e) {
        await Semaphore.unlock()
        const err = e.lpfrError?.[0] || 2110
        res.status(423)
            .send(`${err}`)
    }
}

const checkToken = async () => {
    SecureElement.checkIsWorkingCertificateGotThrowException()
    if (!TaxCoreApi.token) {
        await Semaphore.lock()
        try {
            await CriticalError.clearError(EXCEPTIONS.infoErrors_0220_internetUnavailable)
            await TaxCoreApi.getToken()
            if (!TaxCoreApi.token) {
                throwLPFRErrorObj(EXCEPTIONS.infoErrors_0220_internetUnavailable)
            }
            Semaphore.unlock()
        } catch (e) {
            Semaphore.unlock()
            throw e
        }
    }
}

const getStatusFromCardSemaphores = async () => {
    try {
        await Semaphore.lock()
        const status = await createStatus()
        Semaphore.unlock()
        return status
    } catch (e) {
        Semaphore.unlock()
        throw e
    }
}

/** "Uraiditi ovo sa semaforima"   commande prema cartici */
export const notifyStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        SecureElement.checkIsWorkingCertificateGotThrowException()
        await checkToken()
        const isExistsFirst = await TaxCoreCommands.isCommandsExists()
        const commands = await TaxCoreCommands.fetchCommands(isExistsFirst)
        await TaxCoreCommands.processCommandsUseSemaphores(commands)

        const reqN = req.params?.requestId
        if (reqN === CRON_JOB_REQ) {
            return res.status(200).send()
        }

        const status = await getStatusFromCardSemaphores()
        res.status(200)
            .json(status)
    } catch (e) {
        next(e)
    }
}

export const setSettings = async (req: Request, res: Response, next: NextFunction) => {

    const data = req.body || {}
    const isRestart = !!data?.restart
    await Configuration.newSettings(__omit(data, 'restart'))
    const _dd = await Configuration.currentSettings
    if (isRestart) {
        setTimeout(() => {
      global.MONITOR?.restart()
        }, 250)
    }
    return res.status(200).json(_dd)

}

export const getStatus = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const type = req.params?.type
        switch (type) {
            default:
                break

            case STATUS_TYPES.info: {
                SecureElement.checkIsWorkingCertificateGotThrowException(false)
                const ress = await Info.readLogs()
                return res.status(200)
                    .json(ress)
            }

            case STATUS_TYPES.license: {
                SecureElement.checkIsWorkingCertificateGotThrowException(false)
                await License.init()
                return res.status(200).json(License.LICENSES)
            }

            case STATUS_TYPES.payer: {
                SecureElement.checkIsWorkingCertificateGotThrowException(false)
                return res.status(200).json(TaxPayer.dataSettings)

            }

            case STATUS_TYPES.critic:
            case STATUS_TYPES.error:
                await getErrors(req, res, next)
                return

            case STATUS_TYPES.settings: {
                const _dd = await Configuration.currentSettings
                return res.status(200).json(_dd)
            }

        }

        if (!SecureElement.isInWorkingCondition) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }

        const status = await getStatusFromCardSemaphores()
        res.status(200)
            .json(status)
    } catch (e) {
        next(e)
    }
}

const checkIsDirectory = async (parent, path) => {
    const isDirectory = await isPathDirectory(`${parent}/${path}`)
    return {
        path,
        isDirectory
    }
}

export const getEnvironmentParameters = async (req: Request, res: Response, next: NextFunction) => {

    try {
        let environment = await TaxCoreCommands.getTaxCoreConfig()
        if (!SecureElement.isInWorkingCondition) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }

        environment = {
            ...environment,
            supportedLanguages: [
                'sr-Cyrl-RS'
            ]
        }

        res.status(200)
            .json(environment)
    } catch (e) {
        next(e)
    }
}

export const checkProcessSemaphore = async (req: Request, res: Response, next: NextFunction) => {
    Semaphore.checkLockedBlock()
    res.status(200)
}

const getTimeFromPref = async (type: INFO) => {
    const lastTime = await Info.getLastTime(type)
    if (!lastTime) {
        return 0
    }
    const tt = (new Date()).getTime()
    const diff = tt - lastTime
    return diff
}

const _sendAuditsFiles = async () => {
    const files = await TaxCoreAuditPackage.listFilesAudit()
    if (files.length === 0) {
        return 0
    }
    await checkToken()
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const data = await TaxCoreAuditPackage.readFileAudit(file)
        const _data = await TaxCoreAuditPackage.sendAuditPackage(data, file)
        if (_data?.commands?.length) {
            await TaxCoreCommands.processCommandsUseSemaphores(_data?.commands)
        }
    }

    return files.length
}

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        SecureElement.checkIsWorkingCertificateGotThrowException()

        const lastTime = await getTimeFromPref(INFO.lastReceipt)
        if (lastTime < LAST_RECEIPT_ALLOWED_TIME_INCONSISTENCY) {
            throwLPFRErrorObj(EXCEPTIONS.localError_90200_prev_Receipt_Time)
        }

        const dataReceipt = await validateReceipt(req.body)

        if (!License.isVALIDLicense) {
            const lastReceipt = await Info.getLastNumberReceipt() || 0
            if (lastReceipt > LICENSE_NUMBER_RECEIPT) {
                throwLPFRErrorObj(EXCEPTIONS.localError_90300_not_valid_license)
            }
        }

        await Semaphore.lock()
        const data = await fiscalizationOfInvoice(dataReceipt, req.get('RequestId'))
        await SecureElement.amountStatus()
        Semaphore.unlock()
        res.status(200)
            .json(data)
    } catch (e) {
        next(e)
        Semaphore.unlock()
    }
}

export const sendAudits = async (req: Request, res: Response, next: NextFunction) => {
    try {

        SecureElement.checkIsWorkingCertificateGotThrowException(false)

        const reqN = req.params?.requestId
        if (reqN === CRON_JOB_REQ) {
            const diff = await getTimeFromPref(INFO.auditSent)
            if (diff < Configuration.timeAllowToAuditSend) {
                return res.status(200)
                    .send()
            }
        }

        await _sendAuditsFiles()
        await getStatusFromCardSemaphores()
        res.status(200)
            .send()

    } catch (e) {
        next(e)

    }
}

const sendAuditProofSemaphore = async () => {

    await checkToken()

    try {
        await Semaphore.lock()
        await TaxCoreAuditPackage.sendAuditProof()
    } finally {
        Semaphore.unlock()
    }
}

export const checkCardOverflowLimit = async (req: Request, res: Response, next: NextFunction) => {

    try {

        const reqN = req.params?.requestId
        if (reqN !== CRON_JOB_REQ) {
            return res.status(200).send()
        }
        Logger.log('request by CRON')
        SecureElement.checkIsWorkingCertificateGotThrowException(true)

        let limits = await Info.getCardLimits()
        if (!limits?.data?.maxLimit || isNaN(Number(limits?.data?.maxLimit)) || isNaN(Number(limits?.data?.totalAmount))) {
            Logger.log('new Status by VRONE')
            await getStatusFromCardSemaphores()
            limits = await Info.getCardLimits()
            if (!limits?.data?.maxLimit || isNaN(Number(limits?.data?.maxLimit)) || isNaN(Number(limits?.data?.totalAmount))) {
                return res.status(200).send()
            }
        }

        const isOverflow = limits.data.maxLimit <= limits.data.totalAmount
        Logger.log(`isOverFlow: ', ${isOverflow}, ${limits}`)
        if (!isOverflow) {
      // stop the job
            cronJobCheckCheckOverFlowLimit.stop()
            return res.status(200)
                .send()
        }

        let timeProofStart = await Info.getLastTime(INFO.proofStart)
        const timeProofDone = await Info.getLastTime(INFO.proofDone)

        if (timeProofDone && timeProofStart && timeProofDone > timeProofStart) {
            timeProofStart = null
        }

        const currentTime = (new Date()).getTime()

        if (!timeProofStart || ((currentTime - timeProofStart) > 6 * ONE_MIN)) {
            Logger.log('time proof need to be send')
            await sendAuditProofSemaphore()
            await _sendAuditsFiles()
            return res.status(200)
                .send()
        }

        const sentFiles = await _sendAuditsFiles()
        if (sentFiles) {
            await getStatusFromCardSemaphores()
            return res.status(200)
                .send()
        }

        const uid = TaxPayer.UID
        let lastSent = await Info.getLastNumberByType(INFO.auditSent)
        if (!lastSent || !await existsFileSync(TaxCoreAuditPackage.pathFileSendAuditByNumber(lastSent, uid))) {
            if (!uid) {
                return res.status(200)
                    .send()
            }
            Logger.log('FILE for send not found')
            for (let i = 2000000; i > 0; i--) {
                const file = TaxCoreAuditPackage.pathFileSendAuditByNumber(i, uid)
                if (!await existsFileSync(file)) {
                    continue
                }
                await Info.writeLogs(INFO.auditSent, i)
                break
            }
            lastSent = await Info.getLastNumberByType(INFO.auditSent)
        }
        const filePath = TaxCoreAuditPackage.pathFileSendAuditByNumber(lastSent, uid)
        const isExists = await existsFileSync(filePath)
        Logger.log(`FILE for send, ${lastSent}, ${isExists}`)
        if (isExists) {
            for (let i = 0; i < 10; i++) {
                const file = `${uid}-${uid}-${lastSent}.json`
                await TaxCoreAuditPackage.fileBackFromSent(file, uid)
                const data = await TaxCoreAuditPackage.readFileAudit(file)
                const _data = await TaxCoreAuditPackage.sendAuditPackage(data, file)
                if (_data?.commands?.length) {
                    await TaxCoreCommands.processCommandsUseSemaphores(_data?.commands)
                    await getStatusFromCardSemaphores()
                    limits = await Info.getCardLimits()
                    const isOverflow = limits.data.maxLimit <= limits.data.totalAmount
                    if (!isOverflow) {
                        break
                    }
                }
            }
        }

        res.status(200)
            .send()

    } catch (e) {
        res.status(400).send()
    }
}

export const sendAuditsProof = async (req: Request, res: Response, next: NextFunction) => {

    try {

        SecureElement.checkIsWorkingCertificateGotThrowException()
        const reqN = req.params?.requestId
        const isNeedToSend = await TaxCoreAuditPackage.isNeedToProof()

        if (!isNeedToSend) {
            return res.status(400)
                .send('')
        }
        if (reqN === CRON_JOB_REQ) {
            const diff = await getTimeFromPref(INFO.proofStart)

            if (diff < Configuration.timeAllowToProofSend) {
                return res.status(200)
                    .send()
            }
        }
        await sendAuditProofSemaphore()
        res.status(200)
            .send()

    } catch (e) {
        Semaphore.unlock()
        next(e)

    }
}

export const attention = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestId = req.params?.requestId
        if (requestId) {
            return res.status(200).json({
                tax: TaxPayer.UID || '',
                isPin: !SecureElement.isPinRequired
            })
        }
        res.status(200)
            .send()
    } catch (e) {
        next(e)
    }
}

export const getLastInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestId = req.params?.requestId || DEFAULT_REQUEST_ID
        SecureElement.checkIsWorkingCertificateGotThrowException(false)
        const invoice = await TaxCoreLastInvoice.readFile(requestId)
        res.status(200)
            .json(invoice)
    } catch (e) {
        next(e)
    }
}

export const listSystemDirectory = async (req: Request, res: Response, next: NextFunction) => {
    const _path = (req.path || '').replace(/^\/get-system-directory-data\//, '')
    const __path = !_path ? ROOT_DATA : `${ROOT_DATA}/${_path}`
    try {
        const path1 = resolvePath(__path)
        const path2 = resolvePath(ROOT_DATA)

        if (!path1.startsWith(path2)) {
            throwLPFRErrorObj(EXCEPTIONS.localError_80300_pathIsNotValid)
        }

        const isFileExists = await existsFileSync(__path)
        if (!isFileExists) {
            throwLPFRErrorObj(EXCEPTIONS.localError_80300_pathIsNotValid)
        }

        if (!await isPathDirectory(__path)) {
            const data = await readFileSync(__path)
            return res.status(200)
                .send(data)
        }

        const dirFiles = await listDirectorySync(__path)
        const data = await Promise.all(dirFiles.map(x => checkIsDirectory(__path, x)))

        return res.status(200)
            .send(data)

    } catch (e) {
        next(e)
    }
}

export const usbSyncFiles = async (req: Request, res: Response, next: NextFunction) => {

    const _path = req.body?.path

    try {
        await TaxCoreExternalStorageSync.executeCommandFileUSB(_path)
    } catch (e) {
        next(e)
        return
    }

    try {
        await Semaphore.lock()
        await TaxCoreExternalStorageSync.copyAuditArpFileUSB(_path)
        Semaphore.unlock()
    } catch (e) {
        Semaphore.unlock()
        next(e)
        return
    }

    try {
        await TaxCoreExternalStorageSync.copyAuditFilesUSB(_path)
    } catch (e) {
        next(e)
        return
    }

    res.status(200)
        .send('OK')

}

export const getLastAuditInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
        SecureElement.checkIsWorkingCertificateGotThrowException(false)
        const data = await TaxCoreAuditPackage.readObjectAuditProofPoint()
        res.status(200)
            .json(data)
    } catch (e) {
        next(e)
    }
}

export const getErrors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.params?.type
        SecureElement.checkIsWorkingCertificateGotThrowException(false)

        if (type === 'critic') {
            let critic = await CriticalError.readLogs()
            const isConfig = await TaxCoreCommands.isValidCommandsStored()
            if (!SecureElement.isInWorkingCondition) {
                critic = [
                    ...critic,
                    {
                        error: EXCEPTIONS.warningError_1300_smartCardNotPresent
                    }
                ]
            }

            if (SecureElement.isPinRequired) {
                critic = [
                    ...critic,
                    {
                        error: EXCEPTIONS.warningError_1500_pinCodeReq,
                    }
                ]
            }

            if (!isConfig) {
                critic = [
                    ...critic,
                    {
                        error: EXCEPTIONS.secureElem_2400_notConfig,
                    }
                ]
            }

            res.status(200)
                .json({
                    critic
                })
            return
        }

        let errors = await ErrorLog.readLogs()
        errors = errors?.reverse() || []
        res.status(200)
            .json({
                errors
            })

    } catch (e) {
        next(e)
    }
}

const checkNtp = async (req: Request, res: Response, next: NextFunction) => {

/*    SecureElement.checkIsWorkingCertificateGotThrowException(false)

    const timeCheck = async function() {
        try {

            const ntp = await TaxCoreCommands.getValidNTP()
            if (!ntp) {
                return
            }
            const options = {
                host: ntp, // Defaults to pool.ntp.org
                port: 123,                      // Defaults to 123 (NTP)
                resolveReference: true,         // Default to false (not resolving)
                timeout: 1000                   // Defaults to zero (no timeout)
            }

            const wasError = await CriticalError.getErrorNtp()

            if (!wasError) {
                const reqN = req.params?.requestId
                if (reqN === CRON_JOB_REQ) {
                    const diff = await getTimeFromPref(INFO.ntpDiff) || 0
                    if (diff < NTP_CRON__NEXT_TIME_ALLOWED) {
                        return
                    }
                }
            }

            const time = await Sntp.time(options)
            const difference = Math.floor(Math.abs(time.originateTimestamp - time.receiveTimestamp))
            if (difference < NTP_CRON__MIN_TIME_CRITIC_ERROR) {
                await CriticalError.clearError(EXCEPTIONS.localError_90100_ntpFailedTimeDiff)
                await Info.writeLogs(INFO.ntpDiff, difference)
                return difference
            }

            await CriticalError.writeLogs(EXCEPTIONS.localError_90100_ntpFailedTimeDiff)
            await Info.writeLogs(INFO.ntpDiff, difference)
            return difference

        } catch (err) { /!**   *!/ }
        return null
    }

    await timeCheck()
    */
    res.status(200).send()
}

export const initCardCheckReader = async (req: Request, res: Response, next: NextFunction) => {
    try {
        cronJobCheckCheckCardInitOnce.stop()
        const reqN = req.params?.requestId
        if (reqN !== CRON_JOB_REQ) {
            return res.status(200).send()
        }
        await SecureElement.tryToInitCert()
        res.status(200).send()
    } catch (e) {
        next(e)
    }
}

export const cardReadersStatus = async (req: Request, res: Response, next: NextFunction) => {

    const cardReaders = SecureElement.CardReaders.map(c => ({
        guid: c.guid,
        uid: c.UID,
        name: c.Name,
        selected: !!c.isSelected
    }))
    res.status(200).json(cardReaders)
}

/* export const setActiveExternalCardReader = async (req: Request, res: Response, next: NextFunction) => {
    const guid = req.body?.guid
    try {
        await Semaphore.lock()
        const result = SecureElement.setExternal(guid || '')
        return res.status(result ? 200 : 400).send('')
    } catch (e) {
        next(e)
    } finally {
        Semaphore.unlock()
    }
}*/

router.post('/pin', bodyParser.text({ type: '*/*' }), verifyPin)
router.get('/status/:type?', bodyParser.json({ type: '*/*' }), getStatus)
router.post('/status/settings', bodyParser.json({ type: '*/*' }), setSettings)
router.get('/environment-parameters', bodyParser.json({ type: '*/*' }), getEnvironmentParameters)
router.get('/notify-status/:requestId?', bodyParser.json({ type: '*/*' }), notifyStatus)
router.get('/check-semaphore', checkProcessSemaphore)
router.post('/invoices', bodyParser.json({ type: '*/*' }), createInvoice)
router.get('/invoices/:requestId?', getLastInvoice)
router.put('/audits-send/:requestId?', sendAudits)
router.put('/audits-send-proof/:requestId?', sendAuditsProof)
router.get('/audits-last-proof', getLastAuditInfo)
router.get('/attention/:requestId?', attention)
router.get('/check-card-overflow/:requestId?', checkCardOverflowLimit)
router.get('/ntp-status/:requestId?', checkNtp)
router.get('/card-readers-status', bodyParser.json({ type: '*/*' }), cardReadersStatus)
// router.post('/card-readers-status', bodyParser.json({ type: '*/*' }), setActiveExternalCardReader)
router.get('/init-card-reader-cron-check/:requestId?', initCardCheckReader)
router.post('/usb-sync-files', bodyParser.json({ type: '*/*' }), usbSyncFiles)
router.get(/^\/get-system-directory-data\/.*$/i, listSystemDirectory)

export default router

