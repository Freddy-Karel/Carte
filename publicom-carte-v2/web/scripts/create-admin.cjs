const crypto = require("crypto");
const { Client } = require("pg");

const email = process.env.ADMIN_EMAIL;
const name = process.env.ADMIN_NAME;
const password = process.env.ADMIN_PASSWORD;

if (!email || !name || !password) {
  console.error("Définissez ADMIN_EMAIL, ADMIN_NAME et ADMIN_PASSWORD avant de créer un administrateur.");
  process.exit(1);
}

const passwordHash = crypto.scryptSync(password, email.toLowerCase(), 64).toString("hex");
const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect()
  .then(() => client.query(`
    INSERT INTO admin_users (email, name, password_hash)
    VALUES ($1, $2, $3)
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, is_active = TRUE, updated_at = NOW()
  `, [email.toLowerCase(), name, passwordHash]))
  .then(() => client.end())
  .then(() => console.log("Administrateur créé ou mis à jour."))
  .catch((error) => { console.error(error); process.exit(1); });
