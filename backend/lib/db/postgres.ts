import { Pool } from 'pg';

// Create a connection pool to PostgreSQL
// Optimized for production-scale performance (Requirement 9.1: 1000+ concurrent users)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // Connection pool sizing
  max: 50, // Maximum number of clients in the pool (increased for 1000+ concurrent users)
  min: 10, // Minimum number of clients to keep in the pool
  
  // Timeout configurations
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Wait up to 5 seconds for a connection
  
  // Query timeout
  statement_timeout: 10000, // Abort queries that take longer than 10 seconds
  
  // Connection lifecycle
  allowExitOnIdle: false, // Keep the pool alive even when idle
});

// Test connection on startup
pool.on('connect', (client) => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

pool.on('acquire', (client) => {
  // Log when a client is acquired from the pool (for monitoring)
  const poolStats = getPoolStats();
  if (poolStats.waitingCount > 5) {
    console.warn('⚠️ High connection pool wait queue:', poolStats);
  }
});

pool.on('remove', (client) => {
  // Log when a client is removed from the pool
  console.log('🔄 Client removed from pool');
});

export default pool;

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
}

// Helper function to get a client from the pool for transactions
export async function getClient() {
  const client = await pool.connect();
  return client;
}

// Helper function to get pool statistics for monitoring
export function getPoolStats() {
  return {
    totalCount: pool.totalCount, // Total number of clients in the pool
    idleCount: pool.idleCount, // Number of idle clients
    waitingCount: pool.waitingCount, // Number of queued requests waiting for a client
  };
}

// Helper function to check pool health
export function isPoolHealthy(): boolean {
  const stats = getPoolStats();
  // Pool is unhealthy if waiting queue is too long or no idle connections
  return stats.waitingCount < 10 && stats.idleCount > 0;
}
