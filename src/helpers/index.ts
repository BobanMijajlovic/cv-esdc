import { Buffer } from 'buffer'

export const bufferBytesFromStringPaddingStart = (data: string, size: number) => {
    const buff1 = Buffer.from(data)
    const buff0 = Buffer.alloc(size - data.length)
    return Buffer.concat([buff0, buff1], size)
}

export const bufferBytesFromLong = (data: number, size: number) => {
    const buf = Buffer.alloc(8)
    buf.writeBigUInt64BE(BigInt(data))
    const buff = Buffer.alloc(size)
    buf.copy(buff, 0, 8 - size, 8)
    return buff
}

export const bufferBytesFromInteger = (data: number, size = 1) => {
    const buf = Buffer.alloc(4)
    buf.writeUInt32BE(data)
    const buff = Buffer.alloc(size)
    buf.copy(buff, 0, 4 - size, 4)
    return buff
}

export const bufferCopyData = (bufferSource: Buffer, offset: number, numBytes: number) => {
    const buff = Buffer.alloc(numBytes)
    bufferSource.copy(buff, 0, offset, offset + numBytes)
    return buff
}

export const bufferToLong = (buffer: Buffer) => {
    const buff = Buffer.alloc(8)
    const size = buffer.length
    buffer.copy(buff, 8 - size, 0, size)
    const nn = buff.readBigInt64BE()
    return Number(nn)

}

export const bufferToInteger = (buffer: Buffer) => {
    const buff = Buffer.alloc(4)
    const size = buffer.length
    buffer.copy(buff, 4 - size, 0, size)
    return buff.readUInt32BE()

}

export const bufferToIntegerLE = (buffer: Buffer) => {
    const buff = Buffer.alloc(4)
    const size = buffer.length
    buffer.copy(buff, 4 - size, 0, size)
    return buff.readUInt32LE()

}

export const bufferToStringTrim = (buffer: Buffer) => {
    const str = buffer.toString().replace(/\W/g, '')
    return str
}

export const bufferIntLE = (value: number) => {
    const buf = Buffer.alloc(4)
    buf.writeInt32LE(value, 0)
    return buf
}

export const bufferLongLE = (value: number) => {
    const buf = Buffer.alloc(8)
    buf.writeBigInt64LE(BigInt(value), 0)
    return buf
}

