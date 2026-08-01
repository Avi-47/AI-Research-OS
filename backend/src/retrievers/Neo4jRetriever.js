const {extractEntities} = require("./entityExtractor");
const BaseRetriever = require("./BaseRetriever");
const { driver } = require("../db/neo4j");
class Neo4jRetriever extends BaseRetriever {
    normalize(text) {
        return String(text)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    }
    async retrieve(query) {
        const session = driver.session();
        try {
            const entities = [...new Set(extractEntities(query))];
            const graph_context = [];
            const seen = new Set();
            for (const entity of entities) {
                const id = this.normalize(entity);
                const result = await session.run(
                `
                MATCH (a:Entity)
                WHERE a.id = $entityId
                    OR toLower(a.name) = toLower($entityName)
                OPTIONAL MATCH (a)-[r]->(b)
                RETURN
                a.name AS source,
                r.type AS relation,
                b.name AS target
                `,
                {
                    entityId: id,
                    entityName: entity
                }
                );
                for (const record of result.records) {
                    if (!record.get("target"))
                        continue;
                    const fact = {
                        source: record.get("source"),
                        relation: record.get("relation"),
                        target: record.get("target")
                    };
                    const key = `${fact.source}|${fact.relation}|${fact.target}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        graph_context.push(fact);
                    }
                }
            }
            return {
                graph_context
            };
        }
        finally {
            await session.close();
        }
    }
}
module.exports = new Neo4jRetriever();