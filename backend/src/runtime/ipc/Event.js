const { randomUUID } = require("crypto");

function createEvent({
    workflowId,
    eventType,
    producer,
    payload
}) {
    return {
        messageId: randomUUID(),
        workflowId,
        eventType,
        producer,
        timestamp: new Date().toISOString(),
        payload
    };
}

module.exports = {
    createEvent
};