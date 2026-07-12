function graphExtractionPrompt(evidence) {
    return `
You are an expert knowledge graph extraction system.

Your task is to convert research evidence into a structured knowledge graph.

Research Evidence:
${JSON.stringify(evidence, null, 2)}

Rules:

- Return ONLY valid JSON.
- Do NOT output markdown.
- Do NOT output explanations.
- Do NOT invent information.
- Extract information ONLY from the supplied evidence.

-------------------------------------------------

Extract ONLY entities directly related to the research topic.

Ignore unrelated technical terms even if they appear incidentally.

Do not infer entities that are not explicitly mentioned.

Use BOTH:

- topic
- notes

Do NOT restrict extraction to the topic field.

If an entity appears multiple times, include it only once.

Ignore:

- paper titles
- author names
- conference names
- journal names
- URLs

-------------------------------------------------

Allowed Entity Types

METHOD
MODEL
ALGORITHM
DATASET
CONCEPT
FRAMEWORK

Entity Type Guidelines

METHOD:
A concrete pruning or optimization technique.

MODEL:
A neural network model.

ALGORITHM:
A computational algorithm.

DATASET:
A dataset or benchmark.

CONCEPT:
A theory, hypothesis, property or research idea.

FRAMEWORK:
A software framework.

-------------------------------------------------

Extract EVERY relationship explicitly supported by the evidence.

Do not stop after one or two relationships.

If multiple relationships exist, return all of them.

Allowed Relationship Types

USES

BASED_ON

COMPARES_WITH

OUTPERFORMS

INTRODUCES

-------------------------------------------------

Return exactly this JSON:

{
  "entities": [
    {
      "name": "Entity Name",
      "type": "METHOD"
    }
  ],
  "relationships": [
    {
      "source": "Entity Name",
      "target": "Another Entity Name",
      "type": "USES"
    }
  ]
}
`;
}

module.exports = {
    graphExtractionPrompt
};