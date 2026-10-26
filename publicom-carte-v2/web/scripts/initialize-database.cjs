const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const password = process.env.PGPASSWORD;
const databaseName = "publicom_cartographie";
const baseConfig = { host: "127.0.0.1", port: 5432, user: "postgres", password };

async function run() {
  const adminClient = new Client({ ...baseConfig, database: "postgres" });
  await adminClient.connect();
  const database = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [databaseName]);
  if (database.rowCount === 0) await adminClient.query(`CREATE DATABASE ${databaseName}`);
  await adminClient.end();

  const applicationClient = new Client({ ...baseConfig, database: databaseName });
  await applicationClient.connect();
  const schema = fs.readFileSync(path.join(__dirname, "..", "database", "schema.sql"), "utf8");
  await applicationClient.query(schema);
  await applicationClient.end();
  console.log(`Base ${databaseName} initialisée.`);
}

run().catch((error) => { console.error(error); process.exit(1); });
