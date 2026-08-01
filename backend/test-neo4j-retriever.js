require("dotenv").config();
const retriever = require("./src/retrievers/Neo4jRetriever");
(async () => {
    const result =
        await retriever.retrieve(
            "Magnitude Pruning"
        );
    console.dir(result,{
        depth:null
    });
})();