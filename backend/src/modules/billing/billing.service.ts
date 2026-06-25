// File: backend/src/modules/billing/billing.service.ts

import { Pool } from 'pg';
import { getRestaurantId } from '../orders/orders.service';
import { OrderStatus } from '../orders/orders.types';
import {
  BillingMetrics,
  CreateInvoicePayload,
  InvoiceRecord,
  PaymentMethodType,
  PaymentRecord,
  PaymentStatus,
} from './billing.types';
import { logEvent } from '../ai-operations/aiOperations.service';
import { OperationalEventType } from '../ai-operations/aiOperations.types';
import { recordCustomerVisit } from '../crm/crm.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function formatInvoiceNumber(date: Date, seq: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `INV-${y}${m}${d}-${String(seq).padStart(4, '0')}`;
}

export async function listBillableOrders(userId: string, role: string): Promise<any[]> {
  const restaurantId = await getRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT
        o.id,
        o.restaurant_id,
        o.waiter_id,
        o.table_number,
        o.guest_count,
        o.status,
        o.total_amount,
        o.created_at,
        o.updated_at,
        u.name as waiter_name,
        EXISTS(SELECT 1 FROM invoices i WHERE i.order_id = o.id) as invoice_exists,
        COALESCE(json_agg(json_build_object(
          'id', oi.id,
          'menu_item_id', oi.menu_item_id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'subtotal', oi.subtotal,
          'name', mi.name
        )) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN menu_items mi ON mi.id = oi.menu_item_id
     LEFT JOIN users u ON u.id = o.waiter_id
     WHERE o.restaurant_id = $1 AND o.status IN ($2, $3)
     GROUP BY o.id, u.name
     ORDER BY o.created_at DESC`,
    [restaurantId, OrderStatus.SERVED, OrderStatus.READY]
  );
  return rows.map((r: any) => ({
    ...r,
    total_amount: parseFloat(r.total_amount),
    invoice_exists: r.invoice_exists,
    items: r.items.map((item: any) => ({
      ...item,
      unit_price: parseFloat(item.unit_price),
      subtotal: parseFloat(item.subtotal),
    })),
  }));
}

export async function createInvoice(
  userId: string,
  role: string,
  payload: CreateInvoicePayload,
  gstNumber?: string
): Promise<InvoiceRecord> {
  const restaurantId = await getRestaurantId(userId, role);

  const taxPercent = payload.tax_percent ?? 0;
  const discountAmountInput = payload.discount_amount ?? 0;

  const { rows: existingInvoiceRows } = await pool.query(
    `SELECT id FROM invoices WHERE order_id = $1 LIMIT 1`,
    [payload.order_id]
  );
  if (existingInvoiceRows.length > 0) {
    throw new Error('Invoice already exists for this order');
  }

  const { rows: orderRows } = await pool.query(
    `SELECT total_amount, restaurant_id, status FROM orders WHERE id = $1 AND restaurant_id = $2 LIMIT 1`,
    [payload.order_id, restaurantId]
  );
  if (orderRows.length === 0) {
    throw new Error('Order not found');
  }

  const orderStatus = orderRows[0].status;
  if (![OrderStatus.READY, OrderStatus.SERVED].includes(orderStatus)) {
    throw new Error('Invoice can only be created for orders that are ready or served');
  }

  const subtotal = parseFloat(orderRows[0].total_amount);
  const taxAmount = parseFloat(((subtotal * taxPercent) / 100).toFixed(2));
  const discountAmount = parseFloat(discountAmountInput.toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount - discountAmount).toFixed(2));

  const { rows: seqRows } = await pool.query(
    `SELECT COUNT(*) as count FROM invoices WHERE issue_date::date = CURRENT_DATE AND restaurant_id = $1`,
    [restaurantId]
  );
  const seq = Number(seqRows[0]?.count || 0) + 1;
  const invoiceNumber = formatInvoiceNumber(new Date(), seq);

  const { rows: createdRows } = await pool.query(
    `INSERT INTO invoices
      (restaurant_id, order_id, invoice_number, issue_date, subtotal, tax_amount, discount_amount, total_amount, gst_number, status)
      VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9)
      RETURNING *`,
    [
      restaurantId,
      payload.order_id,
      invoiceNumber,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      gstNumber || null,
      'UNPAID',
    ]
  );

  const invoiceRecord = createdRows[0];
  try {
    await logEvent(restaurantId, OperationalEventType.INVOICE_GENERATED, `Invoice ${invoiceNumber} generated for Order #${payload.order_id.substring(0,8)} (Total: ₹${totalAmount})`, {
      invoiceId: invoiceRecord.id,
      orderId: payload.order_id,
      invoiceNumber,
      totalAmount
    });
  } catch (e) {
    console.error('Failed to log INVOICE_GENERATED event:', e);
  }

  return {
    ...invoiceRecord,
    subtotal: parseFloat(invoiceRecord.subtotal),
    tax_amount: parseFloat(invoiceRecord.tax_amount),
    discount_amount: parseFloat(invoiceRecord.discount_amount),
    total_amount: parseFloat(invoiceRecord.total_amount),
  };
}

