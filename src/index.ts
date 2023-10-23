import express from 'express'
import router from './routes'
import { cronJobCheckSemaphore } from './cron/index'
import { processErrors } from './exception/helpers'
import cors from 'cors'
import Configuration from './configuration/Configuration'
import { throwLPFRErrorObj } from './exception'
import { EXCEPTIONS } from './exception/d'
import TaxCoreCommands from './taxCoreCommands'
import TaxPayer from './secureElement/TaxPayer'
import License from './license'
import { CRON_JOB_REQ } from './constant'
import SecureElement from './secureElement/SecureElement'
import Logger from './logger'

const app = express()

const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    callback(null, true)

  }
}

app.use(cors(corsOptions))

app.use(async (req, resp, next) => {

  const path = (req.path || '').replace('/api/v3', '').replace(`/${CRON_JOB_REQ}`, '')

  switch (path) {
    case '/status/settings':
      next()
      return
  }

  try {

    switch (path) {
      case '/init-card-reader-cron-check':
      case '/card-readers-status':
        break
      default: {
        if (!TaxPayer.UID) {
          throwLPFRErrorObj(EXCEPTIONS.warningError_1300_smartCardNotPresent)
          return
        }

        if (!Configuration.isConfigurationValid) {
          throwLPFRErrorObj(EXCEPTIONS.secureElem_2400_notConfig)
        }
      }
    }

    switch (path) {
      case  '/pin':
      case  '/attention':
      case  '/attention/payer':
      case  '/check-semaphore':
      case  '/notify-status':
      case '/status/error':
      case '/status/license':
      case '/status/critic':
      case '/init-card-reader-cron-check':
      case '/check-card-overflow':
      case '/card-readers-status':
        break
      default: {
        const isConfigured = await TaxCoreCommands.isValidCommandsStored()
        if (!isConfigured) {
          throwLPFRErrorObj(EXCEPTIONS.secureElem_2400_notConfig)
        }
      }
    }

    switch (path) {
      case  '/check-semaphore':
      case '/pin':
      case '/status':
      case  '/attention':
      case  '/attention/payer':
      case '/status/critic':
      case '/status/error':
      case '/status/info':
      case  '/status/license':
      case '/status/settings':
      case '/status/payer':
      case '/init-card-reader-cron-check':
      case '/check-card-overflow':
      case '/card-readers-status':
        break
      default:
        if (SecureElement.isPinRequired) {
          throwLPFRErrorObj(EXCEPTIONS.warningError_1500_pinCodeReq)
        }
    }
  } catch (e) {
    next(e)
    return
  }

  next()
})

app.use('/api/v3', router)

app.use((err, req, resp, next) => {
  resp.status(400)
  console.log("err", err)
  return resp.json(processErrors(err))
})

const MONITOR = {
  app: app,
  server: null,
  restart: null
}

const restartServer = async () => {
  MONITOR.server.close()
  await Configuration.init()
  const PORT = Configuration.CONFIG.PORT
  MONITOR.server = app.listen(PORT, async () => {
    Logger.log(`SERVER ${PORT}`)
  })
}

MONITOR.restart = restartServer

global.MONITOR = MONITOR

process.on('exit', (code) => {
  Logger.log('SERVER END')
})

const startFn = async () => {

  await Configuration.init()
  await License.init()
  const PORT = Configuration.CONFIG.PORT

  MONITOR.server = app.listen(PORT, async () => {
    await SecureElement.initSecureElement()
    Logger.log(`SERVER ${PORT}`)
  })

  const cronSep = cronJobCheckSemaphore
  cronSep.start()
}

startFn().then()

