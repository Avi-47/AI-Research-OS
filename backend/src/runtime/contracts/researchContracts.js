function freezeObject(value) {
	return Object.freeze(value);
}

const PlannerInputSchema = freezeObject({
	title: "PlannerInput",
	type: "object",
	required: ["query"],
	properties: {
		query: { type: "string" },
		state: { type: "object" }
	}
});

const PlannerOutputSchema = freezeObject({
	title: "PlannerOutput",
	type: "object",
	required: ["topics"],
	properties: {
		topics: {
			type: "array",
			items: { type: "string" }
		}
	}
});

const ResearchInputSchema = freezeObject({
	title: "ResearchInput",
	type: "object",
	required: ["query", "topics"],
	properties: {
		query: { type: "string" },
		topics: {
			type: "array",
			items: { type: "string" }
		},
		state: { type: "object" }
	}
});

const ResearchOutputSchema = freezeObject({
	title: "ResearchOutput",
	type: "object",
	required: ["evidence", "retrievedContext"],
	properties: {
		evidence: {
			type: "array",
			items: { type: "object" }
		},
		retrievedContext: {
			type: "object"
		}
	}
});

const WriterInputSchema = freezeObject({
	title: "WriterInput",
	type: "object",
	required: ["query", "evidence"],
	properties: {
		query: { type: "string" },
		evidence: {
			type: "array",
			items: { type: "object" }
		},
		state: { type: "object" },
		retrievedContext: {
			type: "object"
		}
	}
});

const WriterOutputSchema = freezeObject({
	title: "WriterOutput",
	type: "object",
	required: ["report"],
	properties: {
		report: { type: "string" }
	}
});

const AgentResultSchema = freezeObject({
	title: "AgentResult",
	type: "object",
	required: ["agentId", "status", "durationMs", "output"],
	properties: {
		agentId: { type: "string" },
		status: { type: "string", enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED"] },
		durationMs: { type: "number" },
		output: { type: "object" }
	}
});

function createPlannerInput({ query, state }) {
	return freezeObject({
		query: String(query || "").trim(),
		state
	});
}

function createPlannerOutput({ topics }) {
	return freezeObject({
		topics: Array.isArray(topics) ? [...topics] : []
	});
}

function createResearchInput({ query, topics, state }) {
	return freezeObject({
		query: String(query || "").trim(),
		topics: Array.isArray(topics) ? [...topics] : [],
		state
	});
}

function createResearchOutput({
	evidence,
	retrievedContext
}) {
	return freezeObject({
		evidence: Array.isArray(evidence) ? [...evidence] : [],
		retrievedContext: retrievedContext || {
			semantic_context: [],
			graph_context: [],
			metadata: {}
		}
	});
}

function createWriterInput({ query, evidence,retrievedContext, state }) {
	return freezeObject({
		query: String(query || "").trim(),
		evidence: Array.isArray(evidence) ? [...evidence] : [],
		retrievedContext:
			retrievedContext || {
				semantic_context: [],
				graph_context: [],
				metadata: {}
			},
		state
	});
}

function createWriterOutput({ report }) {
	return freezeObject({
		report: String(report || "")
	});
}

module.exports = {
	PlannerInputSchema,
	PlannerOutputSchema,
	ResearchInputSchema,
	ResearchOutputSchema,
	WriterInputSchema,
	WriterOutputSchema,
	AgentResultSchema,
	createPlannerInput,
	createPlannerOutput,
	createResearchInput,
	createResearchOutput,
	createWriterInput,
	createWriterOutput
};