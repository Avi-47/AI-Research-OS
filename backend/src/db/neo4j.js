const neo4j = require("neo4j-driver");
const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(
        process.env.NEO4J_USERNAME,
        process.env.NEO4J_PASSWORD
    )
);
async function healthCheck() {
    const session = driver.session();
    try {
        await session.run("RETURN 1");
        console.log("Neo4j Connected");
    } finally {
        await session.close();
    }
}
async function close() {
    await driver.close();
}
module.exports = {
    driver,
    healthCheck,
    close
};