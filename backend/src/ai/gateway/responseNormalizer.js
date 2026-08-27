class ResponseNormalizer {
    normalize(response) {
        if (!response) {
            throw new Error(
                "Empty AI provider response"
            );
        }
        if (typeof response !== "object") {
            throw new Error(
                "Invalid AI provider response"
            );
        }
        if (!Object.prototype.hasOwnProperty.call(response,"content")) {
            throw new Error(
                "AI provider response missing content"
            );
        }
        return response.content;
    }
}
module.exports = ResponseNormalizer;