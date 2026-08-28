const {
    createEvent
} = require("../ipc/Event");

const {
    BaseAgent
} = require("../baseAgent");

const {
    createWriterInput,
    createWriterOutput,
    WriterInputSchema,
    WriterOutputSchema
} = require(
    "../contracts/researchContracts"
);

class WriterAgent extends BaseAgent {

    constructor({
        writerService,
        runtimeKernel,
        workflowOutputRepository,
        ...baseConfig
    }) {

        super(baseConfig);

        this.writerService =
            writerService;

        this.workflowOutputRepository =
            workflowOutputRepository;

        this.inputSchema =
            WriterInputSchema;

        this.runtimeKernel =
            runtimeKernel;

        this.outputSchema =
            WriterOutputSchema;
    }

    buildInput(state) {

        return createWriterInput({
            query:
                state.query,

            evidence:
                state.evidence || [],

            retrievedContext:
                state.retrievedContext || {},

            state:
                state.snapshot()
        });
    }

    async execute(
        input,
        context = {}
    ) {

        const revisionFeedback =
            context.state.revisionFeedback ||
            null;

        const revisionAttempt =
            context.state.revisionAttempt ||
            0;

        console.log(
            "\n========= WRITER INPUT ========="
        );

        console.log(
            "Evidence:",
            input.evidence?.length || 0
        );

        console.log(
            "Semantic chunks:",
            input.retrievedContext
                ?.semantic_context
                ?.length || 0
        );

        console.log(
            "Graph facts:",
            input.retrievedContext
                ?.graph_context
                ?.length || 0
        );

        console.log(
            "Revision attempt:",
            revisionAttempt
        );

        console.log(
            "================================\n"
        );

        /*
        IMPORTANT:

        You may need to update generateReport()
        to accept the third argument.

        generateReport(
            query,
            retrievedContext,
            options
        )
        */

        const report =
            await this.writerService.generateReport(
                input.query,
                {
                    ...input.retrievedContext,
                    evidence: input.evidence
                },
                {
                    mode: revisionFeedback ? "revision" : "initial",
                    revisionFeedback,
                    previousReport: context.state.report || null,
                    topics: context.state.topics || []
                }
            );

        const reportVersion =
            revisionAttempt > 0
                ? 2
                : 1;

        context.state.update({
            report,

            reportVersion
        });

        if (
            this.workflowOutputRepository &&
            context.workflowId
        ) {

            await this.workflowOutputRepository.save({
                workflowId:
                    context.workflowId,

                outputType:
                    reportVersion === 1
                        ? "REPORT"
                        : "REVISED_REPORT",

                content:
                    report
            });
        }

        await this.runtimeKernel.publish(
            createEvent({
                workflowId:
                    context.workflowId,

                eventType:
                    "writer.completed",

                producer:
                    this.id,

                payload: {
                    reportVersion
                }
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