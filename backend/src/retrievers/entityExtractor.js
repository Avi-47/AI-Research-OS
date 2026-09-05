function extractEntities(query) {
    const text = String(query || "").trim();

    if (!text) {
        return [];
    }

    const stopWords = new Set([
        "compare",
        "what",
        "is",
        "are",
        "how",
        "does",
        "do",
        "explain",
        "show",
        "list",
        "the",
        "a",
        "an",
        "and",
        "or",
        "vs",
        "versus",
        "between",
        "difference",
        "with",
        "for",
        "of",
        "to",
        "in",
        "on",
        "using",
        "use",
        "techniques",
        "method",
        "methods"
    ]);

    const tokens =
        text.match(/[A-Za-z0-9-]+/g) || [];

    return [
        ...new Set(
            tokens
                .map(token => token.trim())
                .filter(Boolean)
                .filter(token =>
                    !stopWords.has(token.toLowerCase())
                )
                .filter(token => token.length > 2)
        )
    ];
}

module.exports = {
    extractEntities
};