import express from "express";
import { engine } from "express-handlebars";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";

const dbPromise = open({
  filename: "./data/messageboard.db",
  driver: sqlite3.Database,
});

const app = express();

app.use(express.urlencoded());
app.use(cookieParser());

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/", async (req, res) => {
  const db = await dbPromise;
  const messages = await db.all("SELECT * FROM Message;");
  if (req.cookies.userId) {
    console.log('user is registered as user ', req.cookies.userId);
  }
  res.render("home", { messages });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/message", async (req, res) => {
  const db = await dbPromise;
  console.log("received new message", req.body.messageBody);
  await db.run("INSERT INTO Message (body) VALUES (?);", req.body.messageBody);
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (typeof password !== "string" || password.length < 6) {
    res.status(400);
    res.render("register", {
      error: "Password must be a string of at least 6 characters ",
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const db = await dbPromise;
  try {
    const meta = await db.run(
      "INSERT INTO User (username, passwordHash) VALUES (?, ?);",
      [username, passwordHash]
    );
    console.log("meta", meta);
    res.cookie("userId", meta.lastID);
    res.redirect("/");
  } catch (e) {
    if (
      e.message === "SQLITE_CONSTRAINT: UNIQUE constraint failed: User.username"
    ) {
      res.status(400);
      res.render("register", { error: "Username taken" });
      return;
    }
    res.status(500);
    res.render("register", { error: "Something went wrong" });
    return;
  }
});

async function setup() {
  const db = await dbPromise;
  db.migrate();
  app.listen(3000, () => {
    console.log("listening on http://localhost:3000");
  });
}
setup();
