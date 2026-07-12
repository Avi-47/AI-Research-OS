require("dotenv").config();
const axios = require("axios");

async function run() {

  const res = await axios.get(
    "https://openrouter.ai/api/v1/models"
  );

  const freeModels =
    res.data.data.filter(
      m =>
      m.id.includes("free")
    );

  // console.log(freeModels.map(m => m.id));
}

run();