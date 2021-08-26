const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
const util = require("util");
require("dotenv").config();

app.use(express.static("public"));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const viewsDirectoryPath = path.join(__dirname, "/views");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
});

connection.connect(() => {
  console.log("DB SUCCESSFULLY CONNECTED");
});

const port = process.env.PORT || 3000;

// Get api of all todo
app.get("/list/apis", async (req, res) => {
  try {
    const results = await util.promisify(connection.query).bind(connection)(
      "SELECT * FROM todo ORDER BY index_number"
    );

    res.json({ results });
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Get api of a selected todo
app.get("/read/apis/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const results = await util.promisify(connection.query).bind(connection)(
      `SELECT * FROM todo where id=${id}`
    );
    res.json({ results });
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Add todo
app.post("/add/apis", async (req, res) => {
  const todo = req.body.todo;

  try {
    const results = await util.promisify(connection.query).bind(connection)(
      `SELECT IFNULL((SELECT index_number FROM todo ORDER BY index_number DESC LIMIT 1) ,0) as max_index_number;`
    );

    await util.promisify(connection.query).bind(connection)(
      `INSERT INTO todo(todo, index_number) VALUES('${todo}', ${results[0].max_index_number}+1024)`
    );

    res.redirect("/");
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Change order of todo
app.post("/order/apis/:id", async (req, res) => {
  const id = req.params.id;

  // datas passed from script.js
  let prevElIndex_Number = Number(req.body.prevElIndex_Number);
  let nextElIndex_Number = Number(req.body.nextElIndex_Number);
  let currElIndex_Number;

  // isNaN(prevElIndex_Number) = true, it means that there is no previous element for the element moved.
  // So currElIndex_Number is nextElIndex_Number - 512, instead of the average index_number of prevElIndex_Number and nextElIndex_Number
  if (isNaN(prevElIndex_Number)) currElIndex_Number = nextElIndex_Number - 512;
  // The same as well
  else if (isNaN(nextElIndex_Number))
    currElIndex_Number = prevElIndex_Number + 512;
  else
    currElIndex_Number = Math.ceil(
      (prevElIndex_Number + nextElIndex_Number) / 2
    );

  try {
    if (
      currElIndex_Number === prevElIndex_Number ||
      currElIndex_Number === nextElIndex_Number
    ) {
      const orderedData = await util
        .promisify(connection.query)
        .bind(connection)(
        `SELECT *, ROW_NUMBER() OVER (ORDER BY index_number) as orderedData FROM todo;`
      );
      orderedData.forEach(async (element) => {
        await util.promisify(connection.query).bind(connection)(
          `UPDATE todo SET index_number = ${element.orderedData}*1024 where id = ${element.id}`
        );
      });
      return;
    }

    await util.promisify(connection.query).bind(connection)(
      `UPDATE todo SET index_number = ${currElIndex_Number} where id = ${id}`
    );
    res.end();
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Edit todo
app.post("/edit/apis/:id", async (req, res) => {
  const id = req.params.id;
  const todo = req.body.newValue;
  console.log(id, todo);
  try {
    await util.promisify(connection.query).bind(connection)(
      `UPDATE todo SET todo = '${todo}' where id = ${id}`
    );

    res.redirect("/");
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Delete todo
app.post("/delete/apis/:id", async (req, res) => {
  const id = req.params.id;

  try {
    await util.promisify(connection.query).bind(connection)(
      `DELETE FROM todo where id = ${id}`
    );

    res.redirect("/");
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Display the screen
app.get("/", (req, res) => {
  res.sendFile(viewsDirectoryPath + "/index.html");
});

app.listen(port);
