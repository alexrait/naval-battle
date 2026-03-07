import { neon } from "@neondatabase/serverless";

export const handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    await sql`CREATE SCHEMA IF NOT EXISTS navalbattle`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS navalbattle.users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS navalbattle.games (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player1_id TEXT NOT NULL,
        player2_id TEXT,
        player1_ships JSONB,
        player2_ships JSONB,
        player1_moves JSONB DEFAULT '[]',
        player2_moves JSONB DEFAULT '[]',
        turn TEXT DEFAULT 'player1',
        status TEXT DEFAULT 'waiting',
        winner TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Database initialized" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
