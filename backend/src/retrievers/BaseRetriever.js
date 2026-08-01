class BaseRetriever {
    async retrieve(query) {
        throw new Error("retrieve() must be implemented.");
    }
}
module.exports = BaseRetriever;