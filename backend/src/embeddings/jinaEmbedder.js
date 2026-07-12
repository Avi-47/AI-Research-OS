const axios = require("axios");
const { Embedder } = require("./embedder");

class JinaEmbedder extends Embedder {

    async embed(text) {

        const response = await axios.post(
            "https://api.jina.ai/v1/embeddings",
            {
                model: "jina-embeddings-v3",
                input: [text]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.JINA_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.data[0].embedding;
    }
}

module.exports = {
    JinaEmbedder
};