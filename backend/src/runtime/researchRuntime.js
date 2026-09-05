const { researchWorkflowDefinition } = require("./workflow/researchWorkflow.definition");
const { EvaluationRuntime } = require("../evaluation/EvaluationRuntime");
const { EvaluationRepository } = require("../evaluation/EvaluationRepository");
const RuleEvaluator = require("../evaluation/RuleEvaluator");
const { LLMEvaluator } = require("../evaluation/LLMEvaluator");
const { EvaluationAgent } = require("./agents/evaluationAgent");
const aiGateway = require("../ai/gateway/aiGateway");
const {GraphRepository} = require("../graph/repository/graphRepository");
const graphBuilder = require("../graph/builder/graphBuilder");
const {GraphBuilderAgent} = require("./agents/graphBuilderAgent");
const { EventLogRepository } = require("./storage/EventLogRepository");
const { RedisMessageBus } = require("./ipc/RedisMessageBus");
const { RuntimeKernel } = require("./kernel/RuntimeKernel");
const { InMemoryMessageBus } = require("./ipc/InMemoryMessageBus");
const { SubscriptionRegistry } = require("./ipc/SubscriptionRegistry");
const {ResearchStateRepository} = require("./storage/researchStateRepository");
const { EvidenceRepository } = require("./storage/evidenceRepository");
const {WorkflowOutputRepository} = require("./storage/workflowOutputRepository");
const { AgentRunRepository } = require("./storage/agentRunRepository");
const plannerService = require("../services/planner.service");
const evidenceService = require("../services/evidence.service");
const writerService = require("../services/llm.service");
const { AgentRegistry } = require("./registry/agentRegistry");
const { AgentScheduler } = require("./scheduler/agentScheduler");
const { InMemoryAgentRunStore } = require("./models/agentRun.model");
const { ExecutionTracer } = require("./tracing/executionTracer");
const { WorkflowEngine } = require("./workflow/workflowEngine");
const { PlannerAgent } = require("./agents/plannerAgent");
const { ResearchAgent } = require("./agents/researchAgent");
const { WriterAgent } = require("./agents/writerAgent");
const { createResearchState } = require("./models/researchState.model");
const { FileWorkflowRunRepository } = require("./storage/workflowRunRepository");

