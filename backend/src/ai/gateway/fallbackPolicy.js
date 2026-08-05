const modelRegistry = require("../registry/modelRegistry");
class FallbackPolicy {
    constructor(modelRegistry) {
        this.modelRegistry = modelRegistry;
    }
    getModels(role) {
        const config = modelRegistry[role];
        if (!config)
            throw new Error(
                `Unknown AI role: ${role}`
            );
        return [
            config.primary,
            ...config.fallback.map(model => ({
                provider: config.primary.provider,
                model
            }))
        ];
    }
}
module.exports = FallbackPolicy;