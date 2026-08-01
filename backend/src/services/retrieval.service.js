const grouper = require("./documentGrouper.service");
const contextProcessor = require("./contextProcessor.service");
const keywordSearch = require("./keywordSearch.service");
const reranker = require("./reranker.service");
const hybridRetriever = require("../retrievers/HybridRetriever");
class RetrievalService {
    async retrieve(
        query,
        evidence = []
    ) {
        const hybrid = await hybridRetriever.retrieve(query);
        const keywordResults =
            keywordSearch.search(
                query,
                evidence
            );
        const mergedSemantic = [
            ...hybrid.semantic_context,
            ...keywordResults
        ];
        const grouped =
            grouper.group(
                mergedSemantic
            );
        const ranked =
            reranker.rerank(
                grouped
            );
        const compressed =
            contextProcessor.compress(
                ranked
            );
        return {
            semantic_context: compressed,
            graph_context: hybrid.graph_context,
            metadata: hybrid.metadata
        };
    }
}
module.exports = new RetrievalService();