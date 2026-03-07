import { neon } from "@neondatabase/serverless";

export const handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);
  const user = context.clientContext?.user;

  if (!user) return { statusCode: 401, body: "Unauthorized" };

  try {
    const games = await sql`
      SELECT id FROM navalbattle.games 
      WHERE player2_id IS NULL AND player1_id != ${user.sub}
      LIMIT 1
    `;

    if (games.length > 0) {
      const gameId = games[0].id;
      await sql`
        UPDATE navalbattle.games 
        SET player2_id = ${user.sub}, status = 'playing' 
        WHERE id = ${gameId}
      `;
      return { statusCode: 200, body: JSON.stringify({ gameId, role: "player2" }) };
    } else {
      const newGame = await sql`
        INSERT INTO navalbattle.games (player1_id, status) 
        VALUES (${user.sub}, 'waiting') 
        RETURNING id
      `;
      return { statusCode: 200, body: JSON.stringify({ gameId: newGame[0].id, role: "player1" }) };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
