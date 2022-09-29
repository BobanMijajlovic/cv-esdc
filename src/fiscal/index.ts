import { TInvoiceRequest } from './invoice/d'
import { camelizeKeys } from '../utils'
import { invoiceSignInvoice } from './invoice'
import SecureElement from '../secureElement/SecureElement'
import TaxCoreAuditPackage from '../taxCoreAuditPackage'
import TaxCoreLastInvoice from '../taxCoreLastInvoice'
import { DEFAULT_REQUEST_ID } from '../constant'
import QRCode from 'qrcode'
import Info, { INFO } from '../info/Info'

const generateQR = async (text: string) => {

    try {
        const qrCode = await QRCode.toDataURL(text)
        return  qrCode.replace('data:image/png;base64,','')
    } catch (err) {
        console.error(err)
    }
    return ''
}

export const fiscalizationOfInvoice = async (requestInvoice: TInvoiceRequest, requestId =  DEFAULT_REQUEST_ID) => {

    SecureElement.checkIsWorkingCertificateGotThrowException()

    const result = await invoiceSignInvoice(requestInvoice)

    const request = camelizeKeys(requestInvoice)

    SecureElement.checkIsWorkingCertificateGotThrowException()
    try {
        const { auditPackage, invoiceNumber } = await TaxCoreAuditPackage.createAuditPackage({
            result,
            request
        })

        await TaxCoreAuditPackage.writeSignedToStore(auditPackage, invoiceNumber)

        const isQRCodeOmit = requestInvoice.options?.omitQRCodeGen == 1
        let _res = {
            ...result
        }
    /** generate QRCode base64 */
        if (!isQRCodeOmit) {
            const verificationQRCode = await generateQR(result.verificationUrl)
            _res = {
                ...result,
                verificationQRCode
            }
        }
        await TaxCoreLastInvoice.saveToFile(_res, requestId)
        try {
            await Info.writeLogs(INFO.lastReceipt, +invoiceNumber.split('-')[2])
        } catch (e) { /** */ }
        return _res

    } catch (e) {
        console.log(e)
    }
}
