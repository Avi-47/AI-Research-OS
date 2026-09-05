const crypto = require("crypto");

const {
    client,
    COLLECTION
} = require("../db/qdrant");

class VectorStoreService {

    async insert({
        text,
        embedding,
        metadata
    }) {
        await client.upsert(
            COLLECTION,
            {
                wait: true,
                points: [
                    {
                        id: crypto.randomUUID(),
                        vector: embedding,
                        payload: {
                            text,
                            ...metadata
                        }
                    }
                ]
            }
        );
    }

    async search(
        embedding,
        limit = 30
    ) {

        const response = await client.query(
            COLLECTION,
            {
                query: embedding,
                limit,
                with_payload: true
            }
        );

        // Qdrant's current JS client returns the
        // query response as an object containing points.
        return response.points || response.result || [];
    }
}

module.exports = new VectorStoreService();