const { driver } = require("../../db/neo4j");
class GraphRepository {
    async save(graphDocument) {
        const session = driver.session();
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
                MATCH (a:Entity {id:$id})-[r]->(b)
                RETURN
                    a,
                    r,
                    b
                `,
                {
                    id: entityId
                }
            );
            return result.records;
        }
        finally {
            await session.close();
        }
    }
}

module.exports = {
    GraphRepository
};