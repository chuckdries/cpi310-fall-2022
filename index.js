import express from "express";
import { engine } from "express-handlebars";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const dbPromise = open({
  filename: "./data/messageboard.db",
  driver: sqlite3.Database,
});

const app = express();

app.use(express.urlencoded());

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/", async (req, res) => {
  const db = await dbPromise;
  const messages = await db.all('SELECT * FROM Message;');
  res.render("home", { messages });
});

app.post("/message", async (req, res) => {
  const db = await dbPromise;
  await db.run("INSERT INTO Message (body) VALUES (?);", req.body.messageBody);
  res.redirect("/");
});

async function setup() {
  const db = await dbPromise;
  db.migrate();
  app.listen(3000, () => {
    console.log("listening on http://localhost:3000");
  });
}
setup();
