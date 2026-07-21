require("dotenv").config();
const fs = require("fs");
const path = require("path");

const { build } = require("./src/graph/builder/graphBuilder");

const {
    GraphRepository
} = require("./src/graph/repository/graphRepository");

const {
    healthCheck,
    close
} = require("./src/db/neo4j");

async function main() {

    await healthCheck();

    const evidence = JSON.parse(
        fs.readFileSync(
            path.join(
                __dirname,
                "data",
                "runs",
                "run_018",
                "evidence.json"
            ),
            "utf8"
        )
    );

    console.log("Is Array:", Array.isArray(evidence));
    console.log("Type:", typeof evidence);
    console.dir(evidence, { depth: 2 });

    const graph = await build(evidence.evidence);

    const repository = new GraphRepository();

    console.log("========== GRAPH ==========");
    console.log(JSON.stringify(graph, null, 2));
    console.log("===========================");
    await repository.save(graph);

    console.log("Graph saved successfully.");

    const graphNeighbors = await repository.getNeighbors(
        "magnitude-pruning"
    );

    console.log(graphNeighbors.neighbors.length);

    console.dir(graphNeighbors, {
        depth: null
    });

    await close();

}

main().catch(console.error);