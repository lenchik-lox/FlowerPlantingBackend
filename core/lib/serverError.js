const { getReasonPhrase } = require("http-status-codes");

class ServerError extends Error {
    constructor(statusCode, message = undefined) {
        super();
        this.status = statusCode;
        this.statusMessage = getReasonPhrase(statusCode);
        this.message = message;
    }
    get body() {
        return {
            status: this.status,
            message: this.statusMessage,
            error: {
                message: this.message,
            },
            data: {},
        }
    }
}
module.exports = ServerError;