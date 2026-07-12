require("dotenv").config();
const fs = require("fs");
const path = require("path");

const {
    build
} = require("./src/graph/builder/graphBuilder");

async function main() {

    const evidencePath = path.join(
        __dirname,
        "data",
        "runs",
        "run_018",
        "evidence.json"
    );

    const run = JSON.parse(
        fs.readFileSync(evidencePath, "utf8")
    );

    
    console.log("--------------------------------");
    console.log("Building Knowledge Graph...");
    console.log("--------------------------------");
    
    const graph = await build(run.evidence);

    console.log("--------------------------------");
    console.log("Graph Built Successfully");
    console.log("--------------------------------");

    console.log(`Entities      : ${graph.entities.length}`);
    console.log(`Relationships : ${graph.relationships.length}`);

    console.log("\nFirst 5 Entities:");
    console.table(graph.entities.slice(0, 5));

    console.log("\nFirst 5 Relationships:");
    console.table(graph.relationships.slice(0, 5));

    console.log("--------------------------------");
    console.log(
        `Entities: ${graph.entities.length}`
    );
    console.log(
        `Relationships: ${graph.relationships.length}`
    );
    console.log("--------------------------------");

    // console.log(run.evidence.length);
    // console.dir(run.evidence[0], { depth: null });

}

main().catch(err => {
    console.error(err);
});