const axios = require("axios");
const AIProvider = require("./AIProvider");
const AIResponse = require("../contracts/AIResponse");
const {extractJsonBlock,isUsefulJsonValue} = require("../../utils/jsonParser");

class OpenRouterProvider extends AIProvider {
    parseJsonResponse(content) {
        const jsonText = extractJsonBlock(content).replace(/,\s*([}\]])/g, "$1");
        const parsed = JSON.parse(jsonText);
        if (!isUsefulJsonValue(parsed)) throw new Error("Empty JSON response");
        return parsed;
    }
    async generate(request, model) {
        if (!request?.prompt) {
            throw new Error("AIRequest prompt is required");
        }
        if (!model) {
            throw new Error("Model is required");
        }
        const body = {
            model,
            messages: [
                {
                    role: "user",
                    content: request.prompt
                }
            ],
            temperature: request.temperature,
            max_tokens: request.maxTokens
        };
        if (request.responseType === "json") {
            body.response_format = {
                type: "json_object"
            };
        }
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            body,
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
                }
            }
        );
        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty model response");
        if (request.responseType === "json") {
            return new AIResponse({
                content: this.parseJsonResponse(content),
                provider: "openrouter",
                model
            });
        }
        return new AIResponse({
            content,
            provider: "openrouter",
            model
        });
    }
}
module.exports = OpenRouterProvider;