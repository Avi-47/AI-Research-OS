module.exports = {
    planner: {
        primary: {
            provider: "openrouter",
            model: "openai/gpt-oss-20b:free"
        },
        fallback: [
            "google/gemma-4-31b-it:free",
            "google/gemma-4-26b-a4b-it:free"
        ]
    },
    research: {
        primary: {
            provider: "openrouter",
            model: "openai/gpt-oss-20b:free"
        },
        fallback: [
            "google/gemma-4-31b-it:free"
        ]
    },
    writer: {
        primary: {
            provider: "openrouter",
            model: "google/gemma-4-31b-it:free"
        },
        fallback: [
            "openai/gpt-oss-20b:free",
            "google/gemma-4-26b-a4b-it:free"
        ]
    },
    // NEW
    evaluation: {
        primary: {
            provider: "openrouter",
            model: "google/gemma-4-31b-it:free"
        },
        fallback: [
            "openai/gpt-oss-20b:free"
        ]
    },
    graph_builder: {
        primary: {
            provider: "openrouter",
            model: "openai/gpt-oss-20b:free"
        },
        fallback: [
            "google/gemma-4-31b-it:free"
        ]
    }
};