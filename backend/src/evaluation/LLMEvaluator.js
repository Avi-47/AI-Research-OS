const {
    AIRoles
} = require("../ai/contracts/aiRoles");

class LLMEvaluator {
    constructor({ aiGateway } = {}) {
        this.aiGateway = aiGateway;
    }

    async evaluate({report = "",evidence = [],retrievedContext = {}} = {}) {
    if (!this.aiGateway) {
        throw new Error("LLM evaluator is not configured");
    }
    /*
     * Keep only the fields necessary for evaluation.
     * Do not send the entire retrieved context because
     * it can make the prompt unnecessarily large.
     */
    const compactEvidence = evidence.map((item) => ({
            topic: item.topic,
            notes: String(item.notes || "")
                .slice(0, 800)
        }));

    const compactContext = {
        semantic_context:
            Array.isArray(
                retrievedContext.semantic_context
            )
                ? retrievedContext.semantic_context
                    .slice(0, 5)
                    .map((item) => ({
                        topic: item.topic,
                        notes: String(item.notes || "")
                            .slice(0, 500)
                    }))
                : [],

        graph_context:
            Array.isArray(
                retrievedContext.graph_context
            )
                ? retrievedContext.graph_context
                    .slice(0, 10)
                : []
    };

    const prompt = `
You are a strict research report evaluator.

Evaluate the report ONLY against the supplied evidence.

Do not invent missing evidence.

Score the report from 0 to 100 based on:

1. Groundedness
2. Relevance
3. Topic coverage
4. Internal consistency
5. Hallucination risk

Return ONLY this JSON:

{
  "score": 0,
  "passed": false,
  "feedback": "short explanation"
}

REPORT:
${report}

EVIDENCE:
${JSON.stringify(compactEvidence)}

CONTEXT:
${JSON.stringify(compactContext)}
`;
    const response = await this.aiGateway.generate({
            role: AIRoles.EVALUATION,
            prompt,
            responseType: "json",
            temperature: 0,
            maxTokens: 1000
        });
        const parsed = response.content;
        if (!parsed || typeof parsed !== "object") {
            throw new Error("Invalid evaluation response");
        }
        const score = Number(parsed.score);
        if (!Number.isFinite(score)) {
            throw new Error("Evaluation response contains invalid score");
        }
        if (typeof parsed.feedback !== "string") {
            throw new Error("Evaluation response contains invalid feedback");
        }
        const normalizedScore = Math.max(0,Math.min(100,Math.round(score)));
        return {
            evaluator: "LLM",
            score: normalizedScore,
            passed: normalizedScore >= 60,
            feedback: parsed.feedback.trim() || "No feedback provided.",
            details: {
                gateway:
                    response.metadata
            }
        };
    }
}
module.exports = {
    LLMEvaluator
};