const ALLOWED_ENTITY_TYPES = new Set([
    "MODEL",
    "METHOD",
    "ALGORITHM",
    "DATASET",
    "PAPER",
    "METRIC",
    "CONCEPT",
    "FRAMEWORK",
    "LIBRARY",
    "ORGANIZATION",
    "PERSON"
]);

const ALLOWED_RELATIONSHIP_TYPES = new Set([
    "USES",
    "IMPROVES",
    "COMPARES_WITH",
    "OUTPERFORMS",
    "BASED_ON",
    "INTRODUCES",
    "EVALUATED_ON",
    "PROPOSES"
]);

function validateGraph(graph) {

    if (!graph || typeof graph !== "object") {
        throw new Error("Graph must be an object.");
    }

    if (!Array.isArray(graph.entities)) {
        throw new Error("Graph must contain an entities array.");
    }

    if (!Array.isArray(graph.relationships)) {
        throw new Error("Graph must contain a relationships array.");
    }

    const entityIds = new Set();

    for (const entity of graph.entities) {

        if (!entity.id || !entity.name || !entity.type) {
            throw new Error(
                `Invalid entity: ${JSON.stringify(entity)}`
            );
        }

        if (!ALLOWED_ENTITY_TYPES.has(entity.type)) {
            throw new Error(
                `Unknown entity type: ${entity.type}`
            );
        }

        if (entityIds.has(entity.id)) {
            throw new Error(
                `Duplicate entity id: ${entity.id}`
            );
        }

        entityIds.add(entity.id);
    }

    for (const relationship of graph.relationships) {

        if (
            !relationship.source ||
            !relationship.target ||
            !relationship.type
        ) {
            throw new Error(
                `Invalid relationship: ${JSON.stringify(relationship)}`
            );
        }

        if (!entityIds.has(relationship.source)) {
            throw new Error(
                `Relationship source does not exist: ${relationship.source}`
            );
        }

        if (!entityIds.has(relationship.target)) {
            throw new Error(
                `Relationship target does not exist: ${relationship.target}`
            );
        }

        if (
            !ALLOWED_RELATIONSHIP_TYPES.has(
                relationship.type
            )
        ) {
            throw new Error(
                `Unknown relationship type: ${relationship.type}`
            );
        }
    }

    return true;
}

module.exports = {
    validateGraph
};