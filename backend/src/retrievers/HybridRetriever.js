const BaseRetriever = require("./BaseRetriever");
const QdrantRetriever = require("./QdrantRetriever");
const Neo4jRetriever = require("./Neo4jRetriever");
const ContextAssembler = require("./ContextAssembler");
class HybridRetriever extends BaseRetriever {
    async retrieve(query) {
        const [
            semantic,
            graph
        ] = await Promise.all([
            QdrantRetriever.retrieve(query),
            Neo4jRetriever.retrieve(query)
        ]);
        return ContextAssembler.assemble(
            semantic.semantic_context,
            graph.graph_context
        );
    }
}
module.exports = new HybridRetriever();