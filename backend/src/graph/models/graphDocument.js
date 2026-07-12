function createGraphDocument({
    entities = [],
    relationships = [],
    metadata = {}
} = {}) {
    return {
        entities,
        relationships,
        metadata
    };
}

module.exports = {
    createGraphDocument
};