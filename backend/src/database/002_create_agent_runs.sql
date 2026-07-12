CREATE TABLE IF NOT EXISTS agent_runs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_id VARCHAR(255) NOT NULL,

    agent_id VARCHAR(255) NOT NULL,

    agent_name VARCHAR(255) NOT NULL,

    parent_agent_id VARCHAR(255),

    execution_order INTEGER,

    status VARCHAR(50),

    started_at TIMESTAMP,

    ended_at TIMESTAMP,

    duration_ms INTEGER,

    error TEXT,

    result JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_runs_workflow
ON agent_runs(workflow_id);

CREATE INDEX idx_agent_runs_agent
ON agent_runs(agent_id);

CREATE INDEX idx_agent_runs_parent
ON agent_runs(parent_agent_id);