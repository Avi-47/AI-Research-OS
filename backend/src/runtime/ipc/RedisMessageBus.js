const { MessageBus } = require("./MessageBus");
const redis = require("../../db/redis");

class RedisMessageBus extends MessageBus {
    constructor(stream = "agent-events") {
        super();
        this.stream = stream;
        this.handlers = [];
    }

    subscribe(handler) {
        this.handlers.push(handler);
    }

    async publish(event) {
        // Persist event to Redis Stream
        await redis.xAdd(
            this.stream,
            "*",
            {
                event: JSON.stringify(event)
            }
        );

        // Immediately dispatch locally
        for (const handler of this.handlers) {
            await handler(event);
        }
    }
}

module.exports = {
    RedisMessageBus
};