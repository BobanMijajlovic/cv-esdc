type TSemaphoreClient<T = any> = {
    resolve: (value: T | PromiseLike<T>)=> void,
    time: number
}

const DIFF = 1000 * 60

class Semaphore {

    locked: boolean
    processes: TSemaphoreClient[]

    constructor () {
        this.locked = false
        this.processes = []
    }

    lock = async () => {
        if (!this.locked) {
            this.locked = true
            return true
        }
        return new Promise(resolve => {
            const obj = {
                time: (new Date()).getTime(),
                resolve: resolve
            }
            this.processes.push(obj)
        })
    }

    checkLockedBlock = () => {
        if (!this.processes.length) {
            return
        }
        let obj = this.processes[0]
        const time = (new Date()).getTime()
        const diff = time - obj.time
        if (diff < DIFF) {
            return
        }
        this.locked = true
        obj = this.processes.shift()
        obj.resolve(true)

    }

    unlock = () => {
        this.locked = false
        if (!this.processes.length) {
            return
        }
        const obj = this.processes.shift()
        this.locked = true
        obj.resolve(true)
    }

}

const instance = new Semaphore()
export default instance
