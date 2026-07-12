class SubscriptionRegistry {
    constructor() {
        this.subscriptions = new Map();
    }

    register(eventType, handler) {
        if (!this.subscriptions.has(eventType)) {
            this.subscriptions.set(eventType, []);
        }

        this.subscriptions.get(eventType).push(handler);
    }

    getSubscribers(eventType) {
        return this.subscriptions.get(eventType) || [];
    }
}

module.exports = {
    SubscriptionRegistry
};