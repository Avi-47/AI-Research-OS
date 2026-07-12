class Reranker {
    rerank(results) {
        const seen = new Set();
        const unique = [];
        for (const item of results) {
            const title =
                (
                    item.metadata?.title ||
                    item.provenance?.title ||
                    ""
                ).toLowerCase();
            const topic = (item.topic || "").toLowerCase();
            const text = (item.notes || "").substring(0, 150).toLowerCase();
            const key =
                (
                    item.provenance?.url ||
                    item.provenance?.title ||
                    item.metadata?.title ||
                    item.topic
                ).toLowerCase();
            if (seen.has(key))
                continue;
            seen.add(key);
            unique.push(item);
        }
        unique.sort(
            (a, b) =>
                (b.score || 0) -
                (a.score || 0)
        );
        return unique.slice(0, 8);
    }
}
module.exports = new Reranker();