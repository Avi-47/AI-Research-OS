class DocumentGrouper {

    group(results) {

        const best = new Map();

        for (const result of results) {

            const key =
                (
                    result.provenance?.title ||
                    result.notes?.slice(0,50) ||
                    "unknown"
                ).toLowerCase();

            const existing = best.get(key);

            if (!existing || (result.score || 0) > (existing.score || 0)) {

                best.set(key, result);

            }

        }

        return [...best.values()];

    }

}

module.exports = new DocumentGrouper();