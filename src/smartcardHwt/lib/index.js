'use strict'

const { SOCKET_CARD_VERSION } = require('../../constant')

const _Iso7816Application = SOCKET_CARD_VERSION ? { default: {} } : _interopRequireDefault(require('./Iso7816Application'))

const _CommandApdu = _interopRequireDefault(require('./CommandApdu'))

const _ResponseApdu = _interopRequireDefault(require('./ResponseApdu'))

const _Devices = SOCKET_CARD_VERSION ? { default: {} } : _interopRequireDefault(require('./Devices'))

const _Device = SOCKET_CARD_VERSION ? { default: {} } : _interopRequireDefault(require('./Device'))

const _Card = SOCKET_CARD_VERSION ? { default: {} } : _interopRequireDefault(require('./Card'))

function _interopRequireDefault (obj) {
    return obj && obj.__esModule ? obj : { 'default': obj }
}

module.exports = {
    Iso7816Application: _Iso7816Application['default'],
    CommandApdu: _CommandApdu['default'],
    ResponseApdu: _ResponseApdu['default'],
    Devices: _Devices['default'],
    Device: _Device['default'],
    Card: _Card['default']
}
