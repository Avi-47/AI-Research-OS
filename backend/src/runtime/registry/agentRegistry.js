const { assertAgentContract } = require("../contracts/agent.contract");
class AgentRegistry {
	constructor() {
		this.agents = new Map();
	}
	register(agent) {
		assertAgentContract(agent);
		this.agents.set(agent.id, agent);
		return agent;
	}
	get(agentId) {
		return this.agents.get(agentId) || null;
	}
	list() {
		return [...this.agents.values()];
	}
	remove(agentId) {
		return this.agents.delete(agentId);
	}
	clear() {
		this.agents.clear();
	}
}
module.exports = {
	AgentRegistry
};