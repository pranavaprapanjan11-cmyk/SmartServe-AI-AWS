// File: backend/src/modules/auth/auth.controller.ts
// Controller for auth routes: registration and login

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, verifyPassword } from './auth.service';
import { Role, normalizeRole, storageRole } from './auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'please-set-a-secure-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user: { id: string; role: Role; email?: string }) {
  const role = normalizeRole(user.role) || user.role;
  return jwt.sign({ sub: user.id, role, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
}

async function generateUniqueWorkspaceCode(dbPool: any, restaurantName: string): Promise<string> {
  const base = restaurantName.replace(/[^A-Z]/gi, '').substring(0, 5).toUpperCase() || 'REST';
  let attempts = 0;
  while (attempts < 100) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const code = `${base}${randomDigits}`;
    const { rows } = await dbPool.query('SELECT id FROM workspaces WHERE workspace_code = $1 LIMIT 1', [code]);
    if (rows.length === 0) {
      return code;
    }
    attempts++;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role, workspaceName, restaurantName, workspaceCode } = req.body;
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const { Pool } = require('pg');
    const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });

    let workspaceId: string | null = null;
    let generatedCode: string | null = null;

    const storedRole = storageRole(role) || role;
    const normalized = normalizeRole(storedRole) || storedRole;

    if (normalized === 'OWNER') {
      const rName = restaurantName || workspaceName || 'My Restaurant';
      const wName = workspaceName || `${name}'s Workspace`;
      generatedCode = await generateUniqueWorkspaceCode(dbPool, rName);
      
      const { rows: ws } = await dbPool.query(
        `INSERT INTO workspaces (workspace_code, workspace_name, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id`,
        [generatedCode, wName]
      );
      workspaceId = ws[0].id;
    } else {
      if (!workspaceCode) {
        await dbPool.end();
        return res.status(400).json({ message: 'Workspace Code is required' });
      }
      const { rows: ws } = await dbPool.query(
        `SELECT id FROM workspaces WHERE workspace_code = $1 LIMIT 1`,
        [workspaceCode.trim().toUpperCase()]
      );
      if (ws.length === 0) {
        await dbPool.end();
        return res.status(404).json({ message: 'Workspace not found. Check the workspace code.' });
      }
      workspaceId = ws[0].id;
    }

    const user = await createUser({
      name,
      email,
      password,
      role: storedRole,
      workspace_id: workspaceId
    });

    if (normalized === 'OWNER') {
      await dbPool.query(
        `UPDATE workspaces SET owner_id = $1 WHERE id = $2`,
        [user.id, workspaceId]
      );
      
      // Auto seed default categories for this workspace
      await dbPool.query(
        `INSERT INTO menu_categories (restaurant_id, workspace_id, name, description, color_code, icon_emoji, display_order)
         VALUES 
           ($1, $2, 'Beverages', 'Cold and hot drinks', '#3b82f6', '🥤', 1),
           ($1, $2, 'Starters', 'Appetizers and quick bites', '#10b981', '🥟', 2),
           ($1, $2, 'Main Course', 'Main dishes and entrees', '#f59e0b', '🍛', 3),
           ($1, $2, 'Desserts', 'Sweet treats and desserts', '#ec4899', '🍰', 4)
         ON CONFLICT DO NOTHING`,
        [user.id, workspaceId]
      );
    }

    if (!generatedCode && workspaceId) {
      const { rows: wsData } = await dbPool.query(
        `SELECT workspace_code FROM workspaces WHERE id = $1 LIMIT 1`,
        [workspaceId]
      );
      if (wsData.length > 0) {
        generatedCode = wsData[0].workspace_code;
      }
    }

    await dbPool.end();

    const normalizedRole = normalizeRole(user.role) || user.role;
    const token = jwt.sign(
      { sub: user.id, role: normalizedRole, email: user.email, workspaceId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizedRole,
      workspace_id: workspaceId,
      workspace_code: generatedCode || workspaceCode,
      created_at: user.created_at
    };

    return res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password, workspaceCode } = req.body;
    const user = await findUserByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    let workspaceId = (user as any).workspace_id;
    let currentCode = null;

    const { Pool } = require('pg');
    const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });

    if (workspaceCode) {
      const wResult = await dbPool.query(
        `SELECT id FROM workspaces WHERE workspace_code = $1 LIMIT 1`,
        [workspaceCode.trim().toUpperCase()]
      );
      if (wResult.rows.length === 0) {
        await dbPool.end();
        return res.status(404).json({ message: 'Invalid Workspace Code' });
      }
      workspaceId = wResult.rows[0].id;
      await dbPool.query(
        `UPDATE users SET workspace_id = $1 WHERE id = $2`,
        [workspaceId, user.id]
      );
      currentCode = workspaceCode.trim().toUpperCase();
    } else if (workspaceId) {
      const wResult = await dbPool.query(
        `SELECT workspace_code FROM workspaces WHERE id = $1 LIMIT 1`,
        [workspaceId]
      );
      if (wResult.rows.length > 0) {
        currentCode = wResult.rows[0].workspace_code;
      }
    }

    await dbPool.end();

    const normalizedRole = normalizeRole(user.role) || user.role;
    const token = jwt.sign(
      { sub: user.id, role: normalizedRole, email: user.email, workspaceId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizedRole,
      workspace_id: workspaceId,
      workspace_code: currentCode,
      created_at: user.created_at
    };

    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const { Pool } = require('pg');
    const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
    const { rows } = await dbPool.query(
      `SELECT u.id, u.name, u.email, u.role, u.workspace_id, w.workspace_code, u.created_at 
       FROM users u
       LEFT JOIN workspaces w ON u.workspace_id = w.id
       WHERE u.id = $1 LIMIT 1`,
      [user.id]
    );
    
    // Resolve restaurant ID using the orders.service helper
    const { getRestaurantId } = require('../orders/orders.service');
    const normalizedRole = normalizeRole(user.role) || user.role;
    const rId = await getRestaurantId(user.id, normalizedRole);

    await dbPool.end();

    if (rows.length === 0) return res.status(401).json({ message: 'User not found' });

    const freshUser = rows[0];

    return res.json({
      user: {
        id: freshUser.id,
        name: freshUser.name,
        email: freshUser.email,
        role: normalizedRole,
        workspace_id: freshUser.workspace_id,
        workspace_code: freshUser.workspace_code,
        restaurantId: rId,
        created_at: freshUser.created_at
      }
    });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function validateManagerPin(req: Request, res: Response) {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ message: 'PIN is required' });
    }

    const { Pool } = require('pg');
    const localPool = new Pool({ connectionString: process.env.DATABASE_URL });

    const { rows } = await localPool.query(
      `SELECT name, role FROM users 
       WHERE role IN ('OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'SUPER_ADMIN') 
         AND pin = $1 
       LIMIT 1`,
      [pin]
    );

    await localPool.end();

    if (rows.length > 0) {
      return res.json({ approved: true, managerName: rows[0].name, role: rows[0].role });
    }
    return res.status(401).json({ approved: false, message: 'Invalid Manager PIN' });
  } catch (err: any) {
    console.error('validateManagerPin error:', err);
    return res.status(500).json({ message: 'Internal server error validating PIN' });
  }
}
