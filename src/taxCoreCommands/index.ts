import {
    STORAGE,
    SUF_ESDC_GET_COMMANDS,
    SUF_ESDC_NOTIFY_STATUS
} from '../constant'
import TaxPayer from '../secureElement/TaxPayer'
import { throwLPFRErrorObj } from '../exception'
import { EXCEPTIONS } from '../exception/d'
import TaxCore from '../taxCoreApi'
import Semaphore from '../semaphore'
import moment from 'moment-timezone'
import { TTaxServerDefinition } from '../fiscal/tax/d'
import {
    TTaxCoreCommand,
    CommandsType,
    TTaxCoreConfig
} from '../taxCoreApi/d'
import { Buffer } from 'buffer'
import SecureElement from '../secureElement/SecureElement'
import TaxCoreAuditPackage from '../taxCoreAuditPackage'
import File from '../file/File'
import Info, { INFO } from '../info/Info'

class TaxCoreCommands {

    get commandsFileName () {
        return `${TaxPayer.UID}.commands`
    }

    get commandsFolder () {
        return STORAGE
    }

    checkIsValid = async () => {
        const data = await this.readCommands()
        if (!data.length) {
            throwLPFRErrorObj(EXCEPTIONS.secureElem_2400_notConfig)
        }
    }

    isValidCommandsStored = async () => {
        try {
            await this.checkIsValid()
            return true
        } catch (e) {
            return false
        }
    }

  /** return array of commands */
    readCommands = async () => {
        if (!TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        const file = new File(this.commandsFolder, this.commandsFileName)
        try {
            const data = await file.read()
            return data || []
        } catch (e) {
      /** error to log */
        }
        return []
    }

    findInitDataByType = (array: TTaxCoreCommand[], type: CommandsType, isObject = false) => {
        const { payload } = array.find(x => x.type === type)
        return isObject ? JSON.parse(payload) : payload
    }

    getValidTaxes = async (): Promise<TTaxServerDefinition[]> => {
        const readData = await this.readCommands()
        if (!readData?.length) {
            throwLPFRErrorObj(EXCEPTIONS.secureElem_2400_notConfig)
        }
        const data = this.findInitDataByType(readData, CommandsType.SetTaxRates)
        try {
            return JSON.parse(data)
        } catch (e) { /**  */
        }
        return []
    }

    getValidNTP = async (): Promise<string> => {
        const readData = await this.readCommands()
        if (!readData?.length) {
            return ''
        }
        try {
            return this.findInitDataByType(readData, CommandsType.SetTimeServerUrl) || ''
        } catch (e) { /**  */
        }
        return ''
    }

    getVerificationURL = async (): Promise<string> => {
        const readData = await this.readCommands()
        if (!readData?.length) {
            return ''
        }
        try {
            return this.findInitDataByType(readData, CommandsType.SetVerificationUrl) || ''
        } catch (e) { /**  */
        }
        return ''
    }

    getTaxCoreConfig = async (): Promise<TTaxCoreConfig> => {
        const readData = await this.readCommands()
        const data = this.findInitDataByType(readData, CommandsType.SetTaxCoreConfiguration)
        try {
            const _data = JSON.parse(data)
            return {
                ..._data,
                supportedLanguages: [
                    'sr-Cyrl-RS'
                ]
            }
        } catch (e) { /**  */
        }
        return {} as any
    }

    isCommandsExists = async () => {
        const prevData = await this.readCommands()
        return !!prevData.length
    }

    isCommandToSave = (cmd: TTaxCoreCommand) => {
        switch (cmd.type) {
            default:
                return true
            case CommandsType.ForwardProofOfAudit:
            case CommandsType.ForwardSecureElementDirective:
                return false
        }
    }

  /** call this function after you get commands from server
   *
   *
   * */
    processCommandsUseSemaphores = async (commands: TTaxCoreCommand[], sendToServer = true, usb = false) => {

        commands  = commands.filter(c => c.uid === TaxPayer.UID)

        let _commands = []

        for (let i = 0; i < commands.length; i++) {
            const cc = await this.processCommand(commands[i], usb)
            _commands.push(cc)

        }

        const commandsExecuted = [..._commands]

        if (sendToServer) {
            if (!_commands.length) {
                return []
            }
            const prms = _commands.map(c => this.sendCommandExecuted(c))
            try {
                await Promise.all(prms)
            } catch (e) { /** */ }
        }

        _commands = _commands.filter(c => this.isCommandToSave(c))
        if (!commands.length) {
            return commandsExecuted
        }
        const old = (await this.readCommands()).map(c => {
            const newOne = _commands.find(cc => cc.type === c.type)
            if (!newOne) {
                return c
            }
            _commands = _commands.filter(p => p.commandId !== newOne.commandId)
            return newOne
        })

        await this.writeCommands([...old, ..._commands])
        return commandsExecuted
    }

  /** process command should process forwarded commands */
    processCommand = async (command: TTaxCoreCommand, usb = false): Promise<TTaxCoreCommand> => {
        switch (command.type) {
            default:
                return {
                    ...command,
                    success: true,
                    dateAndTime: moment().tz('Europe/Belgrade')
                        .format()
                }
            case CommandsType.ForwardSecureElementDirective:
            case CommandsType.ForwardProofOfAudit: {
                const buffer: any = Buffer.from(command.payload, 'base64')
                await Semaphore.lock()
                try {
                    if (CommandsType.ForwardProofOfAudit) {
                        await SecureElement.endAudit(buffer)
            // if passed delete all
                        if (usb) {
                            await TaxCoreAuditPackage.copyFilesAuditConfirmed()
                        }
                        await TaxCoreAuditPackage.deleteFilesAuditConfirmed()
                    }
          //* * base64 to buffer send to secure element */
                    Semaphore.unlock()
                    return {
                        ...command,
                        success: true,
                        dateAndTime: moment().tz('Europe/Belgrade')
                            .format()
                    }

                } catch (e) {
                    Semaphore.unlock()
                    await Info.writeLogs(INFO.proofFailed)
                    return {
                        ...command,
                        success: false,
                        dateAndTime: moment().tz('Europe/Belgrade')
                            .format()
                    }

                }
            }
        }
    }

    writeCommands = async (commands: TTaxCoreCommand[]) => {
        if (!TaxPayer.UID) {
            throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
        }
        const file = new File(this.commandsFolder, this.commandsFileName)
        return file.write(commands)
    }

    sendCommandExecuted = (command: TTaxCoreCommand) => TaxCore.requestByMethod(`${SUF_ESDC_GET_COMMANDS}/${command.commandId.toUpperCase()}`, 'PUT', `${command.success}`)
    fetchCommands = async (init = false) => TaxCore.requestByMethod(!init ? SUF_ESDC_GET_COMMANDS : SUF_ESDC_NOTIFY_STATUS, !init ? 'GET' : 'PUT')

}

const instance = new TaxCoreCommands()
export default instance
