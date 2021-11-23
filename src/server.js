const path = require("path");
const express = require("express");
const fs = require("fs");
const { renderToString } = require("@vue/server-renderer");
const manifest = require("../dist/ssr-manifest.json");

const server = express();

server.use("/img", express.static(path.join(__dirname, "../dist", "img")));
server.use("/js", express.static(path.join(__dirname, "../dist", "js")));
server.use("/css", express.static(path.join(__dirname, "../dist", "css")));
server.use("/favicon.ico", express.static(path.join(__dirname, "../dist", "favicon.ico")));

const appPath = path.join(__dirname, "../dist", "", manifest["app.js"]);
const createApp = require(appPath).default;

server.get("*", async (req, res) => {
  const { app, router } = createApp();

  await router.push(req.url);
  await router.isReady();

  const appContent = await renderToString(app);

  fs.readFile(path.join(__dirname, "../dist/index.html"), (err, htmlExt) => {
    if (err) {
      throw err;
    }
    htmlExt = htmlExt.toString().replace('<div id="app">', `<div id="app">${appContent}`);
    res.setHeader("Content-Type", "text/html");
    res.send(htmlExt);
  });
});

console.log("You can navigate to http://localhost:9999");

server.listen(9999);
