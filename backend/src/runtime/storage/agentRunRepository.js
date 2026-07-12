const pool = require("../../db/postgres");

class AgentRunRepository {

    constructor({ logger = console } = {}) {
        this.logger = logger;
    }

    async save(record) {

        try {

            const query = `
                INSERT INTO agent_runs(
                    workflow_id,
                    agent_id,
                    agent_name,
                    parent_agent_id,
                    execution_order,
                    status,
                    started_at,
                    ended_at,
                    duration_ms,
                    error,
                    result
                )
                VALUES(
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
                )
            `;
            console.log(
                "INSERTING AGENT:",
                record.agentId
            );
            await pool.query(query, [

                record.workflowId,

                record.agentId,

                record.agentName,

                record.parentAgentId,

                record.executionOrder,

                record.status,

                record.startedAt,

                record.endedAt,

                record.durationMs,

                record.error,

                JSON.stringify(record.result)

            ]);

        } catch (err) {

            this.logger.error(
                "Failed to save agent run",
                err
            );

        }

    }

}

module.exports = {
    AgentRunRepository
};