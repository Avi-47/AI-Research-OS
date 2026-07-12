const crypto = require("crypto");
const pool = require("../../db/postgres");

class EvidenceRepository {

    constructor({ logger = console } = {}) {
        this.logger = logger;
    }

    async save({
        workflowId,
        topic,
        provenance,
        notes
    }) {

        const query = `
            INSERT INTO evidence(
                id,
                workflow_id,
                topic,
                title,
                source_url,
                notes
            )
            VALUES($1,$2,$3,$4,$5,$6)
        `;

        await pool.query(query, [

            crypto.randomUUID(),

            workflowId,

            topic,

            provenance?.title || null,

            provenance?.url || null,

            notes

        ]);

        this.logger.log(
            `Evidence stored : ${topic}`
        );

    }

}

module.exports = {
    EvidenceRepository
};