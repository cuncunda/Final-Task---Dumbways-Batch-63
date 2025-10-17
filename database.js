const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "cimuncang78",
  database: "final_task_db",
});

module.exports = pool;
