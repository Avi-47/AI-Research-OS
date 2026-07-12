class Chunker {
    chunk(text, chunkSize = 700, overlap = 120) {
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            const end = start + chunkSize;
            chunks.push(
                text.slice(start, end)
            );
            start += chunkSize - overlap;

        }
        return chunks;
    }
}
module.exports = new Chunker();