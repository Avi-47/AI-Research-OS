const router = require("express").Router();
const {generateResearch} = require("../controllers/research.controller");
router.post("/", generateResearch);
module.exports = router;