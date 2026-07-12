class ResearchState {
	constructor({
		query = "",
		topics = [],
		evidence = [],
		report = "",
		topicStatus = {},
		workflowGraph = null,
		metadata = {}
	} = {}) {
		this.query = String(query || "").trim();
		this.topics = Array.isArray(topics) ? [...topics] : [];
		this.evidence = Array.isArray(evidence) ? [...evidence] : [];
		this.topicStatus = { ...topicStatus };
		this.workflowGraph = workflowGraph;
		this.report = String(report || "");
		this.metadata = { ...metadata };
	}

	update(patch = {}) {
		if (Object.prototype.hasOwnProperty.call(patch, "query")) {
			this.query = String(patch.query || "").trim();
		}

		if (Object.prototype.hasOwnProperty.call(patch, "topics")) {
			this.topics = Array.isArray(patch.topics) ? [...patch.topics] : [];
		}
		
		if (Object.prototype.hasOwnProperty.call(patch, "evidence")) {
			this.evidence = Array.isArray(patch.evidence) ? [...patch.evidence] : [];
		}
		if (Object.prototype.hasOwnProperty.call(patch, "topicStatus")) {
			this.topicStatus = {...this.topicStatus, ...patch.topicStatus};
		}
		if (Object.prototype.hasOwnProperty.call(patch, "workflowGraph")) {
			this.workflowGraph = patch.workflowGraph;
		}
		if (Object.prototype.hasOwnProperty.call(patch, "report")) {
			this.report = String(patch.report || "");
		}

		if (Object.prototype.hasOwnProperty.call(patch, "metadata")) {
			this.metadata = { ...this.metadata, ...patch.metadata };
		}

		return this;
	}

	snapshot() {
		return {
			query: this.query,
			topics: [...this.topics],
			evidence: [...this.evidence],
			topicStatus: { ...this.topicStatus },
			report: this.report,
			metadata: { ...this.metadata },
			workflowGraph: this.workflowGraph
		};
	}

	clone() {
		return new ResearchState(this.snapshot());
	}

	toJSON() {
		return this.snapshot();
	}
}

function createResearchState(initialState) {
	return new ResearchState(initialState);
}

module.exports = {
	ResearchState,
	createResearchState
};