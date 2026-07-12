const retrievalService = require("../services/retrieval.service");
exports.search = async (req, res) => {
    try {
        const q = req.query.q;
        const results = await retrievalService.search(q);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};