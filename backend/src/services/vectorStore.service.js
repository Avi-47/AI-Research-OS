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

        const results = await client.search(
            COLLECTION,
            {
                vector: embedding,

                limit,

                with_payload: true
            }
        );

        return results;

    }

}

module.exports = new VectorStoreService();