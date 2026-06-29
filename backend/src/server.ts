// File: backend/src/server.ts
// Express server that mounts all module routes

import 'dotenv/config';
import { pool } from './database';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRouter from './modules/auth/auth.routes';
import menuRouter from './modules/menu/menu.routes';
import ordersRouter from './modules/orders/orders.routes';
import kitchenRouter from './modules/kitchen/kitchen.routes';
import billingRouter from './modules/billing/billing.routes';
import settingsRouter from './modules/settings/settings.routes';
import inventoryRouter from './modules/inventory/inventory.routes';
import analyticsRouter from './modules/analytics/analytics.routes';
import aiRouter from './modules/ai/ai.routes';
import ocrRouter from './modules/ocr/ocr.routes';
import assistantRouter from './modules/assistant/assistant.routes';
import employeesRouter from './modules/employees/employees.controller';
import tablesRouter from './modules/tables/tables.routes';
import aiOperationsRouter from './modules/ai-operations/aiOperations.routes';
import crmRouter from './modules/crm/crm.routes';
import workspaceRouter from './modules/workspace/workspace.routes';

const app = express();
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://smartserve-ai-aws-five.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use('/api/uploads', express.static(path.join(process.cwd(), 'backend', 'uploads')));

// Mount auth routes
app.use('/api/auth', authRouter);

// Mount menu routes
app.use('/api/menu', menuRouter);

// Mount orders routes
app.use('/api/orders', ordersRouter);

// Mount kitchen routes
app.use('/api/kitchen', kitchenRouter);

// Mount billing routes
app.use('/api/billing', billingRouter);

// Mount inventory routes
app.use('/api/inventory', inventoryRouter);

// Mount analytics routes
app.use('/api/analytics', analyticsRouter);

// Mount AI intelligence routes
app.use('/api/ai', aiRouter);

// Mount OCR routes
app.use('/api/ocr', ocrRouter);

// Mount Assistant routes
app.use('/api/assistant', assistantRouter);

// Mount employees routes
app.use('/api/restaurants', employeesRouter);

// Mount settings routes
app.use('/api/settings', settingsRouter);

// Mount tables routes
app.use('/api/tables', tablesRouter);

// Mount AI operations routes
app.use('/api/ai-operations', aiOperationsRouter);

// Mount CRM routes
app.use('/api/crm', crmRouter);

// Mount Workspace routes
app.use('/api/workspace', workspaceRouter);

import { sseHandler } from './modules/workspace/workspace.sse';

let isGeminiConnected = false;

// Health check
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'failed';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'failed';
  }

  res.json({
    database: dbStatus,
    gemini: isGeminiConnected ? 'connected' : 'failed',
    server: 'running'
  });
});

// Aurora DB test verification endpoint
app.get('/api/db-test', async (_req, res) => {
  try {
    const timeRes = await pool.query('SELECT NOW()');
    const dbRes = await pool.query('SELECT current_database()');
    const userRes = await pool.query('SELECT current_user');
    res.json({
      status: "connected",
      database: "aurora",
      dbName: dbRes.rows[0]?.current_database || "unknown",
      user: userRes.rows[0]?.current_user || "unknown",
      timestamp: timeRes.rows[0]?.now || new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: "failed",
      error: error.message
    });
  }
});

// Workspace updates endpoint
app.get('/api/workspace/updates', sseHandler);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, async () => {
  console.log(`Backend server listening on port ${PORT}`);
  try {
    const { runStartupTest } = require('./services/gemini.service');
    isGeminiConnected = await runStartupTest();
  } catch (err) {
    console.error('Failed to trigger Gemini startup test:', err);
  }
});
