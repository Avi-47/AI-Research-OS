const axios = require("axios");

async function searchWikipedia(query) {
    const response = await axios.get("https://en.wikipedia.org/w/api.php", {
        params: {
            action: "query",
            list: "search",
            srsearch: query,
            format: "json",
            origin: "*"
        }
    });

    const results = response.data?.query?.search || [];

    return results.map((result) => ({
        title: result.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, "_"))}`,
        description: result.snippet ? result.snippet.replace(/<[^>]+>/g, "") : "Wikipedia result"
    }));
}

async function searchWikidata(query) {
    const response = await axios.get("https://www.wikidata.org/w/api.php", {
        params: {
            action: "wbsearchentities",
            search: query,
            language: "en",
            format: "json",
            origin: "*"
        }
    });

    const results = response.data?.search || [];

    return results.map((result) => ({
        title: result.label,
        url: `https://www.wikidata.org/wiki/${result.id}`,
        description: result.description || "Wikidata result"
    }));
}

async function searchFact(query) {
    try {
        const wikipediaResults = await searchWikipedia(query);
        if (wikipediaResults.length > 0) {
            return wikipediaResults;
        }
    } catch (err) {
        console.log("Fact search Wikipedia failed");
        console.log(err.message);
    }

    try {
        const wikidataResults = await searchWikidata(query);
        if (wikidataResults.length > 0) {
            return wikidataResults;
        }
    } catch (err) {
        console.log("Fact search Wikidata failed");
        console.log(err.message);
    }

    return [];
}

module.exports = {
    searchFact,
    searchWikipedia,
    searchWikidata
};