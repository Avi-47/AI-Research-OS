const axios = require("axios");
const AIProvider = require("./AIProvider");
const AIResponse = require("../contracts/AIResponse");
const {
    extractJsonBlock,
    isUsefulJsonValue
} = require("../../utils/jsonParser");

class OpenRouterProvider
    extends AIProvider {
    parseJsonResponse(content) {
        if (
            content === undefined ||
            content === null
        ) {
            throw new Error("Empty JSON response");
        }

        if (typeof content === "object") {
            if (!isUsefulJsonValue(content)) {
                throw new Error(
                    "Empty JSON response"
                );
            }
            return content;
        }

        const raw = String(content).trim();
        if (!raw) {
            throw new Error("Empty JSON response");
        }
        const jsonText = extractJsonBlock(raw)
                .trim()
                .replace(
                    /,\s*([}\]])/g,
                    "$1"
                );

        if (!jsonText) {
            throw new Error("LLM response did not contain JSON");
        }
        try {
            const parsed = JSON.parse(jsonText);
            if (!isUsefulJsonValue(parsed)) {
                throw new Error("Empty JSON response");
            }
            return parsed;
        }
        catch (error) {
            console.error("[OpenRouter] Invalid JSON response:");
            console.error(jsonText.slice(0, 1000));
            throw error;
        }
    }
    async generate(request,model) {
        if (!request?.prompt) {
            throw new Error(
                "AIRequest prompt is required"
            );
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
            temperature: request.temperature ?? 0.2,
            max_tokens: request.maxTokens ?? 2000
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
                        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 60000
                }
            );
        const message = response.data?.choices?.[0]?.message;
        let content = message?.content;
        if (content === undefined ||content === null || !String(content).trim()) {
            const reasoning = message?.reasoning || message?.reasoning_content;
            if (reasoning !== undefined && reasoning !== null && String(reasoning).trim()){
                console.warn(
                    "[OpenRouter] Using reasoning as fallback content"
                );
                content = reasoning;
            }
        }
        if (content === undefined || content === null || !String(content).trim()) {
            console.error("[OpenRouter] Empty response:");
            console.dir(response.data,{ depth: null });
            throw new Error("Empty model response");
        }
        let finalContent = content;
        if (request.responseType === "json") {
            finalContent = this.parseJsonResponse(content);
        }
        return new AIResponse({
            content: finalContent,
            provider:"openrouter",
            model
        });
    }
}
module.exports = OpenRouterProvider;