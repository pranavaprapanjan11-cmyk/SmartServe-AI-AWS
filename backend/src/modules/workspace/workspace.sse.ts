import { Response } from 'express';

interface SSEClient {
  id: string;
  workspaceId: string;
  res: Response;
}

const clients: SSEClient[] = [];

/**
 * Handles incoming Server-Sent Events client connections.
 * Auth is performed using a token passed via query parameters.
 */
export async function sseHandler(req: any, res: Response) {
  const token = req.query.token as string;
  if (!token) {
    res.status(401).json({ message: 'Token is required' });
    return;
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'please-set-a-secure-secret') as any;
    let workspaceId = decoded.workspaceId;

    if (!workspaceId && decoded.sub) {
      const { Pool } = require('pg');
      const tempPool = new Pool({ connectionString: process.env.DATABASE_URL });
      const { rows } = await tempPool.query('SELECT workspace_id FROM users WHERE id = $1 LIMIT 1', [decoded.sub]);
      await tempPool.end();
      if (rows.length > 0 && rows[0].workspace_id) {
        workspaceId = rows[0].workspace_id;
      }
    }

    if (!workspaceId) {
      res.status(400).json({ message: 'User does not belong to a workspace' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering on Nginx if any
    });

    const clientId = Math.random().toString(36).substring(2);
    clients.push({ id: clientId, workspaceId, res });

    console.log(`[SSE CONNECTED]\n${decoded.sub || 'unknown'}\n${decoded.role || 'unknown'}\n${workspaceId}`);

    // Send initial verification event
    res.write(`data: ${JSON.stringify({ type: 'connected', workspaceId })}\n\n`);

    // Keep alive heartbeat ping every 25 seconds
    const heartbeat = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      const index = clients.findIndex((c) => c.id === clientId);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/**
 * Broadcasts an update event to all connected clients in a specific workspace.
 */
export function notifyWorkspace(workspaceId: string, eventType: string, data?: any) {
  if (!workspaceId) return;
  const payload = JSON.stringify({ type: eventType, data: data || {} });
  let count = 0;
  clients.forEach((client) => {
    if (client.workspaceId === workspaceId) {
      count++;
      try {
        client.res.write(`data: ${payload}\n\n`);
      } catch (err) {
        console.error('SSE write failed for client', client.id, err);
      }
    }
  });
  if (eventType === 'order_created') {
    console.log(`[SSE BROADCAST]\nevent=order_created\n${workspaceId}\n${count}`);
  }
}

/**
 * Resolves workspace ID from restaurant_id and notifies.
 */
export async function notifyWorkspaceByRestaurantId(restaurantId: string, eventType: string, data?: any) {
  if (!restaurantId) return;
  try {
    const { Pool } = require('pg');
    const tempPool = new Pool({ connectionString: process.env.DATABASE_URL });
    const { rows } = await tempPool.query('SELECT workspace_id FROM users WHERE id = $1 LIMIT 1', [restaurantId]);
    
    let workspaceId = rows.length > 0 ? rows[0].workspace_id : null;
    if (!workspaceId) {
      const { rows: workspaceRows } = await tempPool.query('SELECT id FROM workspaces WHERE owner_id = $1 LIMIT 1', [restaurantId]);
      if (workspaceRows.length > 0) {
        workspaceId = workspaceRows[0].id;
      }
    }
    
    await tempPool.end();
    if (workspaceId) {
      notifyWorkspace(workspaceId, eventType, data);
    }
  } catch (err) {
    console.error('Failed to notify workspace by restaurant ID', restaurantId, err);
  }
}
