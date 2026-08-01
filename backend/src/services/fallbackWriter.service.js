function generateFallbackReport(query, retrievedContext = {}) {

    const semanticContext = retrievedContext.semantic_context || [];
    const graphContext = retrievedContext.graph_context || [];

    const grouped = {};

    for (const item of semanticContext) {

        if (!grouped[item.topic]) {
            grouped[item.topic] = [];
        }

        grouped[item.topic].push(item);
    }

    let report = `# Research Report\n\n`;

    report += `## Query\n`;

    report += `${query}\n\n`;

    for (const topic of Object.keys(grouped)) {

        report += `## ${topic}\n\n`;

        grouped[topic].forEach(item => {

            report += `- ${item.notes}\n\n`;

        });

    }

    if (graphContext.length > 0) {
        report += `## Graph Context\n\n`;

        graphContext.forEach((fact) => {
            report += `- ${fact.source} ${fact.relation} ${fact.target}\n`;
        });

        report += `\n`;
    }

    report += `## Conclusion\n\n`;

    report += `This report was generated using retrieved evidence because the LLM was unavailable.\n`;

    return report;

}

module.exports = {
    generateFallbackReport
};