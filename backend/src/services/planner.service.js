const { callJsonOpenRouter } = require("../utils/llm");
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

		topics = await callJsonOpenRouter(
			plannerPrompt(query),
			{
				stage: "Planner"
			}
		);
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