const {
    aiGateway,
    AIRequest
} = require("../ai");

const {plannerPrompt} = require("../utils/prompts");
const {keywordPlanner} = require("./fallbackPlanner.service");

function normalizeTopics(topics) {
    return [...new Set(
        topics
            .map(topic =>
                String(topic || "").trim()
            )
            .filter(Boolean)
    )].slice(0, 5);
}

function parsePlannerResponse(content) {
    if (Array.isArray(content)) {
        return content;
    }
    if (content && Array.isArray(content.items)) {
        return content.items;
    }
    if (typeof content === "string") {
        try {
            const parsed =
                JSON.parse(content);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            if (parsed && Array.isArray(parsed.items)) {
                return parsed.items;
            }
        } catch (error) {
            console.warn(
                "Could not parse planner JSON:",
                error.message
            );
        }
    }
    return null;
}
async function generateTopics(query) {
    if (!query || !String(query).trim()) {
        throw new Error(
            "Query is required"
        );
    }
    let topics;
    try {
        const response = await aiGateway.generate(
                new AIRequest({
                    role: "planner",
                    prompt: plannerPrompt(query),
                    responseType:
                        "json"
                })
            );
        console.log("Planner Gateway Response:");
        console.dir(response, { depth: null });
        topics = parsePlannerResponse(
                response.content
            );
        if (!topics) {
            throw new Error(
                "Planner returned invalid topic structure"
            );
        }
    } catch (err) {
        console.error(
            "Planner LLM failed:",
            err.message
        );
        console.log("Using keyword fallback.");
        topics = keywordPlanner(query);
    }
    if (!Array.isArray(topics)) {
        console.error(
            "Invalid planner output:",
            topics
        );
        throw new Error("Planner must return a JSON array of topics");
    }
    return normalizeTopics(topics);
}
module.exports = {
    generateTopics
};