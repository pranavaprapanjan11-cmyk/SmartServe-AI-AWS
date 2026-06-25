// File: backend/src/modules/tables/tables.validation.ts
import Joi from 'joi';
import { TableStatus } from './tables.types';

export const createTableSchema = Joi.object({
  table_number: Joi.number().integer().min(1).required(),
  capacity: Joi.number().integer().min(1).required(),
  section: Joi.string().max(50).optional(),
  shape: Joi.string().valid('rectangle', 'round', 'square').optional(),
  position_x: Joi.number().integer().min(0).optional(),
  position_y: Joi.number().integer().min(0).optional(),
});

export const updateTableSchema = Joi.object({
  capacity: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid(...Object.values(TableStatus)).optional(),
  current_order_id: Joi.string().uuid().allow(null).optional(),
  section: Joi.string().max(50).optional(),
  shape: Joi.string().valid('rectangle', 'round', 'square').optional(),
  position_x: Joi.number().integer().min(0).optional(),
  position_y: Joi.number().integer().min(0).optional(),
});

export const reservationSchema = Joi.object({
  reserved_for: Joi.string().max(100).required(),
  reserved_phone: Joi.string().max(20).required(),
  reservation_time: Joi.date().iso().required(),
});
