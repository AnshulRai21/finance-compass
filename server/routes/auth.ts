import { Router } from 'express';
import { randomUUID } from 'crypto';
import {
  hashPassword,
  comparePassword,
  generateToken,
  createSession,
  invalidateSession,
  invalidateAllUserSessions,
} from '../config/auth';
import { getDatabase } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    const db = getDatabase();
    const trimmedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await db.get(
      `SELECT id FROM users WHERE email = ?`,
      [trimmedEmail]
    );

    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    // Create user
    const userId = randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), trimmedEmail, passwordHash, now, now]
    );

    // Create user settings
    const settingsId = randomUUID();
    await db.run(
      `INSERT INTO user_settings (id, user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      [settingsId, userId, now, now]
    );

    // Generate JWT and create session
    const token = generateToken({
      userId,
      email: trimmedEmail,
      sessionId: '', // Will be updated after session creation
    });

    const sessionId = await createSession(userId, token);

    // Update token with actual sessionId
    const updatedToken = generateToken({
      userId,
      email: trimmedEmail,
      sessionId,
    });

    res.status(201).json({
      success: true,
      user: {
        id: userId,
        name: name.trim(),
        email: trimmedEmail,
        currency: 'USD',
        createdAt: now,
      },
      token: updatedToken,
      sessionId,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const db = getDatabase();
    const trimmedEmail = email.trim().toLowerCase();

    // Find user
    const user = await db.get(
      `SELECT id, name, email, password_hash, currency, monthly_budget, created_at, is_active
       FROM users WHERE email = ?`,
      [trimmedEmail]
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.is_active) {
      res.status(401).json({ error: 'Account is inactive' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT and create session
    const token = generateToken({
      userId: user.id,
      email: user.email,
      sessionId: '', // Will be updated after session creation
    });

    const sessionId = await createSession(user.id, token);

    // Update token with actual sessionId
    const updatedToken = generateToken({
      userId: user.id,
      email: user.email,
      sessionId,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        monthlyBudget: user.monthly_budget,
        createdAt: user.created_at,
      },
      token: updatedToken,
      sessionId,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Logout user
 * POST /api/auth/logout
 */
router.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const sessionId = (req as any).sessionId;

    if (sessionId) {
      await invalidateSession(sessionId);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 */
router.post('/logout-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await invalidateAllUserSessions(req.userId);

    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const user = await db.get(
      `SELECT id, name, email, currency, monthly_budget, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.userId]
    );

    const settings = await db.get(
      `SELECT * FROM user_settings WHERE user_id = ?`,
      [req.userId]
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        monthlyBudget: user.monthly_budget,
        createdAt: user.created_at,
      },
      settings,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, currency, monthlyBudget } = req.body;

    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    await db.run(
      `UPDATE users SET name = ?, currency = ?, monthly_budget = ?, updated_at = ?
       WHERE id = ?`,
      [name || '', currency || 'USD', monthlyBudget || 0, now, req.userId]
    );

    const updatedUser = await db.get(
      `SELECT id, name, email, currency, monthly_budget FROM users WHERE id = ?`,
      [req.userId]
    );

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Change password
 * POST /api/auth/change-password
 */
router.post('/change-password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const db = getDatabase();

    // Get current password hash
    const user = await db.get(
      `SELECT password_hash FROM users WHERE id = ?`,
      [req.userId]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    const now = new Date().toISOString();

    await db.run(
      `UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`,
      [newPasswordHash, now, req.userId]
    );

    // Invalidate all sessions for security
    await invalidateAllUserSessions(req.userId);

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

/**
 * Delete account
 * DELETE /api/auth/account
 */
router.delete('/account', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required to delete account' });
      return;
    }

    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const db = getDatabase();

    // Verify password before deletion
    const user = await db.get(
      `SELECT password_hash FROM users WHERE id = ?`,
      [req.userId]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Soft delete user (mark as inactive)
    const now = new Date().toISOString();
    await db.run(
      `UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?`,
      [now, req.userId]
    );

    // Invalidate all sessions
    await invalidateAllUserSessions(req.userId);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
