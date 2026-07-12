
const { callJsonOpenRouter } = require("../../utils/llm");

const {
    graphExtractionPrompt
} = require("../prompts/graphExtractionPrompt");

const {
    validateGraph
} = require("../validation/graphValidator");

const {
    createGraphDocument
} = require("../models/graphDocument");

/**
 * Creates stable IDs for entities.
 */
function normalizeId(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/**
 * Remove duplicate entities.
 */
function dedupeEntities(entities = []) {
    const seen = new Set();
    const idMap = new Map();
    const normalizedEntities = [];
    for (const entity of entities) {
        if (!entity.name) {
            continue;
        }
        // Save the LLM's original id before replacing it
        const originalId = String(entity.name || "").trim();
        // Always generate our own stable id
        const generatedId = normalizeId(entity.name);
        if (seen.has(generatedId)) {
            continue;
        }
        seen.add(generatedId);
        // Remember how old ids map to new ids
        if (originalId) {
            idMap.set(originalId, generatedId);
        }
        normalizedEntities.push({
            id: generatedId,
            name: String(entity.name).trim(),
            type: String(entity.type || "")
                .trim()
                .toUpperCase()
        });
    }
    return {
        entities: normalizedEntities,
        idMap
    };
}

function compressEvidence(evidence = []) {

    const seen = new Set();

    return evidence
        .filter(item => {

            if (seen.has(item.topic))
                return false;

            seen.add(item.topic);

            return true;

        })
        .map(item => ({

            topic: item.topic,

            notes: String(item.notes || "")
                .split(".")
                .slice(0, 1)
                .join(".")
        }));
}

/**
 * Normalize relationships.
 */
function normalizeRelationships( relationships = [], idMap = new Map()) {
    const seen = new Set();
    const normalized = [];
    for (const relationship of relationships) {
        const source = normalizeId(relationship.source);
        const target = normalizeId(relationship.target);

        const type = String(relationship.type || "").trim().toUpperCase();
        const signature = `${source}|${target}|${type}`;
        if (seen.has(signature)) {
            continue;
        }
        seen.add(signature);
        normalized.push({
            source,
            target,
            type
        });
    }
    return normalized;
}

async function build(evidence) {

    if (!Array.isArray(evidence) || evidence.length === 0) {
        return createGraphDocument();
    }

    const graph = await callJsonOpenRouter(
        graphExtractionPrompt(
            compressEvidence(evidence).slice(0, 5)
        ),
        {
            stage: "Graph Builder"
        }
    );

    // console.log("========== RAW GRAPH ==========");
    // console.dir(graph, { depth: null });
    // console.log("===============================");

    graph.entities = dedupeEntities(graph.entities || []).entities;
    graph.relationships = normalizeRelationships(graph.relationships || []);
    validateGraph(graph);

    return createGraphDocument({
        entities: graph.entities,
        relationships: graph.relationships,
        metadata: {
            generatedAt: new Date().toISOString(),
            evidenceCount: evidence.length
        }
    });
}

module.exports = {
    build
};
