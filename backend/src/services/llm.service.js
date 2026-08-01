const {generateFallbackReport} = require("./fallbackWriter.service");
const { callOpenRouter } = require("../utils/llm");
const { reportPrompt } = require("../utils/prompts");

function compressEvidence(evidence = []) {

    return evidence
        .slice(0, 15)
        .map(item => ({

            topic: item.topic,

            notes: String(item.notes || "")
                .replace(/\s+/g, " ")
                .substring(0, 80)

        }));
}

function collectSourceValues(evidence) {
    const sourceValues = [];
    const seen = new Set();

    for (const item of evidence || []) {
        const source = String(item?.provenance?.url || item?.source || "").trim();
        if (!source || seen.has(source)) {
            continue;
        }
        seen.add(source);
        sourceValues.push({
            title: String(item?.provenance?.title || item?.title || "").trim(),
            url: source,
            topic: String(item?.topic || "").trim(),
            notes: String(item?.notes || "").trim()
        });
    }
    return sourceValues;
}

function buildReferencesSection(evidence) {
    const sources = collectSourceValues(evidence);
    if (sources.length === 0) {
        return "## References\n\n- No sources available";
    }
    return [
        "## References",
        "",
        ...sources.map((source) => `- [${source.title || source.url}](${source.url})${source.topic ? ` - ${source.topic}` : ""}`)
    ].join("\n");
}

async function generateReport(query, retrievedContext) {
    if (!query || !String(query).trim()) {
        throw new Error("Query is required");
    }
    const evidence = retrievedContext.semantic_context || [];
    const graphFacts = retrievedContext.graph_context || [];
    const compactEvidence = compressEvidence(evidence);
    const prompt = reportPrompt(
        query,
        compactEvidence,
        graphFacts
    );
    let reportBody;
    try {
        reportBody = await callOpenRouter(
            prompt,
            {
                stage: "Writer"
            }
        );
    }
    catch(err){
        console.log("Writer fallback.");
        reportBody = generateFallbackReport(
            query,
            evidence
        );
    }
    const referencesSection = buildReferencesSection(evidence);
    return `${reportBody.trim()}\n\n${referencesSection}`;
}

module.exports = { generateReport };