const grouper = require("./documentGrouper.service");
const contextProcessor = require("./contextProcessor.service");
const vectorStore =     require("./vectorStore.service");
const keywordSearch =     require("./keywordSearch.service");
const reranker =     require("./reranker.service");
const {JinaEmbedder} = require("../embeddings/jinaEmbedder");
const embedder = new JinaEmbedder();

class RetrievalService {
    async retrieve(
        query,
        evidence = []
    ) {
        const embedding = await embedder.embed(query);
        const vectorResults =
            await vectorStore.search(
                embedding,
                20
            );
        const memoryResults =
            vectorResults.map(r => ({
                score: r.score,
                topic:
                    r.payload.topic,
                notes:
                    r.payload.text,
                provenance: {
                    title:
                        r.payload.title,
                    url:
                        r.payload.url
                },
                source: "memory"
            }));
        const keywordResults =
            keywordSearch.search(
                query,
                evidence
            );
        const merged = [
            ...memoryResults,
            ...keywordResults

        ];
        const grouped = grouper.group(merged);
        const ranked = reranker.rerank(grouped);
        return contextProcessor.compress(ranked);
    }
}

module.exports = new RetrievalService();