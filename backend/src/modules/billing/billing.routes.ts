// File: backend/src/modules/billing/billing.routes.ts

import { Router } from 'express';
import {
  fetchBillableOrders,
  fetchBillingMetrics,
  fetchInvoice,
  fetchInvoiceByOrder,
  fetchInvoices,
  fetchPayments,
  issueInvoice,
  submitPayment,
  refundInvoiceController,
} from './billing.controller';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';

const router = Router();
router.use(authenticateJWT);

router.get('/orders', authorizeRoles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN), fetchBillableOrders);
router.post('/invoices', authorizeRoles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN), issueInvoice);
router.get('/invoices', authorizeRoles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN), fetchInvoices);
router.get('/invoices/order/:orderId', authorizeRoles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN), fetchInvoiceByOrder);
router.get('/invoices/:invoiceId', authorizeRoles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN), fetchInvoice);
router.post('/payments', authorizeRoles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN), submitPayment);
router.post('/invoices/:invoiceId/refund', authorizeRoles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN), refundInvoiceController);
router.get('/payments', authorizeRoles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN), fetchPayments);
router.get('/metrics', authorizeRoles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN), fetchBillingMetrics);

export default router;
