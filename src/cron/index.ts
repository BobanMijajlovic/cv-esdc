import cron from 'node-cron'

import axios from 'axios'
import Configuration from '../configuration/Configuration'
import { CRON_JOB_REQ } from '../constant'
import System from '../system/System'

export const cronJobNotifyStatus = cron.schedule('*/5 * * * *', async () => {
    try {
        const path = `http://localhost:${Configuration.SERVER_PORT}/api/v3/notify-status/${CRON_JOB_REQ}`
        await axios(path)
    } catch (error) { /** e **/
    }
})

export const cronJobCheckSemaphore = cron.schedule('*/30 * * * * *', async () => {
    try {
        const path = `http://localhost:${Configuration.SERVER_PORT}/api/v3/check-semaphore`
        await axios(path)
    } catch (error) { /** e **/
    }
})

export const cronJobSendAudit = cron.schedule('*/2 * * * *', async () => {
    try {
        const path = `http://localhost:${Configuration.SERVER_PORT}/api/v3/audits-send/${CRON_JOB_REQ}`
        await axios({
            method: 'PUT',
            url: path
        })
    } catch (error) { /** e **/
    }
})

export const cronJobSendProof = cron.schedule('*/10 * * * *', async () => {
    try {
        const path = `http://localhost:${Configuration.SERVER_PORT}/api/v3/audits-send-proof/${CRON_JOB_REQ}`
        await axios({
            method: 'PUT',
            url: path
        })
    } catch (error) { /** e **/
    }
})

export const cronJobCheckNTP = cron.schedule('*/5 * * * *', async () => {
    try {
        const path = `http://localhost:${Configuration.SERVER_PORT}/api/v3/ntp-status/${CRON_JOB_REQ}`
        await axios({
            method: 'GET',
            url: path
        })
    } catch (error) { /** e **/
    }
})

export const cronJobCheckCheckOverFlowLimit = cron.schedule('*/1 * * * *', async () => {
    try {
        const path = `http://localhost:${Configuration.SERVER_PORT}/api/v3/check-card-overflow/${CRON_JOB_REQ}`
        await axios({
            method: 'GET',
            url: path
        })
    } catch (error) { /** e **/
    }
})

export const cronJobCheckCheckCardInit = cron.schedule('*/20 * * * * *', async () => {
    try {
        const path = `http://localhost:${Configuration.SERVER_PORT}/api/v3/init-card-reader-cron-check/${CRON_JOB_REQ}`
        await axios({
            method: 'GET',
            url: path
        })
    } catch (error) { /** e **/
    }
})

export const cronJobCheckCheckCardInitOnce = cron.schedule('*/1 * * * * *', async () => {
    cronJobCheckCheckCardInit.stop()
    try {
        const path = `http://localhost:${Configuration.SERVER_PORT}/api/v3/init-card-reader-cron-check/${CRON_JOB_REQ}`
        await axios({
            method: 'GET',
            url: path
        })
    } catch (error) { /** e **/
    }
    cronJobCheckCheckCardInit.start()
}, {
    scheduled: false
})

export const cronJobCheckRestart = cron.schedule('*/5 * * * * *', async () => {
    try {
        await System.checkShutDown()
    } catch (error) { /** e **/

    }
}, {
    scheduled: true
})
