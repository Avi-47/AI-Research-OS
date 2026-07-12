const searchService = require("./search.service");
const { callJsonOpenRouter } = require("../utils/llm");
const { evidencePrompt } = require("../utils/prompts");

function flattenSearchResults(searchResponse, topic) {
	const documents = [];

	for (const result of searchResponse || []) {
		documents.push({
			topic,
			title: String(result?.title || topic).trim() || topic,
			url: String(result?.url || "").trim(),
			notes: String(result?.description || "").trim()
		});
	}

	if (documents.length === 0) {
		documents.push({
			topic,
			title: topic,
			url: "",
			notes: `No search results found for ${topic}.`
		});
	}

	return documents.slice(0, 8);
}

function dedupeDocuments(documents) {
	const seen = new Set();
	const deduped = [];

	for (const document of documents) {
		const signature = `${document.topic}::${document.title}::${document.url}::${document.notes}`;
		if (seen.has(signature)) {
			continue;
		}

		seen.add(signature);
		deduped.push(document);
	}

	return deduped;
}

function normalizeDocument(document, topic) {
	return {
		topic: String(document?.topic || topic || "").trim(),
		provenance: {
			title: String(document?.title || topic || "").trim(),
			url: String(document?.url || "").trim()
		},
		notes: String(document?.notes || "").trim()
	};
}

function normalizeEvidenceItems(items, topic, documents) {
	if (!Array.isArray(items)) {
		return documents.slice(0, 3).map((document) => normalizeDocument(document, topic));
	}

	const allowedSources = new Map(
		documents.map((document) => [String(document.url || "").trim(), document])
	);

	const normalized = items
		.map((item) => {
			const title = String(item?.title || topic).trim();
			const notes = String(item?.notes || item?.note || "").trim();
			const sourceCandidate = String(item?.source || item?.url || "").trim();
			const allowedDocument = allowedSources.get(sourceCandidate);

			if (allowedDocument) {
				return {
					topic: allowedDocument.topic || topic,
					provenance: {
						title: allowedDocument.title,
						url: allowedDocument.url
					},
					notes: notes || allowedDocument.notes
				};
			}

			const matchingDocument = documents.find((document) =>
				String(document.title || "").toLowerCase() === title.toLowerCase()
			);

			if (matchingDocument) {
				return {
					topic: matchingDocument.topic || topic,
					provenance: {
						title: matchingDocument.title,
						url: matchingDocument.url
					},
					notes: notes || matchingDocument.notes
				};
			}

			const fallbackDocument = documents[0];
			return fallbackDocument
				? {
					topic: fallbackDocument.topic || topic,
					provenance: {
						title: fallbackDocument.title || topic,
						url: fallbackDocument.url || ""
					},
					notes: notes || fallbackDocument.notes
				}
				: null;
		})
		.filter(Boolean)
		.filter((item) => item.topic && item.provenance && item.provenance.title && item.provenance.url)
		.filter((item) => item.notes);

	if (normalized.length > 0) {
		return normalized.slice(0, 5);
	}

	return documents.slice(0, 3).map((document) => normalizeDocument(document, topic));
}

async function collectEvidenceForTopic(topic) {
	const searchResponse = await searchService.search(topic);
	const documents = dedupeDocuments(flattenSearchResults(searchResponse, topic));

	if (documents.length === 0) {
		return [];
	}

	try {
		const evidenceItems = await callJsonOpenRouter(evidencePrompt(topic, documents), {
			stage: "Research"
		});
		return normalizeEvidenceItems(evidenceItems, topic, documents);
	} catch (err) {
		console.log(`Evidence synthesis failed for topic: ${topic}`);
		console.log(err.response?.data || err.message);
		return documents.slice(0, 3).map((document) => normalizeDocument(document, topic));
	}
}

async function collectEvidence(topics) {
	const results = await Promise.allSettled(
		topics.map((topic) => collectEvidenceForTopic(topic))
	);

	return results
		.filter((result) => result.status === "fulfilled")
		.flatMap((result) => result.value);
}

module.exports = {
	collectEvidence,
	collectEvidenceForTopic
};