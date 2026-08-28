const {
    aiGateway,
    AIRequest
} = require("../ai");

const {
    plannerPrompt
} = require("../utils/prompts");

const {
    keywordPlanner
} = require("./fallbackPlanner.service");


function normalizeTopics(topics) {

    if (!Array.isArray(topics)) {
        return [];
    }

    const normalized = topics
        .map(topic => {

            if (typeof topic === "string") {
                return topic.trim();
            }

            if (
                topic &&
                typeof topic === "object"
            ) {
                return String(
                    topic.topic ||
                    topic.name ||
                    topic.title ||
                    ""
                ).trim();
            }

            return "";

        })
        .filter(Boolean);

    return [...new Set(normalized)]
        .slice(0, 5);
}


function parsePlannerResponse(content) {
    if (Array.isArray(content)) {
        return content;
    }
    if (content && typeof content === "object" && Array.isArray(content.items)) {
        return content.items;
    }
    if (content && typeof content === "object" && Array.isArray(content.topics)) {
        return content.topics;
    }
    if (content && typeof content === "object" && !Array.isArray(content)) {
        const keys = Object.keys(content)
            .map(topic => topic.trim())
            .filter(Boolean);
        if (keys.length > 0) {
            console.warn(
                "[Planner] Using object keys as topics."
            );
            return keys;
        }
    }
    if (typeof content === "string") {
        try {
            return parsePlannerResponse(
                JSON.parse(content)
            );
        } catch (error) {
            console.warn(
                "[Planner] Could not parse planner JSON:",
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
        const response =
            await aiGateway.generate(
                new AIRequest({
                    role: "planner",
                    prompt: plannerPrompt(query),
                    responseType: "json"
                })
            );
        console.log(
            "Planner Gateway Response:"
        );
        console.dir(
            response,
            { depth: null }
        );
        const parsedTopics =
            parsePlannerResponse(
                response.content
            );
        topics = normalizeTopics(
                parsedTopics
            );
        if (topics.length === 0) {
            throw new Error(
                "Planner returned no valid topics"
            );
        }
        console.log(
            "[Planner] Generated topics:",
            topics
        );
    } catch (err) {
        console.error(
            "Planner LLM failed:",
            err.message
        );
        console.log("Using keyword fallback.");
        topics = normalizeTopics(
                keywordPlanner(query)
            );

    }
    if (topics.length === 0) {
        throw new Error(
            "Planner could not generate any topics"
        );
    }
    return topics;
}
module.exports = {
    generateTopics
};