function createResearchRuntime(overrides = {}) {
	const logger = overrides.logger || console;
	const runStore = overrides.runStore || new InMemoryAgentRunStore();
	const tracer = overrides.tracer || new ExecutionTracer();
	const registry = overrides.registry || new AgentRegistry();
	const workflowGraphs = new Map();
	const scheduler = new AgentScheduler({ logger });
	const eventLogRepository = new EventLogRepository();
	const graphRepository = new GraphRepository();
	const graphBuilderAgent =
    new GraphBuilderAgent({
        id: "graph-builder-agent",
        name: "Graph Builder Agent",
        role: "GRAPH",
        goal: "Convert evidence into a knowledge graph",
        dependencies: {
            graphBuilder,
            graphRepository
        },
        runStore,
        tracer,
        logger
    });

	const messageBus = overrides.messageBus || new RedisMessageBus();
	const subscriptionRegistry = new SubscriptionRegistry();
	const runtimeKernel = new RuntimeKernel({
        messageBus,
        subscriptionRegistry,
        eventLogRepository
    });
	
	const workflowOutputRepository = overrides.workflowOutputRepository || new WorkflowOutputRepository({
		logger
	});

	const evaluationRepository = overrides.evaluationRepository || new EvaluationRepository({
			logger
		});

	const ruleEvaluator = overrides.ruleEvaluator || new RuleEvaluator();

	const llmEvaluator = overrides.llmEvaluator || new LLMEvaluator({
			aiGateway
		});

	const evaluationRuntime = overrides.evaluationRuntime || new EvaluationRuntime({
			ruleEvaluator,
			llmEvaluator,
			evaluationRepository
		});

	const evidenceRepository = overrides.evidenceRepository || new EvidenceRepository({
		logger
	});
	
	const researchStateRepository = overrides.researchStateRepository || new ResearchStateRepository();

	const plannerAgent = new PlannerAgent({
		id: "planner-agent",
		name: "Planner Agent",
		role: "PLANNER",
		goal: "Translate the query into research topics",
		dependencies: {
			plannerService: overrides.plannerService || plannerService
		},
		runStore,
		tracer,
		logger,
		runtimeKernel,
		plannerService: overrides.plannerService || plannerService
	});
	
	const researchAgent = new ResearchAgent({
		id: "research-agent",
		name: "Research Agent",
		role: "RESEARCH",
		goal: "Collect structured evidence for each topic",
		dependencies: {
			researchService:
				overrides.researchService || evidenceService
		},
		runStore,
		tracer,
		logger,
		runtimeKernel,
		scheduler,
		researchService:
			overrides.researchService || evidenceService,
		evidenceRepository
	});

	const writerAgent = new WriterAgent({
		id: "writer-agent",
		name: "Writer Agent",
		role: "WRITER",
		goal: "Generate a report from collected evidence",
		dependencies: {
			writerService: overrides.writerService || writerService
		},
		runStore,
		tracer,
		logger,
		runtimeKernel,
		writerService: overrides.writerService || writerService,
		workflowOutputRepository
	});

	const evaluationAgent = new EvaluationAgent({
        id: "evaluation-agent",
        name: "Evaluation Agent",
        role: "EVALUATION",
        goal: "Evaluate generated report quality",
        runStore,
        tracer,
        logger,
        runtimeKernel,
        evaluationRuntime
    });

	registry.register(plannerAgent);
	registry.register(researchAgent);
	registry.register(writerAgent);
	registry.register(graphBuilderAgent);
	registry.register(evaluationAgent);


	// subscriptionRegistry.register(
	// 	"evidence.stored",
	// 	async (event) => {
	// 		await graphBuilderAgent.run(event);
	// 	}
	// );
	subscriptionRegistry.register(
		"planner.completed",
		async () => {
			logger.log("[Runtime] Planner finished");
		}
	);
	subscriptionRegistry.register(
		"research.completed",
		async (event) => {
			logger.log(
				"[Runtime] Research finished"
			);
			try {
				const graphResult = await graphBuilderAgent.run(
					{
						payload: {
							evidence: event.payload.evidence
						}
					},
					{
						workflowId: event.workflowId,
						runtimeKernel
					}
				);
				workflowGraphs.set(event.workflowId, graphResult?.graph || null);
				logger.log(
					"[Runtime] Knowledge graph built successfully"
				);
			} catch (error) {
				logger.error(
					"[Runtime] Graph building failed, continuing workflow:",
					error.message
				);
			}
		}
	);
	subscriptionRegistry.register(
		"writer.completed",
		async () => {
			logger.log("[Runtime] Writer finished");
		}
	);
	subscriptionRegistry.register(
		"evaluation.completed",
		async () => {
			logger.log("[Runtime] Evaluation finished");
		}
	);
	
	const workflowRunRepository = overrides.workflowRunRepository || new FileWorkflowRunRepository({
		baseDirectory: overrides.workflowRunDirectory || require("path").join(__dirname, "..", "..", "workflow-runs"),
		logger
	});
	const agentRunRepository = overrides.agentRunRepository || new AgentRunRepository({
		logger
	});
	const workflowEngine = overrides.workflowEngine || new WorkflowEngine({
        registry,
        tracer,
        logger,
        agentRunRepository,
		researchStateRepository
    });

	// const workflowDefinition = overrides.workflowDefinition || {
	// 	workflowId: "research-workflow",
	// 	name: "Research Workflow",
	// 	steps: ["planner-agent", "research-agent", "writer-agent", "evaluation-agent"]
	// };

	const workflowDefinition = overrides.workflowDefinition || researchWorkflowDefinition;



	async function execute(query, context = {}) {
		const state = createResearchState({ query });
		const execution = await workflowEngine.execute(
			workflowDefinition,
			state,
			{
				workflowId:
					context.workflowId || null,
				runtimeKernel
			}
		);
		const schedulerMetrics = scheduler.getMetrics();

		return {
			...execution,
			schedulerMetrics,
			query: execution.state.query,
			topics: execution.state.topics,
			evidence: execution.state.evidence,
				report: execution.state.report,
				workflowGraph: workflowGraphs.get(execution.workflowId) || null
		};
	}

	return {
		logger,
		workflowOutputRepository,
		evaluationRepository,
		ruleEvaluator,
		llmEvaluator,
		evaluationRuntime,
		runStore,
		tracer,
		registry,
		workflowEngine,
		workflowRunRepository,
		agentRunRepository,
		scheduler,
		messageBus,
		subscriptionRegistry,
		runtimeKernel,
		workflowDefinition,
		evidenceRepository,
		researchStateRepository,
		execute
	};
}

let defaultRuntime = null;

function getResearchRuntime(overrides = {}) {
	if (overrides && Object.keys(overrides).length > 0) {
		return createResearchRuntime(overrides);
	}
	if (!defaultRuntime) {
		defaultRuntime = createResearchRuntime();
	}
	return defaultRuntime;
}

module.exports = {
	createResearchRuntime,
	getResearchRuntime
};