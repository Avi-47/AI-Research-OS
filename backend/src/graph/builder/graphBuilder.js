console.log(">>> graphBuilder.js loaded <<<");
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
			idMap.set(normalizeId(originalId), generatedId);
        }
		idMap.set(generatedId, generatedId);
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

function validateGraphCandidate(graph) {
    if (!graph || typeof graph !== "object" || Array.isArray(graph)) {
        throw new Error("Graph response must be an object");
    }

    if (!Array.isArray(graph.entities) || graph.entities.length === 0) {
        throw new Error("Graph response did not contain entities");
    }

    if (!Array.isArray(graph.relationships) || graph.relationships.length === 0) {
        throw new Error("Graph response did not contain relationships");
    }

    for (const entity of graph.entities) {
        if (!entity || typeof entity !== "object") {
            throw new Error(`Invalid entity: ${JSON.stringify(entity)}`);
        }

        if (!String(entity.name || "").trim()) {
            throw new Error(`Invalid entity name: ${JSON.stringify(entity)}`);
        }

        if (!String(entity.type || "").trim()) {
            throw new Error(`Invalid entity type: ${JSON.stringify(entity)}`);
        }
    }

    for (const relationship of graph.relationships) {
        if (!relationship || typeof relationship !== "object") {
            throw new Error(`Invalid relationship: ${JSON.stringify(relationship)}`);
        }

        if (!String(relationship.source || "").trim()) {
            throw new Error(`Invalid relationship source: ${JSON.stringify(relationship)}`);
        }

        if (!String(relationship.target || "").trim()) {
            throw new Error(`Invalid relationship target: ${JSON.stringify(relationship)}`);
        }

        if (!String(relationship.type || "").trim()) {
            throw new Error(`Invalid relationship type: ${JSON.stringify(relationship)}`);
        }
    }
}

/**
 * Normalize relationships.
 */
function normalizeRelationships(relationships = [], idMap = new Map()) {
    const seen = new Set();
    const normalized = [];
    for (const relationship of relationships) {
        const sourceName = String(relationship.source || "").trim();
        const targetName = String(relationship.target || "").trim();
        const source = idMap.get(sourceName) || idMap.get(normalizeId(sourceName)) || normalizeId(sourceName);
        const target = idMap.get(targetName) || idMap.get(normalizeId(targetName)) || normalizeId(targetName);

        const type = String(relationship.type || "").trim().toUpperCase();
        if (!source || !target || !type || source === target) {
            continue;
        }

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

    console.log("BUILD() CALLED");
    console.log("Evidence Count:", evidence.length);
    const compressed = compressEvidence(evidence).slice(0, 5);

    console.log("========== COMPRESSED EVIDENCE ==========");
    console.dir(compressed, { depth: null });
    console.log("========================================");

    const prompt = graphExtractionPrompt(compressed);
    console.log("Prompt Length:", prompt.length);


    const graph = await callJsonOpenRouter(
        prompt,
        {
            stage: "Graph Builder",
            validateParsedResponse: validateGraphCandidate
        }
    );

    console.log("========== RAW GRAPH ==========");
    console.dir(graph, { depth: null });
    console.log("===============================");

    const { entities, idMap } = dedupeEntities(graph.entities || []);
    graph.entities = entities;
    graph.relationships = normalizeRelationships(graph.relationships || [], idMap);
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
