const retrievalService = require("../services/retrieval.service");
exports.search = async (req, res) => {
    try {
        const q = req.query.q;
        if (!q || !q.trim()) {
            return res.status(400).json({
                error: "Query is required"
            });
        }
        const results = await retrievalService.retrieve(q);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};