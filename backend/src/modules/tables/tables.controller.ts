// File: backend/src/modules/tables/tables.controller.ts
import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import * as tablesService from './tables.service';
import * as validation from './tables.validation';

export async function getTables(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const tables = await tablesService.listTables(userId, role);
    return res.json(tables);
  } catch (err: any) {
    console.error('getTables error:', err);
    return res.status(500).json({ message: 'Failed to fetch tables' });
  }
}

export async function createTable(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { error, value } = validation.createTableSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const table = await tablesService.createTable(userId, role, value);
    return res.status(201).json(table);
  } catch (err: any) {
    console.error('createTable error:', err);
    return res.status(500).json({ message: 'Failed to create table' });
  }
}

export async function updateTable(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { error, value } = validation.updateTableSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const table = await tablesService.updateTable(userId, role, id, value);
    return res.json(table);
  } catch (err: any) {
    console.error('updateTable error:', err);
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to update table' });
  }
}

export async function deleteTable(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await tablesService.deleteTable(userId, role, id);
    return res.json({ message: 'Table deleted successfully' });
  } catch (err: any) {
    console.error('deleteTable error:', err);
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to delete table' });
  }
}

export async function reserveTable(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { error, value } = validation.reservationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const table = await tablesService.createReservation(userId, role, id, value);
    return res.json(table);
  } catch (err: any) {
    console.error('reserveTable error:', err);
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to create reservation' });
  }
}

export async function editReservation(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { error, value } = validation.reservationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const table = await tablesService.modifyReservation(userId, role, id, value);
    return res.json(table);
  } catch (err: any) {
    console.error('editReservation error:', err);
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to modify reservation' });
  }
}

export async function cancelReservation(req: RequestWithUser, res: Response) {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params as { id: string };
    if (!userId || !role) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const table = await tablesService.cancelReservation(userId, role, id);
    return res.json(table);
  } catch (err: any) {
    console.error('cancelReservation error:', err);
    if (err.message.includes('not found') || err.message.includes('unauthorized')) {
      return res.status(404).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to cancel reservation' });
  }
}
