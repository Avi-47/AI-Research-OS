class ContextAssembler {
    assemble(
        semantic_context = [],
        graph_context = []
    ) {
        return {
            semantic_context,
            graph_context,
            metadata: {
                semantic_hits: semantic_context.length,
                graph_hits: graph_context.length
            }
        };
    }
}
module.exports = new ContextAssembler();