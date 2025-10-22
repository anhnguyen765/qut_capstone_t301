import mysql from "mysql2/promise";

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
}

export async function createConnection() {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "crm_db",
  };

  // Add valid connection options for MySQL2
  const connectionConfig = {
    ...config,
    connectTimeout: 30000, // 30 seconds - this is valid
    // Remove acquireTimeout and timeout as they're not valid for individual connections
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    return connection;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw new Error("Failed to connect to database");
  }
}

export async function executeQuery(query: string, params: any[] = [], retries: number = 3) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await createConnection();
      try {
        const [rows] = await connection.execute(query, params);
        // Ensure we always return an array for SELECT queries
        if (query.trim().toUpperCase().startsWith('SELECT')) {
          return Array.isArray(rows) ? rows : [];
        }
        return rows;
      } finally {
        await connection.end();
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`Database query attempt ${attempt} failed:`, error);
      
      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Database query failed after all retries');
}

export async function executeTransaction(queries: { query: string; params: any[] }[]) {
  const connection = await createConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
} 