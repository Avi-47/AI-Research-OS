const axios = require("axios");
const { searchAcademic } = require("./searchAcademic.service");

async function searchGitHub(query) {
    const response = await axios.get("https://api.github.com/search/repositories", {
        params: {
            q: query,
            sort: "stars",
            order: "desc",
            per_page: 10
        },
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "research-os"
        }
    });

    const results = response.data?.items || [];

    return results.map((result) => ({
        title: result.full_name,
        url: result.html_url,
        description: result.description || `GitHub repository with ${result.stargazers_count || 0} stars`
    }));
}

async function searchPapersWithCode(query) {
    const response = await axios.get("https://paperswithcode.com/api/v1/search/", {
        params: {
            q: query
        },
        headers: {
            Accept: "application/json"
        }
    });

    const results = response.data?.results || response.data?.papers || [];

    return results.map((result) => ({
        title: result.title || result.name || "Untitled result",
        url: result.url || result.paper_url || result.repository_url || "",
        description: result.summary || result.description || "Papers With Code result"
    }));
}

async function searchTech(query) {
    try {
        const githubResults = await searchGitHub(query);
        if (githubResults.length > 0) {
            return githubResults;
        }
    } catch (err) {
        console.log("Tech search GitHub failed");
        console.log(err.message);
    }

    try {
        const papersWithCodeResults = await searchPapersWithCode(query);
        if (papersWithCodeResults.length > 0) {
            return papersWithCodeResults;
        }
    } catch (err) {
        console.log("Tech search Papers With Code failed");
        console.log(err.message);
    }

    try {
        return await searchAcademic(query);
    } catch (err) {
        console.log("Tech search academic fallback failed");
        console.log(err.message);
        return [];
    }
}

module.exports = {
    searchTech,
    searchGitHub,
    searchPapersWithCode
};