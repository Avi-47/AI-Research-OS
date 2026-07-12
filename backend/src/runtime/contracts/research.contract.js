function assertString(value, label) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${label} must be a non-empty string`);
	}
}

function assertArray(value, label) {
	if (!Array.isArray(value)) {
		throw new Error(`${label} must be an array`);
	}
}

function freeze(value) {
	return Object.freeze(value);
}

function createPlannerInput({ query }) {
	assertString(query, "PlannerInput.query");
	return freeze({ query: query.trim() });
}

function createPlannerOutput({ topics }) {
	assertArray(topics, "PlannerOutput.topics");
	return freeze({
		topics: freeze([...topics])
	});
}

function createResearchInput({ query, topics }) {
	assertString(query, "ResearchInput.query");
	assertArray(topics, "ResearchInput.topics");
	return freeze({
		query: query.trim(),
		topics: freeze([...topics])
	});
}

function createResearchOutput({ evidence }) {
	assertArray(evidence, "ResearchOutput.evidence");
	return freeze({
		evidence: freeze([...evidence])
	});
}

function createWriterInput({ query, evidence }) {
	assertString(query, "WriterInput.query");
	assertArray(evidence, "WriterInput.evidence");
	return freeze({
		query: query.trim(),
		evidence: freeze([...evidence])
	});
}

function createWriterOutput({ report }) {
	assertString(report, "WriterOutput.report");
	return freeze({ report: report.trim() });
}

module.exports = {
	createPlannerInput,
	createPlannerOutput,
	createResearchInput,
	createResearchOutput,
	createWriterInput,
	createWriterOutput
};