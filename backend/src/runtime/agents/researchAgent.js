// backend/src/runtime/agents/researchAgent.js

const { createEvent } = require("../ipc/Event");
const { deduplicateEvidence } = require("../../utils/evidenceDeduplicator");
const retrievalService = require("../../services/retrieval.service");
const semanticMemoryService = require("../../services/semanticMemory.service");
const { AgentRunRepository } = require("../storage/agentRunRepository");
const { TopicResearchAgent } = require("./topicResearchAgent");
const { BaseAgent } = require("../baseAgent");

const {
    createResearchInput,
    createResearchOutput,
    ResearchInputSchema,
    ResearchOutputSchema,
} = require("../contracts/researchContracts");

class ResearchAgent extends BaseAgent {
    constructor({
        researchService,
        scheduler,
        runtimeKernel,
        evidenceRepository,
        agentRunRepository,
        runStore,
        tracer,
        logger,
        ...baseConfig
    }) {
        super({
            ...baseConfig,
            runStore,
            tracer,
            logger,
        });

        this.researchService = researchService;
        this.scheduler = scheduler;
        this.runtimeKernel = runtimeKernel;
        this.evidenceRepository = evidenceRepository;

        this.agentRunRepository =
            agentRunRepository ||
            new AgentRunRepository({
                logger,
            });

        this.runStore = runStore;
        this.tracer = tracer;
        this.logger = logger;

        this.inputSchema = ResearchInputSchema;
        this.outputSchema = ResearchOutputSchema;
    }

    buildInput(state) {
        return createResearchInput({
            query: state.query,
            topics: state.topics,
            state: state.snapshot(),
        });
    }

    /**
     * Execute tasks with a controlled concurrency limit.
     *
     * This intentionally keeps concurrency low because
     * free/public AI providers can quickly hit rate limits.
     */
    async runWithConcurrency(tasks, limit = 1) {
        if (!Array.isArray(tasks)) {
            throw new Error("Tasks must be an array");
        }

        if (tasks.length === 0) {
            return [];
        }

        const results = new Array(tasks.length);

        let nextIndex = 0;

        const worker = async () => {
            while (true) {
                const currentIndex = nextIndex++;

                if (currentIndex >= tasks.length) {
                    return;
                }

                try {
                    const value = await tasks[currentIndex]();

                    results[currentIndex] = {
                        status: "fulfilled",
                        value,
                    };
                } catch (reason) {
                    results[currentIndex] = {
                        status: "rejected",
                        reason,
                    };
                }
            }
        };

        const concurrency = Math.max(
            1,
            Math.min(limit, tasks.length)
        );

        await Promise.all(
            Array.from(
                { length: concurrency },
                () => worker()
            )
        );

        return results;
    }

    /**
     * Determine whether a topic is already sufficiently covered
     * by retrieved semantic memory.
     *
     * This intentionally avoids simple substring matching.
     *
     * Example:
     *   "Machine Learning" should not match "Learning"
     *   merely because one word is contained in the other.
     */
    isTopicCoveredByMemory(topic, memoryItems = []) {
        if (!topic) {
            return false;
        }

        const normalizedTopic = String(topic)
            .toLowerCase()
            .trim();

        const topicWords = normalizedTopic
            .split(/\s+/)
            .filter((word) => word.length > 2);

        if (topicWords.length === 0) {
            return false;
        }

        return memoryItems.some((item) => {
            const memoryTopic = String(item.topic || "")
                .toLowerCase()
                .trim();

            const memoryNotes = String(item.notes || "")
                .toLowerCase();

            const searchableText = `${memoryTopic} ${memoryNotes}`;

            const matchedWords = topicWords.filter((word) =>
                searchableText.includes(word)
            );

            /*
             * For a single-word topic, require an exact topic match.
             */
            if (topicWords.length === 1) {
                return memoryTopic === normalizedTopic;
            }

            /*
             * For multi-word topics, require at least 80% of
             * meaningful words to be present.
             */
            const matchRatio =
                matchedWords.length / topicWords.length;

            return matchRatio >= 0.8;
        });
    }

