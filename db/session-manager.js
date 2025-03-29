import { db } from './index.js';

// Initialize logger
const logger = {
  info: (message) => console.log(`SESSION: ${message}`),
  error: (message, error) => {
    console.error(`SESSION ERROR: ${message}`);
    if (error && error.stack) {
      console.error(error.stack.split('\n').slice(0, 3).join('\n'));
    }
  },
};

/**
 * Session management utilities
 */
const sessionManager = {
  /**
   * Find an active session for a user
   * @param {number} userId - User ID to find session for
   * @returns {Promise<Object|null>} Session object or null if not found
   */
  async findActiveSessionForUser(userId) {
    logger.info(`Looking for active session for user ${userId}`);
    try {
      // Find sessions that contain this user ID and are active
      const result = await db.oneOrNone(
        "SELECT * FROM \"session\" WHERE sess->'passport'->>'user' = $1 AND status = 'active' AND expire > NOW() ORDER BY expire DESC LIMIT 1",
        [userId.toString()]
      );
      
      if (result) {
        logger.info(`Found active session ${result.sid} for user ${userId}`);
        return result;
      }
      
      logger.info(`No active session found for user ${userId}`);
      return null;
    } catch (error) {
      logger.error(`Error finding active session for user ${userId}:`, error);
      return null;
    }
  },

  /**
   * Update session status
   * @param {string} sid - Session ID
   * @param {string} status - New status ('active', 'inactive', 'logged_out')
   * @returns {Promise<boolean>} Success status
   */
  async updateSessionStatus(sid, status) {
    logger.info(`Updating session ${sid} status to ${status}`);
    try {
      await db.none(
        'UPDATE "session" SET status = $1 WHERE sid = $2',
        [status, sid]
      );
      logger.info(`Session ${sid} status updated to ${status}`);
      return true;
    } catch (error) {
      logger.error(`Error updating session ${sid} status:`, error);
      return false;
    }
  },

  /**
   * Mark all active sessions for a user as logged out
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of sessions marked as logged out
   */
  async logoutAllUserSessions(userId) {
    logger.info(`Logging out all sessions for user ${userId}`);
    try {
      const result = await db.result(
        "UPDATE \"session\" SET status = 'logged_out' WHERE sess->'passport'->>'user' = $1 AND status = 'active'",
        [userId.toString()]
      );
      logger.info(`Logged out ${result.rowCount} sessions for user ${userId}`);
      return result.rowCount;
    } catch (error) {
      logger.error(`Error logging out sessions for user ${userId}:`, error);
      return 0;
    }
  },

  /**
   * Clean up expired sessions
   * @returns {Promise<number>} Number of sessions removed
   */
  async cleanupExpiredSessions() {
    logger.info('Cleaning up expired sessions');
    try {
      const result = await db.result(
        'DELETE FROM "session" WHERE expire < NOW()'
      );
      logger.info(`Removed ${result.rowCount} expired sessions`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  },

  /**
   * Get session information by SID
   * @param {string} sid - Session ID
   * @returns {Promise<Object|null>} Session object or null if not found
   */
  async getSessionInfo(sid) {
    logger.info(`Getting info for session ${sid}`);
    try {
      const session = await db.oneOrNone(
        'SELECT * FROM "session" WHERE sid = $1',
        [sid]
      );
      
      if (session) {
        logger.info(`Found session ${sid}`);
        return session;
      }
      
      logger.info(`Session ${sid} not found`);
      return null;
    } catch (error) {
      logger.error(`Error getting session ${sid} info:`, error);
      return null;
    }
  }
};

export default sessionManager;
