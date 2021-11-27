
class Route {
    path;
    handler;
    constructor(path, method, handler) {
        this.path = path;
        // base methods, not including CONNECT, etc.
        if (method !== "post" && method !== "put" && method !== "get" && method !== "delete") 
            throw new Error(`method must be put, post, get or delete, but got ${method}`);
        this.method = method;
        this.handler = handler;
    }
}

module.exports = Route;

