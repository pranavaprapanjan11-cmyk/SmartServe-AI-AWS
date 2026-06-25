import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import * as crmService from './crm.service';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createReservationSchema,
  updateReservationStatusSchema,
  createWaitlistEntrySchema,
  updateWaitlistStatusSchema,
} from './crm.validation';

// --- Customers ---

export async function listCustomers(req: RequestWithUser, res: Response) {
  try {
    const customers = await crmService.listCustomers(req.user!.id, req.user!.role);
    return res.json(customers);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createCustomer(req: RequestWithUser, res: Response) {
  try {
    const { value: validated, error } = createCustomerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details });
    const customer = await crmService.createCustomer(req.user!.id, req.user!.role, validated);
    return res.status(201).json(customer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateCustomer(req: RequestWithUser, res: Response) {
  try {
    const { value: validated, error } = updateCustomerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details });
    const customer = await crmService.updateCustomer(req.user!.id, req.user!.role, (req.params as { id: string }).id, validated);
    return res.json(customer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// --- Reservations ---

export async function listReservations(req: RequestWithUser, res: Response) {
  try {
    const reservations = await crmService.listReservations(req.user!.id, req.user!.role);
    return res.json(reservations);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createReservation(req: RequestWithUser, res: Response) {
  try {
    const { value: validated, error } = createReservationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details });
    const reservation = await crmService.createReservation(req.user!.id, req.user!.role, validated);
    return res.status(201).json(reservation);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateReservationStatus(req: RequestWithUser, res: Response) {
  try {
    const { value: validated, error } = updateReservationStatusSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details });
    const reservation = await crmService.updateReservationStatus(req.user!.id, req.user!.role, (req.params as { id: string }).id, validated);
    return res.json(reservation);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateReservation(req: RequestWithUser, res: Response) {
  try {
    const reservation = await crmService.updateReservation(req.user!.id, req.user!.role, (req.params as { id: string }).id, req.body);
    return res.json(reservation);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// --- Waitlist ---

export async function listWaitlist(req: RequestWithUser, res: Response) {
  try {
    const entries = await crmService.listWaitlist(req.user!.id, req.user!.role);
    return res.json(entries);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createWaitlistEntry(req: RequestWithUser, res: Response) {
  try {
    const { value: validated, error } = createWaitlistEntrySchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details });
    const entry = await crmService.createWaitlistEntry(req.user!.id, req.user!.role, validated);
    return res.status(201).json(entry);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateWaitlistStatus(req: RequestWithUser, res: Response) {
  try {
    const { value: validated, error } = updateWaitlistStatusSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details });
    const entry = await crmService.updateWaitlistStatus(req.user!.id, req.user!.role, (req.params as { id: string }).id, validated);
    return res.json(entry);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// --- Metrics ---

export async function getDashboardMetrics(req: RequestWithUser, res: Response) {
  try {
    const metrics = await crmService.getCRMDashboardMetrics(req.user!.id, req.user!.role);
    return res.json(metrics);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
