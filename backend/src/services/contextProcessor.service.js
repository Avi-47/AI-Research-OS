class ContextProcessor {
    compress(evidence = []) {
        const grouped = new Map();
        for (const doc of evidence) {
            const key =
                (
                    doc.provenance?.title ||
                    doc.topic
                ).trim().toLowerCase();
            if (!grouped.has(key)) {
                grouped.set(key, doc);
                continue;
            }
            const existing = grouped.get(key);
            if (
                (doc.notes?.length || 0) >
                (existing.notes?.length || 0)
            ) {
                grouped.set(key, doc);
            }
        }
        return [...grouped.values()];
    }
}
module.exports = new ContextProcessor();