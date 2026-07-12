const { MessageBus } = require("./MessageBus");

class InMemoryMessageBus extends MessageBus {
    constructor() {
        super();
        this.handlers = [];
    }

    subscribe(handler) {
        this.handlers.push(handler);
    }

    async publish(event) {
        for (const handler of this.handlers) {
            await handler(event);
        }
    }
}

module.exports = {
    InMemoryMessageBus
};