const { BaseAgent } =
    require("../baseAgent");

const {
    createEvent
} = require("../ipc/Event");

class EvaluationAgent extends BaseAgent {
    constructor({
        evaluationRuntime,
        runtimeKernel,
        ...baseConfig
    }) {
        super(baseConfig);

        this.evaluationRuntime =
            evaluationRuntime;

        this.runtimeKernel =
            runtimeKernel;
    }

    buildInput(state) {
        return {
            report: state.report,

            evidence:
                state.evidence,

            retrievedContext:
                state.retrievedContext
        };
    }

    async execute(input, context = {}) {

        const result =
            await this.evaluationRuntime.evaluate({
                workflowId:
                    context.workflowId,

                report:
                    input.report,

                evidence:
                    input.evidence,

                retrievedContext:
                    input.retrievedContext
            });

        context.state.update({
            metadata: {
                evaluation: result
            }
        });

        if (
            this.runtimeKernel &&
            context.workflowId
        ) {
            await this.runtimeKernel.publish(
                createEvent({
                    workflowId:
                        context.workflowId,

                    eventType:
                        "evaluation.completed",

                    producer:
                        this.id,

                    payload: {
                        evaluation: result
                    }
                })
            );
        }

        return {
            evaluation:
                result
        };
    }
}

module.exports = {
    EvaluationAgent
};