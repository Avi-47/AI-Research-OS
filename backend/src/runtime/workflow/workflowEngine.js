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
	async executeAgent({agentId,workflowId,state,context,executionOrder,stepDefinition}) {
		const agent = this.registry.get(agentId);
		if (!agent) {
			throw new AgentError(
				`Agent not found in registry: ${agentId}`,
				{
					code: "AGENT_NOT_FOUND",
					workflowId,
					agentId,
					fatal: true
				}
			);
		}
		const trace = this.tracer.startStep({
				workflowId,
				agentId: agent.id,
				agentName:	agent.name,
				executionOrder
			});
		try {
			const input = typeof agent.buildInput === "function" ? agent.buildInput(state,{
							workflowId,
							executionOrder,
							stepDefinition
						}
					)
					: {
						state: state.snapshot()
					};
			const result = context.runtimeKernel ? await context.runtimeKernel.invoke(agent,state,{
							workflowId,
							executionOrder,
							stepDefinition
						}
					): await agent.run(input,{
							workflowId,
							executionOrder,
							state,
							stepDefinition
						}
					);

			if (this.researchStateRepository) {
				await this.researchStateRepository.save(
					workflowId,
					state.snapshot()
				);
			}
			const completedTrace = this.tracer.completeStep(
					trace.traceId,
					workflowId
				);
			if (completedTrace && this.agentRunRepository) {
				await this.agentRunRepository.save({
					workflowId,
					agentId: completedTrace.agentId,
					agentName: completedTrace.agentName,
					parentAgentId: completedTrace.parentAgentId ||null,
					executionOrder: completedTrace.executionOrder,
					status: completedTrace.status,
					startedAt: completedTrace.startedAt,
					endedAt: completedTrace.endedAt,
					durationMs: completedTrace.durationMs,
					error: completedTrace.error,
					result
				});
			}
			return result;
		} catch (error) {
			const normalizedError =
				error instanceof AgentError
					? error
					: new AgentError(
						error.message ||
						"Agent execution failed",
						{
							workflowId,
							agentId,
							fatal: true,
							cause: error
						}
					);

			const failedTrace = this.tracer.failStep(
					trace.traceId,
					workflowId,
					normalizedError
				);

			if (failedTrace &&this.agentRunRepository) {
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
					error:failedTrace.error,
					result: null
				});
			}
			throw normalizedError;
		}
	}
	async executeRevisionCycle({workflowId,state,context,executionOrder}) {
		const evaluation = state.evaluation;
		if (!evaluation || evaluation.decision !== "REVISE") {
			return [];
		}
		console.log("\n[WorkflowEngine] Quality below threshold.");
		console.log("[WorkflowEngine] Starting one revision attempt.");
		state.update({
			revisionAttempt: 1,
			revisionFeedback: evaluation.revisionFeedback || []
		});
		const results = [];
		/*
		----------------------------------------
		REVISED WRITER
		----------------------------------------
		*/
		const writerResult =
			await this.executeAgent({
				agentId: "writer-agent",
				workflowId,
				state,
				context,
				executionOrder: executionOrder + 1,
				stepDefinition: {
					agentId:
						"writer-agent",
					revision:
						true
				}
			});
		results.push(writerResult);

		/*
		----------------------------------------
		RE-EVALUATION
		----------------------------------------
		*/

		const evaluationResult =
			await this.executeAgent({
				agentId: "evaluation-agent",
				workflowId,
				state,
				context,
				executionOrder: executionOrder + 2,
				stepDefinition: {
					agentId:
						"evaluation-agent",
					revision:
						true
				}
			});
		results.push(evaluationResult);
		return results;
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
		if (!failedError) {
			const evaluation = state.evaluation;
			if (evaluation && evaluation.decision === "REVISE") {
				try {
					const revisionResults = await this.executeRevisionCycle({
							workflowId,
							state,
							context,
							executionOrder: workflowDefinition.steps.length
						});
					agentResults.push(
						...revisionResults
					);
				} catch (error) {
					this.logger.error(
						"[WorkflowEngine] Revision cycle failed:",
						error.message
					);
					/*
					Do not crash the entire research workflow.
					*/
					state.update({
						metadata: {
							revisionError:
								error.message
						}
					});
				}
			}
		}
		const traces = this.tracer.getWorkflowTraces(workflowId);
		const summary = this.tracer.getWorkflowSummary(workflowId);

		const evaluation = state.evaluation;

		const workflowPassed = !failedError;

		return {
			workflowId,
			state:state.snapshot(),
			traces,
			graph: graph.toJSON(),
			agentResults,
			summary,
			evaluation: state.evaluation || null,
			success: workflowPassed,
			failedAgent: failedError ? failedAgent : null,
			error: failedError ? failedError.toJSON() : null
		};
	}
}

module.exports = {
	WorkflowEngine
};