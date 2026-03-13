import { neon } from "@netlify/neon";
import Pusher from "pusher";

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

  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });

  try {
    const { targetEmail, senderName, senderId } = JSON.parse(event.body);

    if (!targetEmail || !senderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing targetEmail or senderId" }),
      };
    }

    const normalizedTarget = normalizeEmail(targetEmail);
    if (!normalizedTarget) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Only Gmail addresses are allowed" }),
      };
    }

    // Look up target user by normalized email (username only, stored in DB)
    const users = await sql`
      SELECT id, email, name FROM navalbattle.users 
      WHERE email = ${normalizedTarget}
      LIMIT 1
    `;

    if (users.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found. Make sure they have logged in first." }),
      };
    }

    const targetUser = users[0];

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
