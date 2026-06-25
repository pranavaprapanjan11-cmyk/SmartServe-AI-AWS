import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { MenuItemRecipeLine, CreateInventoryItemPayload, UpdateInventoryItemPayload } from './inventory.types';

const createInventoryItemSchema = Joi.object<CreateInventoryItemPayload>({
  name: Joi.string().min(2).max(150).required(),
  description: Joi.string().max(500).optional().allow('', null),
  unit: Joi.string().max(50).required(),
  quantity_on_hand: Joi.number().min(0).required(),
  reorder_threshold: Joi.number().min(0).required(),
  expiry_date: Joi.string().isoDate().optional().allow('', null),
  batch_number: Joi.string().max(100).optional().allow('', null),
  category_id: Joi.string().uuid({ version: 'uuidv4' }).optional().allow('', null),
  supplier_id: Joi.string().uuid({ version: 'uuidv4' }).optional().allow('', null),
  is_active: Joi.boolean().optional(),
});

const updateInventoryItemSchema = Joi.object<UpdateInventoryItemPayload>({
  name: Joi.string().min(2).max(150).optional(),
  description: Joi.string().max(500).optional().allow('', null),
  unit: Joi.string().max(50).optional(),
  quantity_on_hand: Joi.number().min(0).optional(),
  reorder_threshold: Joi.number().min(0).optional(),
  expiry_date: Joi.string().isoDate().optional().allow('', null),
  batch_number: Joi.string().max(100).optional().allow('', null),
  category_id: Joi.string().uuid({ version: 'uuidv4' }).optional().allow('', null),
  supplier_id: Joi.string().uuid({ version: 'uuidv4' }).optional().allow('', null),
  is_active: Joi.boolean().optional(),
}).min(1);

const recipeLineSchema = Joi.object<MenuItemRecipeLine>({
  inventory_item_id: Joi.string().uuid({ version: 'uuidv4' }).required(),
  quantity_required: Joi.number().positive().required(),
});

const saveRecipeSchema = Joi.object({
  recipe: Joi.array().items(recipeLineSchema).min(0).required(), // Allow empty recipe to clear ingredients
});

function validate<T>(schema: Joi.ObjectSchema<T>) {
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

export const validateCreateInventoryItem = validate(createInventoryItemSchema);
export const validateUpdateInventoryItem = validate(updateInventoryItemSchema);
export const validateSaveRecipeForMenuItem = validate(saveRecipeSchema);