export async function getInvoiceByOrderId(userId: string, role: string, orderId: string): Promise<InvoiceRecord | null> {
  const restaurantId = await getRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM invoices WHERE order_id = $1 AND restaurant_id = $2 LIMIT 1`,
    [orderId, restaurantId]
  );
  return rows[0] || null;
}

export async function recordPayment(
  userId: string,
  role: string,
  invoiceId: string,
  amount: number,
  paymentMethod: PaymentMethodType,
  status: PaymentStatus,
  transactionReference?: string,
  customerPhone?: string,
  customerName?: string
): Promise<PaymentRecord> {
  const restaurantId = await getRestaurantId(userId, role);

  const { rows: invoiceRows } = await pool.query(
    `SELECT * FROM invoices WHERE id = $1 AND restaurant_id = $2 LIMIT 1`,
    [invoiceId, restaurantId]
  );
  if (invoiceRows.length === 0) {
    throw new Error('Invoice not found');
  }
  const invoice = invoiceRows[0];

  const { rows: paymentRows } = await pool.query(
    `INSERT INTO payments
      (restaurant_id, order_id, invoice_id, amount, payment_method, status, transaction_reference)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
    [
      restaurantId,
      invoice.order_id,
      invoiceId,
      amount,
      paymentMethod,
      status,
      transactionReference || null,
    ]
  );

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const paidAmount = Number(amount);
  const totalPaidRows = await pool.query(
    `SELECT COALESCE(SUM(amount),0) as total_paid FROM payments WHERE invoice_id = $1`,
    [invoiceId]
  );
  const totalPaid = parseFloat(totalPaidRows.rows[0].total_paid);

  let newStatus: PaymentStatus = status;
  if (totalPaid >= parseFloat(invoice.total_amount)) {
    newStatus = 'PAID';
  } else if (totalPaid > 0) {
    newStatus = 'PARTIALLY_PAID';
  }

  await pool.query(`UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2`, [newStatus, invoiceId]);

  if (newStatus === 'PAID') {
    await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND restaurant_id = $3`,
      [OrderStatus.PAID, invoice.order_id, restaurantId]
    );
    
    // Automatically transition the table to CLEANING status and clear current_order_id
    await pool.query(
      `UPDATE restaurant_tables 
       SET status = 'CLEANING', current_order_id = NULL, updated_at = NOW() 
       WHERE (current_order_id = $1 OR id = (SELECT table_id FROM orders WHERE id = $1))
         AND restaurant_id = $2`,
      [invoice.order_id, restaurantId]
    );

    // CRM Integration
    if (customerPhone) {
      await recordCustomerVisit(restaurantId, customerPhone, customerName, totalPaid);
      
      // Link order to customer if not already linked
      const { rows: custRows } = await pool.query(`SELECT id FROM customers WHERE phone_number = $1 AND restaurant_id = $2`, [customerPhone, restaurantId]);
      if (custRows.length > 0) {
         await pool.query(`UPDATE orders SET customer_id = $1 WHERE id = $2 AND restaurant_id = $3`, [custRows[0].id, invoice.order_id, restaurantId]);
      }
    }
  }

  // Log operations events
  try {
    const paymentCountRows = await pool.query("SELECT COUNT(*) FROM payments WHERE invoice_id = $1", [invoiceId]);
    const paymentCount = parseInt(paymentCountRows.rows[0].count, 10);
    
    await logEvent(restaurantId, OperationalEventType.PAYMENT_RECEIVED, `Payment of ₹${amount.toFixed(2)} received via ${paymentMethod} for Invoice ${invoice.invoice_number}`, {
      invoiceId,
      amount,
      paymentMethod,
      paymentCount
    });

    if (paymentCount > 1) {
      await logEvent(restaurantId, OperationalEventType.SPLIT_PAYMENT, `Split payment transaction recorded for Invoice ${invoice.invoice_number}`, {
        invoiceId,
        paymentCount,
        totalPaid
      });
    }

    if (newStatus === 'PAID') {
      await logEvent(restaurantId, OperationalEventType.PAYMENT_COMPLETED, `Payment completed for Invoice ${invoice.invoice_number}`, {
        invoiceId,
        orderId: invoice.order_id,
        totalPaid
      });
      await logEvent(restaurantId, OperationalEventType.TABLE_CLEANING, `Table associated with Order #${invoice.order_id.substring(0,8)} marked as CLEANING`, {
        orderId: invoice.order_id
      });
    }
  } catch (e) {
    console.error('Failed to log payment events:', e);
  }

  return {
    ...paymentRows[0],
    amount: parseFloat(paymentRows[0].amount),
  };
}

