// File: backend/src/modules/settings/settings.service.ts

import { Pool } from 'pg';
import { getRestaurantId } from '../orders/orders.service';
import {
  PrinterSettingsPayload,
  PrinterSettingsRecord,
  RestaurantSettingsPayload,
  RestaurantSettingsRecord,
} from './settings.types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function getRestaurantSettings(userId: string, role: string): Promise<RestaurantSettingsRecord | null> {
  const restaurantId = await getRestaurantId(userId, role);

  const { rows } = await pool.query(
    `SELECT * FROM restaurant_settings WHERE restaurant_id = $1 LIMIT 1`,
    [restaurantId]
  );

  return rows[0] || null;
}

export async function upsertRestaurantSettings(
  userId: string,
  role: string,
  payload: RestaurantSettingsPayload
): Promise<RestaurantSettingsRecord> {
  const restaurantId = await getRestaurantId(userId, role);

  const existing = await getRestaurantSettings(userId, role);
  if (existing) {
    const { rows } = await pool.query(
      `UPDATE restaurant_settings
       SET restaurant_name = $1,
           logo_url = $2,
           theme = $3,
           compact_mode = $4,
           high_contrast = $5,
           animations_enabled = $6,
           address = $7,
           contact_number = $8,
           gst_number = $9,
           updated_at = NOW()
       WHERE restaurant_id = $10
       RETURNING *`,
      [
        payload.restaurant_name,
        payload.logo_url,
        payload.theme || null,
        payload.compact_mode || false,
        payload.high_contrast || false,
        payload.animations_enabled !== undefined ? payload.animations_enabled : true,
        payload.address,
        payload.contact_number,
        payload.gst_number,
        restaurantId,
      ]
    );
    return rows[0];
  }

  const { rows } = await pool.query(
    `INSERT INTO restaurant_settings
      (restaurant_id, restaurant_name, logo_url, theme, compact_mode, high_contrast, animations_enabled, address, contact_number, gst_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
    [
      restaurantId,
      payload.restaurant_name,
      payload.logo_url,
      payload.theme || null,
      payload.compact_mode || false,
      payload.high_contrast || false,
      payload.animations_enabled !== undefined ? payload.animations_enabled : true,
      payload.address,
      payload.contact_number,
      payload.gst_number,
    ]
  );
  return rows[0];
}

export async function getPrinterSettings(userId: string, role: string): Promise<PrinterSettingsRecord[]> {
  const restaurantId = await getRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM printer_settings WHERE restaurant_id = $1 ORDER BY is_default DESC, created_at ASC`,
    [restaurantId]
  );
  return rows;
}

export async function updatePrinterSettings(
  userId: string,
  role: string,
  printerId: string,
  payload: PrinterSettingsPayload
): Promise<PrinterSettingsRecord> {
  const restaurantId = await getRestaurantId(userId, role);
  const { rows } = await pool.query(
    `UPDATE printer_settings
       SET printer_name = $1,
           connection_type = $2,
           paper_width = $3,
           is_default = $4,
           status = $5,
           last_tested_at = $6,
           updated_at = NOW()
       WHERE id = $7 AND restaurant_id = $8
       RETURNING *`,
    [
      payload.printer_name,
      payload.connection_type,
      payload.paper_width,
      payload.is_default,
      payload.status,
      payload.last_tested_at || null,
      printerId,
      restaurantId,
    ]
  );

  if (payload.is_default) {
    await pool.query(
      `UPDATE printer_settings SET is_default = false WHERE restaurant_id = $1 AND id <> $2`,
      [restaurantId, printerId]
    );
  }

  if (!rows[0]) {
    throw new Error('Printer setting not found');
  }

  return rows[0];
}

export async function createPrinterSettings(
  userId: string,
  role: string,
  payload: PrinterSettingsPayload
): Promise<PrinterSettingsRecord> {
  const restaurantId = await getRestaurantId(userId, role);
  if (payload.is_default) {
    await pool.query(
      `UPDATE printer_settings SET is_default = false WHERE restaurant_id = $1`,
      [restaurantId]
    );
  }

  const { rows } = await pool.query(
    `INSERT INTO printer_settings
      (restaurant_id, printer_name, connection_type, paper_width, is_default, status, last_tested_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
    [
      restaurantId,
      payload.printer_name,
      payload.connection_type,
      payload.paper_width,
      payload.is_default,
      payload.status,
      payload.last_tested_at || null,
    ]
  );

  return rows[0];
}
