import express from "express";
import { engine } from "express-handlebars";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import cors from 'cors';

interface User {
  id: number;
  username: string;
  passwordHash?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const dbPromise = open({
  filename: process.env.DATABASE_URL || "./data/messageboard.db",
  driver: sqlite3.Database,
});

const app = express();

app.use(cors({
  origin: true,
}));
app.use("/static", express.static("static"));
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

interface MessageWithAuthor {
  id: number;
  body: string;
  author: string;
}

app.get("/", async (req, res) => {
  const db = await dbPromise;
  const messages = await db.all<MessageWithAuthor[]>(
    "SELECT Message.id, Message.body, User.username as author FROM Message INNER JOIN User ON Message.authorId = User.id;"
  );
  // res.render("home", { messages, user: req.user?.username });
  res.json({ messages });
});

app.get("/register", (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("register");
});

app.post("/message", async (req, res) => {
  if (!req.user) {
    res.status(401);
    return res.send("User must be logged in to post messages");
  }
  const db = await dbPromise;
  console.log("received new message", req.body.messageBody);
  await db.run("INSERT INTO Message (body, authorId) VALUES (?, ?);", [
    req.body.messageBody,
    req.user.id,
  ]);
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
      (e as any).message ===
      "SQLITE_CONSTRAINT: UNIQUE constraint failed: User.username"
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

app.get("/login", (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("login");
});

app.post("/login", async (req, res) => {
  const db = await dbPromise;
  const { username, password } = req.body;
  if (!username || !username.length || !password || !password.length) {
    return res.render("login", { error: "missing parameter" });
  }
  const maybeUser = await db.get(
    "SELECT * FROM User WHERE username = ?",
    username
  );
  if (!maybeUser) {
    return res.render("login", { error: "username or password is incorrect" });
  }
  const passwordMatches = await bcrypt.compare(
    password,
    maybeUser.passwordHash
  );
  if (!passwordMatches) {
    return res.render("login", { error: "username or password is incorrect" });
  }
  const authToken = uuidv4();
  await db.run("INSERT INTO AuthToken (token, userId) VALUES (?, ?);", [
    authToken,
    maybeUser.id,
  ]);
  res.cookie("authToken", authToken);
  res.redirect("/");
});

app.get("/logout", async (req, res) => {
  if (!req.user || !req.cookies.authToken) {
    return res.redirect("/");
  }
  const db = await dbPromise;
  try {
    await db.run(
      "DELETE FROM AuthToken WHERE token = ?",
      req.cookies.authToken
    );
  } catch (e) {
    console.log("logout failed", e);
  }
  res.clearCookie("authToken");
  res.redirect("/");
});

async function setup() {
  const db = await dbPromise;
  db.migrate();
  app.listen(process.env.PORT || 3000, () => {
    console.log(`listening on http://localhost:${process.env.PORT || 3000}`);
  });
}
setup();