export async function getBillingMetrics(userId: string, role: string): Promise<BillingMetrics> {
  const restaurantId = await getRestaurantId(userId, role);

  const metricsSql = `
    SELECT
      COALESCE(SUM(CASE WHEN issue_date::date = CURRENT_DATE THEN total_amount END), 0) as today_revenue,
      COALESCE(SUM(CASE WHEN issue_date >= now() - interval '7 days' THEN total_amount END), 0) as week_revenue,
      COALESCE(SUM(CASE WHEN issue_date >= date_trunc('month', now()) THEN total_amount END), 0) as month_revenue,
      COALESCE(AVG(total_amount), 0) as avg_bill,
      COALESCE(SUM(CASE WHEN status <> 'PAID' THEN total_amount END), 0) as outstanding_balance,
      COUNT(*) as total_invoices,
      COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0) as paid_invoices
    FROM invoices
    WHERE restaurant_id = $1
  `;

  const { rows } = await pool.query(metricsSql, [restaurantId]);
  const row = rows[0];

  return {
    todayRevenue: parseFloat(row.today_revenue),
    weekRevenue: parseFloat(row.week_revenue),
    monthRevenue: parseFloat(row.month_revenue),
    averageBill: parseFloat(row.avg_bill),
    outstandingBalance: parseFloat(row.outstanding_balance),
    totalInvoices: parseInt(row.total_invoices, 10),
    paidInvoices: parseInt(row.paid_invoices, 10),
  };
}

export async function getInvoiceById(userId: string, role: string, invoiceId: string): Promise<InvoiceRecord | null> {
  const restaurantId = await getRestaurantId(userId, role);
  const { rows } = await pool.query(
    `SELECT * FROM invoices WHERE id = $1 AND restaurant_id = $2 LIMIT 1`,
    [invoiceId, restaurantId]
  );
  return rows[0] || null;
}

