require("dotenv").config();
const searchRoute = require("./routes/search.route");
const { initializeQdrant } = require("./db/qdrant");
const express = require("express");
const cors = require("cors");
const researchRoute = require("./routes/research.route");
const app = express();
const PORT = process.env.PORT || 5000;
const graphRoute = require("./routes/graph.routes");
console.log("POSTGRES_URL =", process.env.POSTGRES_URL);
app.use(cors());
app.use(express.json());
app.use("/api/search", searchRoute);
app.use("/api/research", researchRoute);
app.use("/graph", graphRoute);
(async () => {
    try {
        await initializeQdrant();
        console.log("✅ Qdrant Connected");
    } catch (err) {
        console.warn("⚠️ Qdrant unavailable");
        console.warn(err.message);
    }
    app.listen(PORT, () => {
        console.log(`🚀 Server Running on ${PORT}`);
    });
})();