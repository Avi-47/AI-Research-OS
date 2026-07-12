const { randomUUID } = require("crypto");
const { AgentStatus } = require("./models/agentStatus");
const { AgentError } = require("./errors/agentError");
const { assertAgentContract } = require("./contracts/agent.contract");

class BaseAgent {
	constructor({id,name,role,goal,dependencies = {},runStore,tracer = null,logger = console}) {
		assertAgentContract({id,name,role,goal,execute: this.execute});

		if (!runStore) {
			throw new Error(`BaseAgent ${id} requires a runStore`);
		}

		this.id = id;
		this.name = name;
		this.role = role;
		this.goal = goal;
		this.dependencies = { ...dependencies };
		this.runStore = runStore;
		this.tracer = tracer;
		this.logger = logger;
	}

	async run(input, context = {}) {
		const agentRunId = context.agentRunId || randomUUID();
		const startedAt = new Date();

		this.runStore.create({
			runId: agentRunId,
			agentId: this.id,
			agentName: this.name,
			workflowId: context.workflowId || null,
			executionOrder: context.executionOrder || null,
			status: AgentStatus.PENDING,
			startTime: null,
			endTime: null,
			durationMs: null,
			error: null,
			input,
			output: null
		});

		this.runStore.update(agentRunId, {
			status: AgentStatus.RUNNING,
			startTime: startedAt.toISOString()
		});

		this._log("info", `${this.name} started`, {
			agentRunId,
			workflowId: context.workflowId || null,
			executionOrder: context.executionOrder || null
		});

		try {
			const output = await this.execute(input, {
				...context,
				agentRunId
			});
			const endedAt = new Date();
			const durationMs = endedAt.getTime() - startedAt.getTime();

			this.runStore.update(agentRunId, {
				status: AgentStatus.COMPLETED,
				endTime: endedAt.toISOString(),
				durationMs,
				output
			});

			if (this.tracer && context.workflowId && context.parentAgentId) {
				this.tracer.recordAgent({
					workflowId: context.workflowId,
					agentId: this.id,
					agentName: this.name,
					parentAgentId: context.parentAgentId || null,
					executionOrder: context.executionOrder || null,
					status: AgentStatus.COMPLETED,
					durationMs
				});
			}

			this._log("info", `${this.name} completed`, {
				agentRunId,
				durationMs
			});

			return output;
		} catch (error) {
			const agentError = this._normalizeError(error, context);
			const endedAt = new Date();
			const durationMs = endedAt.getTime() - startedAt.getTime();

			this.runStore.update(agentRunId, {
				status: AgentStatus.FAILED,
				endTime: endedAt.toISOString(),
				durationMs,
				error: agentError.toJSON()
			});

			if (this.tracer && context.workflowId && context.parentAgentId) {
				this.tracer.recordAgent({
					workflowId: context.workflowId,
					agentId: this.id,
					agentName: this.name,
					parentAgentId: context.parentAgentId || null,
					executionOrder: context.executionOrder || null,
					status: AgentStatus.FAILED,
					durationMs,
					error: agentError.toJSON()
				});
			}

			this._log("error", `${this.name} failed`, agentError.toJSON());
			throw agentError;
		}
	}

	async execute() {
		throw new Error(`${this.constructor.name} must implement execute(input, context)`);
	}

	_normalizeError(error, context = {}) {
		if (error instanceof AgentError) {
			return error;
		}

		return new AgentError(error.message || "Agent execution failed", {
			code: error.code || "AGENT_EXECUTION_FAILED",
			agentId: this.id,
			agentName: this.name,
			workflowId: context.workflowId || null,
			recoverable: false,
			fatal: true,
			cause: error,
			details: {
				stack: error.stack || null
			}
		});
	}

	_log(level, message, meta = {}) {
		const targetLogger = this.logger || console;
		const payload = {
			agentId: this.id,
			agentName: this.name,
			role: this.role,
			goal: this.goal,
			...meta
		};

		if (typeof targetLogger[level] === "function") {
			targetLogger[level](message, payload);
			return;
		}

		if (typeof targetLogger.log === "function") {
			targetLogger.log(message, payload);
		}
	}
}

module.exports = {
	BaseAgent
};