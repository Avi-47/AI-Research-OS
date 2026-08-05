class AIRequest {
    constructor({
        role,
        prompt,
        temperature = 0.7,
        maxTokens = 4000,
        responseType = "text"
    }) {
        this.role = role;
        this.prompt = prompt;
        this.temperature = temperature;
        this.maxTokens = maxTokens;
        this.responseType = responseType;
    }
}

module.exports = AIRequest;