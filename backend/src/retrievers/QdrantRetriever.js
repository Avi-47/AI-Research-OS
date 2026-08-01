const BaseRetriever = require("./BaseRetriever");
const vectorStore = require("../services/vectorStore.service");
const { JinaEmbedder } = require("../embeddings/jinaEmbedder");
const embedder = new JinaEmbedder();
class QdrantRetriever extends BaseRetriever {
    async retrieve(query) {
        const embedding = await embedder.embed(query);
        const results = await vectorStore.search(
            embedding,
            20
        );
        const semantic_context = results.map(r => ({
            score: r.score,
            topic: r.payload.topic,
            notes: r.payload.text,
            provenance: {
                title: r.payload.title,
                url: r.payload.url
            },
            source: "memory"
        }));
        return {
            semantic_context
        };
    }
}
module.exports = new QdrantRetriever();