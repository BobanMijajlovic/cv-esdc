import axios from 'axios'
import { Buffer } from 'buffer'
import { throwLPFRErrorObj } from '../exception'
import { EXCEPTIONS } from '../exception/d'
import { __isString } from 'lodashLocal'

export enum PortReaderAndroid {
    onSideNG = 1,
    PSAM1NG = 4,
    PSAM2NG = 5,
    PSAMSUNMI = 8

}

class CardSocket {

    portReaderNumber: PortReaderAndroid
    port: string
    hostname: string
    isOpen: boolean
    noCardError: boolean
    lastCommandTime: number

    constructor () {
        this.portReaderNumber = PortReaderAndroid.PSAMSUNMI
        this.port = '1234'
        this.hostname = '89.216.26.6',// '192.168.1.35'
        this.isOpen = false
        this.noCardError = false
        this.lastCommandTime = 0
    }

    private sendData = async (data) => {
        const requestData = {
            method: 'POST',
            url: `http://${this.hostname}:${this.port}`,
            data,
        } as any
        const _data = await axios(requestData)
        if (_data?.data?.status && __isString(_data?.data?.status) && /NO_CARD/i.test(_data?.data?.status)) {
            this.noCardError = true

        }
        return _data
    }

    private openPort = async () => {
        if (this.isOpen) {
            return
        }
        console.log(' OPEN PORT ')
        const data = `ReaderOpenEx 5 0 ${this.portReaderNumber} 0`
        await this.sendData(data)
        this.isOpen = true
        return true
    }

    getToken = async (url: string, path: string, port: string | number, pin: string) => {
        const str = `DL_TLS_Token ${url} ${path} ${port} ${pin}`
        try {
            const data = await this.sendData(str)
            const _data = data.data?.response
            const array = _data.split('\r\n').filter(s => /token/.test(s) && /expires/.test(s))
            if (array.length === 1) {
                return JSON.parse(array[0])
            }
        } catch (e) { /** */ }
        throwLPFRErrorObj(EXCEPTIONS.infoErrors_0220_internetUnavailable)
    }

    _issueCommand = async (command: any) => {
        try {
            await this.openPort()
            const time = new Date().getTime()
            const diff = time - this.lastCommandTime
            if (diff < 1000) {
                const tt = diff < 10 ? 10 : diff
                await new Promise(resolve => setTimeout(resolve, tt))
            }
            const data = Buffer.from(command.bytes).toString('hex')
            const dataString = `APDU ${data}`
            const _data = await this.sendData(dataString)
            this.lastCommandTime = time
            return {
                buffer: Buffer.from(_data?.data?.response || '', 'hex'),
                data: _data?.data?.response
            }
        } catch (e) {
            console.log(e)
        }
    }

    isCommandAllowedToBeRepeated = (command: any) => {
        if (command.bytes) {
            if (command.bytes?.[0] ===  0x88 && command.bytes?.[1] ===  0x13) {
                return false
            }
        }
        return true
    }

    issueCommand = async (command: any) => {

        let data = await this._issueCommand(command)
        if (this.noCardError && this.isCommandAllowedToBeRepeated(command)) {
            console.log('execute no card error')
            this.noCardError = false
            this.isOpen = false
            data = await this._issueCommand(command)
        }
        return data

    }
}

const instance = new CardSocket()
export default instance
