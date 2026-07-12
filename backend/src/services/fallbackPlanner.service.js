function keywordPlanner(query) {
    if (!query) return [];

    const stopWords = [
        "compare",
        "comparison",
        "vs",
        "versus",
        "between",
        "and",
        "with",
        "using",
        "about",
        "of",
        "the"
    ];

    return query
        .split(/[\s,]+/)
        .map(word => word.trim())
        .filter(Boolean)
        .filter(word => !stopWords.includes(word.toLowerCase()))
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        );
}

module.exports = {
    keywordPlanner
};