import CardReader from '../secureElement/CardReader'
import Configuration from '../configuration/Configuration'

class Logger {

    constructor () {

    }

    get logg () {
        return Configuration.isLogOut
    }

    log (value: string) {
        if (!this.logg) {
            return
        }
        console.log('--- ', value)
    }

    logSection (section, value) {
        if (!this.logg) {
            return
        }
        console.log('*** ', section.toUpperCase(), ' : ', value)
    }

    logTaxRequest (data) {
        if (!this.logg) {
            return
        }
        console.log('*** ', 'taxCoreApi - send'.toUpperCase(), ' : ', data.method, '  ', data.url, '  ', data.data)
    }

    logTaxResponse (data) {
        if (!this.logg) {
            return
        }
        console.log('*** ', 'taxCoreApi - received'.toUpperCase(), ' : ', data.status, data.data)
    }

    logCardCommandStart (data: string) {
        if (!this.logg) {
            return
        }
        console.log('CARD command :  ', data)
    }

    logCardCommandStatus (data: string) {
        if (!this.logg) {
            return
        }
        console.log('CARD status :  ', data)
    }

    logCardCommandError (data: string) {
        if (!this.logg) {
            return
        }
        console.log('CARD error :  ', data)
    }

    logLimits (limitAudit, limitTotal, total, sum) {
        if (!this.logg) {
            return
        }
        console.log('Audits Limit [lim.A, lim.T, tot, sum] : ', limitAudit, limitTotal, total, sum)
    }

    logReader (message, reader: CardReader) {
        if (!this.logg) {
            return
        }
        console.log(`Reader: ${message}  ${reader.guid} - ${reader.UID} -  ${reader.Device?.name}`)
    }

}

const logger = new Logger()
export default logger
