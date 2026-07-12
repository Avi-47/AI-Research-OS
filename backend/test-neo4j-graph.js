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

    const graph = await build(evidence);

    const repository = new GraphRepository();

    await repository.save(graph);

    console.log("Graph saved successfully.");

    const neighbors = await repository.getNeighbors(
        "magnitude-pruning"
    );

    console.log(neighbors.length);

    console.dir(neighbors, {
        depth: null
    });

    await close();

}

main().catch(console.error);