import { Router } from 'express';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getDatabase } from '../config/database';

const router = Router();

/**
 * Add EMI
 * POST /api/emis
 */
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, principal, rate, tenureMonths, startDate, amount, autoDeduct } = req.body;

    if (!name || !amount || !startDate) {
      res.status(400).json({ error: 'Name, amount, and start date are required' });
      return;
    }

    const db = getDatabase();
    const emiId = randomUUID();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO emis (id, user_id, name, principal, rate, tenure_months, start_date, amount, paid_months, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [emiId, req.userId, name.trim(), principal || 0, rate || 0, tenureMonths || 0, startDate, amount, 0, 1, now, now]
    );

    res.status(201).json({
      success: true,
      emi: {
        id: emiId,
        name,
        principal,
        rate,
        tenureMonths,
        startDate,
        amount,
      },
    });
  } catch (error) {
    console.error('Add EMI error:', error);
    res.status(500).json({ error: 'Failed to add EMI' });
  }
});

/**
 * Get All EMIs
 * GET /api/emis
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const emis = await db.all(
      `SELECT * FROM emis WHERE user_id = ? ORDER BY start_date DESC`,
      [req.userId]
    );

    const activeEmis = emis.filter((emi: any) => emi.is_active);
    const completedEmis = emis.filter((emi: any) => !emi.is_active);

    res.json({
      activeEmis,
      completedEmis,
      totalActive: activeEmis.length,
      totalMonthlyAmount: activeEmis.reduce((sum: number, emi: any) => sum + emi.amount, 0),
    });
  } catch (error) {
    console.error('Get EMIs error:', error);
    res.status(500).json({ error: 'Failed to fetch EMIs' });
  }
});

/**
 * Get Single EMI
 * GET /api/emis/:id
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const emi = await db.get(
      `SELECT * FROM emis WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId]
    );

    if (!emi) {
      res.status(404).json({ error: 'EMI not found' });
      return;
    }

    res.json({ emi });
  } catch (error) {
    console.error('Get EMI error:', error);
    res.status(500).json({ error: 'Failed to fetch EMI' });
  }
});

/**
 * Update EMI
 * PUT /api/emis/:id
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, principal, rate, tenureMonths, startDate, amount, paidMonths, isActive } = req.body;

    const db = getDatabase();
    const now = new Date().toISOString();

    const emi = await db.get(
      `SELECT * FROM emis WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId]
    );

    if (!emi) {
      res.status(404).json({ error: 'EMI not found' });
      return;
    }

    await db.run(
      `UPDATE emis SET name = ?, principal = ?, rate = ?, tenure_months = ?, start_date = ?, amount = ?, paid_months = ?, is_active = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [name || emi.name, principal ?? emi.principal, rate ?? emi.rate, tenureMonths ?? emi.tenure_months, 
       startDate || emi.start_date, amount ?? emi.amount, paidMonths ?? emi.paid_months, 
       isActive ?? emi.is_active, now, req.params.id, req.userId]
    );

    res.json({ success: true, message: 'EMI updated successfully' });
  } catch (error) {
    console.error('Update EMI error:', error);
    res.status(500).json({ error: 'Failed to update EMI' });
  }
});

/**
 * Mark EMI as Paid
 * POST /api/emis/:id/pay
 */
router.post('/:id/pay', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();

    const emi = await db.get(
      `SELECT * FROM emis WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId]
    );

    if (!emi) {
      res.status(404).json({ error: 'EMI not found' });
      return;
    }

    // Increment paid months
    const newPaidMonths = (emi.paid_months || 0) + 1;
    const isCompleted = newPaidMonths >= (emi.tenure_months || 1);

    // Update EMI
    await db.run(
      `UPDATE emis SET paid_months = ?, is_active = ?, updated_at = ? WHERE id = ?`,
      [newPaidMonths, !isCompleted, now, req.params.id]
    );

    // Create payment transaction
    const txnId = randomUUID();
    await db.run(
      `INSERT INTO transactions (id, user_id, type, amount, description, category, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [txnId, req.userId, 'expense', emi.amount, `EMI Payment: ${emi.name}`, 'EMI', now, now, now]
    );

    res.json({
      success: true,
      message: isCompleted ? 'EMI completed!' : 'EMI payment recorded',
      paidMonths: newPaidMonths,
      isCompleted,
    });
  } catch (error) {
    console.error('Pay EMI error:', error);
    res.status(500).json({ error: 'Failed to record EMI payment' });
  }
});

/**
 * Delete EMI
 * DELETE /api/emis/:id
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();

    const emi = await db.get(
      `SELECT * FROM emis WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId]
    );

    if (!emi) {
      res.status(404).json({ error: 'EMI not found' });
      return;
    }

    await db.run(
      `UPDATE emis SET is_active = 0 WHERE id = ?`,
      [req.params.id]
    );

    res.json({ success: true, message: 'EMI deleted successfully' });
  } catch (error) {
    console.error('Delete EMI error:', error);
    res.status(500).json({ error: 'Failed to delete EMI' });
  }
});

export default router;
