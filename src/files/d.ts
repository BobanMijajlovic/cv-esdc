


export type TMkdirOptions = {
    recursive?: boolean
    mode?: string | number // Not supported on Windows. Default: 0o777
}

export type TReadFileOptions = {
    encoding?: BufferEncoding
    flag?: string,
    signal?: AbortSignal
}
