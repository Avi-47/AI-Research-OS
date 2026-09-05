const { BaseAgent } = require("../baseAgent");
class GraphBuilderAgent extends BaseAgent {
    buildInput(event) {
        return event;
    }
    async execute(input) {
        const graph =
            await this.dependencies.graphBuilder.build(
                input.payload.evidence
            );
        await this.dependencies.graphRepository.save(
            graph
        );
        return {
            graph,
            entities: graph.entities.length,
            relationships: graph.relationships.length
        };
    }
}
module.exports = {
    GraphBuilderAgent
};