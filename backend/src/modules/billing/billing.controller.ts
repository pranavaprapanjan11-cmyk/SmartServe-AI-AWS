// File: backend/src/modules/billing/billing.controller.ts

import { Response } from 'express';
import { RequestWithUser } from '../auth/auth.types';
import {
  createInvoice,
  getBillingMetrics,
  getInvoiceById,
  getInvoiceByOrderId,
  listBillableOrders,
  listInvoices,
  listPayments,
  recordPayment,
  refundInvoice,
} from './billing.service';
import { PaymentMethodType, PaymentStatus } from './billing.types';
import { getRestaurantSettings } from '../settings/settings.service';

export async function fetchBillableOrders(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const orders = await listBillableOrders(req.user.id, req.user.role);
    return res.json(orders);
  } catch (err: any) {
    console.error('fetchBillableOrders error:', err);
    return res.status(500).json({ message: 'Failed to fetch billable orders' });
  }
}

export async function issueInvoice(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { order_id, tax_percent, discount_amount } = req.body as { order_id: string; tax_percent: number; discount_amount: number };
    const restaurantSettings = await getRestaurantSettings(req.user.id, req.user.role);
    const invoice = await createInvoice(req.user.id, req.user.role, {
      order_id,
      tax_percent,
      discount_amount,
    }, restaurantSettings?.gst_number || undefined);
    return res.status(201).json(invoice);
  } catch (err: any) {
    console.error('issueInvoice error:', err);
    if (err.message.includes('Invoice already exists')) {
      return res.status(409).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to issue invoice' });
  }
}

export async function fetchInvoice(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { invoiceId } = req.params as { invoiceId: string };
    const invoice = await getInvoiceById(req.user.id, req.user.role, invoiceId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    return res.json(invoice);
  } catch (err: any) {
    console.error('fetchInvoice error:', err);
    return res.status(500).json({ message: 'Failed to fetch invoice' });
  }
}

export async function fetchInvoiceByOrder(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { orderId } = req.params as { orderId: string };
    const invoice = await getInvoiceByOrderId(req.user.id, req.user.role, orderId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    return res.json(invoice);
  } catch (err: any) {
    console.error('fetchInvoiceByOrder error:', err);
    return res.status(500).json({ message: 'Failed to fetch invoice by order' });
  }
}

export async function submitPayment(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { invoice_id, amount, payment_method, status, transaction_reference, customer_phone, customer_name } = req.body as { invoice_id: string; amount: number; payment_method: string; status: string; transaction_reference?: string; customer_phone?: string; customer_name?: string };
    const payment = await recordPayment(
      req.user.id,
      req.user.role,
      invoice_id,
      amount,
      payment_method as PaymentMethodType,
      status as PaymentStatus,
      transaction_reference,
      customer_phone,
      customer_name
    );
    return res.status(201).json(payment);
  } catch (err: any) {
    console.error('submitPayment error:', err);
    return res.status(500).json({ message: 'Failed to submit payment' });
  }
}

export async function fetchBillingMetrics(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const metrics = await getBillingMetrics(req.user.id, req.user.role);
    return res.json(metrics);
  } catch (err: any) {
    console.error('fetchBillingMetrics error:', err);
    return res.status(500).json({ message: 'Failed to fetch billing metrics' });
  }
}

export async function fetchInvoices(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const invoices = await listInvoices(req.user.id, req.user.role);
    return res.json(invoices);
  } catch (err: any) {
    console.error('fetchInvoices error:', err);
    return res.status(500).json({ message: 'Failed to fetch invoices' });
  }
}

export async function fetchPayments(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const payments = await listPayments(req.user.id, req.user.role);
    return res.json(payments);
  } catch (err: any) {
    console.error('fetchPayments error:', err);
    return res.status(500).json({ message: 'Failed to fetch payments' });
  }
}

export async function refundInvoiceController(req: RequestWithUser, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { invoiceId } = req.params as { invoiceId: string };
    const result = await refundInvoice(req.user.id, req.user.role, invoiceId);
    return res.json(result);
  } catch (err: any) {
    console.error('refundInvoiceController error:', err);
    return res.status(500).json({ message: err.message || 'Failed to refund invoice' });
  }
}

