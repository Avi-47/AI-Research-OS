require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

console.log({
    neo4jUri: process.env.NEO4J_URI,
    neo4jUsername: process.env.NEO4J_USERNAME,
    hasNeo4jPassword: !!process.env.NEO4J_PASSWORD
});

const { driver } = require("./src/db/neo4j");

async function main() {
    const session = driver.session();

    try {
        const result = await session.run(`
            MATCH (n:Entity)
            RETURN n.id AS id, n.name AS name, n.type AS type
            ORDER BY n.name
        `);

        console.table(
            result.records.map(r => ({
                id: r.get("id"),
                name: r.get("name"),
                type: r.get("type")
            }))
        );
    } finally {
        await session.close();
        await driver.close();
    }
}

main().catch(console.error);