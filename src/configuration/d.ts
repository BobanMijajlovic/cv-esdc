export type TConfiguration = {
    PORT: string | number,
    NUM_PRINTER_CHARS: number,
    CPORT?: number,
    logOut?: boolean,
    TIME_AUDIT_SEND: number,
    TIME_PROOF_SEND: number,
    LPFR: {
        protocolVersion: string
        hardwareVersion: string
        softwareVersion: string
        deviceSerialNumber: string
        make: string
        model: string,
        mrcPrefix?: string
    }
}
