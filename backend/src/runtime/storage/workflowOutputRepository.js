const crypto = require("crypto");
const pool = require("../../db/postgres");

class WorkflowOutputRepository {

    constructor({ logger = console } = {}) {
        this.logger = logger;
    }

    async save({
        workflowId,
        outputType,
        content
    }) {

        const query = `
            INSERT INTO workflow_outputs(
                id,
                workflow_id,
                output_type,
                content
            )
            VALUES($1,$2,$3,$4)
        `;

        await pool.query(query, [
            crypto.randomUUID(),
            workflowId,
            outputType,
            JSON.stringify(content)
        ]);

        this.logger.log(
            `${outputType} saved for workflow ${workflowId}`
        );
    }

}

module.exports = {
    WorkflowOutputRepository
};