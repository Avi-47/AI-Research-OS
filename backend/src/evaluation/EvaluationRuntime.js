const RuleEvaluator = require("./RuleEvaluator");
const LLMEvaluator = require("./LLMEvaluator");
const {
    createEvaluationResult
} = require("./EvaluationResult");
class EvaluationRuntime {
    constructor({
        ruleEvaluator,
        llmEvaluator,
        evaluationRepository,
        logger = console
    }) {
        this.ruleEvaluator = ruleEvaluator;
        this.llmEvaluator = llmEvaluator;
        this.evaluationRepository = evaluationRepository;
        this.logger = logger;
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
                "[Evaluation] LLM evaluation failed. Using rule evaluation only."
            );
        }

        const ruleScore =
            Number(ruleResult.score || 0);

        const llmScore =
            llmResult
                ? Number(llmResult.score || 0)
                : null;

        const overallScore =
            llmScore !== null
                ? (ruleScore + llmScore) / 2
                : ruleScore;

        const passed =
            overallScore >= 0.6;

        const result = {
            workflowId,
            overallScore,
            ruleScore,
            llmScore,
            passed,
            ruleEvaluation: ruleResult,
            llmEvaluation: llmResult
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
            evaluationId: savedEvaluation.id
        };
    }
}

module.exports = {
    EvaluationRuntime
};