class KeywordSearchService {

    search(
        query,
        evidence = []
    ) {

        const words = query
            .toLowerCase()
            .split(/\s+/);

        return evidence.filter(doc => {

            const text = (
                doc.notes +
                " " +
                doc.topic
            ).toLowerCase();

            return words.some(word =>
                text.includes(word)
            );

        });

    }

}

module.exports = new KeywordSearchService();