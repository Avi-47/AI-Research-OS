class EvaluationResult {
    constructor({
        workflowId,

        reportVersion = 1,
        revisionAttempt = 0,

        topicCoverage = 0,
        groundedness = 0,
        relevance = 0,
        structure = 0,

        overallScore = 0,

        decision = "REJECT",
        passed = false,

        issues = [],
        revisionFeedback = [],

        ruleEvaluation = null,
        llmEvaluation = null,

        evaluatedAt = new Date().toISOString()
    } = {}) {

        this.workflowId = workflowId;

        this.reportVersion =
            reportVersion;

        this.revisionAttempt =
            revisionAttempt;

        this.topicCoverage =
            topicCoverage;

        this.groundedness =
            groundedness;

        this.relevance =
            relevance;

        this.structure =
            structure;

        this.overallScore =
            overallScore;

        this.decision =
            decision;

        this.passed =
            passed;

        this.issues =
            issues;

        this.revisionFeedback =
            revisionFeedback;

        this.ruleEvaluation =
            ruleEvaluation;

        this.llmEvaluation =
            llmEvaluation;

        this.evaluatedAt =
            evaluatedAt;
    }

    toJSON() {
        return {
            workflowId:
                this.workflowId,

            reportVersion:
                this.reportVersion,

            revisionAttempt:
                this.revisionAttempt,

            topicCoverage:
                this.topicCoverage,

            groundedness:
                this.groundedness,

            relevance:
                this.relevance,

            structure:
                this.structure,

            overallScore:
                this.overallScore,

            decision:
                this.decision,

            passed:
                this.passed,

            issues:
                this.issues,

            revisionFeedback:
                this.revisionFeedback,

            ruleEvaluation:
                this.ruleEvaluation,

            llmEvaluation:
                this.llmEvaluation,

            evaluatedAt:
                this.evaluatedAt
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