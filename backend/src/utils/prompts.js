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

function reportPrompt(query, evidence) {
	return `
You are a senior research analyst.

Write a research report using only the supplied evidence.

Research Question:
${query}

Evidence:
${JSON.stringify(evidence, null, 2)}

Requirements:

1. Use markdown formatting.
2. Include a concise executive summary.
3. Include the sections: Introduction, Findings, Comparative Analysis, and Conclusion.
4. Do not introduce claims that are not supported by the evidence.
5. Do not fabricate citations or sources.
6. Do not add a references section; it will be appended separately from evidence.provenance values only.
7. Be detailed and technical.
`;
}

module.exports = {
		plannerPrompt,
		evidencePrompt,
		reportPrompt
};
