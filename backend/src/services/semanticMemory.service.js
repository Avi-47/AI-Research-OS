const { chunkEvidence } = require("../memory/chunker");
const vectorStore = require("./vectorStore.service");
const {JinaEmbedder} = require("../embeddings/jinaEmbedder");
const embedder = new JinaEmbedder();
class SemanticMemoryService {
    async indexEvidence(evidence) {
        const chunks = chunkEvidence(evidence);
        for (const chunk of chunks) {
            const embedding = await embedder.embed(
                chunk.text
            );
            await vectorStore.insert({
                text: chunk.text,
                embedding,
                metadata: chunk.metadata
            });
        }
    }
}
module.exports = new SemanticMemoryService();