    /**
     * Normalize evidence before storing or indexing it.
     */
    normalizeEvidence(item, source = "research") {
        if (!item) {
            return null;
        }

        const topic = String(item.topic || "").trim();
        const notes = String(item.notes || "").trim();

        if (!topic || !notes) {
            return null;
        }

        return {
            topic,
            provenance: item.provenance || null,
            notes,
            source: item.source || source,
        };
    }

    /**
     * Determine whether evidence is useful enough to retain.
     *
     * This is intentionally simple for now and can later be
     * replaced with a semantic relevance evaluator.
     */
    isUsefulEvidence(evidence, query, allowedTopics = []) {
        if (!evidence) {
            return false;
        }

        const notes = String(evidence.notes || "").trim();

        if (notes.length < 20) {
            return false;
        }

        const evidenceTopic = String(evidence.topic || "")
            .toLowerCase()
            .trim();

        const normalizedAllowedTopics = allowedTopics.map((topic) =>
            String(topic).toLowerCase().trim()
        );

        /*
         * If the evidence has a topic, prefer evidence that
         * belongs to one of the requested research topics.
         */
        if (
            normalizedAllowedTopics.length > 0 &&
            evidenceTopic
        ) {
            const matchesTopic = normalizedAllowedTopics.some(
                (topic) =>
                    evidenceTopic === topic ||
                    evidenceTopic.includes(topic) ||
                    topic.includes(evidenceTopic)
            );

            if (!matchesTopic) {
                this.logger?.warn?.(
                    `[Research] Dropping potentially irrelevant evidence: ${evidence.topic}`
                );

                return false;
            }
        }

        return true;
    }

    /**
     * Persist evidence while preventing duplicate writes
     * within the same workflow execution.
     */
    async saveEvidence(
        evidence,
        workflowId,
        agentId,
        savedEvidenceKeys
    ) {
        if (!this.evidenceRepository) {
            return;
        }

        for (const item of evidence) {
            const key = [
                item.topic,
                item.provenance,
                item.notes,
            ]
                .map((value) =>
                    String(value || "")
                        .trim()
                        .toLowerCase()
                )
                .join("|");

            if (savedEvidenceKeys.has(key)) {
                this.logger?.log?.(
                    `[Research] Skipping duplicate evidence storage: ${item.topic}`
                );

                continue;
            }

            savedEvidenceKeys.add(key);

            await this.evidenceRepository.save({
                workflowId,
                agentId,
                topic: item.topic,
                provenance: item.provenance,
                notes: item.notes,
            });
        }
    }

