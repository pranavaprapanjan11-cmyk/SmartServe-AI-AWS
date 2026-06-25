// File: backend/src/modules/menu/menu.validation.ts
// Input validation schemas using Joi for menu operations

import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { DietaryInfo, SpiceLevel } from './menu.types';

const createMenuItemSchema = Joi.object({
  category_id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  name: Joi.string().min(3).max(150).required(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().positive().required(),
  image_url: Joi.string().uri().optional().allow(''),
  is_available: Joi.boolean().default(true),
  is_bestseller: Joi.boolean().default(false),
  preparation_time: Joi.number().min(0).max(120).optional(),
  spice_level: Joi.number().min(0).max(4).optional(),
  dietary_info: Joi.string()
    .valid(...Object.values(DietaryInfo))
    .optional(),
  calories: Joi.number().min(0).optional(),
  tags: Joi.string().max(200).optional(),
});

const updateMenuItemSchema = Joi.object({
  category_id: Joi.string().uuid({ version: 'uuidv4' }).optional(),
  name: Joi.string().min(3).max(150).optional(),
  description: Joi.string().max(500).optional(),
  price: Joi.number().positive().optional(),
  image_url: Joi.string().uri().optional().allow(''),
  is_available: Joi.boolean().optional(),
  is_bestseller: Joi.boolean().optional(),
  preparation_time: Joi.number().min(0).max(120).optional(),
  spice_level: Joi.number().min(0).max(4).optional(),
  dietary_info: Joi.string()
    .valid(...Object.values(DietaryInfo))
    .optional(),
  calories: Joi.number().min(0).optional(),
  tags: Joi.string().max(200).optional(),
}).min(1);

const createMenuCategorySchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(300).optional(),
  color_code: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  icon_emoji: Joi.string().max(10).optional(),
  display_order: Joi.number().integer().min(0).optional(),
});

const toggleAvailabilitySchema = Joi.object({
  is_available: Joi.boolean().required(),
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

export const validateCreateMenuItem = validate(createMenuItemSchema);
export const validateUpdateMenuItem = validate(updateMenuItemSchema);
export const validateCreateMenuCategory = validate(createMenuCategorySchema);
export const validateToggleAvailability = validate(toggleAvailabilitySchema);
