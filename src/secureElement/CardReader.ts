import Logger from '../logger'
import { guid } from '../utils'
import {
    throwLPFRErrorObj,
    throwLPFRErrorWithData
} from '../exception'
import { EXCEPTIONS } from '../exception/d'
import CriticalError from '../crtiticalError/CriticalError'

import {
    CommandApdu,
    Iso7816Application
} from '../smartcardHwt'
import {
    cronJobCheckCheckCardInit,
    cronJobCheckCheckCardInitOnce
} from '../cron'
import CardReaderAbsolute from './CardReaderAbsolute'

class CardReader extends CardReaderAbsolute {

    constructor (device: any) {
        super(device)
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
    async doCommand (command: CommandApdu)  {
        try {
            if (!this.isInWorkingCondition) {
                throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
            }
            await CriticalError.clearError(EXCEPTIONS.secureElem_2110_cardLocked)
            const application = new Iso7816Application(this.device?.card)
            const result = await application.issueCommand(command)
            const status = result.data.substr(result.data.length - 4, result.data.length)
            if (status !== '9000') {
                Logger.logCardCommandStatus(status)
                throwLPFRErrorWithData(EXCEPTIONS.secureElem_failed_2150, CardReaderAbsolute.mapStatus(status))
            }
            return result
        } catch (error) {
            Logger.logCardCommandError(error)
            throw error
        }
    }

}

export default CardReader
