import Pusher from "pusher";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });

  try {
    const { gameId, x, y, senderId } = JSON.parse(event.body);

    if (!gameId || x == null || y == null) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing gameId, x, or y" }),
      };
    }

    // Notify the game channel — both players listen on game-{gameId}
    await pusher.trigger(`game-${gameId}`, "fire", { x, y, senderId });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Shot fired" }),
    };
  } catch (error) {
    console.error("Fire error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
