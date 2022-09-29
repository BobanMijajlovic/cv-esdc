import { ROOT_DATA } from '../constant'
import {
    existsFileSync,
    unlinkSync
} from '../files'

class System {

    constructor () {
        this.init().then()
    }

    init = async () => {
        const isShutDown = await existsFileSync(this.shutDownFile)
        if (isShutDown) {
            await unlinkSync(this.shutDownFile)
        }
    }

    get shutDownFile () {
        return `${ROOT_DATA}/exit.exit`
    }

    checkShutDown = async () => {
        const isShutDown = await existsFileSync(this.shutDownFile)
        if (!isShutDown) {
            return
        }
        await unlinkSync(this.shutDownFile)
        process.exit(0)
    }

}

const instance = new System()
export default instance
