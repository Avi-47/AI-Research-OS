CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY,
    workflow_id UUID NOT NULL,
    passed BOOLEAN NOT NULL,
    failed_rules JSONB NOT NULL,
    completeness INTEGER,
    correctness INTEGER,
    structure INTEGER,
    evidence_usage INTEGER,
    hallucination_risk INTEGER,
    comments TEXT,
    evaluated_at TIMESTAMP NOT NULL
);