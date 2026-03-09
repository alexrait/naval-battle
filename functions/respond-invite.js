import { neon } from "@netlify/neon";
import Pusher from "pusher";

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
    const { gameId, senderId, accepted, responderName } = JSON.parse(event.body);

    if (!gameId || !senderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing gameId or senderId" }),
      };
    }

    if (accepted) {
      // Update game status to 'playing'
      await sql`
        UPDATE navalbattle.games SET status = 'playing' WHERE id = ${gameId}
      `;
    } else {
      // Delete the pending game
      await sql`
        DELETE FROM navalbattle.games WHERE id = ${gameId} AND status = 'pending'
      `;
    }

    // Notify the original sender via Pusher
    await pusher.trigger(`user-${senderId}`, "invite-response", {
      type: "invite-response",
      gameId,
      accepted,
      responderName: responderName || "Unknown Commander",
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Response sent" }),
    };
  } catch (error) {
    console.error("Respond invite error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
