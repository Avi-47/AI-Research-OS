require("dotenv").config();

const { healthCheck, close } = require("./src/db/neo4j");

async function main() {
    await healthCheck();
    console.log("Neo4j connection successful!");
    await close();
}

main().catch(console.error);