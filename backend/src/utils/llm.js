// const axios = require("axios");

// const MODELS = [
// 	"openai/gpt-oss-20b",
// 	"google/gemma-4-31b-it:free",
// 	"google/gemma-4-26b-a4b-it:free",
// 	"nvidia/nemotron-3-super-120b-a12b:free"
// ];

// function getStageLabel(stage) {
// 	return String(stage || "LLM").trim();
// }

// function stripCodeFences(content) {
// 	return String(content || "")
// 		.trim()
// 		.replace(/^```(?:json)?/i, "")
// 		.replace(/```$/i, "")
// 		.trim();
// }

// function extractJsonBlock(content) {
// 	const cleanedContent = stripCodeFences(content);

// 	const arrayStart = cleanedContent.indexOf("[");
// 	const objectStart = cleanedContent.indexOf("{");

// 	let startIndex = -1;

// 	if (arrayStart === -1) {
// 		startIndex = objectStart;
// 	} else if (objectStart === -1) {
// 		startIndex = arrayStart;
// 	} else {
// 		startIndex = Math.min(arrayStart, objectStart);
// 	}

// 	if (startIndex === -1) {
// 		throw new Error("LLM response did not contain JSON");
// 	}

// 	const openingToken = cleanedContent[startIndex];
// 	const closingToken = openingToken === "[" ? "]" : "}";
// 	const endIndex = cleanedContent.lastIndexOf(closingToken);

// 	if (endIndex === -1 || endIndex < startIndex) {
// 		throw new Error("LLM response JSON was incomplete");
// 	}

// 	return cleanedContent.slice(startIndex, endIndex + 1);
// }

// function isUsefulJsonValue(value) {
// 	if (value === null || value === undefined) {
// 		return false;
// 	}

// 	if (Array.isArray(value)) {
// 		return value.length > 0;
// 	}

// 	if (typeof value === "object") {
// 		return Object.keys(value).length > 0;
// 	}

// 	return false;
// }

// async function callOpenRouterModel(model, prompt, options = {}) {
// 	const stage = getStageLabel(options.stage);
// 	console.log(`${stage} Model Attempt: ${model}`);
// 	const response = await axios.post(
// 		"https://openrouter.ai/api/v1/chat/completions",
// 		{
// 			model,
// 			messages: [
// 				{
// 					role: "user",
// 					content: prompt
// 				}
// 			],
// 			temperature: options.temperature ?? 0.7,
// 			max_tokens: options.maxTokens ?? 4000
// 		},
// 		{
// 			headers: {
// 				Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
// 			}
// 		}
// 	);

// 	console.log(`${stage} Model Used: ${model}`);
// 	const choice = response.data?.choices?.[0];
// 	if (!choice?.message?.content) {
// 		throw new Error("Empty model response");
// 	}

// 	return choice.message.content;
// }

// async function callOpenRouter(prompt, options = {}) {
// 	let lastError = null;

// 	for (const model of MODELS) {
// 		try {
// 			return await callOpenRouterModel(model, prompt, options);
// 		} catch (err) {
// 			lastError = err;
// 			const stage = getStageLabel(options.stage);
// 			console.log(`${stage} Model Failed: ${model}`);
// 			console.log(err.response?.data || err.message);
// 		}
// 	}

// 	throw lastError || new Error("All models failed");
// }

// async function callJsonOpenRouter(prompt, options = {}) {

// 	const jsonPrompt = `
// You are a JSON generation engine.

// IMPORTANT:
// Return ONLY valid JSON.
// Do NOT explain.
// Do NOT think aloud.
// Do NOT use markdown.
// Do NOT wrap the response in code fences.
// Your first character must be {.
// Your last character must be }.
// Any other output is invalid.

// ${prompt}
// `;
// 	let lastError = null;

// 	for (const model of MODELS) {
// 		try {
// 			const content = await callOpenRouterModel(model, jsonPrompt, {
// 				...options,
// 				temperature: 0,
// 				maxTokens: options.maxTokens ?? 1500,
// 				response_format: {
// 					type: "json_object"
// 				}
// 			});
// 			console.log("\n========== RAW LLM RESPONSE ==========");
// 			console.log(content);
// 			console.log("======================================\n");
// 			let jsonText = extractJsonBlock(content);
// 			jsonText = jsonText.replace(/,\s*([}\]])/g, "$1");
// 			try {
// 				const parsed = JSON.parse(jsonText);
// 				if (!isUsefulJsonValue(parsed)) {
// 					lastError = new Error("Empty JSON response");
// 					console.log(`Empty JSON response from model: ${model}`);
// 					continue;
// 				}
// 				if (typeof options.validateParsedResponse === "function") {
// 					options.validateParsedResponse(parsed);
// 				}
// 				return parsed;
// 			} catch (err) {
// 				lastError = err;
// 				console.log(`JSON Parse/Validation Failed for model: ${model}`);
// 				console.log(jsonText);
// 				continue;
// 			}
// 		} catch (err) {
// 			lastError = err;
// 			console.log(`JSON Request Failed for model: ${model}`);
// 			console.log(err.response?.data || err.message);
// 		}
// 	}

// 	throw lastError || new Error("No model returned valid JSON");
// }

// module.exports = {
// 	callOpenRouter,
// 	callJsonOpenRouter,
// 	callOpenRouterModel,
// 	isUsefulJsonValue,
// 	extractJsonBlock,
// 	stripCodeFences
// };
