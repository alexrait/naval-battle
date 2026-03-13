import { neon } from "@netlify/neon";

const normalizeEmail = (email) => {
  if (!email) return null;
  const parts = email.toLowerCase().trim().split('@');
  const local = parts[0];
  const domain = parts[1];

  if (domain && domain !== 'gmail.com') return null;

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
    console.log("Sync user request received:", { id, email, name });

    if (!id || !email) {
      console.log("Validation failed: Missing user ID or email");
      return { statusCode: 400, body: JSON.stringify({ error: "Missing user ID or email" }) };
    }

    const normalizedEmail = normalizeEmail(email);
    console.log("Normalized sync email:", normalizedEmail);

    if (!normalizedEmail) {
      console.log("Validation failed: Only Gmail addresses are allowed", email);
      return { statusCode: 400, body: JSON.stringify({ error: "Only Gmail addresses are allowed" }) };
    }

    // Upsert user into the users table
    try {
      console.log("Upserting user into DB...");
      await sql`
        INSERT INTO navalbattle.users (id, email, name, last_played)
        VALUES (${id}, ${normalizedEmail}, ${name || normalizedEmail}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
          last_played = CURRENT_TIMESTAMP,
          email = EXCLUDED.email,
          name = EXCLUDED.name
      `;
      console.log("User upserted successfully");
    } catch (insertError) {
      if (insertError.message && insertError.message.includes('unique constraint "users_email_key"')) {
        console.log("Unique constraint hit for email, updating existing record with new ID");
        // If a user was deleted & recreated in Netlify, they hold a new ID but the same email.
        // In this case, we update the existing row to use their fresh ID.
        await sql`
          UPDATE navalbattle.users
          SET id = ${id}, last_played = CURRENT_TIMESTAMP, name = ${name || normalizedEmail}
          WHERE email = ${normalizedEmail}
        `;
        console.log("User updated successfully via email match");
      } else {
        console.error("Database error during sync:", insertError);
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
