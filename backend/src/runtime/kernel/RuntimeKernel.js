const { EventLogRepository } = require("../storage/EventLogRepository");
const { RetryManager } = require("../ipc/RetryManager");

class RuntimeKernel {
    constructor({
        messageBus,
        subscriptionRegistry,
        retryManager = new RetryManager(),
        eventLogRepository = new EventLogRepository()
    }) {
        this.messageBus = messageBus;
        this.subscriptionRegistry = subscriptionRegistry;
        this.retryManager = retryManager;
        this.eventLogRepository = eventLogRepository;

        this.messageBus.subscribe(
            this.dispatch.bind(this)
        );
    }

    async publish(event) {
        console.log("Publishing:", event.eventType);
        // await this.eventLogRepository.save(event);
        await this.messageBus.publish(event);
    }

    async dispatch(event) {
        console.log(
            `[Kernel] Dispatching ${event.eventType}`
        );

        const handlers =
            this.subscriptionRegistry.getSubscribers(
                event.eventType
            );

        const results = await Promise.allSettled(
            handlers.map(handler =>
                this.retryManager.execute(() => handler(event))
            )
        );
        results.forEach(result => {
            if (result.status === "rejected") {
                console.error(result.reason);
            }
        });
    }

    async invoke(agent, state, context = {}) {
        const input = agent.buildInput(state);

        return agent.run(input, {
            ...context,
            state
        });
    }
}

module.exports = {
    RuntimeKernel
};