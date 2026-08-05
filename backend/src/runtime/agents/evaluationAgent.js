const { createEvent } = require("../ipc/Event");
const { BaseAgent } = require("../baseAgent");
class EvaluationAgent extends BaseAgent {
    constructor({
        evaluationRuntime,
        runtimeKernel,
        ...baseConfig
    }) {
        super(baseConfig);
        this.evaluationRuntime = evaluationRuntime;
        this.runtimeKernel = runtimeKernel;
    }
    buildInput(state) {
        return {
            report: state.report,
            evidence: state.evidence,
            retrievedContext: state.retrievedContext
        };
    }
    async execute(input, context = {}) {
        const evaluation =
            await this.evaluationRuntime.evaluate({
                workflowId: context.workflowId,
                report: input.report,
                retrievedContext: input.retrievedContext
            });
        context.state.update({
            evaluation
        });
        await this.runtimeKernel.publish(
            createEvent({
                workflowId: context.workflowId,
                eventType: "evaluation.completed",
                producer: this.id,
                payload: {}
            })
        );
        return {
            evaluation
        };
    }
}
module.exports = {
    EvaluationAgent
};