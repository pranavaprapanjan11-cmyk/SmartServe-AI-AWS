import { Request, Response } from 'express';
import { Pool } from 'pg';
import { AuthRequest } from '../auth/rbac.middleware';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function generateUniqueWorkspaceCode(dbPool: Pool, workspaceName: string): Promise<string> {
  const base = workspaceName.replace(/[^A-Z]/gi, '').substring(0, 5).toUpperCase() || 'REST';
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

// GET /api/workspace/current
export async function getCurrentWorkspace(req: AuthRequest, res: Response) {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace associated with this user session.' });
    }

    const { rows } = await pool.query(
      `SELECT w.id, w.workspace_code, w.workspace_name, w.owner_id, w.created_at,
              o.name as owner_name,
              (SELECT COUNT(*) FROM employees WHERE workspace_id = w.id) as total_employees,
              (SELECT COUNT(*) FROM users WHERE workspace_id = w.id) as total_active_users
       FROM workspaces w
       LEFT JOIN users o ON w.owner_id = o.id
       WHERE w.id = $1 LIMIT 1`,
      [workspaceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    return res.json(rows[0]);
  } catch (error: any) {
    console.error('getCurrentWorkspace error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/workspace/members
export async function getWorkspaceMembers(req: AuthRequest, res: Response) {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace associated with this user session.' });
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role,
              COALESCE((SELECT status FROM employees WHERE email = u.email AND workspace_id = u.workspace_id LIMIT 1), 'ACTIVE') as status
       FROM users u
       WHERE u.workspace_id = $1
       ORDER BY u.name ASC`,
      [workspaceId]
    );

    return res.json(rows);
  } catch (error: any) {
    console.error('getWorkspaceMembers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/workspace/regenerate-code
export async function regenerateWorkspaceCode(req: AuthRequest, res: Response) {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace associated with this user session.' });
    }

    // Verify current user is owner
    const wsRes = await pool.query(
      'SELECT owner_id, workspace_name FROM workspaces WHERE id = $1 LIMIT 1',
      [workspaceId]
    );
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    const workspace = wsRes.rows[0];
    if (workspace.owner_id !== req.user?.id) {
      return res.status(403).json({ error: 'Only the restaurant owner can regenerate the workspace code.' });
    }

    const newCode = await generateUniqueWorkspaceCode(pool, workspace.workspace_name);

    await pool.query(
      'UPDATE workspaces SET workspace_code = $1 WHERE id = $2',
      [newCode, workspaceId]
    );

    return res.json({ workspace_code: newCode });
  } catch (error: any) {
    console.error('regenerateWorkspaceCode error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/workspace/invite
export async function generateInviteLink(req: AuthRequest, res: Response) {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace associated with this user.' });
    }

    let code = req.body.workspaceCode;
    if (!code) {
      const wsRes = await pool.query('SELECT workspace_code FROM workspaces WHERE id = $1 LIMIT 1', [workspaceId]);
      if (wsRes.rows.length > 0) {
        code = wsRes.rows[0].workspace_code;
      }
    }

    if (!code) {
      return res.status(404).json({ error: 'Workspace code not found.' });
    }

    const origin = req.headers.origin || 'https://smartserve-ai-restaurant-management.vercel.app';
    const inviteLink = `${origin}/auth/register?workspace=${code}`;

    return res.json({ inviteLink, workspace_code: code });
  } catch (error: any) {
    console.error('generateInviteLink error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/workspace/by-code/:code
export async function getWorkspaceByCode(req: Request, res: Response) {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ error: 'Workspace code parameter is required.' });
    }

    const { rows } = await pool.query(
      `SELECT w.id, w.workspace_name, o.name as owner_name
       FROM workspaces w
       LEFT JOIN users o ON w.owner_id = o.id
       WHERE UPPER(w.workspace_code) = $1 LIMIT 1`,
      [code.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    return res.json(rows[0]);
  } catch (error: any) {
    console.error('getWorkspaceByCode error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/workspace/members/:memberId/role
export async function updateMemberRole(req: AuthRequest, res: Response) {
  try {
    const workspaceId = req.user?.workspaceId;
    const { memberId } = req.params;
    const { role } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace associated with this user.' });
    }

    if (!role) {
      return res.status(400).json({ error: 'Role is required.' });
    }

    // Perform role update
    const { rowCount } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 AND workspace_id = $3',
      [role, memberId, workspaceId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Member not found in your workspace.' });
    }

    // Also try updating role in employees table if it exists
    await pool.query(
      'UPDATE employees SET role = $1 WHERE email = (SELECT email FROM users WHERE id = $2) AND workspace_id = $3',
      [role, memberId, workspaceId]
    );

    return res.json({ success: true, message: 'Role updated successfully.' });
  } catch (error: any) {
    console.error('updateMemberRole error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/workspace/members/:memberId/deactivate
export async function deactivateMember(req: AuthRequest, res: Response) {
  try {
    const workspaceId = req.user?.workspaceId;
    const { memberId } = req.params;
    const { status } = req.body; // 'ACTIVE', 'INACTIVE' or 'TERMINATED'

    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace associated with this user.' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    // Get user details
    const userRes = await pool.query(
      'SELECT name, email, role FROM users WHERE id = $1 AND workspace_id = $2 LIMIT 1',
      [memberId, workspaceId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found in your workspace.' });
    }

    const member = userRes.rows[0];

    // Check if employee record exists
    const empRes = await pool.query(
      'SELECT id FROM employees WHERE email = $1 AND workspace_id = $2 LIMIT 1',
      [member.email, workspaceId]
    );

    if (empRes.rows.length > 0) {
      await pool.query(
        'UPDATE employees SET status = $1 WHERE id = $2',
        [status, empRes.rows[0].id]
      );
    } else {
      // Create new inactive employee record
      await pool.query(
        `INSERT INTO employees (name, email, role, status, workspace_id, restaurant_id, hire_date)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [member.name, member.email, member.role, status, workspaceId, req.user?.restaurantId || req.user?.id]
      );
    }

    return res.json({ success: true, message: `Member status updated to ${status}.` });
  } catch (error: any) {
    console.error('deactivateMember error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
