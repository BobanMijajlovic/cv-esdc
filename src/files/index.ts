import fs, { Stats } from 'fs'
import {
    TMkdirOptions,
    TReadFileOptions
} from '../files/d'
import path from 'path'

export const resolvePath = (_path: string) => {
    const sep = path.sep
    _path = _path.replace(/\\/g, sep)
    _path = _path.replace(/\\\\/g, sep)
    _path = _path.replace(/\//g, sep)
    return path.resolve(_path)
}

export const readFileSync = async (_path: string, encoding: BufferEncoding = 'utf-8') => new Promise<any>((resolve, reject) => {
    _path = resolvePath(_path)
    fs.readFile(_path, { encoding } as TReadFileOptions, (err, data) => {
        if (err) {
            reject(err)
        } else {
            resolve(data)
        }
    })
})

export const changePermission = async (_path: string, permission = 0o775) => new Promise<any>((resolve, reject) => {
    _path = resolvePath(_path)
    fs.chmod(_path, permission, (err) => {
        if (err) {
            console.log("err chmod ", err)
           // reject(err)
            resolve("ok")
        } else {
            resolve('ok')
        }

    })
})

export const writeFileSync = async (_path: string, data: string | Buffer, encoding = 'utf-8') => new Promise<any>((resolve, reject) => {
    _path = resolvePath(_path)
    fs.writeFile(_path, data, { encoding } as any, (err) => {
        if (err) {
            reject(err)
        } else {
            resolve(true)
        }
    })
})

export const existsFileSync = async (_path: string) => new Promise<any>((resolve, reject) => {
    _path = resolvePath(_path)
    try {
        fs.access(_path, fs.constants.F_OK, (err) => {
            if (err) {
                resolve(false)
            } else {
                resolve(true)
            }
        })
    } catch (e) {
        reject('exists file synch')
    }
})

export const copyFileSync = async (pathSrc: string, pathDest: string) => new Promise<any>((resolve, reject) => {
    const _pathSrc = resolvePath(pathSrc)
    const _pathDest = resolvePath(pathDest)
    try {
        fs.copyFile(_pathSrc, _pathDest, (err) => {
            if (err) {
                resolve(false)
            } else {
                resolve(true)
            }
        })
    } catch (e) {
        reject('File not Copied')
    }
})

export const copyFileDeleteIfPathExists = async (pathSrc: string, pathDest: string) => {
    if (!await existsFileSync(pathSrc)) {
        return
    }
    if (await existsFileSync(pathDest)) {
        await unlinkSync(pathDest)
    }
    await copyFileSync(pathSrc, pathDest)

}

export const unlinkSync = async (_path: string) => new Promise<any>((resolve, reject) => {
    _path = resolvePath(_path)
    fs.unlink(_path, (err) => {
        if (err) {
            reject(err)
        } else {
            resolve(true)
        }
    })
})

export const unlinkFileReturnBoolean = async (_path: string) => {
    if (!await existsFileSync(_path)) {
        return false
    }
    await unlinkSync(_path)
    return true

}

export const _renameSync = async (oldPath: string, newPath: string) => new Promise<any>((resolve, reject) => {
    oldPath = resolvePath(oldPath)
    newPath = resolvePath(newPath)
    fs.rename(oldPath, newPath, (err) => {
        if (err) {
            reject(err)
        } else {
            resolve(true)
        }
    })
})

export const renameSync = async (oldPath: string, newPath: string) => {
    await _renameSync(oldPath, newPath)
    return changePermission(newPath)
}

const _mkdirSync = async (_path: string, options = { recursive: true }) => new Promise<any>((resolve, reject) => {
    _path = resolvePath(_path)
    fs.mkdir(_path, options, (err) => {
        if (err) {
            reject(err)
        } else {
            resolve(true)
        }
    })
})

export const mkdirSync = async (path: string, options?: TMkdirOptions) => {
    if (await existsFileSync(path)) {
        return
    }
    await _mkdirSync(path, options as any)
    return changePermission(path)
}

export const fileWriteWithData = async (pathDir: string, fileName: string, data: string | Buffer, encoding = 'utf-8') => {
    await mkdirSync(pathDir, { recursive: true })
    const _path = `${pathDir}/${fileName}`
    const _pathTmp = `${pathDir}/${fileName}.tmp`
    if (await existsFileSync(_pathTmp)) {
        await unlinkSync(_pathTmp)
    }
    await writeFileSync(_pathTmp, data)
    if (await existsFileSync(_path)) {
        await unlinkSync(_path)
    }
    await renameSync(_pathTmp, _path)
}

export const listDirectorySync = async (directory: string) => new Promise<any>((resolve, reject) => {
    const _dir = resolvePath(directory)
    fs.readdir(_dir, (err, files) => {
        if (err) {
            reject(err)
        } else {
            resolve([...files])
        }
    })
})

export const fileStat = async (file: string): Promise<Stats> => new Promise((resolve, reject) => {
    const _path = resolvePath(file)
    fs.stat(_path, (err, stats) => {
        if (err) {
            reject(err)
        } else {
            resolve(stats)
        }
    })
})

export const isPathDirectory = async (file: string) => {
    const _fileStat = await fileStat(file)
    return _fileStat.isDirectory()
}
