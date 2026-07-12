/**
 * @typedef {Object} AgentContract
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} goal
 * @property {(input: any, context?: Object) => Promise<any>} execute
 */

function isAgentContract(candidate) {
	return Boolean(
		candidate &&
		typeof candidate.id === "string" &&
		candidate.id.trim() &&
		typeof candidate.name === "string" &&
		candidate.name.trim() &&
		typeof candidate.role === "string" &&
		candidate.role.trim() &&
		typeof candidate.goal === "string" &&
		candidate.goal.trim() &&
		typeof candidate.execute === "function"
	);
}

function assertAgentContract(candidate) {
	if (!isAgentContract(candidate)) {
		throw new Error("Agent must implement id, name, role, goal, and execute()");
	}

	return candidate;
}

module.exports = {
	isAgentContract,
	assertAgentContract
};/**
 * @typedef {Object} AgentContract
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} goal
 * @property {(input: any, context?: object) => Promise<any>} execute
 */

function assertAgentContract(agent) {
	if (!agent || typeof agent !== "object") {
		throw new Error("Agent contract is required");
	}

	const requiredProperties = ["id", "name", "role", "goal", "execute"];
	for (const property of requiredProperties) {
		if (!(property in agent)) {
			throw new Error(`Agent contract missing property: ${property}`);
		}
	}

	if (typeof agent.id !== "string" || !agent.id.trim()) {
		throw new Error("Agent id must be a non-empty string");
	}

	if (typeof agent.name !== "string" || !agent.name.trim()) {
		throw new Error("Agent name must be a non-empty string");
	}

	if (typeof agent.role !== "string" || !agent.role.trim()) {
		throw new Error("Agent role must be a non-empty string");
	}

	if (typeof agent.goal !== "string" || !agent.goal.trim()) {
		throw new Error("Agent goal must be a non-empty string");
	}

	if (typeof agent.execute !== "function") {
		throw new Error("Agent execute must be a function");
	}
}

module.exports = {
	assertAgentContract
};