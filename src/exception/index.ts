import {
    EXCEPTIONS_SECTIONS,
    TExceptionObject,
    EXCEPTIONS
} from './d'
import CriticalError from '../crtiticalError/CriticalError'
import ErrorLog from '../logs/ErrorLog'

export const throwLPFRErrorWithData = (errObj: TExceptionObject, error: string | number) => {

    const nn = +error
    switch (nn) {
        case EXCEPTIONS.secureElem_2110_cardLocked.number:
            throwLPFRErrorObj(EXCEPTIONS.secureElem_2110_cardLocked)
            return
        case EXCEPTIONS.secureElem_2100.number:
            throwLPFRErrorObj(EXCEPTIONS.secureElem_2100)
            return
        case EXCEPTIONS.secureElem_2210_seLocked.number:
            throwLPFRErrorObj(EXCEPTIONS.secureElem_2210_seLocked)
            return
        case EXCEPTIONS.secureElem_audit_no_valid_2160.number:
            throwLPFRErrorObj(EXCEPTIONS.secureElem_audit_no_valid_2160)
            return
    }
    if (error) {
        errObj = {
            ...errObj,
            description: error as any
        }
    }
    throwLPFRErrorObj(errObj)
}

export const throwLPFRErrorObj = (object: TExceptionObject) => {
  //* * best for internet unavailable *//
    CriticalError.writeLogsSync(object)
    ErrorLog.writeLogsSync(object)
    throw new LPFRError(object.type, object.number)
}

export const LPFRErrorName = 'ESDCErrorError'
export const LPFRModelError = 'ESDCModelError'

class LPFRError extends Error {
    private section
    private lpfrError: any[]

    constructor (section, error) {
        super(error) // (1)
        this.name = LPFRErrorName
        this.section = section
        this.lpfrError = Array.isArray(error) ? error : [error]
    }
}

export class PropertyError {
    private property: string
    private errors: string[]

    constructor (property) {
        this.property = property
        this.errors = []
    }

    setError = (error: string) => this.errors.push(error)

    get isError () {
        return !!this.errors.length
    }
}

export class ModelErrors extends Error {
    private modelState: PropertyError[]

    constructor (mess) {
        super()
        this.name = LPFRModelError
        this.modelState = []
        this.message = mess
    }

    setError = (error: PropertyError) => this.modelState.push(error)

    isError = () => !!this.modelState.length

}

export const getErrors = () => {
    const excArray = Object.keys(EXCEPTIONS).map(key => EXCEPTIONS[key]) || []
    const mssc = excArray.filter(ex => ex.type === EXCEPTIONS_SECTIONS.LOCAL_ERRORS).map(x => Number(x.number))
    const gsc =  excArray.filter(ex => ex.type !== EXCEPTIONS_SECTIONS.LOCAL_ERRORS).map(x => Number(x.number))
    return {
        mssc: mssc || [],
        gsc: gsc || []
    }
}

export default LPFRError

