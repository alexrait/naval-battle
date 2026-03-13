import { neon } from "@netlify/neon";
import Pusher from "pusher";

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

  try {
    const { targetEmail, senderName, senderId } = JSON.parse(event.body);
    console.log("Invite request received:", { targetEmail, senderName, senderId });

    if (!targetEmail || !senderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing targetEmail or senderId" }),
      };
    }

    const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error("SEND-INVITE: Missing DATABASE_URL");
      return { statusCode: 500, body: JSON.stringify({ error: "Database configuration error" }) };
    }

    const sql = neon(databaseUrl);
    
    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });

    // Normalize the input: if it's an email, normalize it. If not, treat as username.
    const input = targetEmail.toLowerCase().trim();
    const isEmail = input.includes('@');
    
    let normalizedTarget;
    if (isEmail) {
      normalizedTarget = normalizeEmail(input);
    } else {
      // Treat as username part - apply same cleaning logic (no dots, no plus)
      normalizedTarget = input.replace(/\./g, '').split('+')[0];
    }
    
    // The username part we search for in the database
    const searchUsername = normalizedTarget.split('@')[0];

    console.log("Searching for target:", { input, normalizedTarget, searchUsername });

    // Look up target user by full email OR by username part
    // We look for:
    // 1. Exact email match
    // 2. Email starting with the cleaned username (handles gmail dot/plus aliases)
    const users = await sql`
      SELECT id, email, name FROM navalbattle.users 
      WHERE email = ${normalizedTarget} 
         OR email LIKE ${searchUsername + '@%'}
      LIMIT 1
    `;
    console.log("DB lookup result count:", users.length);

    if (users.length === 0) {
      console.log("User not found in DB for normalized email:", normalizedTarget);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found. Make sure they have logged in first." }),
      };
    }

    const targetUser = users[0];
    console.log("Target user found:", targetUser);

    // Create a pending game record
    const games = await sql`
      INSERT INTO navalbattle.games (player1_id, player2_id, status)
      VALUES (${senderId}, ${targetUser.id}, 'pending')
      RETURNING id
    `;

    const gameId = games[0].id;

    // Notify the target user via Pusher
    await pusher.trigger(`user-${targetUser.id}`, "incoming-invite", {
      type: "incoming-invite",
      gameId,
      senderId,
      senderName: senderName || "Unknown Commander",
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invite sent", gameId }),
    };
  } catch (error) {
    console.error("Send invite error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
