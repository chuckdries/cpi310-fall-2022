import express from "express";
import { engine } from "express-handlebars";

const app = express();

app.use(express.urlencoded());

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

const messages = ["hello world", "hey there", "hola"];

app.get("/", (req, res) => {
  res.render("home", { messages });
});

app.post('/message', (req, res) => {
  messages.push(req.body.messageBody)
  res.redirect('/')
})

app.listen(3000, () => {
  console.log("listening on http://localhost:3000");
});
