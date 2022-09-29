import CardReader from './CardReader'

import { Devices } from '../smartcardHwt'
import { cronJobCheckCheckCardInit } from '../cron'
import Logger from '../logger'
import TaxCoreAudit from '../taxCoreAuditPackage'
import { SOCKET_CARD_VERSION } from '../constant'
import CardReaderBySocket from '../secureElement/CardReaderBySocket'

class CardReaders {
    readers: CardReader[]
    monitorCardReaders: any

    constructor () {
        this.readers = []
        this.monitorCardReaders = null

    }

    get systemReaders () {
        return [...this.readers]
    }

    get activeReader () {
        if (!this.readers.length) {
            return null
        }

        const cWorking = this.readers.filter(c => c.isSelectedInitiated)
        if (cWorking.length === 1) {
            return cWorking[0]
        }
        return null
    }

  /** should be called by cron job */
    initCardsFirstTime = async () => {
        if (!this.readers.length) {
            cronJobCheckCheckCardInit.stop()
            return
        }
        const prms = this.readers.map(c => c.initCardFirstTime())
        await Promise.all(prms)

        const workingReaders = this.readers.filter(c => !!c.taxPayer)

        if (!workingReaders.length) {
            return
        }

        Logger.log(`workingReaders  ${workingReaders.length}`)
        if (workingReaders.length > 1) {
            this.readers.forEach(cc => cc.setSelected(false))
            return
        }

        const wC = workingReaders[0]
        if (wC.isSelected) {
            cronJobCheckCheckCardInit.stop()
            return
        }
        const uid = wC.UID
        if (!uid) {
            return
        }
        wC.setSelected(true)
        Logger.logReader('SELECT', wC)
        await TaxCoreAudit.createFoldersAuditPackage(uid)
        cronJobCheckCheckCardInit.stop()
    }

    init = () => {

        if (SOCKET_CARD_VERSION) {
            this.readers = [new CardReaderBySocket()]
            return
        }

        this.monitorCardReaders = new Devices()
        this.monitorCardReaders.on('device-activated', (__data: any) => {
            const { device } = __data
            const cc = new CardReader(device)
            this.readers = [...this.readers, cc]
            cronJobCheckCheckCardInit.start()
        })

        this.monitorCardReaders.on('device-deactivated', (__data: any) => {
            const { device } = __data
            this.readers = this.readers.filter(d => d.Device !== device)
            cronJobCheckCheckCardInit.start()
        })
    }

}

export default CardReaders
