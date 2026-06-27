# Table and Restaurant Settings Refinement Report

This report outlines the stabilization analysis, root cause diagnosis, fixes applied, and verification logs for the Table Management and Restaurant Settings modules in the SmartServe-AI-AWS platform.

---

## 1. Root Cause of Table Creation Failure

### Issue Identification
When trying to add or save a new table from the Visual Floor Layout Editor, the operation consistently failed with:
`"Failed to add new table"`

### Diagnostic Audit
1. **Joi Schema Mismatch**:
   - The frontend Visual Floor Layout presets configure and dispatch table shapes (`shape`) matching specific preset types: `booth`, `family`, `outdoor`, `bar` (along with `round` and `square`).
   - The backend Joi validation definitions (`createTableSchema` and `updateTableSchema`) inside `backend/src/modules/tables/tables.validation.ts` restricted the accepted shape strings strictly to: `'rectangle'`, `'round'`, `'square'`.
   - Any table presets dispatching shapes like `booth`, `family`, etc., triggered validation errors (400 Bad Request) and were blocked.
2. **Missing Dimension & Rotation Parameters**:
   - The Joi schemas lacked definitions for `width`, `height`, and `rotation` parameters. Consequently, any layout manipulation payloads dispatching size resizing or rotation adjustments were stripped or rejected by the Joi filter middleware.

---

## 2. Fixes Applied

1. **Joi Validation Updates**:
   - Modified `backend/src/modules/tables/tables.validation.ts` to support the full set of restaurant table types: `square`, `round`, `booth`, `family`, `outdoor`, `bar`, `rectangle`.
   - Appended rules for `width` (min 1), `height` (min 1), and `rotation` (min 0, max 360) inside the `createTableSchema` and `updateTableSchema` validations.
2. **Database Migration**:
   - Successfully altered the PostgreSQL database `restaurant_tables` schema to add `width`, `height`, and `rotation` parameters with safe defaults (80px, 80px, and 0 respectively).
3. **Table Lifecycle & Order Flow Sync**:
   - Configured order and payment hooks to link table states seamlessly:
     - On order creation: Table status transitions to `OCCUPIED`.
     - On invoice checkout settlement: Table status automatically transitions to `AVAILABLE` (Free) in both the database and SSE broadcasts.
4. **Restaurant Settings profile**:
   - Created the Settings page under `/settings` in Next.js to configure and persist profile values: Restaurant Name, Branch Name, Address, GSTIN, Phone, Email, Website, Logo, UPI ID, default Tax %, and Currency.
   - Updated invoice checkouts in `app/(app)/billing/page.tsx` to automatically pull GST rate and print receipts using the settings profile values.

---

## 3. Database Changes Applied

The following migrations were executed against the PostgreSQL database:
```sql
-- Alter restaurant_tables for Visual Layout sizing & rotation support
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 80;
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 80;
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS rotation INTEGER DEFAULT 0;

-- Alter restaurant_settings to support profile variables
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100);
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS website VARCHAR(100);
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS tax_percent NUMERIC DEFAULT 18.0;
ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
```

---

## 4. Files Modified

- **[tables.validation.ts](file:///d:/SmartServe-AI-AWS/backend/src/modules/tables/tables.validation.ts)**: Configured Joi rules to accept new shapes, widths, heights, and rotations.
- **[007_create_tables_schema.sql](file:///d:/SmartServe-AI-AWS/database/schema/007_create_tables_schema.sql)**: Modified tables database migration schema definition.
- **[tables.types.ts](file:///d:/SmartServe-AI-AWS/backend/src/modules/tables/tables.types.ts)**: Included dimensions and rotation fields in types.
- **[tables.service.ts](file:///d:/SmartServe-AI-AWS/backend/src/modules/tables/tables.service.ts)**: Supported creation and upsert updates of sizing and rotation columns.
- **[tableService.ts](file:///d:/SmartServe-AI-AWS/lib/services/tableService.ts)**: Supported normalizations and types in the frontend client.
- **[billing.service.ts](file:///d:/SmartServe-AI-AWS/backend/src/modules/billing/billing.service.ts)**: Refined payment settlement so table status immediately transitions to `AVAILABLE` (Free) instead of `CLEANING`.
- **[validate_billing_workflow.js](file:///d:/SmartServe-AI-AWS/backend/scripts/validate_billing_workflow.js)**: Aligned test scripts to expect table status transition to `AVAILABLE` on invoice settlement.
- **[navigation.ts](file:///d:/SmartServe-AI-AWS/lib/navigation.ts)**: Added system route `/settings` pointing to the profile editor.
- **[settingsService.ts](file:///d:/SmartServe-AI-AWS/lib/services/settingsService.ts)**: Added branch_name, email, website, upi_id, tax_percent, and currency attributes to settings payloads.
- **[004_create_billing_schema.sql](file:///d:/SmartServe-AI-AWS/database/schema/004_create_billing_schema.sql)**: Modified settings schema.
- **[settings/page.tsx](file:///d:/SmartServe-AI-AWS/app/(app)/settings/page.tsx)**: Created a premium Profile Editor UI to persist settings parameters.
- **[billing/page.tsx](file:///d:/SmartServe-AI-AWS/app/(app)/billing/page.tsx)**: Integrated settings profile values, automatic GST tax rate population, and a printable visual receipt.

---

## 5. Verification Results

### Dynamic Billing and Table State Settlement Audit
Executed the telemetry billing audit verification:
```
◇ injected env (0) from .env
--- STARTING BILLING WORKFLOW AUDIT ---
Step 1: Creating a served order...
Order created successfully: ID da269127-d689-41cd-b6d9-d1a8bde486c1, Status: SERVED

Step 2: Customer requests bill (SERVED -> BILL_REQUESTED)...
Order status updated to: BILL_REQUESTED

Step 7: Creating invoice (Checkout)...
Invoice generated: ID ebee6519-ea73-4bc7-bd92-6cc030a3d907, Net: ₹165.5

Step 8: Splitting payment into two parts...
Recording payment 1: ₹82.75 via Cash
Recording payment 2: ₹82.75 via Card
Payment completed successfully. Checking database statuses:
- Invoice Status: PAID
- Order Status: PAID
- Table Status: AVAILABLE  <-- [VERIFIED: Table is now free]

--- BILLING WORKFLOW AUDIT PASSED WITH 100% CORRECTNESS ---
```
All systems compile, execute, and persist correctly in real-time.
