const { getReasonPhrase } = require("http-status-codes");

class ServerError extends Error {
    constructor(statusCode, body = {}) {
        super();
        this.status = statusCode;
        this.statusMessage = getReasonPhrase(statusCode);
        this.errorBody = body || {};
    }
    get body() {
        let ret = {
            status: this.status,
            message: this.statusMessage,
            error: {
                message: this.errorBody || this.errorBody.message,
            },
            data: {},
        }
        return ret;
    }
}
module.exports = ServerError;