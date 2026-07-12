class AgentScheduler {

	constructor({ logger = console } = {}) {
		this.logger = logger;
		this.metrics = {
			queued: 0,
			running: 0,
			completed: 0,
			failed: 0
		};
	}

	async schedule(tasks = []) {
		this.metrics.queued = tasks.length;
		const wrappedTasks = tasks.map(task => async () => {
			this.metrics.queued--;
			this.metrics.running++;
			try {
				const result = await task();
				this.metrics.running--;
				this.metrics.completed++;
				return result;
			} catch (error) {
				this.metrics.running--;
				this.metrics.failed++;
				throw error;
			}
		});

		const results = [];

		const MAX_CONCURRENT = 3;

		for (
			let i = 0;
			i < wrappedTasks.length;
			i += MAX_CONCURRENT
		) {
			const batch =
				wrappedTasks.slice(
					i,
					i + MAX_CONCURRENT
				);

			const batchResults =
				await Promise.allSettled(
					batch.map(task => task())
				);

			results.push(...batchResults);
		}

		const metrics = this.getMetrics();

		console.log(`
		SCHEDULER SUMMARY
		-----------------
		Queued: ${metrics.queued}
		Running: ${metrics.running}
		Completed: ${metrics.completed}
		Failed: ${metrics.failed}
		`);

		return results;
	}
    getMetrics() {
		return { ...this.metrics };
	}
}

module.exports = {
	AgentScheduler
};