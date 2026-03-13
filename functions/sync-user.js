import { neon } from "@netlify/neon";

const normalizeEmail = (email) => {
  if (!email) return null;
  const parts = email.toLowerCase().trim().split('@');
  const local = parts[0];
  const domain = parts[1];

  if (!domain) return null;

  // Gmail-specific normalization (only if it's actually gmail)
  if (domain === 'gmail.com') {
    const normalizedLocal = local.replace(/\./g, '').split('+')[0];
    return `${normalizedLocal}@${domain}`;
  }

  return `${local}@${domain}`;
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let sql;
  try {
    sql = neon();
  } catch (setupError) {
    console.error("Neon setup error:", setupError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Database connection setup failed. Check environment variables." }),
    };
  }
  
  try {
    const body = JSON.parse(event.body || "{}");
    const { id, email, name } = body;
    console.log("Sync user request received:", { id, email, name });

    if (!id || !email) {
      console.log("Validation failed: Missing user ID or email");
      return { statusCode: 400, body: JSON.stringify({ error: "Missing user ID or email" }) };
    }

    const normalizedEmail = normalizeEmail(email);
    console.log("Normalized sync email:", normalizedEmail);

    if (!normalizedEmail) {
      console.log("Validation failed: Invalid email format", email);
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid email format" }) };
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
      // Check for email uniqueness conflict if ID is different
      if (insertError.message && insertError.message.includes('unique constraint "users_email_key"')) {
        console.log("Unique constraint hit for email, updating existing record with new ID");
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
      body: JSON.stringify({ message: "User synced successfully", user: { id, email: normalizedEmail } }),
    };
  } catch (error) {
    console.error("CRITICAL SYNC ERROR:", {
      message: error.message,
      stack: error.stack,
      requestBody: event.body
    });
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Internal Server Error during sync", 
        details: error.message,
        hint: "Check database constraints or network connectivity"
      }),
    };
  }
};
