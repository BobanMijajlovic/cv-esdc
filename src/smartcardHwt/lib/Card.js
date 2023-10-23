'use strict'

function _typeof (obj) {
    '@babel/helpers - typeof'

    if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
        _typeof = function _typeof (obj) {
            return typeof obj
        }
    } else {
        _typeof = function _typeof (obj) {
            return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj
        }
    } return _typeof(obj)
}

Object.defineProperty(exports, '__esModule', {
    value: true
})

exports['default'] = void 0

const _events = require('events')

const _hexify = _interopRequireDefault(require('hexify'))

const _ResponseApdu = _interopRequireDefault(require('./ResponseApdu'))

const _pino = _interopRequireDefault(require('pino'))

function _interopRequireDefault (obj) {
    return obj && obj.__esModule ? obj : { 'default': obj }
}

function _classCallCheck (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError('Cannot call a class as a function')
    }
}

function _defineProperties (target, props) {
    for (let i = 0; i < props.length; i++) {
        const descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) {
            descriptor.writable = true
        } Object.defineProperty(target, descriptor.key, descriptor)
    }
}

function _createClass (Constructor, protoProps, staticProps) {
    if (protoProps) {
        _defineProperties(Constructor.prototype, protoProps)
    } if (staticProps) {
        _defineProperties(Constructor, staticProps)
    } return Constructor
}

function _inherits (subClass, superClass) {
    if (typeof superClass !== 'function' && superClass !== null) {
        throw new TypeError('Super expression must either be null or a function')
    } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) {
        _setPrototypeOf(subClass, superClass)
    }
}

function _setPrototypeOf (o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf (o, p) {
        o.__proto__ = p; return o
    }; return _setPrototypeOf(o, p)
}

function _createSuper (Derived) {
    const hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal () {
        let Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) {
            const NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget)
        } else {
            result = Super.apply(this, arguments)
        } return _possibleConstructorReturn(this, result)
    }
}

function _possibleConstructorReturn (self, call) {
    if (call && (_typeof(call) === 'object' || typeof call === 'function')) {
        return call
    } return _assertThisInitialized(self)
}

function _assertThisInitialized (self) {
    if (self === void 0) {
        throw new ReferenceError('this hasn\'t been initialised - super() hasn\'t been called')
    } return self
}

function _isNativeReflectConstruct () {
    if (typeof Reflect === 'undefined' || !Reflect.construct) {
        return false
    } if (Reflect.construct.sham) {
        return false
    } if (typeof Proxy === 'function') {
        return true
    } try {
        Date.prototype.toString.call(Reflect.construct(Date, [], function() {})); return true
    } catch (e) {
        return false
    }
}

function _getPrototypeOf (o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf (o) {
        return o.__proto__ || Object.getPrototypeOf(o)
    }; return _getPrototypeOf(o)
}

const logger = (0, _pino['default'])({
    name: 'Card'
})

const Card = /* #__PURE__*/function(_EventEmitter) {
    _inherits(Card, _EventEmitter)

    const _super = _createSuper(Card)

    function Card (device, atr, protocol) {
        let _this

        _classCallCheck(this, Card)

        _this = _super.call(this)
        logger.debug('new Card('.concat(device, ')'))
        _this.device = device
        _this.protocol = protocol
        _this.atr = atr.toString('hex')
        return _this
    }

    _createClass(Card, [{
        key: 'getAtr',
        value: function getAtr () {
            return this.atr
        }
    }, {
        key: 'toString',
        value: function toString () {
            return 'Card(atr:\''.concat(this.atr, '\')')
        }
    }, {
        key: 'issueCommand',
        value: function issueCommand (commandApdu, callback) {
            const _this2 = this

            let buffer

            if (Array.isArray(commandApdu)) {
                buffer = Buffer.from(commandApdu)
            } else if (typeof commandApdu === 'string') {
                buffer = Buffer.from(_hexify['default'].toByteArray(commandApdu))
            } else if (Buffer.isBuffer(commandApdu)) {
                buffer = commandApdu
            } else if (typeof commandApdu === 'string') {
                buffer =  Buffer.from(_hexify['default'].toByteArray(commandApdu))
            } else {
                buffer = commandApdu.toBuffer()
            }

            const protocol = this.protocol
            this.emit('command-issued', {
                card: this,
                command: commandApdu
            })

            if (callback) {
                this.device.transmit(buffer, 0xFFFF, protocol, function(err, response) {
                    _this2.emit('response-received', {
                        card: _this2,
                        command: commandApdu,
                        response: new _ResponseApdu['default'](response)
                    })

                    callback(err, response)
                })
            } else {
                return new Promise(function(resolve, reject) {
                    _this2.device.transmit(buffer, 0xFFFF, protocol, function(err, response) {
                        if (err) {
                            reject(err)
                        } else {
                            _this2.emit('response-received', {
                                card: _this2,
                                command: commandApdu,
                                response: new _ResponseApdu['default'](response)
                            })

                            resolve(response)
                        }
                    })
                })
            }
        }
    }])

    return Card
}(_events.EventEmitter)

const _default = Card

exports['default'] = _default
