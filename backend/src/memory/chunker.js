function chunkEvidence(evidence = []) {
    const chunks = [];
    for (const item of evidence) {
        chunks.push({
            id: crypto.randomUUID(),
            topic: item.topic,
            text: [
                item.topic,
                item.provenance?.title,
                item.notes
            ]
            .filter(Boolean)
            .join("\n\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim(),
            metadata: {
                topic: item.topic,
                title: item.provenance?.title,
                url: item.provenance?.url
            }
        });
    }
    return chunks;
}
const crypto = require("crypto");
module.exports = {
    chunkEvidence
};