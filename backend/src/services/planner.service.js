// const { callJsonOpenRouter } = require("../utils/llm");
// const aiGateway = require("../ai");
// const AIRequest = require("../ai/contracts/AIRequest");
const {aiGateway,AIRequest} = require("../ai");
const { plannerPrompt } = require("../utils/prompts");
const { keywordPlanner } = require("./fallbackPlanner.service");

function normalizeTopics(topics) {
	return [...new Set(
		topics
			.map((topic) => String(topic || "").trim())
			.filter(Boolean)
	)].slice(0, 5);
}

async function generateTopics(query) {
	if (!query || !String(query).trim()) {
		throw new Error("Query is required");
	}

	let topics;

	try {

		const response = await aiGateway.generate(
			new AIRequest({
				role: "planner",
				prompt: plannerPrompt(query),
				responseType: "json"
			})
		);
		topics = response.content;
	}
	catch(err){
		console.log("Planner LLM failed.");
		console.log("Using keyword fallback.");
		topics = keywordPlanner(query);
	}

	if (!Array.isArray(topics) && Array.isArray(topics?.items)) {
		topics = topics.items;
	}
	if (!Array.isArray(topics)) {
		throw new Error("Planner must return a JSON array of topics");
	}
	return normalizeTopics(topics);
}

module.exports = { generateTopics };