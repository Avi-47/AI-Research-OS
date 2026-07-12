const { WorkflowGraph } = require("./workflowGraph");

const graph = new WorkflowGraph();

graph.addEdge(
	"planner-agent",
	"research-agent"
);

graph.addEdge(
	"research-agent",
	"writer-agent"
);

const researchWorkflowDefinition = Object.freeze({
	id: "research-workflow",
	name: "Research Workflow",

	graph,

	steps: Object.freeze([
		"planner-agent",
		"research-agent",
		"writer-agent"
	])
});

module.exports = {
	researchWorkflowDefinition
};