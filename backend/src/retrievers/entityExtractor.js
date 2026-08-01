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
        "with"
    ]);

    const tokens = text.match(/[A-Za-z0-9-]+/g) || [];
    const candidates = [];

    const isEntityToken = (token) => /[A-Z]/.test(token) && token !== token.toLowerCase();

    let current = [];

    const flush = () => {
        if (current.length === 0) {
            return;
        }

        let phrase = [...current];
        while (phrase.length > 0 && stopWords.has(phrase[0].toLowerCase())) {
            phrase.shift();
        }

        if (phrase.length === 1) {
            const [single] = phrase;
            if (!stopWords.has(single.toLowerCase())) {
                candidates.push(single);
            }
        } else if (phrase.length > 1) {
            candidates.push(phrase.join(" "));
        }

        current = [];
    };

    for (const token of tokens) {
        if (isEntityToken(token)) {
            current.push(token);
        } else {
            flush();
        }
    }

    flush();

    return [...new Set(
        candidates
            .map((entity) => entity.trim())
            .filter(Boolean)
            .filter((entity) => !stopWords.has(entity.toLowerCase()))
    )];
}

module.exports = {
    extractEntities
};