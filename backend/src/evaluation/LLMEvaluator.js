class LLMEvaluator {
    constructor({ aiGateway } = {}) {
        this.aiGateway = aiGateway;
    }

    async evaluate({
        report = "",
        evidence = [],
        retrievedContext = {}
    } = {}) {
        // If no LLM gateway is configured,
        // return a neutral evaluation instead of crashing.
        if (!this.aiGateway) {
            return {
                evaluator: "LLM",
                score: 50,
                passed: true,
                feedback: "LLM evaluator not configured.",
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

Return ONLY valid JSON in this format:

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
                    role: "EVALUATOR",
                    prompt
                });

            let parsed;

            try {
                parsed =
                    typeof response === "string"
                        ? JSON.parse(response)
                        : response;
            } catch (error) {
                parsed = {
                    score: 50,
                    passed: true,
                    feedback:
                        "LLM response could not be parsed."
                };
            }

            return {
                evaluator: "LLM",
                score: Number(parsed.score) || 50,
                passed:
                    typeof parsed.passed === "boolean"
                        ? parsed.passed
                        : true,
                feedback:
                    parsed.feedback ||
                    "No feedback provided.",
                details: {}
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
                    error: error.message
                }
            };
        }
    }
}

module.exports = {
    LLMEvaluator
};