export async function listInvoices(userId: string, role: string): Promise<InvoiceRecord[]> {
  const restaurantId = await getRestaurantId(userId, role);
  const { rows } = await pool.query(`SELECT * FROM invoices WHERE restaurant_id = $1 ORDER BY issue_date DESC`, [restaurantId]);
  return rows.map((row: any) => ({
    ...row,
    subtotal: parseFloat(row.subtotal),
    tax_amount: parseFloat(row.tax_amount),
    discount_amount: parseFloat(row.discount_amount),
    total_amount: parseFloat(row.total_amount),
  }));
}

export async function listPayments(userId: string, role: string): Promise<PaymentRecord[]> {
  const restaurantId = await getRestaurantId(userId, role);
  const { rows } = await pool.query(`SELECT * FROM payments WHERE restaurant_id = $1 ORDER BY created_at DESC`, [restaurantId]);
  return rows.map((row: any) => ({
    ...row,
    amount: parseFloat(row.amount),
  }));
}

export async function refundInvoice(userId: string, role: string, invoiceId: string): Promise<InvoiceRecord> {
  const restaurantId = await getRestaurantId(userId, role);

  const { rows: invoiceRows } = await pool.query(
    `SELECT * FROM invoices WHERE id = $1 AND restaurant_id = $2 LIMIT 1`,
    [invoiceId, restaurantId]
  );
  if (invoiceRows.length === 0) {
    throw new Error('Invoice not found');
  }
  const invoice = invoiceRows[0];
  if (invoice.status !== 'PAID' && invoice.status !== 'PARTIALLY_PAID') {
    throw new Error('Only paid or partially paid invoices can be refunded');
  }

  // Update invoice status to REFUNDED
  const { rows: updatedInvoiceRows } = await pool.query(
    `UPDATE invoices SET status = 'REFUNDED', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [invoiceId]
  );

  // Record refund payment as a negative payment
  await pool.query(
    `INSERT INTO payments
      (restaurant_id, order_id, invoice_id, amount, payment_method, status, transaction_reference)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      restaurantId,
      invoice.order_id,
      invoiceId,
      -parseFloat(invoice.total_amount),
      'Cash',
      'FAILED',
      `REFUND-${Date.now()}`
    ]
  );

  // Update order status to REFUNDED
  await pool.query(
    `UPDATE orders SET status = 'REFUNDED', updated_at = NOW() WHERE id = $1`,
    [invoice.order_id]
  );

  // Reset corresponding table status back to AVAILABLE
  await pool.query(
    `UPDATE restaurant_tables 
     SET status = 'AVAILABLE', current_order_id = NULL, updated_at = NOW() 
     WHERE (current_order_id = $1 OR id = (SELECT table_id FROM orders WHERE id = $1))
       AND restaurant_id = $2`,
    [invoice.order_id, restaurantId]
  );

  try {
    await logEvent(restaurantId, OperationalEventType.REFUND_PROCESSED, `Invoice ${invoice.invoice_number} successfully refunded (Amount: -₹${parseFloat(invoice.total_amount)})`, {
      invoiceId,
      orderId: invoice.order_id,
      amount: -parseFloat(invoice.total_amount)
    });
    await logEvent(restaurantId, OperationalEventType.ORDER_REFUNDED, `Order #${invoice.order_id.substring(0,8)} marked as REFUNDED`, {
      orderId: invoice.order_id
    });
    await logEvent(restaurantId, OperationalEventType.TABLE_AVAILABLE, `Table released back to AVAILABLE on refund`, {
      orderId: invoice.order_id
    });
  } catch (e) {
    console.error('Failed to log refund events:', e);
  }

  return {
    ...updatedInvoiceRows[0],
    subtotal: parseFloat(updatedInvoiceRows[0].subtotal),
    tax_amount: parseFloat(updatedInvoiceRows[0].tax_amount),
    discount_amount: parseFloat(updatedInvoiceRows[0].discount_amount),
    total_amount: parseFloat(updatedInvoiceRows[0].total_amount),
  };
}
