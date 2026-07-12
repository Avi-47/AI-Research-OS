const { randomUUID } = require("crypto");
const { assertAgentContract } = require("../contracts/agent.contract");
const { AgentStatus } = require("../models/agentStatus");
const { AgentError } = require("../errors/agentError");
const { AgentResultSchema } = require("../contracts/researchContracts");

class BaseAgent {
	constructor({
		id,
		name,
		role,
		goal,
		inputSchema = null,
		outputSchema = null,
		dependencies = {},
		runStore,
		logger = console
	}) {
		this.id = id;
		this.name = name;
		this.role = role;
		this.goal = goal;
		this.inputSchema = inputSchema;
		this.outputSchema = outputSchema;
		this.dependencies = Object.freeze({ ...dependencies });
		this.runStore = runStore;
		this.logger = logger;

		assertAgentContract(this);

		if (!this.runStore) {
			throw new Error(`Agent run store is required for agent: ${this.id}`);
		}
	}

	async run(input, context = {}) {
		const runId = context.runId || randomUUID();
		const startedAt = new Date();
		this.runStore.create({
			runId,
			agentId: this.id,
			agentName: this.name,
			status: AgentStatus.PENDING,
			startTime: null,
			endTime: null,
			durationMs: null,
			error: null
		});

		this.runStore.update(runId, {
			status: AgentStatus.RUNNING,
			startTime: startedAt.toISOString()
		});

		try {
			const output = await this.execute(input, {
				...context,
				agentRunId: runId,
				startedAt: startedAt.toISOString()
			});
			const endedAt = new Date();
			const durationMs = endedAt.getTime() - startedAt.getTime();
			const result = {
				agentId: this.id,
				status: AgentStatus.COMPLETED,
				durationMs,
				output
			};

			this.runStore.update(runId, {
				status: AgentStatus.COMPLETED,
				endTime: endedAt.toISOString(),
				durationMs,
				result,
				output,
				error: null
			});
			return result;
		} catch (error) {
			const agentError = AgentError.from(error, {
				agentId: this.id,
				agentName: this.name
			});
			const endedAt = new Date();
			const durationMs = endedAt.getTime() - startedAt.getTime();
			const result = {
				agentId: this.id,
				status: AgentStatus.FAILED,
				durationMs,
				output: null
			};
			this.runStore.update(runId, {
				status: AgentStatus.FAILED,
				endTime: endedAt.toISOString(),
				durationMs,
				result,
				output: null,
				error: agentError.toJSON()
			});
			throw agentError;
		}
	}

	/* eslint-disable class-methods-use-this */
	async execute() {
		throw new Error("BaseAgent execute() must be implemented by subclasses");
	}
	/* eslint-enable class-methods-use-this */
}

module.exports = {
	BaseAgent
};