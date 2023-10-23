import { guid } from '../utils'
import {
    cronJobCheckCheckCardInitOnce,
    cronJobCheckCheckCardInit
} from '../cron'
import {
    throwLPFRErrorObj,
    throwLPFRErrorWithData
} from '../exception'
import { EXCEPTIONS } from '../exception/d'
import CriticalError from '../crtiticalError/CriticalError'
import CardSocket from '../secureElement/CardSocket'
import Logger from '../logger'
import { CommandApdu } from '../smartcardHwt'
import CardReaderAbsolute from './CardReaderAbsolute'

const defaultDevice = {
    name: 'Custom Reader 1234',
    card: {
        attr: guid()
    }
}

class CardReaderBySocket extends CardReaderAbsolute {

    constructor (device: any = defaultDevice) {
        super(device)
    }

    on () {
        this.guid = guid()
        cronJobCheckCheckCardInitOnce.start()
        cronJobCheckCheckCardInit.start()
    }

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
    async doCommand (command: CommandApdu) {
        try {
            if (!this.isInWorkingCondition) {
                throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
            }
            await CriticalError.clearError(EXCEPTIONS.secureElem_2110_cardLocked)
            const result = await CardSocket.issueCommand(command)
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

export default CardReaderBySocket
