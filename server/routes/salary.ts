import { Router } from 'express';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getDatabase } from '../config/database';

const router = Router();

/**
 * Add/Update Salary
 * POST /api/salary
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { amount, creditDate } = req.body;

    if (!amount || !creditDate) {
      res.status(400).json({ error: 'Amount and credit date are required' });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: 'Salary amount must be positive' });
      return;
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    // Update user salary
    await db.run(
      `UPDATE users SET salary = ?, salary_credit_date = ?, updated_at = ? WHERE id = ?`,
      [amount, creditDate, now, req.userId]
    );

    res.json({
      success: true,
      salary: {
        amount,
        creditDate,
      },
    });
  } catch (error) {
    console.error('Add salary error:', error);
    res.status(500).json({ error: 'Failed to add salary' });
  }
});

/**
 * Get Salary Details
 * GET /api/salary
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const user = await db.get(
      `SELECT salary, salary_credit_date FROM users WHERE id = ?`,
      [req.userId]
    );

    const history = await db.all(
      `SELECT id, amount, credited_on FROM salary_history 
       WHERE user_id = ? ORDER BY credited_on DESC LIMIT 12`,
      [req.userId]
    );

    res.json({
      salary: user?.salary || 0,
      creditDate: user?.salary_credit_date || null,
      history,
    });
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ error: 'Failed to fetch salary details' });
  }
});

/**
 * Get Salary History
 * GET /api/salary/history
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const history = await db.all(
      `SELECT * FROM salary_history WHERE user_id = ? ORDER BY credited_on DESC`,
      [req.userId]
    );

    res.json({ history });
  } catch (error) {
    console.error('Get salary history error:', error);
    res.status(500).json({ error: 'Failed to fetch salary history' });
  }
});

/**
 * Record Salary Credit (Internal/Manual)
 * POST /api/salary/credit
 */
router.post('/credit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { amount, creditedOn } = req.body;

    if (!amount || !creditedOn) {
      res.status(400).json({ error: 'Amount and credit date are required' });
      return;
    }

    const db = getDatabase();
    const historyId = randomUUID();
    const now = new Date().toISOString();

    // Add to salary history
    await db.run(
      `INSERT INTO salary_history (id, user_id, amount, credited_on, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [historyId, req.userId, amount, creditedOn, now]
    );

    // Create transaction record
    const txnId = randomUUID();
    await db.run(
      `INSERT INTO transactions (id, user_id, type, amount, description, category, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txnId, req.userId, 'income', amount, 'Salary Credit', 'Salary', creditedOn, now, now]
    );

    res.json({
      success: true,
      message: 'Salary credited successfully',
    });
  } catch (error) {
    console.error('Credit salary error:', error);
    res.status(500).json({ error: 'Failed to credit salary' });
  }
});

export default router;
