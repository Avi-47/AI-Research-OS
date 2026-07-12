const queryClassifierService = require("./queryClassifier.service");
const searchAcademicService = require("./searchAcademic.service");
const searchFactService = require("./searchFact.service");
const searchTechService = require("./searchTech.service");

async function search(query) {
    const classification = await queryClassifierService.classifyQuery(query);

    switch (classification) {
        case "FACT":
            return searchFactService.searchFact(query);
        case "TECH":
            return searchTechService.searchTech(query);
        case "RESEARCH":
        default:
            return searchAcademicService.searchAcademic(query);
    }
}

module.exports = { search };