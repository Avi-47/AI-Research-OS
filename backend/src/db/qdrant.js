const { QdrantClient } = require("@qdrant/js-client-rest");

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY || undefined
});

const COLLECTION = "research_memory";
async function initializeQdrant() {
    const collections = await client.getCollections();
    const exists = collections.collections.some(
        c => c.name === COLLECTION
    );
    if (exists) {
        return;
    }
    await client.createCollection(COLLECTION, {
        vectors: {
            size: 1024,
            distance: "Cosine"
        }
    });
    console.log("Qdrant collection created.");
}
module.exports = {
    client,
    COLLECTION,
    initializeQdrant
};