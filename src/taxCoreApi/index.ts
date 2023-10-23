import {
    TRequestMethod,
    TTaxCoreRequest,
    TTaxCoreRequestHeader,
    TTaxCoreToken
} from '../taxCoreApi/d'
import axios, { AxiosResponse } from 'axios'
import {
    SUF_ESDC_TOKEN_URL,
    SOCKET_CARD_VERSION
} from '../constant'
import https from 'https'
import TaxPayer from '../secureElement/TaxPayer'
import { throwLPFRErrorObj } from '../exception'
import { EXCEPTIONS } from '../exception/d'
import SecureElement from '../secureElement/SecureElement'
import util from 'util'
import child from 'child_process'
import Logger from '../logger'
import CriticalError from '../crtiticalError/CriticalError'
import * as os from 'os'
import Configuration from '../configuration/Configuration'
import path from 'path'
import CardSocket from '../secureElement/CardSocket'

const isNeedTokenForRequest = (req: string) => {
    switch (req) {
        default:
            return true
        case SUF_ESDC_TOKEN_URL:
            return false
    }
}

const HEADER = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
} as TTaxCoreRequestHeader

class TaxCoreApi {
    private authData: TTaxCoreToken

    reset = () => {
        this.authData = undefined
    }

    get PORT () {
        return Configuration.TAX_CORE_PORT || 443
    }

    get HOST () {
        const { taxCoreUrl } = TaxPayer.dataSettings
        if (!taxCoreUrl) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        return taxCoreUrl.replace('https://', '')
    }

    get token () {
        return this.authData?.token
    }

    resetToken = () => {
        this.authData = undefined
    }

    /**
     * Request Authentication Token
     */
    getToken = async () => {
        this.resetToken()
        this.authData = await this.curlGetToken(SecureElement.getPin)
    }

    requestByMethod = async (url, method: TRequestMethod = 'GET', _data = undefined) => {
        const { data } = await this._request({ url, method, data: _data }) || {}
        return data
    }

    requestByMethodFullResponse = async (url, method: TRequestMethod = 'GET', _data = undefined) => {
        return await this._request({ url, method, data: _data }) || {}
    }

    _request = async (props: TTaxCoreRequest): Promise<AxiosResponse> => {
        const {
            method = 'GET',
            url,
            headers = HEADER,
            data
        } = props

        const { taxCoreUrl } = TaxPayer.dataSettings
        if (!taxCoreUrl) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }

        const httpsAgent = new https.Agent({
            host: this.HOST,
            port: this.PORT,
            rejectUnauthorized: false,
        })

        if (!taxCoreUrl) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        const isNeedToken = isNeedTokenForRequest(url)
        if (isNeedToken && !this.token) {
            throwLPFRErrorObj(EXCEPTIONS.infoErrors_0220_internetUnavailable)
        }
        const headerToken = isNeedToken ? { TaxCoreAuthenticationToken: this.token } : {}
        const requestData = {
            method,
            url: `${taxCoreUrl}${url}`,
            headers: {
                ...headers,
                ...headerToken
            },
            httpsAgent,
            data,
        }
        try {
            await CriticalError.clearError(EXCEPTIONS.infoErrors_0220_internetUnavailable)
            const data = await axios(requestData)
            Logger.logTaxResponse(data)
            return data
        } catch (e) {
            this.authData = null
            throwLPFRErrorObj(EXCEPTIONS.infoErrors_0220_internetUnavailable)
        }
    }

    curlGetToken = async (pin: string) => {
        if (SOCKET_CARD_VERSION) {
            return CardSocket.getToken(this.HOST, '/api/v3/sdc/token', this.PORT, pin)
        }

        const isWindows = os.platform() === 'win32'
        const command = isWindows ?
            `${path.resolve('G6X8H12.exe')} ${pin} https://${this.HOST}:${this.PORT}/api/v3/sdc/token ${this.HOST} application/json application/json` :
            `curl -vk  https://${this.HOST}:${this.PORT}/api/v3/sdc/token --header \'Content-Type: application/json;Accept: application/json;Host: ${this.HOST};\'  --engine pkcs11 --cert-type ENG -E "pkcs11:object=Certificate;id=%00;pin-value=${pin}" --key-type ENG --key "pkcs11:object=Private%20Key;id=%00;pin-value=${pin}"`

        const exec = util.promisify(child.exec)
        await CriticalError.clearError(EXCEPTIONS.infoErrors_0220_internetUnavailable)
        try {
            const { stdout, stderr } = await exec(command) as any
            if (stderr) { /** */ }
            const data = JSON.parse(stdout)
            console.log('tk ', data)
            return data
        } catch (e) {
            throwLPFRErrorObj(EXCEPTIONS.infoErrors_0220_internetUnavailable)
        }
    }

}

const instance = new TaxCoreApi()
export default instance
