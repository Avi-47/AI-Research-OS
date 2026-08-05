const RuleEvaluator = require("./RuleEvaluator");
const LLMEvaluator = require("./LLMEvaluator");
const {
    createEvaluationResult
} = require("./EvaluationResult");
class EvaluationRuntime {
    constructor({
        ruleEvaluator = new RuleEvaluator(),
        llmEvaluator = new LLMEvaluator(),
        evaluationRepository
    }) {
        this.ruleEvaluator = ruleEvaluator;
        this.llmEvaluator = llmEvaluator;
        this.evaluationRepository = evaluationRepository;
    }
    async evaluate({
        workflowId,
        report,
        retrievedContext
    }) {
        // --------------------------
        // Step 1: Deterministic rules
        // --------------------------
        const ruleResult =
            this.ruleEvaluator.evaluate(
                report,
                retrievedContext
            );
        // --------------------------
        // Rule failure -> stop
        // --------------------------
        if (!ruleResult.passed) {
            const result = createEvaluationResult({
                    workflowId,
                    passed: false,
                    failedRules: ruleResult.failedRules,
                    completeness: 0,
                    correctness: 0,
                    structure: 0,
                    evidenceUsage: 0,
                    hallucinationRisk: 100,
                    comments: "Rule validation failed."
                });
            if (this.evaluationRepository) {
                await this.evaluationRepository.save(result);
            }
            return result;
        }
        // --------------------------
        // Step 2: LLM evaluation
        // --------------------------
        const llmScores = await this.llmEvaluator.evaluate(report);
        // --------------------------
        // Build final result
        // --------------------------
        const result = createEvaluationResult({
                workflowId,
                passed: true,
                failedRules: [],
                completeness: llmScores.completeness,
                correctness: llmScores.correctness,
                structure: llmScores.structure,
                evidenceUsage: llmScores.evidenceUsage,
                hallucinationRisk: llmScores.hallucinationRisk,
                comments: llmScores.comments
            });
        if (this.evaluationRepository) {
            await this.evaluationRepository.save(result);
        }
        return result;
    }
}
module.exports = EvaluationRuntime;