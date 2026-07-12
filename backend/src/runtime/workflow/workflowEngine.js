const { randomUUID } = require("crypto");
const { AgentError } = require("../errors/agentError");
const { createResearchState } = require("../models/researchState.model");
const { AgentStatus } = require("../models/agentStatus");
const { WorkflowGraph } = require("./workflowGraph");

class WorkflowEngine {
	constructor({registry, tracer, agentRunRepository, researchStateRepository, logger = console}) {
		if (!registry) {
			throw new Error("WorkflowEngine requires an agent registry");
		}
		if (!tracer) {
			throw new Error("WorkflowEngine requires an execution tracer");
		}
		this.registry = registry;
		this.tracer = tracer;
		this.agentRunRepository = agentRunRepository;
		this.researchStateRepository = researchStateRepository;
		this.logger = logger;
	}

	async execute(workflowDefinition, initialState, context = {}) {
		const workflowId = context.workflowId || workflowDefinition.workflowId || randomUUID();
		const state = initialState && typeof initialState.update === "function"	? initialState : createResearchState(initialState);
		if (this.researchStateRepository) {
			await this.researchStateRepository.save(
				workflowId,
				state.snapshot()
			);
		}
		this.tracer.clear();
		let failedError = null;
		let failedAgent = null;

		const agentResults = [];
		const graph = new WorkflowGraph();

		for (let index = 0; index < workflowDefinition.steps.length; index += 1) {
			const stepDefinition = workflowDefinition.steps[index];
			const agentId = typeof stepDefinition === "string" ? stepDefinition : stepDefinition.agentId;
			graph.addNode(agentId);

			if (index > 0) {
				const previousStep =
					typeof workflowDefinition.steps[index - 1] === "string"
						? workflowDefinition.steps[index - 1]
						: workflowDefinition.steps[index - 1].agentId;

				graph.addEdge(previousStep, agentId);
			}
			const agent = this.registry.get(agentId);

			if (!agent) {
				failedError = new AgentError(`Agent not found in registry: ${agentId}`, {
					code: "AGENT_NOT_FOUND",
					workflowId,
					agentId,
					fatal: true
				});
				failedAgent = agentId;
				break;
			}

			const executionOrder = index + 1;
			const trace = this.tracer.startStep({
				workflowId,
				agentId: agent.id,
				agentName: agent.name,
				executionOrder
			});

			try {
				const input = typeof agent.buildInput === "function"
					? agent.buildInput(state, {
						workflowId,
						executionOrder,
						stepDefinition
					})
					: { state: state.snapshot() };

				const result =
					context.runtimeKernel
						? await context.runtimeKernel.invoke(
							agent,
							state,
							{
								workflowId,
								executionOrder,
								graph,
								stepDefinition
							}
						)
						: await agent.run(
							input,
							{
								workflowId,
								executionOrder,
								state,
								graph,
								stepDefinition
							}
						);
				console.log(
					`[WorkflowEngine] After ${agent.name}:`,
					state.evidence.length
				);
				if (this.researchStateRepository) {
					await this.researchStateRepository.save(
						workflowId,
						state.snapshot()
					);
				}

				agentResults.push(result);

				const completedTrace = this.tracer.completeStep(
					trace.traceId,
					workflowId
				);

				if (completedTrace && this.agentRunRepository) {
					await this.agentRunRepository.save({
						workflowId,
						agentId: completedTrace.agentId,
						agentName: completedTrace.agentName,
						parentAgentId: completedTrace.parentAgentId || null,
						executionOrder: completedTrace.executionOrder,
						status: completedTrace.status,
						startedAt: completedTrace.startedAt,
						endedAt: completedTrace.endedAt,
						durationMs: completedTrace.durationMs,
						error: completedTrace.error,
						result
					});
				}
				if (completedTrace && typeof stepDefinition.onComplete === "function") {
					stepDefinition.onComplete({
						state,
						output: result.output,
						result,
						workflowId,
						agent
					});
				}
			} catch (error) {
				const normalizedError = error instanceof AgentError
					? error
					: new AgentError(error.message || "Workflow execution failed", {
						workflowId,
						agentId,
						fatal: true,
						cause: error
					});

				const failedTrace = this.tracer.failStep(
					trace.traceId,
					workflowId,
					normalizedError
				);
				if (failedTrace && this.agentRunRepository) {
					await this.agentRunRepository.save({
						workflowId,
						agentId: failedTrace.agentId,
						agentName: failedTrace.agentName,
						parentAgentId: failedTrace.parentAgentId || null,
						executionOrder: failedTrace.executionOrder,
						status: failedTrace.status,
						startedAt: failedTrace.startedAt,
						endedAt: failedTrace.endedAt,
						durationMs: failedTrace.durationMs,
						error: failedTrace.error,
						result: null
					});
				}
				failedError = normalizedError;
				failedAgent = agent.id;
				if (this.researchStateRepository) {
					await this.researchStateRepository.save(
						workflowId,
						state.snapshot()
					);
				}
				break;
			}
		}

		const traces = this.tracer.getWorkflowTraces(workflowId);
		const summary = this.tracer.getWorkflowSummary(workflowId);

		return {
			workflowId,
			state: state.snapshot(),
			traces,
			graph: graph.toJSON(),
			agentResults,
			summary,
			success: !failedError,
			failedAgent,
			error: failedError ? failedError.toJSON() : null
		};
	}
}

module.exports = {
	WorkflowEngine
};