const ProviderManager = require("./providerManager");
const FallbackPolicy = require("./fallbackPolicy");
const ResponseNormalizer = require("./responseNormalizer");
const modelRegistry = require("../registry/modelRegistry");
class AIGateway {
    constructor() {
        this.providerManager = new ProviderManager();
        this.normalizer = new ResponseNormalizer();
        this.fallbackPolicy = new FallbackPolicy(modelRegistry);
    }
    async generate(request) {
        const candidates = this.fallbackPolicy.getModels(request.role);
        let lastError = null;
        for (const candidate of candidates) {
            try {
                const provider = this.providerManager.get(candidate.provider);
                const response = await provider.generate(
                        request,
                        candidate.model
                    );
                return this.normalizer.normalize(response);
            } catch (err) {
                lastError = err;
                console.log(
                    `[AI Gateway] Model failed: ${candidate.model}`
                );
                console.log(
                    err.response?.data || err.message
                );
            }
        }
        throw lastError;
    }
}
module.exports = new AIGateway();