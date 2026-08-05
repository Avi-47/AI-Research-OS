const OpenRouterProvider = require("../providers/OpenRouterProvider");
class ProviderManager {
    constructor() {
        this.providers = {
            openrouter: new OpenRouterProvider()
        };
    }
    get(name) {
        return this.providers[name];
    }
}
module.exports = ProviderManager;