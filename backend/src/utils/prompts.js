function plannerPrompt(query) {
	return `
You are a research planning system.

Break the research question into 5 to 10 focused research entities or topics.

Research Question:
${query}

Rules:

- Return ONLY valid JSON.
- Return an array of strings.
- No markdown.
- No explanation.

Focus on concepts, methods, and named techniques rather than report headings.

Example:

["Magnitude Pruning", "SparseGPT", "Wanda"]
`;
}

function evidencePrompt(topic, searchResults) {
	return `
You are a research evidence collector.

Topic:
${topic}

Search Results:
${JSON.stringify(searchResults, null, 2)}

Write 2 to 5 evidence items based only on the supplied search results.

Rules:

- Return ONLY valid JSON.
- Return an array of objects.
- Every object must have: topic, provenance, notes.
- provenance must contain title and url.
- The provenance.url must be copied from one of the supplied search result url values.
- Keep notes concise and factual.
- Do not invent sources.
- Do not add markdown or commentary.

Example:

[
	{
		"topic": "SparseGPT",
		"provenance": {
			"title": "Example Paper",
			"url": "https://example.com/paper.pdf"
		},
		"notes": "One sentence evidence summary."
	}
]
`;
}

function reportPrompt(query, retrievedContext) {

	const semanticContext = retrievedContext.semantic_context || [];

	const graphContext = retrievedContext.graph_context || [];

	return `
You are a senior research analyst.

Write a research report using ONLY the supplied context.

Research Question:
${query}

Semantic Context
----------------
${JSON.stringify(semanticContext, null, 2)}

Graph Context
-------------
${JSON.stringify(graphContext, null, 2)}

Requirements:

1. Use markdown formatting.
2. Include a concise executive summary.
3. Include the sections:
   - Introduction
   - Findings
   - Comparative Analysis
   - Conclusion
4. Use BOTH semantic context and graph context when they are relevant.
5. Treat graph facts as structured relationships between concepts.
6. Do not introduce claims that are not supported by the supplied context.
7. Do not fabricate citations or sources.
8. Do not add a references section; it will be appended separately.
9. Be detailed and technical.
`;
}

module.exports = {
		plannerPrompt,
		evidencePrompt,
		reportPrompt
};
