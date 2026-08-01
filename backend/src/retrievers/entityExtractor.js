function extractEntities(query) {
    const words = query.match(/[A-Za-z0-9-]+/g) || [];
    return [...new Set(words)];
}

module.exports = {
    extractEntities
};