    async execute(input, context = {}) {
        const graph = context.graph;
        const workflowId = context.workflowId || null;

        /*
         * ============================================================
         * STEP 1: Retrieve previous semantic and graph context.
         * ============================================================
         */

        const retrievedContext = await retrievalService.retrieve(
            input.query,
            context.state?.evidence || []
        );

        const memory = Array.isArray(
            retrievedContext.semantic_context
        )
            ? retrievedContext.semantic_context
            : [];

        const graphContext = Array.isArray(
            retrievedContext.graph_context
        )
            ? retrievedContext.graph_context
            : [];

        this.logger?.log?.(
            `[Research] Retrieved ${memory.length} semantic chunks`
        );

        this.logger?.log?.(
            `[Research] Retrieved ${graphContext.length} graph facts`
        );

        /*
         * ============================================================
         * STEP 2: Determine which topics require new research.
         * ============================================================
         */

        const coveredTopics = [];

        const topicsToResearch = input.topics.filter((topic) => {
            const covered = this.isTopicCoveredByMemory(
                topic,
                memory
            );

            if (covered) {
                coveredTopics.push(topic);
            }

            return !covered;
        });

        this.logger?.log?.(
            `[Research] Topics requested: ${input.topics.length}`
        );

        this.logger?.log?.(
            `[Research] Topics covered by relevant memory: ${coveredTopics.length}`
        );

        this.logger?.log?.(
            `[Research] Topics requiring research: ${topicsToResearch.length}`
        );

        /*
         * ============================================================
         * STEP 3: Initialize topic statuses.
         * ============================================================
         */

        const topicStatus = {};

        for (const topic of input.topics) {
            topicStatus[topic] = coveredTopics.includes(topic)
                ? "COVERED_BY_MEMORY"
                : "QUEUED";
        }

        context.state.update({
            topicStatus,
        });

        /*
         * ============================================================
         * STEP 4: Create topic research agents.
         * ============================================================
         */

        const workers = topicsToResearch.map((topic, index) => {
            return new TopicResearchAgent({
                id: `topic-research-${index + 1}`,
                name: `Topic Research Agent ${index + 1}`,
                role: "TOPIC_RESEARCH",
                goal: `Research ${topic}`,

                dependencies: {
                    researchService: this.researchService,
                },

                runStore: this.runStore,
                tracer: this.tracer,
                logger: this.logger,
            });
        });

        workers.forEach((worker) => {
            graph?.addNode(worker.id);
            graph?.addEdge("research-agent", worker.id);
        });

        /*
         * ============================================================
         * STEP 5: Create executable research tasks.
         * ============================================================
         */

        const tasks = workers.map((worker, index) => {
            return async () => {
                const topic = topicsToResearch[index];

                topicStatus[topic] = "RUNNING";

                return worker.run(
                    {
                        topic,
                    },
                    {
                        workflowId,
                        parentAgentId: this.id,
                        graph,
                    }
                );
            };
        });

        /*
         * Keep concurrency low for free/shared LLM providers.
         * Increase this later when provider capacity allows it.
         */
        const workerResults = await this.runWithConcurrency(
            tasks,
            1
        );

        /*
         * ============================================================
         * STEP 6: Initialize evidence from semantic memory.
         * ============================================================
         */

        let evidence = memory
            .map((item) =>
                this.normalizeEvidence(item, "memory")
            )
            .filter(Boolean)
            .filter((item) =>
                this.isUsefulEvidence(
                    item,
                    input.query,
                    input.topics
                )
            );

        evidence = deduplicateEvidence(evidence);

        this.logger?.log?.(
            `[Research] Valid memory evidence: ${evidence.length}`
        );

        graph?.addNode("writer-agent");

        /*
         * Track evidence that has already been persisted.
         */
        const savedEvidenceKeys = new Set();

        /*
         * ============================================================
         * STEP 7: Process each topic research result.
         * ============================================================
         */

        for (let index = 0; index < workerResults.length; index++) {
            const result = workerResults[index];
            const topic = topicsToResearch[index];
            const worker = workers[index];

            /*
             * Save agent execution metadata.
             */

            const trace = this.tracer
                ?.getWorkflowTraces(workflowId)
                ?.find(
                    (traceItem) =>
                        traceItem.agentId === worker.id
                );

            if (trace) {
                try {
                    await this.agentRunRepository.save({
                        workflowId,

                        agentId: trace.agentId,
                        agentName: trace.agentName,
                        parentAgentId: trace.parentAgentId,

                        executionOrder:
                            trace.executionOrder,

                        status: trace.status,

                        startedAt: trace.startedAt,
                        endedAt: trace.endedAt,
                        durationMs: trace.durationMs,

                        error: trace.error,

                        result:
                            result.status === "fulfilled"
                                ? result.value
                                : null,
                    });
                } catch (error) {
                    this.logger?.error?.(
                        "[Research] Failed to save agent run:",
                        error
                    );
                }
            }

            /*
             * Handle successful topic research.
             */

            if (result.status === "fulfilled") {
                const rawEvidence = Array.isArray(
                    result.value?.evidence
                )
                    ? result.value.evidence
                    : [];

                const topicEvidence = rawEvidence
                    .map((item) =>
                        this.normalizeEvidence(
                            item,
                            "research"
                        )
                    )
                    .filter(Boolean)
                    .filter((item) =>
                        this.isUsefulEvidence(
                            item,
                            input.query,
                            [topic]
                        )
                    );

                if (topicEvidence.length === 0) {
                    topicStatus[topic] = "PARTIAL";

                    this.logger?.warn?.(
                        `[Research] No useful evidence generated for topic: ${topic}`
                    );

                    continue;
                }

                topicStatus[topic] = "COMPLETED";

                evidence.push(...topicEvidence);

                /*
                 * Persist topic evidence only once.
                 */

                try {
                    const uniqueTopicEvidence =
                        deduplicateEvidence(
                            topicEvidence
                        );

                    await this.saveEvidence(
                        uniqueTopicEvidence,
                        workflowId,
                        worker.id,
                        savedEvidenceKeys
                    );
                } catch (error) {
                    this.logger?.error?.(
                        `[Research] Failed to save evidence for ${topic}:`,
                        error
                    );
                }

                graph?.addEdge(
                    worker.id,
                    "writer-agent"
                );

                continue;
            }

            /*
             * Handle failed topic research.
             */

            topicStatus[topic] = "FAILED";

            this.logger?.error?.(
                `[Research] Topic failed: ${topic}`,
                result.reason?.message ||
                    result.reason ||
                    "Unknown error"
            );
        }

        /*
         * ============================================================
         * STEP 8: Final evidence deduplication.
         * ============================================================
         */

        const evidenceBeforeDedupe = evidence.length;

        evidence = deduplicateEvidence(evidence);

        this.logger?.log?.(
            `[Research] Evidence before dedupe: ${evidenceBeforeDedupe}`
        );

        this.logger?.log?.(
            `[Research] Evidence after dedupe: ${evidence.length}`
        );

        /*
         * ============================================================
         * STEP 9: Determine overall research status.
         * ============================================================
         */

        const statuses = Object.values(topicStatus);

        const failedCount = statuses.filter(
            (status) => status === "FAILED"
        ).length;

        const completedCount = statuses.filter(
            (status) => status === "COMPLETED"
        ).length;

        let researchStatus;

        if (
            completedCount === 0 &&
            evidence.length === 0
        ) {
            researchStatus = "FAILED";
        } else if (
            failedCount > 0 ||
            statuses.includes("PARTIAL")
        ) {
            researchStatus = "PARTIAL_SUCCESS";
        } else {
            researchStatus = "SUCCESS";
        }

        this.logger?.log?.(
            `[Research] Final status: ${researchStatus}`
        );

        /*
         * ============================================================
         * STEP 10: Update workflow state.
         * ============================================================
         */

        const failedTopics = Object.entries(topicStatus)
            .filter(([, status]) => status === "FAILED")
            .map(([topic]) => topic);

        context.state.update({
            evidence,
            retrievedContext,
            topicStatus,

            metadata: {
                researchStatus,
                failedTopics,
                coveredTopics,
            },
        });

        /*
         * ============================================================
         * STEP 11: Index evidence into semantic memory.
         *
         * Failure here must not fail the entire research workflow.
         * ============================================================
         */

        try {
            if (evidence.length > 0) {
                await semanticMemoryService.indexEvidence(
                    evidence
                );
            }
        } catch (error) {
            this.logger?.error?.(
                "[Research] Failed to index semantic memory:",
                error
            );
        }

        /*
         * ============================================================
         * STEP 12: Publish research completion event.
         * ============================================================
         */

        if (this.runtimeKernel) {
            await this.runtimeKernel.publish(
                createEvent({
                    workflowId,
                    eventType: "research.completed",
                    producer: this.id,

                    payload: {
                        evidence,
                        evidenceCount: evidence.length,
                        topicStatus,
                        researchStatus,
                    },
                })
            );
        }

        /*
         * ============================================================
         * STEP 13: Return validated research output.
         * ============================================================
         */

        return createResearchOutput({
            evidence,
            retrievedContext,
        });
    }
}

module.exports = {
    ResearchAgent,
};
