const crypto = require("crypto");
const pool = require("../db/postgres");
class EvaluationRepository {
    constructor({ logger = console } = {}) {
        this.logger = logger;
    }
    async save(result) {
        const query = `
            INSERT INTO evaluations(
                id,
                workflow_id,
                passed,
                failed_rules,
                completeness,
                correctness,
                structure,
                evidence_usage,
                hallucination_risk,
                comments,
                evaluated_at
            )
            VALUES(
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
            )
        `;
        await pool.query(query, [
            crypto.randomUUID(),
            result.workflowId,
            result.passed,
            JSON.stringify(result.failedRules),
            result.completeness,
            result.correctness,
            result.structure,
            result.evidenceUsage,
            result.hallucinationRisk,
            result.comments,
            result.evaluatedAt
        ]);

        this.logger.log(
            `Evaluation saved for workflow ${result.workflowId}`
        );
    }
}
module.exports = {
    EvaluationRepository
};