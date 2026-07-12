class AgentError extends Error {
	constructor(message, options = {}) {
		super(message);
		this.name = "AgentError";
		this.code = options.code || "AGENT_ERROR";
		this.agentId = options.agentId || null;
		this.agentName = options.agentName || null;
		this.workflowId = options.workflowId || null;
		this.recoverable = Boolean(options.recoverable);
		this.fatal = typeof options.fatal === "boolean" ? options.fatal : !this.recoverable;
		this.details = options.details || null;
		this.cause = options.cause || null;
	}

	static from(error, options = {}) {
		if (error instanceof AgentError) {
			return error;
		}

		return new AgentError(error?.message || "Agent execution failed", {
			...options,
			cause: error,
			fatal: options.fatal === undefined ? true : options.fatal,
			recoverable: options.recoverable || false,
			details: options.details || error?.response?.data || error?.details || null
		});
	}

	static recoverable(message, options = {}) {
		return new AgentError(message, {
			...options,
			recoverable: true,
			fatal: false
		});
	}

	static fatal(message, options = {}) {
		return new AgentError(message, {
			...options,
			recoverable: false,
			fatal: true
		});
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			agentId: this.agentId,
			agentName: this.agentName,
			workflowId: this.workflowId,
			recoverable: this.recoverable,
			fatal: this.fatal,
			details: this.details
		};
	}
}

module.exports = {
	AgentError
};