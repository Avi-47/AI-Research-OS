require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const { driver } = require("./src/db/neo4j");

async function main() {
    const session = driver.session();

    try {
        const result = await session.run(`
            MATCH (a:Entity)
            WHERE
                toLower(a.name) CONTAINS "pruning"
            RETURN
                a.id AS id,
                a.name AS name,
                a.type AS type
            ORDER BY a.name
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