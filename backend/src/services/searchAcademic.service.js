const axios = require("axios");

function normalizeAcademicResult(result, sourceName) {
    const landingPageUrl =
        result?.url ||
        result?.primary_location?.landing_page_url ||
        result?.primary_location?.source?.homepage_url ||
        result?.doi ||
        "";

    return {
        title: result?.title || result?.display_name || "Untitled result",
        url: landingPageUrl,
        description: result?.description || result?.abstract || `Source: ${sourceName}`
    };
}

async function searchArxiv(query) {
    const response = await axios.get("http://export.arxiv.org/api/query", {
        params: {
            search_query: `all:${query}`,
            start: 0,
            max_results: 10,
            sortBy: "relevance",
            sortOrder: "descending"
        }
    });

    const xml = String(response.data || "");
    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/i);
        const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/i);
        const linkMatch = entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i);

        entries.push({
            title: titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "Untitled result",
            url: linkMatch ? linkMatch[1].trim() : "",
            description: summaryMatch ? summaryMatch[1].replace(/\s+/g, " ").trim() : ""
        });
    }

    return entries;
}

async function searchSemanticScholar(query) {
    const response = await axios.get("https://api.semanticscholar.org/graph/v1/paper/search", {
        params: {
            query,
            limit: 10,
            fields: "title,url,abstract,year,authors,venue"
        },
        headers: {
            Accept: "application/json"
        }
    });

    const results = response.data?.data || [];

    return results.map((result) => normalizeAcademicResult({
        title: result.title,
        url: result.url,
        description: result.abstract ? `${result.abstract}` : `Source: Semantic Scholar${result.year ? ` (${result.year})` : ""}`
    }, "Semantic Scholar"));
}

async function searchOpenAlex(query) {
    const response = await axios.get("https://api.openalex.org/works", {
        params: {
            search: query,
            "per-page": 10,
            sort: "relevance_score:desc"
        },
        headers: {
            Accept: "application/json"
        }
    });

    const results = response.data?.results || [];

    return results.map((result) => normalizeAcademicResult({
        title: result?.display_name,
        url:
            result?.primary_location?.landing_page_url ||
            result?.primary_location?.source?.homepage_url ||
            result?.doi ||
            "",
        description: `Source: ${result?.primary_location?.source?.display_name || result?.host_venue?.display_name || "OpenAlex"}${result?.publication_year ? ` (${result.publication_year})` : ""}${typeof result?.cited_by_count === "number" ? `, cited by ${result.cited_by_count}` : ""}`
    }, "OpenAlex"));
}

async function searchAcademic(query) {
    try {
        const arxivResults = await searchArxiv(query);
        if (arxivResults.length > 0) {
            return arxivResults;
        }
    } catch (err) {
        console.log("Academic search arXiv failed");
        console.log(err.message);
    }

    try {
        const semanticScholarResults = await searchSemanticScholar(query);
        if (semanticScholarResults.length > 0) {
            return semanticScholarResults;
        }
    } catch (err) {
        console.log("Academic search Semantic Scholar failed");
        console.log(err.message);
    }

    try {
        return await searchOpenAlex(query);
    } catch (err) {
        console.log("Academic search OpenAlex failed");
        console.log(err.message);
        return [];
    }
}

module.exports = {
    searchAcademic,
    searchArxiv,
    searchSemanticScholar,
    searchOpenAlex
};