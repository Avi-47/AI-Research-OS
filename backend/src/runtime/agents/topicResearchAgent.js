const { BaseAgent } = require("../baseAgent");

class TopicResearchAgent extends BaseAgent {

	buildInput(topic) {
		return { topic };
	}

	async execute(input) {
		const evidence =
			await this.dependencies.researchService
				.collectEvidenceForTopic(input.topic);

		return {
			topic: input.topic,
			evidence
		};
	}
}

module.exports = {TopicResearchAgent};