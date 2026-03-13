import { neon } from "@netlify/neon";

const normalizeEmail = (email) => {
  if (!email) return null;
  const [local, domain] = email.toLowerCase().split('@');
  if (domain !== 'gmail.com') return null;
  // Remove dots and everything after + in the local part
  // test.one+spam@gmail.com -> testone
  const normalized = local.replace(/\./g, '').split('+')[0];
  return normalized;
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const sql = neon();
  
  try {
    const { id, email, name } = JSON.parse(event.body);

    if (!id || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing user ID or email" }) };
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: "Only Gmail addresses are allowed" }) };
    }

    // Upsert user into the users table
    try {
      await sql`
        INSERT INTO navalbattle.users (id, email, name, last_played)
        VALUES (${id}, ${normalizedEmail}, ${name || normalizedEmail}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
          last_played = CURRENT_TIMESTAMP,
          email = EXCLUDED.email,
          name = EXCLUDED.name
      `;
    } catch (insertError) {
      if (insertError.message && insertError.message.includes('unique constraint "users_email_key"')) {
        // If a user was deleted & recreated in Netlify, they hold a new ID but the same email.
        // In this case, we update the existing row to use their fresh ID.
        await sql`
          UPDATE navalbattle.users
          SET id = ${id}, last_played = CURRENT_TIMESTAMP, name = ${name || normalizedEmail}
          WHERE email = ${normalizedEmail}
        `;
      } else {
        throw insertError;
      }
    }

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
