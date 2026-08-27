const crypto = require("crypto");

class EvaluationRepository {
    constructor({ logger = console } = {}) {
        this.logger = logger;
        this.evaluations = [];
    }

    async save({
        workflowId,
        overallScore,
        ruleScore,
        llmScore,
        passed,
        result
    }) {
        const evaluation = {
            id: crypto.randomUUID(),

            workflowId,

            overallScore,
            ruleScore,
            llmScore,

            passed,

            result,

            createdAt:
                new Date().toISOString()
        };

        this.evaluations.push(
            evaluation
        );

        this.logger.log(
            `[EvaluationRepository] Evaluation saved in memory: ${workflowId}`
        );

        return evaluation;
    }

    async findByWorkflowId(workflowId) {
        return this.evaluations.filter(
            evaluation =>
                evaluation.workflowId === workflowId
        );
    }

    async findLatestByWorkflowId(workflowId) {
        const evaluations =
            await this.findByWorkflowId(
                workflowId
            );

        if (evaluations.length === 0) {
            return null;
        }

        return evaluations[
            evaluations.length - 1
        ];
    }

    async getAll() {
        return [
            ...this.evaluations
        ];
    }
}

module.exports = {
    EvaluationRepository
};