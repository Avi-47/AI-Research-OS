const router = require("express").Router();
const {getNeighbors} = require("../controllers/graph.controller");
router.get("/:id", getNeighbors);
module.exports = router;