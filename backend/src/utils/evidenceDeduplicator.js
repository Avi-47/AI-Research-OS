function normalize(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function createEvidenceKey(item) {
    return [
        normalize(item.topic),
        normalize(item.provenance),
        normalize(item.notes)
    ].join("|");
}

function deduplicateEvidence(
    evidence = []
) {
    if (!Array.isArray(evidence)) {
        return [];
    }

    const seen = new Set();

    return evidence.filter(item => {
        if (!item) {
            return false;
        }

        const key =
            createEvidenceKey(item);

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });
}

module.exports = {
    deduplicateEvidence,
    createEvidenceKey
};