const { randomUUID } = require("crypto");
const { AgentStatus } = require("../models/agentStatus");

class ExecutionTracer {
	constructor() {
		this.workflows = new Map();
	}

	startStep({ workflowId, agentId, agentName, executionOrder }) {
		const traceId = randomUUID();
		const entry = {
			traceId,
			workflowId,
			agentId,
			agentName,
			executionOrder,
			status: AgentStatus.RUNNING,
			startedAt: new Date().toISOString(),
			endedAt: null,
			durationMs: null,
			error: null
		};

		this._getWorkflowEntries(workflowId).push(entry);
		return entry;
	}
	recordAgent({workflowId, agentId, agentName, parentAgentId = null, executionOrder = null, status, durationMs = null, error = null}) {
		const entry = {
			traceId: randomUUID(),
			workflowId,
			agentId,
			agentName,
			parentAgentId,
			executionOrder,
			status,
			startedAt: null,
			endedAt: null,
			durationMs,
			error
		};

		this._getWorkflowEntries(workflowId).push(entry);

		return entry;
	}

	completeStep(traceId, workflowId) {
		const entry = this._findTrace(workflowId, traceId);
		if (!entry) {
			return null;
		}

		entry.status = AgentStatus.COMPLETED;
		entry.endedAt = new Date().toISOString();
		entry.durationMs = new Date(entry.endedAt).getTime() - new Date(entry.startedAt).getTime();
		return { ...entry };
	}

	failStep(traceId, workflowId, error) {
		const entry = this._findTrace(workflowId, traceId);
		if (!entry) {
			return null;
		}

		entry.status = AgentStatus.FAILED;
		entry.endedAt = new Date().toISOString();
		entry.durationMs = new Date(entry.endedAt).getTime() - new Date(entry.startedAt).getTime();
		entry.error = typeof error?.toJSON === "function" ? error.toJSON() : {
			name: error?.name || "Error",
			message: error?.message || "Workflow step failed"
		};
		return { ...entry };
	}

	getWorkflowTraces(workflowId) {
		return this._getWorkflowEntries(workflowId).map((entry) => ({ ...entry }));
	}

	getWorkflowSummary(workflowId) {
		const traces = this.getWorkflowTraces(workflowId);
		const completed = traces.filter((trace) => trace.status === AgentStatus.COMPLETED).length;
		const failed = traces.filter((trace) => trace.status === AgentStatus.FAILED).length;
		const starts = traces.map(t => t.startedAt).filter(Boolean).map(v => new Date(v).getTime());
		const ends = traces.map(t => t.endedAt).filter(Boolean).map(v => new Date(v).getTime());
		const totalDurationMs = starts.length && ends.length ? Math.max(...ends) - Math.min(...starts): 0;

		return {
			workflowId,
			stepCount: traces.length,
			completedCount: completed,
			failedCount: failed,
			success: failed === 0,
			totalDurationMs,
			steps: traces.map((trace) => ({
				agentId: trace.agentId,
				agentName: trace.agentName,
				parentAgentId: trace.parentAgentId || null,
				executionOrder: trace.executionOrder,
				status: trace.status,
				durationMs: trace.durationMs
			}))
		};
	}

	clear() {
		this.workflows.clear();
	}

	_getWorkflowEntries(workflowId) {
		if (!this.workflows.has(workflowId)) {
			this.workflows.set(workflowId, []);
		}

		return this.workflows.get(workflowId);
	}

	_findTrace(workflowId, traceId) {
		return this._getWorkflowEntries(workflowId).find((entry) => entry.traceId === traceId) || null;
	}
}

module.exports = {
	ExecutionTracer
};