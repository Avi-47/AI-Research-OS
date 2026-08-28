const { BaseAgent } = require("../baseAgent");

class TopicResearchAgent extends BaseAgent {

	buildInput(topic) {
		return { topic };
	}

	async execute(input) {
		const result = await this.dependencies.researchService
				.collectEvidenceForTopic(
					input.topic
				);

		return result;
	}
}

module.exports = {TopicResearchAgent};