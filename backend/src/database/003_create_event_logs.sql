CREATE TABLE IF NOT EXISTS event_logs (
    id SERIAL PRIMARY KEY,
    message_id UUID NOT NULL,
    workflow_id UUID,
    event_type VARCHAR(100) NOT NULL,
    producer VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL
);