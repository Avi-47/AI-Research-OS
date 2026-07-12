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
			state: state.snapshot()
		});
	}

	async execute(input, context = {}) {
		
		const report = await this.writerService.generateReport(input.query,input.evidence);
		
		context.state.update({report});
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