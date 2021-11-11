const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const util = require('util');
require('dotenv').config();

app.use(express.static('public'));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const viewsDirectoryPath = path.join(__dirname, '/views');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
});

connection.connect(() => {
  console.log('DB SUCCESSFULLY CONNECTED');
});

const port = process.env.PORT || 3000;

// Get api of all todo
app.get('/list-todos', async (req, res) => {
  try {
    const results = await util.promisify(connection.query).bind(connection)(
      'SELECT * FROM todo ORDER BY index_number'
    );

    res.json({ results });
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Get api of a selected todo
app.get('/read-todos/:id', async (req, res) => {
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
app.post('/add-todos', async (req, res) => {
  // value of todo task
  const todo = req.body.todo;

  try {
    // Get and return the maximum value of index_number
    // if there is no data in the table, return 0
    const results = await util.promisify(connection.query).bind(connection)(
      `SELECT IFNULL((SELECT index_number FROM todo ORDER BY index_number DESC LIMIT 1) ,0) as max_index_number;`
    );
    // Add a new task
    // Put the contents of the task and the value obtained in the above query + 1024 into VALUES
    await util.promisify(connection.query).bind(connection)(
      `INSERT INTO todo(todo, index_number) VALUES('${todo}', ${results[0].max_index_number}+1024)`
    );
    res.redirect('/');
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Change order of todo
app.post('/order-todos/:id', async (req, res) => {
  const id = req.params.id;
  // index_number of the task above the dragged and dropped task
  let prevElIndexNumber = req.body.prevElIndexNumber;
  // index_number of the task under the dragged and dropped task
  let nextElIndexNumber = req.body.nextElIndexNumber;
  // a variable containing the index_number of the dragged and dropped task
  let currElIndexNumber;

  // prevElIndexNumber === undefined, this is happended when the drag-and-drop task is at the top of the to-do list.
  // Since there is no upper task, set the index_number of the lower task - 512 as the currElIndexNumber
  if (prevElIndexNumber === undefined) {
    currElIndexNumber = nextElIndexNumber - 512;
    // nextElIndexNumber === undefined, this is happended when the dragged-and-dropped task is at the bottom of the to-do list
    // Set the index_number of the task above + 512 as the currElIndexNumber
  } else if (nextElIndexNumber === undefined) {
    currElIndexNumber = prevElIndexNumber + 512;
    // If there are tasks both above and below the dragged-and-dropped task, then
    // currElIndexNumber = (index_number of the top task + index_number of the bottom task)/2
  } else {
    currElIndexNumber = Math.floor((prevElIndexNumber + nextElIndexNumber) / 2);
  }

  try {
    // Update currElIndexNumber as the index_number of the new task
    await util.promisify(connection.query).bind(connection)(
      `UPDATE todo SET index_number = ${currElIndexNumber} where id = ${id}`
    );

    // When index_number overlaps
    if (
      Math.abs(currElIndexNumber - prevElIndexNumber) <= 1 ||
      Math.abs(currElIndexNumber - nextElIndexNumber) <= 1
    ) {
      // Get index_number in ascending order from 1~ (= orderedData), then update the table
      const orderedData = await util.promisify(connection.query).bind(connection)(
        `SELECT *, ROW_NUMBER() OVER (ORDER BY index_number) as orderedData FROM todo;`
      );
      await Promise.all(
        orderedData.map(async (element) => {
          await util.promisify(connection.query).bind(connection)(
            `UPDATE todo SET index_number = ${element.orderedData}*1024 where id = ${element.id}`
          );
        })
      );
    }
    res.end();
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Edit todo
app.post('/edit-todos/:id', async (req, res) => {
  const id = req.params.id;
  const todo = req.body.newValue;
  console.log(id, todo);
  try {
    await util.promisify(connection.query).bind(connection)(
      `UPDATE todo SET todo = '${todo}' where id = ${id}`
    );

    res.redirect('/');
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Delete todo
app.post('/delete-todos/:id', async (req, res) => {
  const id = req.params.id;

  try {
    await util.promisify(connection.query).bind(connection)(`DELETE FROM todo where id = ${id}`);

    res.redirect('/');
  } catch (e) {
    res.status(500).send({ e });
  }
});

// Display the screen
app.get('/', (req, res) => {
  res.sendFile(viewsDirectoryPath + '/index.html');
});

app.listen(port);
