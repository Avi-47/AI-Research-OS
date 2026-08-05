class AIResponse {
    constructor({
        content,
        provider,
        model,
        success = true
    }) {
        this.content = content;
        this.provider = provider;
        this.model = model;
        this.success = success;
    }
}

module.exports = AIResponse;