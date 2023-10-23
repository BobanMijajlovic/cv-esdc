import { AuditPackageStatus } from '../taxCoreAuditPackage/d'

export type TTaxCoreRequestHeader = {
    'Content-Type'?: string;
    Accept?: string;
    RequestId?: string
}

export type TRequestMethod = 'GET' | 'POST' | 'PUT'

export type TTaxCoreRequest = {
    method?: TRequestMethod
    url: string,
    headers?: TTaxCoreRequestHeader
    timeout?: number
    data?: any
    httpsAgent?: any
    isHttps?: boolean
}

export type TTaxCoreToken = {
    token: string;
    expireAt: string;
}

export enum CommandsType {
    SetTaxRates = 0,
    SetTimeServerUrl = 1,
    SetVerificationUrl = 2,
    ForwardProofOfAudit = 5,
    SetTaxCoreConfiguration = 7,
    ForwardSecureElementDirective = 8
}

export type TTaxCoreCommand = {
    commandId: string
    type: CommandsType
    payload: string,
    uid: string,
    success?: boolean
    dateAndTime?: string
}

export type TAuditResponse = {
    status: AuditPackageStatus // returned after TaxCore.API unpacks and verifies audit packages. If all verifications are successful, status should have the value 4. ( Invoice is verified )
    commands: TTaxCoreCommand[]
}

export type TTaxCoreEndPoints = {
    taxpayerAdminPortal: string
    taxCoreApi: string
    vsdc: string
    root: string
}

export type TTaxCoreConfig = {
    organizationName: string
    serverTimeZone: string
    street: string
    city: string
    country: string
    endpoints: TTaxCoreEndPoints
    environmentName: string
    logo: string
    ntpServer: string
    supportedLanguages: string[]
}
