import {
    listDirectorySync,
    mkdirSync
} from '../files'
import File from '../file/File'
import NodeRSA from 'node-rsa'
import {
    __orderBy,
    __isInteger,
    __uniq
} from '../lodashLocal'
import { LICENCE } from '../constant'
import {
    PRIVATE_KEYS,
    TLicenseType
} from './d'
import TaxPayer from '../secureElement/TaxPayer'
import { throwLPFRErrorObj } from '../exception'
import { EXCEPTIONS } from '../exception/d'

class License {
    private licenses: any

    constructor () {
        this.licenses = {}
    }

    get LICENSES () {
        return this.licenses
    }

    getLicenceByUid (uid: string) {
        return this.licenses[uid]
    }

    get isVALIDLicense () {
        if (!TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        return this.isValidLicense(TaxPayer.UID)
    }

    isValidLicense (uid: string) {
        const lic = this.getLicenceByUid(uid)
        if (!lic) {
            return false
        }
        const current = new Date()
        current.setDate(current.getDate() + 1)
        current.setHours(0)
        current.setMinutes(0)
        const cTime = current.getTime()
        try {
            const timeLic = new Date(lic.valid).getTime()
            return timeLic > cTime
        } catch (e) {
            return false
        }
    }

    init = async () => {
        await mkdirSync(this.licenseStorePath)
        const licenses = await listDirectorySync(this.licenseStorePath)
        const uids = __uniq(licenses.map(l => {
            const order = this.sortByFile(l)
            if (!order) {
                return false
            }
            return order
        }).filter(x => !!x)
            .map(x => x.uid))
        let obj = {}
        for (let i = 0; i < uids.length; i++) {
            const uid = uids[i] as string
            const lic = await this.getLicense(uid)
            if (lic) {
                obj = {
                    ...obj,
                    [uid]: lic
                }
            }
        }
        this.licenses = { ...obj }
    }

    get licenseStorePath () {
        return LICENCE
    }

    private _decryptByStaticKey = async (key: number, encrypted: string): Promise<TLicenseType> => {
        const data = File.decryptDataStatic(PRIVATE_KEYS[key])
        const privateKey = new NodeRSA()
        privateKey.importKey(data, 'pkcs1-private')
        return privateKey.decrypt(encrypted, 'json')
    }

    private decryptByStaticKey = async (key: number, encrypted: string) => {
        try {
            const data = await this._decryptByStaticKey(key, encrypted)
            return data || null
        } catch (e) {
            return null
        }
    }

    private decryptLicense = async (encrypted: string) => {
        const result = (await Promise.all(PRIVATE_KEYS.map((_, index) => this.decryptByStaticKey(index, encrypted)))).filter(x => !!x).filter(x => !!x?.uid)
        return result[0] || null
    }

    private sortByFile = (file: string, uid?: string) => {
        if (!file.endsWith('.license')) {
            return 0
        }
        const _file = file.replace(/\.license/, '')
        const arr = _file.split('_')
        if (arr.length !== 2) {
            return 0
        }
        if (!!uid && arr[0].toUpperCase() !== uid.toUpperCase()) {
            return 0
        }
        const order = Number(arr[1])
        if (!__isInteger(order)) {
            return 0
        }
        return {
            name: file,
            uid: arr[0],
            order
        }
    }

    getLicense = async (uid: string) => {
        const licenses = await listDirectorySync(this.licenseStorePath)
        let _licenses = licenses.map(l => {
            const order = this.sortByFile(l, uid)
            if (!order) {
                return false
            }
            return order
        }).filter(x => !!x)
        _licenses = __orderBy(_licenses, 'order')
        _licenses.reverse()
        if (!_licenses || !_licenses.length) {
            return null
        }
        const { name } = _licenses[0]
        const file = new File(this.licenseStorePath, name)
        const encrypted = await file.read()
        if (!encrypted.lic) {
            return
        }
        return this.decryptLicense(encrypted.lic)
    }

}

const instance = new License()
export default instance

