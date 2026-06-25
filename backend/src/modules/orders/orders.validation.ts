// File: backend/src/modules/orders/orders.validation.ts
// Input validation schemas using Joi for order operations

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { OrderStatus } from './orders.types';

const orderItemSchema = Joi.object({
  menu_item_id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  quantity: Joi.number().integer().positive().required(),
});

const createOrderSchema = Joi.object({
  table_number: Joi.number().integer().min(1).max(100).required(),
  guest_count: Joi.number().integer().min(1).max(50).optional().default(1),
  items: Joi.array().items(orderItemSchema).min(1).required(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(OrderStatus)).required(),
});

function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }
    req.body = value as any;
    next();
  };
}

export const validateCreateOrder = validate(createOrderSchema);
export const validateUpdateOrderStatus = validate(updateOrderStatusSchema);
