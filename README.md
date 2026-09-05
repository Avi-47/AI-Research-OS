Live website: https://ai-research-os-frontend.onrender.com/


## Phase 7 – AI Gateway

![AI Gateway](docs/architecture/phase7-ai-gateway.png)

The AI Gateway introduces a provider-independent service boundary for all LLM interactions across the runtime.

Before this phase, runtime agents communicated directly with OpenRouter, coupling the runtime to a single provider. Phase 7 introduces a centralized AI Gateway that abstracts provider-specific implementations, manages model selection, applies fallback policies, and normalizes responses into a common format.

### Before

Previously, every AI-capable component directly invoked OpenRouter.

```text
Planner
Research
Writer
Graph Builder
        │
        ▼
    OpenRouter
```

### After

All runtime components now communicate exclusively with the AI Gateway.

```text
Planner
Research
Writer
Graph Builder
        │
        ▼
+-------------------------+
|       AI Gateway        |
|-------------------------|
| Model Registry          |
| Provider Manager        |
| Fallback Policy         |
| Response Normalization  |
+-------------------------+
            │
            ▼
      AIProvider
            │
            ▼
   OpenRouterProvider
```

### Runtime Architecture

The AI Gateway becomes the final execution boundary for every LLM request generated during runtime.

```text
                     User Query
                          │
                          ▼
                    Planner Agent
                          │
                          ▼
                    Runtime Kernel
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
  Research Runtime                   Event Bus
          │                               │
          ▼                               ▼
     PostgreSQL                     Graph Builder
          │                               │
          ▼                               ▼
       Qdrant                          Neo4j
          │                               │
          └───────────────┬───────────────┘
                          ▼
                  Hybrid Retriever
                          │
                          ▼
                 Context Assembler
                          │
                          ▼
                    Writer Agent
                          │
                          ▼
                 +-------------------------+
                 |       AI Gateway        |
                 |-------------------------|
                 | Model Registry          |
                 | Provider Manager        |
                 | Fallback Policy         |
                 | Response Normalization  |
                 +-------------------------+
                             │
                             ▼
                    AIProvider Interface
                             │
                             ▼
                   OpenRouter Provider
```

### Responsibilities

- Provider abstraction through a common `AIProvider` interface.
- Centralized AI Gateway for all runtime LLM communication.
- Role-based model selection using a centralized Model Registry.
- Gateway-managed provider and model fallback.
- Unified `AIResponse` contract across all providers.
- Response normalization independent of provider-specific formats.
- Extensible architecture for future providers such as OpenAI, Gemini, Anthropic, or local models without modifying runtime agents.

### Benefits

- Eliminates direct provider dependencies from runtime components.
- Centralizes model routing and configuration.
- Simplifies provider migration and multi-provider deployments.
- Enables consistent fallback and retry strategies.
- Provides a single integration point for observability, logging, caching, and rate limiting.
- Future providers can be added by implementing the `AIProvider` interface without impacting the Planner, Research, Writer, or Graph Builder.
