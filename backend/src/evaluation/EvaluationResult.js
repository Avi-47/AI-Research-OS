class EvaluationResult {
    constructor({
        workflowId,
        passed = false,
        failedRules = [],
        completeness = null,
        correctness = null,
        structure = null,
        evidenceUsage = null,
        hallucinationRisk = null,
        comments = "",
        evaluatedAt = new Date().toISOString()
    } = {}) {
        this.workflowId = workflowId;
        this.passed = passed;
        this.failedRules = failedRules;
        this.completeness = completeness;
        this.correctness = correctness;
        this.structure = structure;
        this.evidenceUsage = evidenceUsage;
        this.hallucinationRisk = hallucinationRisk;
        this.comments = comments;
        this.evaluatedAt = evaluatedAt;
    }
    toJSON() {
        return {
            workflowId: this.workflowId,
            passed: this.passed,
            failedRules: this.failedRules,
            completeness: this.completeness,
            correctness: this.correctness,
            structure: this.structure,
            evidenceUsage: this.evidenceUsage,
            hallucinationRisk: this.hallucinationRisk,
            comments: this.comments,
            evaluatedAt: this.evaluatedAt
        };
    }
}
function createEvaluationResult(data) {
    return new EvaluationResult(data);
}
module.exports = {
    EvaluationResult,
    createEvaluationResult
};