const { driver } = require("../../db/neo4j");
class GraphRepository {
    async save(graphDocument) {
        const session = driver.session();
        const entityCount = Array.isArray(graphDocument?.entities) ? graphDocument.entities.length : 0;
        const relationshipCount = Array.isArray(graphDocument?.relationships) ? graphDocument.relationships.length : 0;
        console.log("Saving graph...");
        console.log(entityCount, relationshipCount);
        try {
            await session.executeWrite(async (tx) => {
                // -----------------------------
                // Save Entities
                // -----------------------------
                for (const entity of graphDocument.entities) {
                    await tx.run(
                        `
                        MERGE (e:Entity {id: $id})
                        SET
                            e.name = $name,
                            e.type = $type
                        `,
                        {
                            id: entity.id,
                            name: entity.name,
                            type: entity.type
                        }
                    );
                }
                // -----------------------------
                // Save Relationships
                // -----------------------------
                for (const rel of graphDocument.relationships) {
                    await tx.run(
                        `
                        MATCH (a:Entity {id: $source})
                        MATCH (b:Entity {id: $target})
                        MERGE (a)-[r:RELATED_TO {type: $type}]->(b)`,
                        {
                            source: rel.source,
                            target: rel.target,
                            type: rel.type
                        }
                    );
                }
            });
            console.log("Graph saved.");
        }
        finally {
            await session.close();
        }
    }

    async getNeighbors(entityId) {
        const session = driver.session();
        try {
            const result = await session.run(
                `
                MATCH (a:Entity {id:$id})
                OPTIONAL MATCH (a)-[r]->(b)
                RETURN
                    a,
                    r,
                    b
                `,
                {
                    id: entityId
                }
            );
            if (result.records.length === 0) {
                return {
                    entity: null,
                    neighbors: []
                };
            }

            const entity = result.records[0].get("a")?.properties || null;
            const neighbors = result.records
                .map((record) => {
                    const relationship = record.get("r");
                    const target = record.get("b");

                    if (!relationship || !target) {
                        return null;
                    }

                    return {
                        relationship: {
                            type: relationship.type,
                            properties: relationship.properties
                        },
                        target: target.properties
                    };
                })
                .filter(Boolean);

            return {
                entity,
                neighbors
            };
        }
        finally {
            await session.close();
        }
    }
}

module.exports = {
    GraphRepository
};