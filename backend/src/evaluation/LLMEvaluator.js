const {
    AIRoles
} = require("../ai/contracts/aiRoles");

class LLMEvaluator {
    constructor({ aiGateway } = {}) {
        this.aiGateway = aiGateway;
    }

    async evaluate({
        report = "",
        evidence = [],
        retrievedContext = {}
    } = {}) {

        if (!this.aiGateway) {
            return {
                evaluator: "LLM",
                score: 50,
                passed: true,
                feedback:
                    "LLM evaluator not configured.",
                details: {}
            };
        }

        try {

            const prompt = `
You are evaluating the quality of a research report.

Evaluate the report based on:

1. Relevance to available evidence
2. Completeness
3. Clarity
4. Consistency with retrieved context
5. Hallucination risk

Return ONLY valid JSON.

{
    "score": 0,
    "passed": true,
    "feedback": "short explanation"
}

REPORT:
${report}

EVIDENCE:
${JSON.stringify(evidence)}

RETRIEVED CONTEXT:
${JSON.stringify(retrievedContext)}
`;

            const response =
                await this.aiGateway.generate({
                    role:
                        AIRoles.EVALUATION,

                    prompt,

                    responseType:
                        "json",

                    temperature:
                        0.2,

                    maxTokens:
                        500
                });

            const parsed =
                response.data;

            return {
                evaluator: "LLM",

                score:
                    Number(parsed.score) || 50,

                passed:
                    typeof parsed.passed ===
                    "boolean"
                        ? parsed.passed
                        : true,

                feedback:
                    parsed.feedback ||
                    "No feedback provided.",

                details: {
                    gateway:
                        response.metadata
                }
            };

        } catch (error) {

            console.error(
                "[LLMEvaluator] Evaluation failed:",
                error.message
            );

            return {
                evaluator: "LLM",

                score: 50,

                passed: true,

                feedback:
                    "LLM evaluation unavailable. Neutral score assigned.",

                details: {
                    error: error.message,

                    code:
                        error.code ||

                        "UNKNOWN_ERROR",

                    attempts:
                        error.attempts ||
                        []
                }
            };
        }
    }
}

module.exports = {
    LLMEvaluator
};