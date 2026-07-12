const AgentStatus = Object.freeze({
	PENDING: "PENDING",
	QUEUED: "QUEUED",
	RUNNING: "RUNNING",
	COMPLETED: "COMPLETED",
	FAILED: "FAILED"
});

function isTerminalStatus(status) {
	return status === AgentStatus.COMPLETED || status === AgentStatus.FAILED;
}

module.exports = {
	AgentStatus,
	isTerminalStatus
};