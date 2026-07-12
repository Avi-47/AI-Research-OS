class WorkflowGraph {

	constructor() {
		this.nodes = new Map();
		this.edges = new Map();
	}

	addNode(nodeId) {

		if (!this.nodes.has(nodeId)) {
			this.nodes.set(nodeId, {
				id: nodeId
			});
		}

		if (!this.edges.has(nodeId)) {
			this.edges.set(nodeId, []);
		}
	}

	addEdge(from, to) {

		this.addNode(from);
		this.addNode(to);

		this.edges.get(from).push(to);
	}

	getChildren(nodeId) {
		return this.edges.get(nodeId) || [];
	}

	toJSON() {
		return {
			nodes: [...this.nodes.values()],
			edges: [...this.edges.entries()]
		};
	}
}

module.exports = {
	WorkflowGraph
};