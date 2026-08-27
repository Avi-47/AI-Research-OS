class FallbackPolicy {
    constructor(modelRegistry) {
        this.modelRegistry = modelRegistry;
    }
    getModels(role) {
        const config = this.modelRegistry[role];
        if (!config) {
            throw new Error(
                `Unknown AI role: ${role}`
            );
        }
        if (
            !Array.isArray(
                config.candidates
            )
        ) {
            throw new Error(
                `No candidates configured for role: ${role}`
            );
        }
        console.log(
            `[FallbackPolicy] Role "${role}" candidates:`,
            config.candidates
        );
        return config.candidates;
    }
}
module.exports = FallbackPolicy;