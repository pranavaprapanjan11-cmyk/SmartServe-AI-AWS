// File: backend/src/modules/auth/auth.validation.ts
// Input validation using Joi for register and login payloads

import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { Role } from './auth.types';

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string()
    .valid(...Object.values(Role))
    .required(),
  workspaceName: Joi.string().allow('', null).optional(),
  restaurantName: Joi.string().allow('', null).optional(),
  workspaceCode: Joi.string().allow('', null).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ errors: error.details.map((d) => d.message) });
    }
    req.body = value as any;
    next();
  };
}

export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
