import { neon } from "@netlify/neon";

console.log("SYNC-USER: Module Loaded");

const normalizeEmail = (email) => {
  if (!email) return null;
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return email.toLowerCase().trim();
  
  const local = parts[0];
  const domain = parts[1];

  // Gmail-specific normalization
  if (domain === 'gmail.com') {
    const normalizedLocal = local.replace(/\./g, '').split('+')[0];
    return `${normalizedLocal}@${domain}`;
  }

  return `${local}@${domain}`;
};

export const handler = async (event) => {
  console.log("SYNC-USER: Start", { method: event.httpMethod });

  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { id, email, name } = body;
    console.log("SYNC-USER: Input received", { id, email, name });

    if (!id || !email) {
      return { 
        statusCode: 400, 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing user ID or email" }) 
      };
    }

    const normalizedEmail = normalizeEmail(email);
    console.log("SYNC-USER: Normalized", { normalizedEmail });

    const sql = neon();
    
    // Upsert user into the users table
    try {
      console.log("SYNC-USER: Attempting UPSERT by ID...");
      await sql`
        INSERT INTO navalbattle.users (id, email, name, last_played)
        VALUES (${id}, ${normalizedEmail}, ${name || normalizedEmail}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
          last_played = CURRENT_TIMESTAMP,
          email = EXCLUDED.email,
          name = EXCLUDED.name
      `;
      console.log("SYNC-USER: Upsert successful");
    } catch (insertError) {
      const msg = insertError.message || "";
      if (msg.includes('unique constraint "users_email_key"')) {
        console.log("SYNC-USER: Email conflict detected, attempting UPDATE by email...");
        await sql`
          UPDATE navalbattle.users
          SET id = ${id}, last_played = CURRENT_TIMESTAMP, name = ${name || normalizedEmail}
          WHERE email = ${normalizedEmail}
        `;
        console.log("SYNC-USER: Update by email successful");
      } else {
        console.error("SYNC-USER: Database error", insertError);
        throw insertError;
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "User synced successfully" }),
    };
  } catch (error) {
    console.error("SYNC-USER: Final Catch", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        error: "Internal Server Error", 
        message: error.message,
        id: event.headers?.["x-nf-request-id"]
      }),
    };
  }
};
