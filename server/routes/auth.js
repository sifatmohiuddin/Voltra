import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

function signToken(admin) {
  return jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/admin/auth/login
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    res.json({
      token: signToken(admin),
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/auth/me
router.get('/me', requireAdmin, (req, res) => {
  const { _id, name, email, role } = req.admin;
  res.json({ id: _id, name, email, role });
});

export default router;
