const { getResearchRuntime } = require("../runtime");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

async function getNextRunDirectory(baseDirectory) {
    await fs.mkdir(baseDirectory, { recursive: true });
    const entries = await fs.readdir(baseDirectory, { withFileTypes: true });
    const runNumbers = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
            const match = entry.name.match(/^run_(\d{3})$/);
            return match ? Number(match[1]) : 0;
        })
        .filter(Boolean);

    const nextRunNumber = (runNumbers.length > 0 ? Math.max(...runNumbers) : 0) + 1;
    return `run_${String(nextRunNumber).padStart(3, "0")}`;
}

async function writeJsonFile(filePath, payload) {
    await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

exports.generateResearch = async (req, res) => {
    try {
        console.log("REQUEST RECEIVED");

        const { query } = req.body;
        const runId = crypto.randomUUID();
        const runtime = getResearchRuntime();

        console.log("QUERY:", query);

        const execution = await runtime.execute(query, {
            workflowId: runId
        });
        console.log(
            "WORKFLOW GRAPH:",
            // JSON.stringify(execution.graph, null, 2)
            `Workflow graph nodes: ${execution.graph.nodes.length}`
        );

        const { topics, evidence, report } = execution;
        const timestamp = new Date().toISOString();

        // console.log("WORKFLOW SUMMARY:", execution.summary);
        console.log(`
        =============================
        WORKFLOW COMPLETE
        =============================
        Workflow : ${execution.summary.workflowId}

        Duration : ${execution.summary.totalDurationMs} ms

        Agents
        ------
        Completed : ${execution.summary.completedCount}
        Failed    : ${execution.summary.failedCount}

        Success   : ${execution.summary.success}
        =============================
        `);

        await runtime.workflowRunRepository.save({
            workflowId: execution.workflowId,
            timestamp,
            query,
            topics,
            evidence,
            report,
            state: execution.state,
            agentResults: execution.agentResults,
            summary: execution.summary,
            traces: execution.traces
        });

        // const runsDirectory = path.join(__dirname, "..", "..", "data", "runs");
        // const runFolder = await getNextRunDirectory(runsDirectory);
        // const artifactDirectory = path.join(runsDirectory, runFolder);
        // await fs.mkdir(artifactDirectory, { recursive: true });

        // await writeJsonFile(path.join(artifactDirectory, "query.json"), {
        //     runId,
        //     timestamp,
        //     query
        // });
        // await writeJsonFile(path.join(artifactDirectory, "topics.json"), {
        //     runId,
        //     timestamp,
        //     topics
        // });
        // await writeJsonFile(path.join(artifactDirectory, "evidence.json"), {
        //     runId,
        //     timestamp,
        //     evidence
        // });
        // await fs.writeFile(
        //     path.join(artifactDirectory, "report.md"),
        //     `${report.trim()}\n`,
        //     "utf8"
        // );
        // await writeJsonFile(path.join(artifactDirectory, "workflow-summary.json"), {
        //     runId,
        //     timestamp,
        //     summary: execution.summary
        // });
        // await writeJsonFile(path.join(artifactDirectory, "workflow-traces.json"), {
        //     runId,
        //     timestamp,
        //     traces: execution.traces
        // });
        // await writeJsonFile(path.join(artifactDirectory, "run.json"), {
        //     runId,
        //     timestamp,
        //     query,
        //     topics,
        //     evidence,
        //     report,
        //     summary: execution.summary,
        //     traces: execution.traces
        // });

        res.json({
            runId,
            query,
            topics,
            evidence,
            report,
            state: execution.state,
            evaluation: execution.evaluation,
            agentResults: execution.agentResults,
            summary: execution.summary,
            traces: execution.traces,
            workflowGraph: execution.workflowGraph || null
        });
    } catch (err) {
        console.log("CONTROLLER ERROR");
        console.error(err.stack);

        res.status(500).json({
            error: "Failed"
        });
    }
};