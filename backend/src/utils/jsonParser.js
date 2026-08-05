function stripCodeFences(content) {
	return String(content || "")
		.trim()
		.replace(/^```(?:json)?/i, "")
		.replace(/```$/i, "")
		.trim();
}
function extractJsonBlock(content) {
	const cleanedContent = stripCodeFences(content);
	const arrayStart = cleanedContent.indexOf("[");
	const objectStart = cleanedContent.indexOf("{");
	let startIndex = -1;
	if (arrayStart === -1) {
		startIndex = objectStart;
	} else if (objectStart === -1) {
		startIndex = arrayStart;
	} else {
		startIndex = Math.min(arrayStart, objectStart);
	}
	if (startIndex === -1) {
		throw new Error("LLM response did not contain JSON");
	}
	const openingToken = cleanedContent[startIndex];
	const closingToken = openingToken === "[" ? "]" : "}";
	const endIndex = cleanedContent.lastIndexOf(closingToken);
	if (endIndex === -1 || endIndex < startIndex) {
		throw new Error("LLM response JSON was incomplete");
	}
	return cleanedContent.slice(startIndex, endIndex + 1);
}

function isUsefulJsonValue(value) {
	if (value === null || value === undefined) {
		return false;
	}
	if (Array.isArray(value)) {
		return value.length > 0;
	}
	if (typeof value === "object") {
		return Object.keys(value).length > 0;
	}
	return false;
}

module.exports = {
    stripCodeFences,
    extractJsonBlock,
    isUsefulJsonValue
};