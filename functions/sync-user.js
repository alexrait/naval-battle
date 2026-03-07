import { neon } from "@neondatabase/serverless";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const { id, email, name } = JSON.parse(event.body);

    if (!id || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing user ID or email" }) };
    }

    // Upsert user into the users table
    await sql`
      INSERT INTO navalbattle.users (id, email, name, last_played)
      VALUES (${id}, ${email}, ${name || 'Unknown Soldier'}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        last_played = CURRENT_TIMESTAMP,
        email = EXCLUDED.email,
        name = EXCLUDED.name
    `;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "User synced successfully" }),
    };
  } catch (error) {
    console.error("Sync user error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
