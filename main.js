const port = 3000;
const express = require("express");
const app = express();
homeController = require("./controllers/homeController");
errorController = require("./controllers/errorController");

app.set("view engine", "pug");

app.get('/', homeController.top)

app.use(express.static("public"))
app.use(errorController.logErrors);
app.use(errorController.respondNoResourceFound);
app.use(errorController.respondInternalError);
app.listen(port, () => {
	console.log("server start http://localhost:%d/", port);
});