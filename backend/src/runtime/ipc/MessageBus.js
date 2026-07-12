class MessageBus {
    async publish() {
        throw new Error("publish() not implemented");
    }

    subscribe() {
        throw new Error("subscribe() not implemented");
    }
}

module.exports = {
    MessageBus
};