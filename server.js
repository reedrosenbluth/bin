const express = require("express");
const next = require("next");
const Cors = require("micro-cors");

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

let manifest = require("./manifest.json");
if (dev) {
  manifest = require("./manifest-dev.json");
}

const cors = Cors({
  allowedMethods: ["POST", "GET", "OPTIONS", "DELETE", "PUT"]
});

app.prepare().then(() => {
  const server = express();

  server.get(
    "/manifest.json",
    cors((req, res) => res.status(200).json(manifest))
  );

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
