const { createEvent } = require("../ipc/Event");
const retrievalService = require("../../services/retrieval.service");
const semanticMemoryService = require("../../services/semanticMemory.service");
const { AgentRunRepository } = require("../storage/agentRunRepository");
const { TopicResearchAgent } = require("./topicResearchAgent");
const { BaseAgent } = require("../baseAgent");
const {
	createResearchInput,
	createResearchOutput,
	ResearchInputSchema,
	ResearchOutputSchema
} = require("../contracts/researchContracts");

class ResearchAgent extends BaseAgent {
	constructor({ researchService, scheduler, runtimeKernel, evidenceRepository, runStore, tracer, logger,...baseConfig}) {
		super({...baseConfig,runStore,tracer,logger});
		
		this.researchService = researchService;
		this.scheduler = scheduler;
		this.runStore = runStore;
		this.tracer = tracer;
		this.logger = logger;
		this.runtimeKernel = runtimeKernel;
		this.evidenceRepository = evidenceRepository;
		this.inputSchema = ResearchInputSchema;
		this.outputSchema = ResearchOutputSchema;
	}

	buildInput(state) {
		return createResearchInput({
			query: state.query,
			topics: state.topics,
			state: state.snapshot()
		});
	}

	async execute(input, context = {}) {
		const graph = context.graph;
		const memory = await retrievalService.retrieve(
			input.query,
			context.state.evidence
		);

		const topicsToResearch = input.topics.filter(topic => {
			const normalizedTopic = topic.toLowerCase();

			return !memory.some(item => {
				const memoryTopic = String(item.topic || "").toLowerCase();

				return (
					memoryTopic.includes(normalizedTopic) ||
					normalizedTopic.includes(memoryTopic)
				);
			});
		});

		console.log(
			`Skipped ${
				input.topics.length - topicsToResearch.length
			} topics already covered by memory`
		);

		console.log(
			`Skipped ${
				input.topics.length - topicsToResearch.length
			} topics already covered by memory`
		);

		console.log("\n========= MEMORY =========");
		console.log(`Retrieved ${memory.length} memory chunks`);
		console.log("==========================\n");
		const topicStatus = {};
		for (const topic of input.topics) {
			topicStatus[topic] = "QUEUED";
		}
		
		context.state.update({ topicStatus });
		const workers = topicsToResearch.map((topic, index) =>
			new TopicResearchAgent({
				id: `topic-research-${index + 1}`,
				name: `Topic Research Agent ${index + 1}`,
				role: "TOPIC_RESEARCH",
				goal: `Research ${topic}`,
				dependencies: {
					researchService: this.researchService
				},
				runStore: this.runStore,
				tracer: this.tracer,
				logger: this.logger
			})
		);
		workers.forEach((worker) => {
			graph?.addNode(worker.id);
			graph?.addEdge(
				"research-agent",
				worker.id
			);
		});
		const workerResults = await this.scheduler.schedule(
			workers.map((worker, index) => {
				topicStatus[topicsToResearch[index]] = "RUNNING";
				return () =>
					worker.run(
						{ topic: input.topics[index] },
						{
							workflowId: context.workflowId,
							parentAgentId: this.id,
							graph
						}
					);
			})
		);
		const repository = new AgentRunRepository();
		
		const evidence = memory.map(item => ({
			topic: item.topic,
			provenance: item.provenance,
			notes: item.notes,
			source: "memory"
		}));
		console.log(
			"[Research] Evidence collected:",
			evidence.length
		);
		graph?.addNode("writer-agent");
		for (let index = 0; index < workerResults.length; index++) {
			const result = workerResults[index];
			const topic = input.topics[index];
			const trace = this.tracer
				.getWorkflowTraces(context.workflowId)
				.find(t => t.agentId === workers[index].id);

			if (trace) {
				await repository.save({
					workflowId: context.workflowId,
					agentId: trace.agentId,
					agentName: trace.agentName,
					parentAgentId: trace.parentAgentId,
					executionOrder: trace.executionOrder,
					status: trace.status,
					startedAt: trace.startedAt,
					endedAt: trace.endedAt,
					durationMs: trace.durationMs,
					error: trace.error,
					result:
						result.status === "fulfilled"
							? result.value
							: null
				});
			}
			if (result.status === "fulfilled") {
				topicStatus[topic] = "COMPLETED";
				evidence.push(
					...result.value.evidence
				);
				for (const item of result.value.evidence) {
					await this.evidenceRepository.save({
						workflowId: context.workflowId,
						agentId: workers[index].id,
						topic: item.topic,
						provenance: item.provenance,
						notes: item.notes
					});
					await this.runtimeKernel.publish(
						createEvent({
							eventType: "evidence.stored",
							payload: {
								evidence
							}
						})
					);
				}
				graph?.addEdge(
					workers[index].id,
					"writer-agent"
				);
			}else {
				topicStatus[topic] = "FAILED";
			}
		}
		context.state.update({
			evidence,
			topicStatus
		});
		await semanticMemoryService.indexEvidence(evidence);

		await this.runtimeKernel.publish(
			createEvent({
				workflowId: context.workflowId,
				eventType: "research.completed",
				producer: this.id,
				payload: {
					evidenceCount: evidence.length
				}
			})
		);
		return createResearchOutput({evidence});
	}

}

module.exports = {
	ResearchAgent
};