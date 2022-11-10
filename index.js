import express from "express";
import { engine } from "express-handlebars";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";

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

app.use(async (req, res, next) => {
  if (!req.cookies.authToken) {
    return next();
  }
  const db = await dbPromise;
  try {
    const token = await db.get(
      "SELECT * FROM AuthToken WHERE token=?;",
      req.cookies.authToken
    );
    if (!token) {
      return next();
    }
    const user = await db.get(
      "SELECT username, id FROM User WHERE id=?;",
      token.userId
    );
    if (!user) {
      return next();
    }
    req.user = user;
    next();
  } catch (e) {
    console.log("something went wrong looking up the user from authtoken", e);
    next();
  }
});

app.get("/", async (req, res) => {
  const db = await dbPromise;
  const messages = await db.all("SELECT * FROM Message;");
  console.log("user is", req.user);
  res.render("home", { messages, user: req.user.username });
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
    const authToken = uuidv4();
    console.log("meta", meta);
    await db.run("INSERT INTO AuthToken (token, userId) VALUES (?, ?);", [
      authToken,
      meta.lastID,
    ]);
    res.cookie("authToken", authToken);
    res.redirect("/");
  } catch (e) {
    if (
      e.message === "SQLITE_CONSTRAINT: UNIQUE constraint failed: User.username"
    ) {
      res.status(400);
      res.render("register", { error: "Username taken" });
      return;
    }
    console.log("registration error", e);
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
