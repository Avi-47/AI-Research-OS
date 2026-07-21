const router = require("express").Router();
const controller = require("../controllers/graph.controller");

router.get("/:id", controller.getNeighbors);

module.exports = router;