const db = require("../../db/postgres");

class EventLogRepository {

    async save(event) {

        await db.query(
            `
            INSERT INTO event_logs
            (
                message_id,
                workflow_id,
                event_type,
                producer,
                created_at
            )
            VALUES ($1,$2,$3,$4,$5)
            `,
            [
                event.messageId,
                event.workflowId,
                event.eventType,
                event.producer,
                event.timestamp
            ]
        );

    }

}

module.exports = {
    EventLogRepository
};