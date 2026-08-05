const aiGateway = require("../ai/gateway/aiGateway");
class LLMEvaluator {
    async evaluate(report) {
        const prompt = `
You are an expert technical report evaluator.
Evaluate the following report.
Return ONLY valid JSON.
Required JSON format:
{
  "completeness": 0,
  "correctness": 0,
  "structure": 0,
  "evidenceUsage": 0,
  "hallucinationRisk": 0,
  "comments": ""
}
Scoring:
completeness:
0-100
correctness:
0-100
structure:
0-100
evidenceUsage:
0-100
hallucinationRisk:
0-100
(100 = very high hallucination risk)
comments:
One short paragraph.
REPORT
${report}
`;
        const response = await aiGateway.generate({
            role: "writer",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });
        let result;
        try {
            result = JSON.parse(response.content);
        } catch (err) {
            throw new Error("LLM evaluator returned invalid JSON.");
        }
        return {
            completeness: Number(result.completeness ?? 0),
            correctness: Number(result.correctness ?? 0),
            structure: Number(result.structure ?? 0),
            evidenceUsage: Number(result.evidenceUsage ?? 0),
            hallucinationRisk: Number(result.hallucinationRisk ?? 0),
            comments: result.comments ?? ""
        };
    }
}
module.exports = LLMEvaluator;