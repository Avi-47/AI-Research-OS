function classifyQuery(query) {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    if (!normalizedQuery) {
        return "RESEARCH";
    }

    const factPatterns = [
        /\b(age|population|capital|ceo|born|died|height|weather|time in|who is|who was|where is|when was)\b/,
        /\b(tokyo|shah rukh khan|openai ceo|president|prime minister)\b/
    ];

    const techPatterns = [
        /\b(mcp|model context protocol|langgraph|crewai|agent framework|github|open-source|framework|library|implementation|graphrag)\b/,
        /\b(how does|what is|explain|best .*frameworks|open source)\b/
    ];

    const researchPatterns = [
        /\b(compare|latest|architectures?|techniques?|paper|papers|pruning|llm|attention sinks|graphrag|sparsegpt|wanda)\b/
    ];

    if (factPatterns.some((pattern) => pattern.test(normalizedQuery))) {
        return "FACT";
    }

    if (techPatterns.some((pattern) => pattern.test(normalizedQuery))) {
        return "TECH";
    }

    if (researchPatterns.some((pattern) => pattern.test(normalizedQuery))) {
        return "RESEARCH";
    }

    return "RESEARCH";
}

module.exports = { classifyQuery };