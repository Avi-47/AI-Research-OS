const { randomUUID } = require("crypto");
const { AgentStatus } = require("./agentStatus");

class AgentRun {
	constructor({
		runId = randomUUID(),
		agentId,
		agentName,
		workflowId = null,
		executionOrder = null,
		status = AgentStatus.PENDING,
		startTime = null,
		endTime = null,
		durationMs = null,
		error = null,
		input = null,
		output = null,
		result = null
	}) {
		this.runId = runId;
		this.agentId = agentId;
		this.agentName = agentName;
		this.workflowId = workflowId;
		this.executionOrder = executionOrder;
		this.status = status;
		this.startTime = startTime;
		this.endTime = endTime;
		this.durationMs = durationMs;
		this.error = error;
		this.input = input;
		this.output = output;
		this.result = result;
	}

	update(patch = {}) {
		Object.assign(this, patch);
		return this;
	}

	snapshot() {
		return {
			runId: this.runId,
			agentId: this.agentId,
			agentName: this.agentName,
			workflowId: this.workflowId,
			executionOrder: this.executionOrder,
			status: this.status,
			startTime: this.startTime,
			endTime: this.endTime,
			durationMs: this.durationMs,
			error: this.error,
			input: this.input,
			output: this.output,
			result: this.result
		};
	}

	toJSON() {
		return this.snapshot();
	}
}

class InMemoryAgentRunStore {
	constructor() {
		this.runs = new Map();
	}

	create(record) {
		const agentRun = record instanceof AgentRun ? record : new AgentRun(record);
		this.runs.set(agentRun.runId, agentRun);
		return agentRun.snapshot();
	}

	update(runId, patch) {
		const agentRun = this.runs.get(runId);
		if (!agentRun) {
			throw new Error(`Agent run not found: ${runId}`);
		}

		agentRun.update(patch);
		return agentRun.snapshot();
	}

	get(runId) {
		const agentRun = this.runs.get(runId);
		return agentRun ? agentRun.snapshot() : null;
	}

	list() {
		return [...this.runs.values()].map((agentRun) => agentRun.snapshot());
	}

	remove(runId) {
		return this.runs.delete(runId);
	}

	clear() {
		this.runs.clear();
	}
}

module.exports = {
	AgentRun,
	InMemoryAgentRunStore
};