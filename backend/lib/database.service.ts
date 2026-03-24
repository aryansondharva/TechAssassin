/**
 * Database Service - Live PostgreSQL Connection
 * 
 * Handles all database operations for TechAssassin platform
 * using local PostgreSQL database managed by pgAdmin 4
 */

import { Pool, PoolClient } from 'pg';
import { logger } from './logger.service';

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'techassassin',
  user: process.env.DB_USER || 'techassassin_app',
  password: process.env.DB_PASSWORD || 'secure_password_123',
  max: parseInt(process.env.DATABASE_CONNECTION_POOL_SIZE || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: parseInt(process.env.DATABASE_TIMEOUT_MS || '30000'),
};

// Create connection pool
const pool = new Pool(dbConfig);

// Database service class
export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool;

  private constructor() {
    this.pool = pool;
    this.initializePool();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database connection pool
   */
  private async initializePool(): Promise<void> {
    try {
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      logger.info('Database connection pool initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database connection pool:', error);
      throw error;
    }
  }

  /**
   * Execute a query with parameters
   */
  public async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      if (process.env.DATABASE_QUERY_LOGGING === 'true') {
        logger.debug(`Query executed in ${duration}ms:`, { text, params, rowCount: result.rowCount });
      }
      
      return result.rows;
    } catch (error) {
      logger.error('Database query error:', { text, params, error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a single query (returns first row or null)
   */
  public async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get database health status
   */
  public async getHealthStatus(): Promise<{
    connected: boolean;
    poolSize: number;
    idleCount: number;
    totalCount: number;
  }> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      return {
        connected: true,
        poolSize: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        totalCount: this.pool.totalCount,
      };
    } catch (error) {
      return {
        connected: false,
        poolSize: 0,
        idleCount: 0,
        totalCount: 0,
      };
    }
  }

  /**
   * Close all connections
   */
  public async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }

  // ==============================================================================
  // Profile Management
  // ==============================================================================

  /**
   * Get user profile by ID
   */
  public async getProfileById(userId: string): Promise<any> {
    const query = `
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'skill_id', us.skill_id,
              'skill_name', s.name,
              'category', s.category,
              'proficiency_level', us.proficiency_level
            )
          ) FILTER (WHERE s.name IS NOT NULL),
          '[]'::json
        ) as skills
      FROM public.profiles p
      LEFT JOIN public.user_skills us ON p.id = us.user_id
      LEFT JOIN public.skills s ON us.skill_id = s.id
      WHERE p.id = $1
      GROUP BY p.id
    `;
    
    return this.queryOne(query, [userId]);
  }

  /**
   * Create or update user profile
   */
  public async upsertProfile(profile: {
    id: string;
    username: string;
    full_name?: string;
    email?: string;
    phone?: string;
    aadhaar_number?: string;
    avatar_url?: string;
    github_url?: string;
    bio?: string;
    address?: string;
    education?: string;
    university?: string;
    graduation_year?: number;
  }): Promise<any> {
    const query = `
      INSERT INTO public.profiles (
        id, username, full_name, email, phone, aadhaar_number, 
        avatar_url, github_url, bio, address, education, 
        university, graduation_year, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
      )
      ON CONFLICT (id) 
      DO UPDATE SET
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        aadhaar_number = EXCLUDED.aadhaar_number,
        avatar_url = EXCLUDED.avatar_url,
        github_url = EXCLUDED.github_url,
        bio = EXCLUDED.bio,
        address = EXCLUDED.address,
        education = EXCLUDED.education,
        university = EXCLUDED.university,
        graduation_year = EXCLUDED.graduation_year,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [
      profile.id, profile.username, profile.full_name, profile.email, profile.phone,
      profile.aadhaar_number, profile.avatar_url, profile.github_url, profile.bio,
      profile.address, profile.education, profile.university, profile.graduation_year
    ];
    
    return this.queryOne(query, values);
  }

  /**
   * Update user skills
   */
  public async updateUserSkills(userId: string, skills: Array<{
    skill_id: string;
    proficiency_level: number;
  }>): Promise<void> {
    await this.transaction(async (client) => {
      // Remove existing skills
      await client.query('DELETE FROM public.user_skills WHERE user_id = $1', [userId]);
      
      // Add new skills
      for (const skill of skills) {
        await client.query(
          'INSERT INTO public.user_skills (user_id, skill_id, proficiency_level) VALUES ($1, $2, $3)',
          [userId, skill.skill_id, skill.proficiency_level]
        );
      }
    });
  }

  // ==============================================================================
  // Events Management
  // ==============================================================================

  /**
   * Get all events
   */
  public async getEvents(): Promise<any[]> {
    const query = `
      SELECT 
        e.*,
        COUNT(r.id) as participant_count
      FROM public.events e
      LEFT JOIN public.registrations r ON e.id = r.event_id
      GROUP BY e.id
      ORDER BY e.start_date ASC
    `;
    
    return this.query(query);
  }

  /**
   * Get event by ID
   */
  public async getEventById(eventId: string): Promise<any> {
    const query = `
      SELECT 
        e.*,
        COUNT(r.id) as participant_count
      FROM public.events e
      LEFT JOIN public.registrations r ON e.id = r.event_id
      WHERE e.id = $1
      GROUP BY e.id
    `;
    
    return this.queryOne(query, [eventId]);
  }

  /**
   * Create new event
   */
  public async createEvent(event: {
    title: string;
    description: string;
    start_date: Date;
    end_date: Date;
    location: string;
    max_participants: number;
    image_urls?: string[];
    prizes?: any;
    themes?: string[];
  }): Promise<any> {
    const query = `
      INSERT INTO public.events (
        title, description, start_date, end_date, location, 
        max_participants, image_urls, prizes, themes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING *
    `;
    
    const values = [
      event.title, event.description, event.start_date, event.end_date,
      event.location, event.max_participants, event.image_urls,
      event.prizes, event.themes
    ];
    
    return this.queryOne(query, values);
  }

  // ==============================================================================
  // Registrations Management
  // ==============================================================================

  /**
   * Get user registrations
   */
  public async getUserRegistrations(userId: string): Promise<any[]> {
    const query = `
      SELECT r.*, e.title as event_title, e.start_date, e.end_date, e.location
      FROM public.registrations r
      JOIN public.events e ON r.event_id = e.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `;
    
    return this.query(query, [userId]);
  }

  /**
   * Create event registration
   */
  public async createRegistration(registration: {
    user_id: string;
    event_id: string;
    team_name: string;
    project_idea?: string;
  }): Promise<any> {
    const query = `
      INSERT INTO public.registrations (
        user_id, event_id, team_name, project_idea, status, created_at
      ) VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING *
    `;
    
    const values = [
      registration.user_id, registration.event_id, 
      registration.team_name, registration.project_idea
    ];
    
    return this.queryOne(query, values);
  }

  // ==============================================================================
  // Leaderboard Management
  // ==============================================================================

  /**
   * Get global leaderboard
   */
  public async getLeaderboard(limit: number = 50): Promise<any[]> {
    const query = `
      SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        COALESCE(l.score, 0) as score,
        COUNT(DISTINCT r.event_id) as events_participated,
        ROW_NUMBER() OVER (ORDER BY COALESCE(l.score, 0) DESC) as rank
      FROM public.profiles p
      LEFT JOIN public.leaderboard l ON p.id = l.user_id
      LEFT JOIN public.registrations r ON p.id = r.user_id AND r.status = 'confirmed'
      GROUP BY p.id, p.username, p.full_name, p.avatar_url, l.score
      ORDER BY COALESCE(l.score, 0) DESC
      LIMIT $1
    `;
    
    return this.query(query, [limit]);
  }

  /**
   * Update user score in leaderboard
   */
  public async updateLeaderboardScore(userId: string, eventId: string, score: number): Promise<void> {
    const query = `
      INSERT INTO public.leaderboard (user_id, event_id, score, rank, updated_at)
      VALUES ($1, $2, $3, 
        (SELECT COUNT(*) + 1 FROM public.leaderboard l2 WHERE l2.event_id = $2 AND l2.score > $3),
        NOW()
      )
      ON CONFLICT (user_id, event_id)
      DO UPDATE SET
        score = EXCLUDED.score,
        rank = (SELECT COUNT(*) + 1 FROM public.leaderboard l2 WHERE l2.event_id = EXCLUDED.event_id AND l2.score > EXCLUDED.score),
        updated_at = NOW()
    `;
    
    await this.query(query, [userId, eventId, score]);
  }

  // ==============================================================================
  // Skills Management
  // ==============================================================================

  /**
   * Get all skills
   */
  public async getSkills(): Promise<any[]> {
    const query = `
      SELECT * FROM public.skills
      ORDER BY category, name
    `;
    
    return this.query(query);
  }

  /**
   * Get skills by category
   */
  public async getSkillsByCategory(category: string): Promise<any[]> {
    const query = `
      SELECT * FROM public.skills
      WHERE category = $1
      ORDER BY name
    `;
    
    return this.query(query, [category]);
  }

  /**
   * Create new skill
   */
  public async createSkill(skill: {
    name: string;
    category: string;
  }): Promise<any> {
    const query = `
      INSERT INTO public.skills (name, category, created_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `;
    
    return this.queryOne(query, [skill.name, skill.category]);
  }

  // ==============================================================================
  // Announcements Management
  // ==============================================================================

  /**
   * Get recent announcements
   */
  public async getAnnouncements(limit: number = 10): Promise<any[]> {
    const query = `
      SELECT a.*, p.username, p.full_name, p.avatar_url
      FROM public.announcements a
      JOIN public.profiles p ON a.author_id = p.id
      ORDER BY a.created_at DESC
      LIMIT $1
    `;
    
    return this.query(query, [limit]);
  }

  /**
   * Create announcement
   */
  public async createAnnouncement(announcement: {
    author_id: string;
    content: string;
  }): Promise<any> {
    const query = `
      INSERT INTO public.announcements (author_id, content, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `;
    
    return this.queryOne(query, [announcement.author_id, announcement.content]);
  }

  // ==============================================================================
  // Analytics and Reporting
  // ==============================================================================

  /**
   * Get dashboard statistics
   */
  public async getDashboardStats(): Promise<{
    totalUsers: number;
    totalEvents: number;
    totalRegistrations: number;
    activeUsers: number;
  }> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM public.profiles) as total_users,
        (SELECT COUNT(*) FROM public.events) as total_events,
        (SELECT COUNT(*) FROM public.registrations) as total_registrations,
        (SELECT COUNT(DISTINCT user_id) FROM public.registrations WHERE created_at > NOW() - INTERVAL '30 days') as active_users
    `;
    
    const result = await this.queryOne(query);
    return result || {
      totalUsers: 0,
      totalEvents: 0,
      totalRegistrations: 0,
      activeUsers: 0,
    };
  }

  /**
   * Get event statistics
   */
  public async getEventStats(eventId: string): Promise<{
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    waitlistedRegistrations: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_registrations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_registrations,
        COUNT(CASE WHEN status = 'waitlisted' THEN 1 END) as waitlisted_registrations
      FROM public.registrations
      WHERE event_id = $1
    `;
    
    const result = await this.queryOne(query, [eventId]);
    return result || {
      totalRegistrations: 0,
      confirmedRegistrations: 0,
      pendingRegistrations: 0,
      waitlistedRegistrations: 0,
    };
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();

// Export pool for direct access if needed
export { pool };
