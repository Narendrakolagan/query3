const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//GET TO DO

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});
module.exports = app;

//GET FROM ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const todoQuery = `
    
    SELECT 
    * 
    FROM 
    todo 
    WHERE 
    id = ${todoId}
    `;
  const todo = await db.get(todoQuery);
  response.send(todo);
});
module.exports = app;

// POST TODO

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createQuery = `
        INSERT 
        INTO 
        todo (id, todo, priority, status)
        VALUES (${id}, '${todo}', '${priority}', '${status}');
    
    `;

  const createdTodo = await db.run(createQuery);
  response.send("Todo Successfully Added");
});

module.exports = app;

// PUT TODO

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  updatedColumn = "";
  requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
  SELECT * FROM todo WHERE id = ${todoId};
  `;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo,
    priority = previousTodo,
    status = previousTodo,
  } = request.body;
  const updatedTodoQuery = `
 
    UPDATE 
    todo 
    SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}' 
    WHERE
    id = ${todoId};
   `;

  await db.run(updatedTodoQuery);
  response.send(`${updatedColumn} Updated`);
});
module.exports = app;

// DELETE TODO

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deletedQuery = `
    DELETE 
    FROM 
    todo
    WHERE 
    id = ${todoId}
    `;
  await db.run(deletedQuery);
  response.send("Todo Deleted");
});
module.exports = app;
