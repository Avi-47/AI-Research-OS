require("dotenv").config();
const retriever = require("./src/retrievers/QdrantRetriever");
(async () => {
    const result = await retriever.retrieve(
        "What is SparseGPT?"
    );
    console.dir(result, {
        depth: null
    });
})();