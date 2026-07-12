const fs = require("fs/promises");
const path = require("path");
const pool = require("../../db/postgres");
class WorkflowRunRepository {
	async save() {
		throw new Error("WorkflowRunRepository.save() must be implemented by subclasses");
	}
}

class FileWorkflowRunRepository extends WorkflowRunRepository {
	constructor({ baseDirectory, logger = console }) {
		super();
		this.baseDirectory = baseDirectory;
		this.logger = logger;
	}

	async ensureDirectory() {
		await fs.mkdir(this.baseDirectory, { recursive: true });
	}

	async nextFileName() {
		await this.ensureDirectory();
		const entries = await fs.readdir(this.baseDirectory, { withFileTypes: true });
		const workflowNumbers = entries
			.filter((entry) => entry.isFile() && entry.name.startsWith("workflow-") && entry.name.endsWith(".json"))
			.map((entry) => {
				const match = entry.name.match(/^workflow-(\d+)\.json$/);
				return match ? Number(match[1]) : 0;
			})
			.filter(Boolean);

		const nextWorkflowNumber = (workflowNumbers.length > 0 ? Math.max(...workflowNumbers) : 0) + 1;
		return `workflow-${String(nextWorkflowNumber).padStart(3, "0")}.json`;
	}

	async save(record) {
		console.log("WORKFLOW RECORD:");
		// console.dir(record, { depth: null });

		try {
			const query = `
				INSERT INTO workflows (
					id,
					workflow_id,
					query,
					status,
					workflow_json
				)
				VALUES ($1,$2,$3,$4,$5)
			`;

			await pool.query(query, [
				record.workflowId,
				record.workflowId,
				record.query || "",
				record.status || "COMPLETED",
				JSON.stringify(record)
			]);

			this.logger.log(
				`Workflow ${record.workflowId} saved to Postgres`
			);
		} catch (error) {
			this.logger.error(
				"Failed to save workflow to Postgres",
				error
			);
		}

		// keep old JSON persistence for now
		// await this.ensureDirectory();

		// const fileName = await this.nextFileName();
		// const filePath = path.join(this.baseDirectory, fileName);

		// await fs.writeFile(
		// 	filePath,
		// 	JSON.stringify(record, null, 2),
		// 	"utf8"
		// );

		return {
			// fileName,
			// filePath,
			workflowId: record.workflowId
		};
	}
}

module.exports = {
	WorkflowRunRepository,
	FileWorkflowRunRepository
};