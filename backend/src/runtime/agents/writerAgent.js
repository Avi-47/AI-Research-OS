const { createEvent } = require("../ipc/Event");
const { BaseAgent } = require("../baseAgent");
const {
	createWriterInput,
	createWriterOutput,
	WriterInputSchema,
	WriterOutputSchema
} = require("../contracts/researchContracts");

class WriterAgent extends BaseAgent {
	constructor({writerService,runtimeKernel,workflowOutputRepository,...baseConfig}) {
		super(baseConfig);
		this.writerService = writerService;
		this.workflowOutputRepository = workflowOutputRepository;
		this.inputSchema = WriterInputSchema;
		this.runtimeKernel = runtimeKernel;
		this.outputSchema = WriterOutputSchema;
	}

	buildInput(state) {
		return createWriterInput({
			query: state.query,
			evidence: state.evidence,
			retrievedContext: state.retrievedContext,
			state: state.snapshot()
		});
	}

	async execute(input, context = {}) {

		console.log("\n========= WRITER INPUT =========");
		console.log(
			"Semantic chunks:",
			input.retrievedContext.semantic_context.length
		);
		console.log(
			"Graph facts:",
			input.retrievedContext.graph_context.length
		);
		console.log(
			"Metadata:",
			input.retrievedContext.metadata
		);
		console.log("================================\n");

		const report = await this.writerService.generateReport(
			input.query,
			input.retrievedContext
		);

		context.state.update({ report });
		if (
			this.workflowOutputRepository &&
			context.workflowId
		) {
			await this.workflowOutputRepository.save({
				workflowId: context.workflowId,
				outputType: "REPORT",
				content: report
			});
		}
		await this.runtimeKernel.publish(
			createEvent({
				workflowId: context.workflowId,
				eventType: "writer.completed",
				producer: this.id,
				payload: {}
			})
		);

		return createWriterOutput({
			report
		});
	}
}

module.exports = {
	WriterAgent
};