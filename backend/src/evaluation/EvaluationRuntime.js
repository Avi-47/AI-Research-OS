class EvaluationRuntime {
    constructor({
        ruleEvaluator,
        llmEvaluator,
        evaluationRepository,
        logger = console,
        passingScore = 60
    }) {
        this.ruleEvaluator = ruleEvaluator;
        this.llmEvaluator = llmEvaluator;
        this.evaluationRepository = evaluationRepository;
        this.logger = logger;
        this.passingScore = passingScore;
    }

    async evaluate({
        workflowId,
        report,
        evidence,
        retrievedContext
    }) {
        const ruleResult =
            await this.ruleEvaluator.evaluate({
                report,
                evidence,
                retrievedContext
            });

        let llmResult = null;

        try {
            llmResult =
                await this.llmEvaluator.evaluate({
                    report,
                    evidence,
                    retrievedContext
                });
        } catch (error) {
            this.logger.warn(
                "[EvaluationRuntime] LLM evaluation failed. Continuing with deterministic evaluation."
            );
        }

        const ruleScore =
            Number(ruleResult.score ?? 0);

        const llmScore =
            llmResult
                ? Number(llmResult.score ?? 0)
                : null;

        const overallScore =
            llmScore !== null
                ? Math.round(
                    (ruleScore + llmScore) / 2
                )
                : ruleScore;

        const passed =
            overallScore >= this.passingScore;

        const result = {
            workflowId,

            overallScore,

            ruleScore,

            llmScore,

            passed,

            ruleEvaluation:
                ruleResult,

            llmEvaluation:
                llmResult,

            evaluatedAt:
                new Date().toISOString()
        };

        const savedEvaluation =
            await this.evaluationRepository.save({
                workflowId,

                overallScore,

                ruleScore,

                llmScore,

                passed,

                result
            });

        return {
            ...result,

            evaluationId:
                savedEvaluation?.id
        };
    }
}

module.exports = {
    EvaluationRuntime
};