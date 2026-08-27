class RetryManager {
    constructor({
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        logger = console
    } = {}) {
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
        this.maxDelay = maxDelay;
        this.logger = logger;
    }

    async execute(fn) {
        let lastError;

        for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                const status =
                    error?.response?.status ||
                    error?.status;

                const isRetryable =
                    status === 429 ||
                    status >= 500;

                if (!isRetryable) {
                    throw error;
                }

                if (attempt === this.maxRetries - 1) {
                    break;
                }

                const delay = Math.min(
                    this.baseDelay * Math.pow(2, attempt),
                    this.maxDelay
                );

                this.logger.warn(
                    `[Retry] Attempt ${attempt + 1}/${this.maxRetries} failed. ` +
                    `Retrying in ${delay}ms...`
                );

                await this.sleep(delay);
            }
        }

        throw lastError;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = {
    RetryManager
};