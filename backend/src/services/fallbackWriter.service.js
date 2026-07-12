function generateFallbackReport(query, evidence = []) {

    const grouped = {};

    for (const item of evidence) {

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

    report += `## Conclusion\n\n`;

    report += `This report was generated using retrieved evidence because the LLM was unavailable.\n`;

    return report;

}

module.exports = {
    generateFallbackReport
};