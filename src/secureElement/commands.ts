export const SELECT_APPLET_COMMAND = {
    cla: 0x00,
    ins: 0xA4,
    p1: 0x04,
    p2: 0x00,
    data: [0xA0, 0x00, 0x00, 0x07, 0x48, 0x46, 0x4A, 0x49, 0x2D, 0x54, 0x61, 0x78, 0x43, 0x6F, 0x72, 0x65]
}

export const GET_CERTIFICATE = {
    cla: 0x88,
    ins: 0x04,
    p1: 0x04,
    p2: 0x00,
    le: 0x00,
    data: [0x00, 0x00, 0x00],
    bytes: [0x88, 0x04, 0x04, 0x00, 0x00, 0x00, 0x00]
}

/**
 * HWT PIN 1456
 * UID - 5YY5LQWN
 * */
export const VERIFY_PIN = {
    bytes: [0x88, 0x11, 0x04, 0x00, 0x04, 0x01, 0x04, 0x05, 0x06]
}

export const GET_AMOUNT_STATUS = {
    bytes: [0x88, 0x14, 0x04, 0x00, 0x00]
}

export const EXPORT_INTERNAL_DATA = {
    cla: 0x88,
    ins: 0x12,
    p1: 0x04,
    p2: 0x00,
}

export const GET_API = {
    bytes: [0x88, 0x09, 0x04, 0x00, 0x00]
}

export const GET_AUDI_VERSION = {
    bytes: [0x88, 0x0A, 0x04, 0x00, 0x00]
}

export const GET_SECURE_ELEMENT_VERSION = {
    cla: 0x88,
    ins: 0x09,
    p1: 0x04,
    p2: 0x00
}

export const GET_TAX_CORE_PUBLIC_KEY = {
    cla: 0x88,
    ins: 0x07,
    p1: 0x04,
    p2: 0x00,
  // bytes: [0x88, 0x07, 0x04, 0x00]
}

export const SIGN_INVOICE = {
    cla: 0x88,
    ins: 0x13,
    p1: 0x04,
    p2: 0x00
}

export const START_AUDIT = {
    bytes: [0x88, 0x21, 0x04, 0x00, 0x00, 0x00, 0x00]
}

export const END_AUDIT = {
    cla: 0x88,
    ins: 0x20,
    p1: 0x04,
    p2: 0x00,
    le: 0x0,
    data: [0x00, 0x1, 0x00],
    bytes: [0x88, 0x20, 0x04, 0x00]
}
