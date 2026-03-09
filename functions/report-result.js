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
    const { gameId, x, y, status, senderId, keepTurn, sunkCells } = JSON.parse(event.body);

    if (!gameId || x == null || y == null || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Broadcast fire-result so the attacking player updates their board.
    // keepTurn=true means the attacker gets another shot (they hit something).
    // sunkCells contains all cells of the ship that was just sunk (if any).
    await pusher.trigger(`game-${gameId}`, "fire-result", {
      x, y, status, senderId, keepTurn, sunkCells: sunkCells || null,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Result reported" }),
    };
  } catch (error) {
    console.error("Report result error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
