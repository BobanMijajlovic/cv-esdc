class Test {
    tests: boolean
    testLimitAudit: boolean
    testLimitTotal: boolean
    isTestNotDeleteAudit: boolean

    constructor () {
        this.tests = false
        this.testLimitAudit = false
        this.testLimitTotal = false
        this.isTestNotDeleteAudit = false
    }

    get saveDeletedAudit () {
        return !!this.tests && !!this.isTestNotDeleteAudit
    }

    get isTestLimitAudit () {
        return !!this.tests && !!this.testLimitAudit
    }

    get isTestLimitTotal () {
        return !!this.tests && !!this.testLimitTotal
    }
}

const instance = new Test()
export default instance
