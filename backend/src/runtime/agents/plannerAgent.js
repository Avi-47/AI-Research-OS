const { createEvent } = require("../ipc/Event");
const { BaseAgent } = require("../baseAgent");
const {
	createPlannerInput,
	createPlannerOutput,
	PlannerInputSchema,
	PlannerOutputSchema
} = require("../contracts/researchContracts");

class PlannerAgent extends BaseAgent {
	constructor({ plannerService, runtimeKernel, ...baseConfig }) {
		super(baseConfig);
		this.plannerService = plannerService;
		this.inputSchema = PlannerInputSchema;
		this.outputSchema = PlannerOutputSchema;
		this.runtimeKernel = runtimeKernel;
	}

	buildInput(state) {
		return createPlannerInput({
			query: state.query,
			state: state.snapshot()
		});
	}

	async execute(input, context = {}) {
		const topics = await this.plannerService.generateTopics(input.query);
		context.state.update({ topics });

		await this.runtimeKernel.publish(
			createEvent({
				workflowId: context.workflowId,
				eventType: "planner.completed",
				producer: this.id,
				payload: {
					topics
				}
			})
		);

		return createPlannerOutput({
			topics
		});
	}
}

module.exports = {
	PlannerAgent
};