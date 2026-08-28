const {
    generateFallbackReport
} = require("./fallbackWriter.service");
const {aiGateway,AIRequest} = require("../ai");
const {reportPrompt} = require("../utils/prompts");

function compressEvidence(evidence = []) {
    return evidence
        .slice(0, 15)
        .map(item => ({
            topic: item.topic,
            notes: String(
                item.notes || ""
            )
                .replace(/\s+/g, " ")
                .substring(0, 500),
            source:
                item?.provenance?.url ||
                item?.source ||
                null
        }));
}

function collectSourceValues(evidence = []) {
    const sourceValues = [];
    const seen = new Set();
    for (const item of evidence) {
        const source = String(
                item?.provenance?.url ||
                item?.source ||
                ""
            ).trim();
        if (!source || seen.has(source)) {
            continue;
        }
        seen.add(source);
        sourceValues.push({
            title: String(
                    item?.provenance?.title ||
                    item?.title ||
                    ""
                ).trim(),
            url: source,
            topic: String(
                    item?.topic ||
                    ""
                ).trim(),
            notes: String(
                    item?.notes ||
                    ""
                ).trim()
        });
    }
    return sourceValues;
}
function buildReferencesSection(evidence = []) {
    const sources = collectSourceValues(evidence);
    if (sources.length === 0) {
        return [
            "## References",
            "",
            "- No sources available"
        ].join("\n");
    }
    return [
        "## References",
        "",
        ...sources.map(
            source =>
                `- [${source.title || source.url}](${source.url})${
                    source.topic
                        ? ` - ${source.topic}`
                        : ""
                }`
        )
    ].join("\n");
}

function buildInitialPrompt(query,compactEvidence,graphFacts,topics) {
    return reportPrompt(
        query,
        {
            semantic_context:compactEvidence,
            graph_context:graphFacts,
            topics
        }
    );
}
function buildRevisionPrompt({query,previousReport,revisionFeedback,compactEvidence,graphFacts, topics}) {
    return `
You are revising a research report.
The previous report was evaluated by a quality gate.
Your job is to improve the report using the evaluator feedback.
IMPORTANT RULES:
1. Preserve information that is already well supported.
2. Fix the specific weaknesses identified by the evaluator.
3. Do NOT invent facts.
4. Do NOT introduce unsupported claims.
5. Use only the available evidence and retrieved context.
6. Improve topic coverage if requested.
7. Improve clarity and structure if requested.
8. Reduce unsupported or hallucinated claims.
9. Return ONLY the revised research report.
10. Do NOT include meta commentary such as:
   "I revised the report" or
   "Based on evaluator feedback".
USER QUERY:
${query}
PLANNED TOPICS:
${JSON.stringify(topics, null, 2)}
PREVIOUS REPORT:
${previousReport}

QUALITY EVALUATION FEEDBACK:
${JSON.stringify(
    revisionFeedback,
    null,
    2
)}

AVAILABLE EVIDENCE:
${JSON.stringify(
    compactEvidence,
    null,
    2
)}
GRAPH FACTS:
${JSON.stringify(
    graphFacts,
    null,
    2
)}
`;
}

async function generateReport(query, retrievedContext = {}, options = {}) {
    if (!query || !String(query).trim()) {
        throw new Error(
            "Query is required"
        );
    }

    const evidence = retrievedContext.evidence || retrievedContext.semantic_context || [];
    const graphFacts = retrievedContext.graph_context || [];
    const compactEvidence = compressEvidence(evidence);

    const {
        mode = "initial",
        revisionFeedback = null,
        previousReport = null,
        topics = []
    } = options;
    let prompt;
    if (mode === "initial") {
        prompt = buildInitialPrompt(
                query,
                compactEvidence,
                graphFacts,
                topics
            );
    }

    else if (mode === "revision") {
        if (!previousReport) {
            throw new Error(
                "Previous report is required for revision"
            );
        }
        prompt = buildRevisionPrompt({
                query,
                previousReport,
                revisionFeedback,
                compactEvidence,
                graphFacts,
                topics
            });
    }
    else {
        throw new Error(
            `Unknown report generation mode: ${mode}`
        );
    }
    let reportBody;
    try {
        console.log(
            `[Writer] Generating ${mode} report...`
        );
        const response = await aiGateway.generate(
                new AIRequest({
                    role: "writer",
                    prompt,
                    responseType: "text"
                })
            );
        reportBody = response.content;
        if (typeof reportBody !== "string" || !reportBody.trim()) {
            throw new Error(
                "Writer returned invalid report content"
            );
        }
        console.log(
            `[Writer] ${mode} report generated successfully`
        );
    }

    catch (err) {
        console.log(
            `[Writer] ${mode} generation failed. Using fallback.`
        );

        if (mode === "revision" && previousReport) {
            reportBody = previousReport;
        }

        else {
            reportBody = generateFallbackReport(
                    query,
                    {
                        semantic_context: compactEvidence,
                        graph_context: graphFacts
                    }
                );
        }
    }

    const reportWithoutReferences =
        removeExistingReferences(
            reportBody
        );
    const referencesSection =  buildReferencesSection(
            evidence
        );
    return `${reportWithoutReferences.trim()}

${referencesSection}`;
}


function removeExistingReferences(report = "") {
    const referencePattern =
        /\n?## References[\s\S]*$/i;

    return String(report)
        .replace(
            referencePattern,
            ""
        ).trim();
}

module.exports = {
    generateReport
};