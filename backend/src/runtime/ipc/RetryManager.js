class RetryManager {
    constructor({
        attempts = 3,
        delay = 2000
    } = {}) {
        this.attempts = attempts;
        this.delay = delay;
    }

    async execute(task) {
        let error;

        for (let attempt = 1; attempt <= this.attempts; attempt++) {
            try {
                return await task();
            } catch (err) {
                error = err;

                console.warn(
                    `[Retry] Attempt ${attempt}/${this.attempts} failed`
                );

                if (attempt < this.attempts) {
                    await new Promise(resolve =>
                        setTimeout(resolve, this.delay)
                    );
                }
            }
        }

        throw error;
    }
}

module.exports = {
    RetryManager
};