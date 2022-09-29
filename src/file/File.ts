import {
    existsFileSync,
    mkdirSync,
    renameSync,
    writeFileSync,
    unlinkSync,
    readFileSync
} from '../files'
import { Buffer } from 'buffer'
import {
    __chunk,
    __flatten,
    __random
} from '../lodashLocal'

class File {
    fileName: string
    directory: string
    crypt: boolean
    isInit: boolean

    constructor (directory, fileName, crypt = true) {
        this.fileName = fileName
        this.directory = directory
        this.crypt = !!crypt
        this.isInit = false
    }

    get path () {
        return `${this.directory}/${this.fileName}`
    }

    get pathTemp () {
        return `${this.directory}/${this.fileName}.tmp`
    }

    private hideStr = (str: string) => {
        const array = __chunk(str.slice(), 5).map(x => x.reverse())
        const genRandom = () => {
            const data = `${__random(10000, 1000000)
                .toString(16)}${__random(10000, 1000000)
                .toString(16)}`
            return [data, 'A1g3'].join('B').substring(0, 5)
        }
        const arr = []
        while (array.length) {
            const p = array.shift()
            arr.push(genRandom())
            arr.push(p)
        }

        const data = __flatten(arr)
            .join('')
        return data
    }

    private static unHideStr = (str: string) => {
        const arr = __chunk(str.slice(), 5).map(x => x.reverse())

        const array = []
        while (arr.length) {
            arr.shift()
            const p = arr.shift()
            array.push(p)
        }
        const data = __flatten(array)
            .join('')
        return data
    }

    private encryptData = async (str: string) => {
        if (!this.crypt) {
            return str
        }
        const buffer = Buffer.from(str, 'utf8')
        return this.hideStr(buffer.toString('base64'))
    }

    public static decryptDataStatic = (str) => {
        str = File.unHideStr(str)
        str = Buffer.from(str, 'base64').toString('utf8')
        try {
            return JSON.parse(str)
        } catch (e) {
            return null
        }
    }

    private decryptData = async (str: string) => {
        if (!this.crypt) {
            return JSON.parse(str)
        }

        str = File.unHideStr(str)
        str = Buffer.from(str, 'base64').toString('utf8')
        try {
            return JSON.parse(str)
        } catch (e) {
            return null
        }
    }

    checkDir = async () => {
        if (!await existsFileSync(this.directory)) {
            await mkdirSync(this.directory)
        }
    }

    init = async () => {
        if (this.isInit) {
            return
        }
        await this.checkDir()
        const isExists = await existsFileSync(this.path)
        if (!isExists) {
            const isTempExists = await existsFileSync(this.pathTemp)
            if (isTempExists) {
                await renameSync(this.pathTemp, this.path)
            }
        }
    }

    private _write = async (str: string) => {
        await this.checkDir()
        if (await existsFileSync(this.pathTemp)) {
            await unlinkSync(this.pathTemp)
        }
        await writeFileSync(this.pathTemp, str)
        if (await existsFileSync(this.path)) {
            await unlinkSync(this.path)
        }
        return renameSync(this.pathTemp, this.path)
    }

    write = async (data: Record<string, any>) => {
        await this.init()
        const str = await this.encryptData(JSON.stringify(data))
        return this._write(str)
    }

    read = async () => {
        await this.init()
        if (!await existsFileSync(this.path)) {
            return null
        }
        const _data = await readFileSync(this.path)
        try {
            return this.decryptData(_data)
        } catch (e) {
            return null
        }
    }
}

export default File

