import {
    LPFRErrorName,
    LPFRModelError
} from './index'
import { __pick } from "../lodashLocal";

export const processErrors = (error) => {
    if (error.name === LPFRErrorName) {
        return {
            message: 'Error',
            modelState: [
                {
                    property: error.section,
                    errors: [...error.lpfrError]
                }
            ]
        }
    }

    if (error.name === LPFRModelError) {
        return { ...__pick(error, ['message','modelState']) }
    }

    return {
        message: 'Error',
    }
}
