class AIProvider {

    async generate(request, model) {
        throw new Error("generate() must be implemented");
    }

}

module.exports = AIProvider;