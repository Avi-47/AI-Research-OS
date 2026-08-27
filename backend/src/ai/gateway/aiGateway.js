const ProviderManager = require("./providerManager");
const FallbackPolicy = require("./fallbackPolicy");
const ResponseNormalizer = require("./responseNormalizer");
const modelRegistry = require("../registry/modelRegistry");
class AIGateway {
    constructor() {
        this.providerManager = new ProviderManager();
        this.normalizer = new ResponseNormalizer();
        this.fallbackPolicy = new FallbackPolicy(modelRegistry);
        this.cooldowns = new Map();
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getCandidateKey(candidate) {
        return `${candidate.provider}:${candidate.model}`;
    }
    isCoolingDown(candidate) {
        const key = this.getCandidateKey(candidate);
        const cooldownUntil = this.cooldowns.get(key);
        if (!cooldownUntil) {
            return false;
        }
        if (Date.now() >= cooldownUntil) {
            this.cooldowns.delete(key);
            return false;
        }
        return true;
    }
    getRemainingCooldown(candidate) {
        const key = this.getCandidateKey(candidate);
        const cooldownUntil = this.cooldowns.get(key);
        if (!cooldownUntil) {
            return 0;
        }
        return Math.max(
            0,
            cooldownUntil - Date.now()
        );
    }
    enterCooldown(candidate, ms = 15000) {
        const key = this.getCandidateKey(candidate);
        this.cooldowns.set(
            key,
            Date.now() + ms
        );
        console.log(
            `[AI Gateway] ${candidate.model} entered cooldown for ${ms}ms`
        );
    }
    isRateLimitError(err) {
        return (
            err?.response?.status === 429 ||
            err?.status === 429 ||
            err?.code === 429
        );
    }
    isNonRetryableError(err) {
        const status =
            err?.response?.status ||
            err?.status ||
            err?.code;
        return [400,401,403,404,422].includes(status);
    }
    createGatewayError({
        role,
        attempts,
        lastError
    }) {
        const error =
            new Error(
                `All AI models failed for role "${role}". ` +
                `Last error: ${lastError?.message || "Unknown error"}`
            );
        error.name = "AIGatewayError";
        error.code = "AI_ALL_MODELS_FAILED";
        error.role = role;
        error.attempts = attempts;
        error.lastError = {
            message:
                lastError?.message || null,
            status:
                lastError?.response?.status ||
                lastError?.status ||
                null,
            providerError:
                lastError?.response?.data ||
                null
        };
        return error;
    }
    async generate(request) {
        const role = String(request.role || "").trim().toLowerCase();
        if (!role) {
            throw new Error(
                "AI request role is required"
            );
        }
        const candidates = this.fallbackPolicy.getModels(role);
        let lastError = null;
        const attempts = [];
        for (const candidate of candidates) {
            if (this.isCoolingDown(candidate)) {
                const remaining = this.getRemainingCooldown(candidate);
                console.log(
                    `[AI Gateway] Skipping ${candidate.model} ` +
                    `because it is cooling down for ${remaining}ms`
                );
                attempts.push({
                    provider: candidate.provider,
                    model: candidate.model,
                    status: "SKIPPED_COOLDOWN",
                    cooldownRemainingMs: remaining
                });
                continue;
            }
            const maxRetries = 2;
            for (let attempt = 1;attempt <= maxRetries; attempt++) {
                try {
                    console.log(
                        `[AI Gateway] Trying ${candidate.model} ` +
                        `for ${role} ` +
                        `(attempt ${attempt}/${maxRetries})`
                    );
                    const provider =
                        this.providerManager.get(
                            candidate.provider
                        );
                    const response =
                        await provider.generate(
                            {
                                ...request,
                                role
                            },
                            candidate.model
                        );
                    const normalized = this.normalizer.normalize(response);
                    console.log(`[AI Gateway] Success: ${candidate.model}`);
                    return {
                        success: true,
                        content: normalized,
                        metadata: {
                            provider: candidate.provider,
                            model: candidate.model,
                            role,
                            attempts
                        }
                    };
                } catch (err) {
                    lastError = err;
                    const status =
                        err?.response?.status ||
                        err?.status ||
                        null;
                    console.log(
                        `[AI Gateway] Model failed: ${candidate.model}`,
                        err?.response?.data ||
                        err?.message
                    );
                    attempts.push({
                        provider: candidate.provider,
                        model: candidate.model,
                        attempt,
                        status: status || "ERROR",
                        error: err?.message || "Unknown error"
                    });
                    // 404, authentication errors, invalid request etc.
                    // Do not retry the same model.
                    if (this.isNonRetryableError(err)) {
                        console.log(
                            `[AI Gateway] Non-retryable error (${status}). ` +
                            `Skipping to next candidate...`
                        );
                        break;
                    }
                    // Rate limited.
                    if (this.isRateLimitError(err)) {
                        this.enterCooldown(
                            candidate,
                            15000
                        );
                        console.log(
                            `[AI Gateway] Rate limited. ` +
                            `Trying next fallback model...`
                        );
                        break;
                    }
                    // Retry only temporary failures.
                    if (attempt < maxRetries) {
                        const delay = 1000 * Math.pow(2,attempt - 1);
                        console.log(`[AI Gateway] Retrying in ${delay}ms`);
                        await this.sleep(delay);
                        continue;
                    }
                    break;
                }
            }
        }
        throw this.createGatewayError({
            role,
            attempts,
            lastError
        });
    }
}
module.exports = new AIGateway();