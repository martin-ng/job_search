require("dotenv").config();

const path = require("path");
const express = require("express");
const redis = require("redis");
const https = require("https");
const sources = require("../worker/sources/");
require("../worker/cron-index.js");

const app = express();

if (process.env.NODE_ENV !== "production") require("../secrets");

let client;
if (process.env.REDIS_URL) {
  client = redis.createClient(process.env.REDIS_URL);
} else {
  client = redis.createClient();
}

const { promisify } = require("util");
const getAsync = promisify(client.get).bind(client);

const PORT = process.env.PORT || 8080;

const bootApp = () => {
  app.use(express.static(path.join(__dirname, "../build")));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });

  app.use((err, req, res, next) => {
    console.error(err);
    console.error(err.stack);
    res.status(err.status || 500).send(err.message || "Internal server error.");
  });
};

const startListening = () => {
  app.listen(PORT, () => {
    console.log(`Zero YOE's server is listening on port ${PORT}`);
  });
};

app.get("/api/jobs", async (req, res) => {
  const getJobs = await getAsync("github");
  // const testing = await sources.getLatest();

  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.send(getJobs);
});

bootApp();
startListening();
