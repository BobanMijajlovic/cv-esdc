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

const _Card = _interopRequireDefault(require('./Card'))

const _events = require('events')

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
    name: 'Device'
})

const Device = /* #__PURE__*/function(_EventEmitter) {
    _inherits(Device, _EventEmitter)

    const _super = _createSuper(Device)

    function Device (reader) {
        let _this

        _classCallCheck(this, Device)

        _this = _super.call(this)
        logger.debug('new Device('.concat(reader, ')'))
        _this.reader = reader
        _this.name = reader.name
        _this.card = null

        const isCardInserted = function isCardInserted (changes, reader, status) {
            return changes & reader.SCARD_STATE_PRESENT && status.state & reader.SCARD_STATE_PRESENT
        }

        const isCardRemoved = function isCardRemoved (changes, reader, status) {
            return changes & reader.SCARD_STATE_EMPTY && status.state & reader.SCARD_STATE_EMPTY
        }

        const cardInserted = function cardInserted (reader, status) {
            reader.connect({
                share_mode: 2
            }, function(err, protocol) {
                if (err) {
                    _this.emit('error', err)
                } else {
                    _this.card = new _Card['default'](_assertThisInitialized(_this), status.atr, protocol)

                    _this.emit('card-inserted', {
                        device: _assertThisInitialized(_this),
                        card: _this.card
                    })
                }
            })
        }

        const cardRemoved = function cardRemoved (reader) {
            const name = reader.name
            reader.disconnect(reader.SCARD_LEAVE_CARD, function(err) {
                if (err) {
                    _this.emit('error', err)
                } else {
                    _this.emit('card-removed', {
                        name: name,
                        card: _this.card
                    })

                    _this.card = null
                }
            })
        }

        reader.on('status', function(status) {
            const changes = reader.state ^ status.state

            if (changes) {
                if (isCardRemoved(changes, reader, status)) {
                    cardRemoved(reader)
                } else if (isCardInserted(changes, reader, status)) {
                    cardInserted(reader, status)
                }
            }
        })
        return _this
    }

    _createClass(Device, [{
        key: 'transmit',
        value: function transmit (data, res_len, protocol, cb) {
            try {
                this.reader.transmit(data, res_len, protocol, cb)
            } catch (err) {
                logger.warn('transmit', err)
            }
        }
    }, {
        key: 'getName',
        value: function getName () {
            return this.name
        }
    }, {
        key: 'toString',
        value: function toString () {
            return ''.concat(this.getName())
        }
    }])

    return Device
}(_events.EventEmitter)

const _default = Device

exports['default'] = _default
