const { GraphRepository } = require("../graph/repository/graphRepository");
const repository = new GraphRepository();
exports.getNeighbors = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await repository.getNeighbors(id);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};