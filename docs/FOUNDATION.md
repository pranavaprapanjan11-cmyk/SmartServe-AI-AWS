# SmartServe AI — Project Foundation Document
### AI-Powered Restaurant Management System
**Version:** 1.0 | **Status:** Foundation & Planning | **Date:** 2025

---

# TABLE OF CONTENTS

1. Software Requirements Specification (SRS)
2. User Roles and Permissions
3. System Architecture
4. Database Design
5. ER Diagram Description
6. Project Folder Structure
7. API Architecture
8. Security Architecture
9. Development Roadmap
10. MASTER_CONTEXT.md

---

---

# PART 1 — SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

---

## 1.1 Introduction

### 1.1.1 Purpose
This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for SmartServe AI — an AI-Powered Restaurant Management System. It serves as the primary reference document for design, development, testing, and deployment of the system.

### 1.1.2 Scope
SmartServe AI is a full-stack, cloud-ready restaurant management platform designed to digitize and automate restaurant operations including ordering, kitchen management, billing, inventory, employee management, and AI-powered decision support. It targets restaurant owners, managers, waitstaff, kitchen staff, and customers.

### 1.1.3 Definitions and Acronyms

| Term | Definition |
|------|-----------|
| SRS | Software Requirements Specification |
| QR | Quick Response (code) |
| OCR | Optical Character Recognition |
| JWT | JSON Web Token |
| KDS | Kitchen Display System |
| RBAC | Role-Based Access Control |
| API | Application Programming Interface |
| AI | Artificial Intelligence |
| POS | Point of Sale |

### 1.1.4 Overview
This document is organized into introduction, problem statement, existing systems, proposed system, objectives, scope, functional requirements, non-functional requirements, assumptions, constraints, and future scope.

---

## 1.2 Problem Statement

Modern restaurant operations face a complex set of challenges that manual or fragmented systems fail to address efficiently:

- **Order Errors:** Handwritten or verbal orders are error-prone, leading to wrong dishes being prepared and customer dissatisfaction.
- **Slow Service:** Manual order taking, paper-based communication to the kitchen, and cash-only billing slow down table turnover.
- **Inventory Waste:** Without predictive tracking, restaurants either over-purchase (waste) or under-purchase (stockouts), both causing revenue loss.
- **Staff Inefficiency:** Without digital tools, waiters spend excess time traveling between tables and the kitchen just to relay order status.
- **Data Blindness:** Most restaurants have no analytics. Owners cannot identify peak hours, top-selling items, or forecast future demand.
- **Menu Management:** Paper menus are costly to reprint, cannot be updated in real time, and provide no filtering for allergens or dietary preferences.
- **Fragmented Systems:** Restaurants often use disconnected POS, billing, and inventory tools that do not talk to each other.

SmartServe AI addresses all of these problems in a unified, intelligent platform.

---

## 1.3 Existing Systems

Current restaurant management systems fall into three categories:

**1. Traditional Paper-Based Systems**
- Handwritten order pads, paper menus, manual billing
- No digital record-keeping or analytics

**2. Basic POS Systems** (e.g., Square, Clover)
- Handle billing and basic sales reports
- No integration with kitchen, inventory, or AI

**3. Partial Digital Solutions** (e.g., Zomato for Restaurants, Petpooja, POSist)
- Cover specific functions but not end-to-end management
- Limited or no AI capabilities
- High subscription costs unsuitable for small/mid-size restaurants

---

## 1.4 Limitations of Existing Systems

| Limitation | Description |
|-----------|-------------|
| No Real-Time Sync | Orders placed at the table are not instantly visible in the kitchen |
| No AI/ML Integration | No demand forecasting, inventory prediction, or sentiment analysis |
| No QR-Based Self-Ordering | Customers cannot order from their own devices |
| High Cost | Enterprise POS systems are expensive and inaccessible to small restaurants |
| Siloed Modules | Billing, inventory, and orders exist as separate disconnected systems |
| No OCR Support | Menu items cannot be uploaded via handwritten images |
| Limited Analytics | Basic sales reports only; no predictive or prescriptive analytics |
| No Multi-Role Access | No fine-grained role-based permissions for different staff types |

---

## 1.5 Proposed System

SmartServe AI is a comprehensive, AI-augmented restaurant management system with the following key capabilities:

- **QR Code Self-Ordering:** Customers scan a table QR code to access the digital menu and place orders without waiter assistance.
- **Kitchen Display System:** Real-time order routing directly from customer/waiter to the kitchen screen.
- **AI Sales Forecasting:** Predict future order volumes using historical sales data.
- **AI Inventory Prediction:** Forecast inventory requirements based on predicted sales.
- **OCR Menu Upload:** Restaurant owners photograph handwritten menus; the system extracts and digitizes menu items.
- **Sentiment Analysis:** Automatically analyze customer reviews to surface actionable insights.
- **Restaurant AI Chatbot:** An embedded assistant that answers business questions using restaurant data.
- **Centralized Dashboard:** Real-time metrics, sales charts, inventory alerts, and employee activity in one view.
- **Role-Based Access Control:** Seven distinct user roles, each with appropriate permissions.

---

## 1.6 Objectives

1. Digitize the complete restaurant order lifecycle from table to kitchen to billing.
2. Provide a self-service QR ordering experience to reduce dependency on waitstaff.
3. Build a real-time Kitchen Display System for faster and more accurate order fulfillment.
4. Implement AI-powered sales forecasting and inventory prediction to reduce waste.
5. Enable OCR-based menu digitization from handwritten or printed menus.
6. Provide customer review sentiment analysis for quality monitoring.
7. Build an AI chatbot assistant embedded in the admin dashboard.
8. Design a comprehensive analytics and reporting module for data-driven decisions.
9. Implement enterprise-grade security with JWT authentication and RBAC.
10. Build a modular, scalable, and maintainable codebase suitable for real deployment.

---

## 1.7 Scope

### In Scope
- Web application accessible on desktop and mobile browsers
- Customer QR ordering flow
- Waiter mobile ordering interface
- Kitchen Display System
- Admin dashboard with full management capabilities
- AI features: OCR, Forecasting, Inventory Prediction, Sentiment Analysis, Chatbot
- Billing and payment recording
- Inventory and supplier management
- Employee management
- Analytics and reporting

### Out of Scope (for current version)
- Native mobile apps (iOS/Android)
- Third-party delivery platform integrations (Swiggy, Zomato)
- Online payment gateway integration (can be added in future)
- Multi-branch restaurant management
- Loyalty points system

---

## 1.8 Functional Requirements

### FR-01: Authentication
- The system shall allow users to register and log in using email and password.
- The system shall issue JWT tokens upon successful authentication.
- The system shall enforce role-based access for all routes.
- The system shall support password reset via email.

### FR-02: Customer QR Ordering
- The system shall generate a unique QR code per table.
- Customers shall scan the QR code to view the digital menu.
- Customers shall add items to a cart and place an order.
- Customers shall track the real-time status of their order.

### FR-03: Waiter Module
- Waiters shall log in on their mobile device.
- Waiters shall view their assigned tables.
- Waiters shall take orders on behalf of customers.
- Waiters shall receive notifications when orders are ready.

### FR-04: Kitchen Display System
- The KDS shall display all incoming orders in real time.
- Kitchen staff shall update order item status (pending → preparing → ready).
- Orders shall be automatically routed to the KDS upon placement.

### FR-05: Menu Management
- Admins shall create, update, and delete menu categories and items.
- Each menu item shall have a name, description, price, image, category, and availability flag.
- Admins shall upload handwritten menus via OCR for digitization.

### FR-06: Order Management
- The system shall create orders linked to a table, customer or waiter, and order items.
- Orders shall have statuses: placed → confirmed → preparing → ready → served → paid.
- The system shall send real-time status updates via WebSocket.

### FR-07: Billing System
- The system shall generate an itemized bill for each order.
- The system shall support tax calculation and discount application.
- The system shall record payment method (cash, card, UPI).
- The system shall generate printable receipts.

### FR-08: Inventory Management
- The system shall track inventory items with quantity, unit, reorder level, and cost.
- The system shall alert when inventory falls below the reorder threshold.
- The system shall record inventory transactions (additions, reductions).
- The system shall support supplier and purchase order management.

### FR-09: Employee Management
- Admins shall add, update, and deactivate employee accounts.
- Each employee shall have a role, contact details, and shift assignment.
- The system shall record employee working hours.

### FR-10: Analytics Dashboard
- The dashboard shall display real-time metrics: revenue, active orders, table occupancy.
- The system shall generate reports: daily sales, top items, revenue by period.
- The system shall display inventory health and low-stock alerts.

### FR-11: AI Features
- **OCR:** Extract menu items from uploaded handwritten or printed menu images.
- **Sales Forecast:** Predict daily/weekly order volumes using ML models.
- **Inventory Prediction:** Recommend purchase quantities based on forecasted demand.
- **Sentiment Analysis:** Classify customer reviews as positive, neutral, or negative.
- **AI Chatbot:** Answer natural language queries about restaurant performance.

### FR-12: Review Management
- Customers shall submit reviews with a rating (1–5) and text comment.
- The system shall automatically analyze sentiment for each review.
- Admins shall view review summaries on the dashboard.

---

## 1.9 Non-Functional Requirements

| ID | Requirement | Target |
|----|------------|--------|
| NFR-01 | Performance | API responses under 500ms for 95% of requests |
| NFR-02 | Scalability | Support up to 50 concurrent tables per restaurant instance |
| NFR-03 | Availability | 99.5% uptime target |
| NFR-04 | Security | All routes protected; passwords hashed with bcrypt (cost 12) |
| NFR-05 | Usability | Mobile-responsive UI; waiter interface operable with one hand |
| NFR-06 | Real-Time | WebSocket latency under 200ms for order updates |
| NFR-07 | Maintainability | Code coverage > 70%; modular architecture |
| NFR-08 | Portability | Deployable via Docker on any cloud provider |
| NFR-09 | Data Integrity | All financial transactions wrapped in DB transactions |
| NFR-10 | Auditability | All data modifications logged with user and timestamp |

---

## 1.10 Assumptions

- A stable internet connection is available at the restaurant.
- Each table has a unique QR code printed and displayed.
- Customers have smartphones capable of scanning QR codes and accessing a web browser.
- The restaurant uses a single currency.
- Kitchen staff can operate a touchscreen or tablet to update order status.
- The AI engine is accessible as a microservice via internal HTTP.

---

## 1.11 Constraints

- The system is built as a single-restaurant instance (not multi-tenant in v1).
- OCR accuracy depends on the clarity of handwritten menus.
- AI forecasting requires at least 30 days of historical sales data for meaningful predictions.
- Payment gateway integration (online payments) is deferred to a future release.
- The system is web-only; no native mobile app is included.

---

## 1.12 Future Scope

- Multi-branch / multi-tenant support with a central super-admin console.
- Integration with payment gateways (Razorpay, Stripe).
- Native iOS and Android apps for waiters and kitchen staff.
- Loyalty program and customer rewards system.
- Integration with food delivery platforms (Swiggy, Zomato).
- Automated WhatsApp/SMS notifications for order status.
- Voice-based ordering via smart speakers.
- Advanced AI features: dynamic pricing, personalized menu recommendations.
- Table reservation and pre-ordering system.

---

---

# PART 2 — USER ROLES AND PERMISSIONS

---

## Role Overview

SmartServe AI implements Role-Based Access Control (RBAC) with seven distinct roles. Every API endpoint and frontend route is protected based on the authenticated user's role.

---

## Role 1: Super Admin

**Description:** The highest-authority system user, managed by the development team. Oversees the entire platform.

**Responsibilities:**
- Platform configuration and system health monitoring
- Creating and managing Restaurant Owner accounts
- Accessing all system data for support and debugging

**Permissions:**
- Full access to all modules across all instances
- Create / read / update / delete (CRUD) on all entities
- Access to system logs and audit trails
- Manage global settings and configurations
- Cannot be created from within the app (seeded directly)

---

## Role 2: Restaurant Owner

**Description:** The business owner who has full control over their specific restaurant instance.

**Responsibilities:**
- Managing all restaurant settings and configurations
- Overseeing all staff accounts within their restaurant
- Viewing all analytics and financial reports
- Making strategic decisions using AI insights

**Permissions:**
- CRUD on menu categories, menu items
- CRUD on employees (all roles below them)
- CRUD on inventory items and suppliers
- View all orders, payments, and reports
- Manage restaurant profile and settings
- Access all AI features
- Cannot manage other restaurant instances

---

## Role 3: Manager

**Description:** Day-to-day operational manager responsible for staff coordination and service quality.

**Responsibilities:**
- Managing shift assignments and daily operations
- Monitoring real-time orders and table status
- Reviewing inventory levels and placing purchase orders
- Generating and reviewing operational reports

**Permissions:**
- Read/update menu items (cannot delete)
- Read/update/delete orders
- CRUD on purchase orders
- Read inventory; update stock quantities
- Read all reports and analytics
- Manage waiter and kitchen staff accounts
- Cannot access financial settings or owner-level configurations

---

## Role 4: Cashier

**Description:** Responsible for billing, payment processing, and end-of-day reconciliation.

**Responsibilities:**
- Processing payments for completed orders
- Applying discounts and handling refunds
- Generating billing receipts
- Closing daily billing sessions

**Permissions:**
- Read orders
- Create and update payments
- Apply discounts (within configured limits)
- Generate billing reports
- View customer details (read-only)
- Cannot modify menu, inventory, or employee records

---

## Role 5: Waiter

**Description:** Floor staff responsible for table management and order taking.

**Responsibilities:**
- Managing assigned tables
- Taking customer orders
- Relaying order status to customers
- Coordinating with the kitchen

**Permissions:**
- View assigned tables and their status
- Create and update orders for assigned tables
- View menu items (read-only)
- View order status in real time
- Cannot access billing, inventory, or employee management
- Cannot view analytics or reports

---

## Role 6: Kitchen Staff

**Description:** Back-of-house staff responsible for preparing and fulfilling orders.

**Responsibilities:**
- Viewing incoming orders on the Kitchen Display System
- Updating order item status as items are prepared
- Notifying waiters when orders are ready

**Permissions:**
- View all active orders on the KDS
- Update individual order item status (preparing → ready)
- Cannot create, modify, or delete orders
- No access to billing, inventory, analytics, or employee management

---

## Role 7: Customer

**Description:** Restaurant guest who interacts with the system via QR code scan on their personal device.

**Responsibilities:**
- Browsing the digital menu
- Placing and tracking their own orders

**Permissions:**
- View menu (read-only, public access via QR token)
- Create orders linked to their table session
- View their own order status
- Submit reviews for completed orders
- No access to any admin, staff, or management features

---

## Permissions Matrix Summary

| Permission | Super Admin | Owner | Manager | Cashier | Waiter | Kitchen | Customer |
|-----------|:-----------:|:-----:|:-------:|:-------:|:------:|:-------:|:--------:|
| System Config | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Owners | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Menu CRUD | ✅ | ✅ | Read/Update | ❌ | Read | ❌ | Read |
| Order CRUD | ✅ | ✅ | ✅ | Read | Create/Update | Read/Update | Create |
| KDS Access | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Billing | ✅ | ✅ | Read | ✅ | ❌ | ❌ | ❌ |
| Inventory | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Employees | ✅ | ✅ | Partial | ❌ | ❌ | ❌ | ❌ |
| Analytics | ✅ | ✅ | ✅ | Read | ❌ | ❌ | ❌ |
| AI Features | ✅ | ✅ | Read | ❌ | ❌ | ❌ | ❌ |
| Reviews | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | Create |

---

---

# PART 3 — SYSTEM ARCHITECTURE

---

## 3.1 High-Level Architecture

SmartServe AI follows a **Three-Tier Architecture** with an additional **AI Engine** microservice layer.

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Customer    │  │  Waiter     │  │  Admin / Manager    │  │
│  │  QR Web App  │  │  Mobile Web │  │  Dashboard (React)  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────┴────────────────┴─────────────────────┴──────────┐  │
│  │              Kitchen Display System (KDS)               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS / WebSocket
┌─────────────────────────────┴───────────────────────────────┐
│                     APPLICATION TIER                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Node.js + Express.js Backend               │  │
│  │                                                          │  │
│  │  Auth    Orders   Menu   Billing   Inventory   Analytics│  │
│  │  Router  Router  Router  Router    Router       Router   │  │
│  └─────────────────────────┬──────────────────────────────┘  │
│                             │                                 │
│  ┌──────────────────────────┴─────────────────────────────┐  │
│  │               Socket.io Real-Time Layer                  │  │
│  │        (Order Updates, KDS, Table Status)                │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                       DATA TIER                              │
│                                                              │
│  ┌──────────────────────────┐  ┌────────────────────────┐   │
│  │   PostgreSQL (Supabase)  │  │   File Storage          │   │
│  │   Primary Database        │  │   (Supabase Storage)   │   │
│  └──────────────────────────┘  └────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                    AI ENGINE (Microservice)                   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │   OCR    │  │ Forecast  │  │Sentiment │  │  Chatbot   │  │
│  │ (Python) │  │(Sklearn) │  │(NLP/API) │  │ (Gemini)   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3.2 Component Diagram Description

### Frontend Components
- **Customer App:** A lightweight, mobile-first React web app served at a table-specific URL. Requires no login. Supports menu browsing, cart, order placement, and order status tracking.
- **Waiter App:** A mobile-responsive React interface used by floor staff to manage tables and take orders on behalf of customers.
- **Kitchen Display System (KDS):** A full-screen React interface displayed on a tablet/monitor in the kitchen. Auto-refreshes via WebSocket.
- **Admin Dashboard:** A feature-rich React SPA for restaurant owners, managers, and cashiers to manage all operational and business functions.

### Backend Components
- **Express.js REST API:** Handles all business logic. Organized into feature-based routers.
- **Socket.io Server:** Manages real-time event channels for order updates, KDS notifications, and table status changes.
- **Authentication Middleware:** JWT-based guard applied to all protected routes.
- **RBAC Middleware:** Role-permission checks applied per route.
- **AI Bridge Service:** HTTP client that forwards requests from the Express backend to the Python AI microservice.

### Database Components
- **PostgreSQL via Supabase:** Primary relational data store.
- **Supabase Storage:** Image storage for menu item photos and OCR uploads.

### AI Engine Components
- **OCR Service:** Accepts image uploads and returns extracted menu text using Tesseract / Google Vision API.
- **Forecasting Service:** Trains and runs a time-series model (ARIMA / Prophet / Linear Regression) on historical orders.
- **Inventory Prediction Service:** Uses forecast output to calculate recommended purchase quantities.
- **Sentiment Analysis Service:** Classifies review text using OpenAI API or a fine-tuned classifier.
- **Chatbot Service:** LLM-powered assistant with restaurant data context injected into the system prompt.

---

## 3.3 Data Flow Description

### Customer QR Ordering Flow
1. Customer scans QR code at the table → Loads Customer Web App with `table_id` in URL params.
2. App fetches menu from `GET /api/menu/public` (no auth required).
3. Customer adds items to local cart → submits order to `POST /api/orders`.
4. Backend creates order in DB, emits `order:new` WebSocket event.
5. KDS receives event and displays new order.
6. Kitchen updates item status → Backend emits `order:updated` event.
7. Customer app and Waiter app receive real-time status updates.
8. When all items ready → Waiter marks order as served.
9. Cashier processes payment via `POST /api/payments`.

### Admin Data Flow
1. Admin logs in → receives JWT.
2. All admin API calls include `Authorization: Bearer <token>`.
3. Auth middleware validates token; RBAC middleware checks role permissions.
4. Data is fetched from PostgreSQL via Supabase client.
5. AI feature requests are forwarded to the Python AI engine.
6. Results returned to frontend for display.

---

## 3.4 Communication Flow

```
Customer Device
     │
     │  HTTP/HTTPS REST (menu, orders)
     │  WebSocket (order status)
     ▼
Express.js Backend ─────── JWT Auth Middleware
     │                     RBAC Middleware
     │
     ├── PostgreSQL (Supabase) ── Data persistence
     │
     ├── Socket.io Server ──────── KDS (Kitchen Tablet)
     │                             Waiter App (order ready)
     │                             Customer App (status update)
     │
     └── AI Engine (HTTP)
              │
              ├── OCR Service (Python/Tesseract)
              ├── Forecasting Service (Sklearn/Prophet)
              ├── Inventory Prediction (Pandas/NumPy)
              ├── Sentiment Analysis (OpenAI API)
              └── Chatbot (Gemini API)
```

---

---

# PART 4 — DATABASE DESIGN

---

## Database: PostgreSQL (hosted on Supabase)

---

### Table: `roles`

**Purpose:** Stores the system's user roles used for RBAC.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment role ID |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Role name (super_admin, owner, manager, etc.) |
| description | TEXT | | Human-readable role description |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation time |

---

### Table: `users`

**Purpose:** Central authentication table for all system users (staff and customers).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Login email |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt-hashed password |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| phone | VARCHAR(20) | | Contact number |
| role_id | INTEGER | FK → roles(id), NOT NULL | Assigned role |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| last_login | TIMESTAMP | | Last successful login |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:** `email`, `role_id`

---

### Table: `employees`

**Purpose:** Extended profile for staff users (waiters, kitchen staff, managers, etc.).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique employee ID |
| user_id | UUID | FK → users(id), NOT NULL | Link to users table |
| employee_code | VARCHAR(20) | UNIQUE | Internal staff code |
| department | VARCHAR(50) | | Department (kitchen, floor, etc.) |
| shift | VARCHAR(20) | | morning / evening / night |
| hire_date | DATE | | Employment start date |
| salary | DECIMAL(10,2) | | Monthly salary |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Foreign Keys:** `user_id → users(id)` ON DELETE CASCADE

---

### Table: `customers`

**Purpose:** Stores customer profiles for order history and review tracking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique customer ID |
| user_id | UUID | FK → users(id) | Link to user account (optional for walk-ins) |
| name | VARCHAR(100) | | Customer display name |
| email | VARCHAR(255) | | Customer email |
| phone | VARCHAR(20) | | Customer phone |
| visit_count | INTEGER | DEFAULT 0 | Number of visits |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `restaurant_tables`

**Purpose:** Tracks all physical tables in the restaurant.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Table ID |
| table_number | VARCHAR(10) | NOT NULL, UNIQUE | Display label (T1, T2, etc.) |
| capacity | INTEGER | NOT NULL | Maximum seating capacity |
| section | VARCHAR(50) | | Indoor / Outdoor / Bar |
| status | VARCHAR(20) | DEFAULT 'available' | available / occupied / reserved / cleaning |
| qr_code_url | TEXT | | URL to the QR code image |
| qr_token | UUID | UNIQUE | Unique token embedded in QR URL |
| assigned_waiter_id | UUID | FK → users(id) | Currently assigned waiter |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes:** `qr_token`, `status`

---

### Table: `menu_categories`

**Purpose:** Groups menu items into logical categories.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Category ID |
| name | VARCHAR(100) | NOT NULL | Category name (Starters, Mains, etc.) |
| description | TEXT | | Category description |
| display_order | INTEGER | DEFAULT 0 | Ordering in menu display |
| is_active | BOOLEAN | DEFAULT TRUE | Visibility flag |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `menu_items`

**Purpose:** Stores all food and beverage items on the restaurant's menu.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Item ID |
| category_id | INTEGER | FK → menu_categories(id) | Parent category |
| name | VARCHAR(150) | NOT NULL | Item name |
| description | TEXT | | Item description |
| price | DECIMAL(10,2) | NOT NULL | Current price |
| image_url | TEXT | | URL to item image |
| is_vegetarian | BOOLEAN | DEFAULT FALSE | Dietary flag |
| is_vegan | BOOLEAN | DEFAULT FALSE | Dietary flag |
| is_gluten_free | BOOLEAN | DEFAULT FALSE | Dietary flag |
| is_available | BOOLEAN | DEFAULT TRUE | Currently orderable |
| preparation_time | INTEGER | | Estimated prep time in minutes |
| calories | INTEGER | | Calorie count |
| display_order | INTEGER | DEFAULT 0 | Ordering within category |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Foreign Keys:** `category_id → menu_categories(id)` ON DELETE SET NULL

---

### Table: `orders`

**Purpose:** Represents a single order session for a table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique order ID |
| table_id | INTEGER | FK → restaurant_tables(id) | The table this order belongs to |
| customer_id | UUID | FK → customers(id) | Customer (if identified) |
| waiter_id | UUID | FK → users(id) | Waiter who took/manages the order |
| order_type | VARCHAR(20) | NOT NULL | qr_self / waiter_assisted / takeaway |
| status | VARCHAR(30) | DEFAULT 'placed' | placed → confirmed → preparing → ready → served → paid → cancelled |
| notes | TEXT | | Special instructions |
| subtotal | DECIMAL(10,2) | | Sum of item prices |
| discount_amount | DECIMAL(10,2) | DEFAULT 0 | Discount applied |
| tax_amount | DECIMAL(10,2) | DEFAULT 0 | Tax calculated |
| total_amount | DECIMAL(10,2) | | Final payable amount |
| created_at | TIMESTAMP | DEFAULT NOW() | Time order was placed |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last status update |

**Indexes:** `table_id`, `status`, `created_at`

---

### Table: `order_items`

**Purpose:** Individual line items within an order.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Item line ID |
| order_id | UUID | FK → orders(id), NOT NULL | Parent order |
| menu_item_id | INTEGER | FK → menu_items(id) | The menu item ordered |
| quantity | INTEGER | NOT NULL, DEFAULT 1 | Quantity ordered |
| unit_price | DECIMAL(10,2) | NOT NULL | Price at time of ordering |
| item_total | DECIMAL(10,2) | GENERATED | quantity × unit_price |
| status | VARCHAR(20) | DEFAULT 'pending' | pending → preparing → ready → served |
| special_instructions | TEXT | | Customer notes for this item |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Foreign Keys:** `order_id → orders(id)` ON DELETE CASCADE, `menu_item_id → menu_items(id)` ON DELETE RESTRICT

---

### Table: `payments`

**Purpose:** Records payment transactions for completed orders.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Payment ID |
| order_id | UUID | FK → orders(id), UNIQUE | Associated order (one payment per order) |
| cashier_id | UUID | FK → users(id) | Staff who processed payment |
| payment_method | VARCHAR(30) | NOT NULL | cash / card / upi / other |
| amount_paid | DECIMAL(10,2) | NOT NULL | Amount received |
| change_returned | DECIMAL(10,2) | DEFAULT 0 | Change given back (cash) |
| transaction_reference | VARCHAR(100) | | External reference (UPI ID, card last 4) |
| payment_status | VARCHAR(20) | DEFAULT 'completed' | completed / refunded / failed |
| paid_at | TIMESTAMP | DEFAULT NOW() | Time of payment |

**Indexes:** `order_id`, `paid_at`

---

### Table: `inventory`

**Purpose:** Tracks all ingredients and stock items.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Inventory item ID |
| name | VARCHAR(150) | NOT NULL | Ingredient/stock name |
| unit | VARCHAR(30) | NOT NULL | kg / liters / pieces / packets |
| current_quantity | DECIMAL(10,3) | DEFAULT 0 | Current stock on hand |
| reorder_level | DECIMAL(10,3) | NOT NULL | Threshold for low-stock alert |
| cost_per_unit | DECIMAL(10,2) | | Last purchase cost per unit |
| supplier_id | INTEGER | FK → suppliers(id) | Primary supplier |
| category | VARCHAR(50) | | Produce / Dairy / Beverages / etc. |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `inventory_transactions`

**Purpose:** Audit log of all inventory changes (additions and deductions).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Transaction ID |
| inventory_id | INTEGER | FK → inventory(id) | Item affected |
| transaction_type | VARCHAR(20) | NOT NULL | purchase / usage / waste / adjustment |
| quantity_change | DECIMAL(10,3) | NOT NULL | Positive (add) or negative (deduct) |
| quantity_before | DECIMAL(10,3) | | Quantity before transaction |
| quantity_after | DECIMAL(10,3) | | Quantity after transaction |
| reference_id | UUID | | Order ID or Purchase Order ID |
| notes | TEXT | | Reason for adjustment |
| performed_by | UUID | FK → users(id) | Staff who made the change |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `suppliers`

**Purpose:** Stores vendor/supplier contact and business information.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Supplier ID |
| name | VARCHAR(150) | NOT NULL | Company name |
| contact_name | VARCHAR(100) | | Primary contact person |
| email | VARCHAR(255) | | Supplier email |
| phone | VARCHAR(20) | | Supplier phone |
| address | TEXT | | Business address |
| payment_terms | VARCHAR(50) | | Net 30 / COD / etc. |
| is_active | BOOLEAN | DEFAULT TRUE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `purchase_orders`

**Purpose:** Tracks purchase orders raised with suppliers.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | PO number |
| supplier_id | INTEGER | FK → suppliers(id) | Supplier for this PO |
| raised_by | UUID | FK → users(id) | Manager who raised the PO |
| status | VARCHAR(20) | DEFAULT 'draft' | draft → sent → received → cancelled |
| total_value | DECIMAL(12,2) | | Total PO value |
| expected_delivery | DATE | | Expected delivery date |
| notes | TEXT | | Additional instructions |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `reviews`

**Purpose:** Stores customer reviews with AI-analyzed sentiment.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Review ID |
| customer_id | UUID | FK → customers(id) | Reviewer |
| order_id | UUID | FK → orders(id) | Associated order |
| rating | INTEGER | CHECK (1-5), NOT NULL | Star rating |
| comment | TEXT | | Review text |
| sentiment | VARCHAR(20) | | positive / neutral / negative (AI-assigned) |
| sentiment_score | DECIMAL(4,3) | | Confidence score (0.000 to 1.000) |
| is_published | BOOLEAN | DEFAULT TRUE | Visibility flag |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `analytics`

**Purpose:** Pre-aggregated analytics snapshots for dashboard performance.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Record ID |
| metric_date | DATE | NOT NULL | Date of the metric |
| metric_type | VARCHAR(50) | NOT NULL | daily_revenue / orders_count / top_items / etc. |
| metric_value | DECIMAL(14,2) | | Numeric value |
| metric_json | JSONB | | Complex metric payload (arrays, objects) |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Indexes:** `metric_date`, `metric_type`

---

---

# PART 5 — ER DIAGRAM DESCRIPTION

---

## Entity Relationships

### users ↔ roles
- **Type:** Many-to-One
- Each `user` is assigned exactly one `role`.
- One `role` can be assigned to many `users`.
- `users.role_id → roles.id`

### users ↔ employees
- **Type:** One-to-One
- Every `employee` record maps to exactly one `user` account.
- `employees.user_id → users.id` (UNIQUE constraint makes this 1:1)

### users ↔ customers
- **Type:** One-to-One (optional)
- A `customer` may optionally have a linked `user` account (for repeat customer login).
- Walk-in customers exist in `customers` without a `user` account.

### restaurant_tables ↔ users (waiters)
- **Type:** Many-to-One
- Many tables can be assigned to one waiter.
- `restaurant_tables.assigned_waiter_id → users.id`

### menu_items ↔ menu_categories
- **Type:** Many-to-One
- Each `menu_item` belongs to one `menu_category`.
- One category can have many items.
- `menu_items.category_id → menu_categories.id`

### orders ↔ restaurant_tables
- **Type:** Many-to-One
- Multiple orders can exist for a table (over time).
- `orders.table_id → restaurant_tables.id`

### orders ↔ customers
- **Type:** Many-to-One (optional)
- Many orders can be linked to the same customer.
- `orders.customer_id → customers.id`

### orders ↔ users (waiters)
- **Type:** Many-to-One
- Many orders can be managed by the same waiter.
- `orders.waiter_id → users.id`

### order_items ↔ orders
- **Type:** Many-to-One
- Each `order_item` belongs to exactly one `order`.
- One `order` has many `order_items`.
- `order_items.order_id → orders.id` (CASCADE DELETE)

### order_items ↔ menu_items
- **Type:** Many-to-One
- Many order items can reference the same menu item.
- `order_items.menu_item_id → menu_items.id`

### payments ↔ orders
- **Type:** One-to-One
- Each `order` has at most one `payment` record.
- `payments.order_id → orders.id` (UNIQUE)

### payments ↔ users (cashiers)
- **Type:** Many-to-One
- A cashier can process many payments.
- `payments.cashier_id → users.id`

### inventory ↔ suppliers
- **Type:** Many-to-One
- Each inventory item has a primary supplier.
- `inventory.supplier_id → suppliers.id`

### inventory_transactions ↔ inventory
- **Type:** Many-to-One
- Many transactions affect one inventory item.
- `inventory_transactions.inventory_id → inventory.id`

### inventory_transactions ↔ users
- **Type:** Many-to-One
- Each transaction is performed by a user.
- `inventory_transactions.performed_by → users.id`

### purchase_orders ↔ suppliers
- **Type:** Many-to-One
- Many POs can be raised with one supplier.
- `purchase_orders.supplier_id → suppliers.id`

### purchase_orders ↔ users (managers)
- **Type:** Many-to-One
- A manager can raise many POs.
- `purchase_orders.raised_by → users.id`

### reviews ↔ customers
- **Type:** Many-to-One
- One customer can leave many reviews.
- `reviews.customer_id → customers.id`

### reviews ↔ orders
- **Type:** One-to-One (optional)
- A review is linked to a specific order.
- `reviews.order_id → orders.id`

---

## ERD Summary (Textual Notation)

```
roles ──< users >── employees
              |
              └── customers
              |
restaurant_tables (assigned_waiter → users)
              |
              └──< orders >──< order_items >── menu_items >── menu_categories
                     |
                     └── payments (cashier → users)
                     |
                     └── reviews (customer → customers)

inventory >── inventory_transactions (performed_by → users)
    |
    └── suppliers ──< purchase_orders (raised_by → users)

analytics (standalone aggregation table)
```

---

---

# PART 6 — PROJECT FOLDER STRUCTURE

---

```
SmartServe-AI/
│
├── README.md                         # Project overview and setup guide
├── .gitignore                        # Git ignore rules
├── docker-compose.yml                # Orchestrates all services locally
│
├── frontend/                         # React + TypeScript + Tailwind CSS
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/                   # Images, icons, fonts
│   │   ├── components/               # Reusable UI components
│   │   │   ├── common/               # Button, Input, Modal, Badge, etc.
│   │   │   ├── layout/               # Navbar, Sidebar, Footer
│   │   │   ├── menu/                 # MenuCard, CategoryFilter, CartDrawer
│   │   │   ├── orders/               # OrderCard, OrderStatus, OrderTimeline
│   │   │   ├── kitchen/              # KDSOrderTile, KDSHeader
│   │   │   ├── billing/              # BillSummary, PaymentForm
│   │   │   ├── inventory/            # InventoryTable, StockAlert
│   │   │   ├── analytics/            # SalesChart, MetricCard
│   │   │   └── ai/                   # ChatbotWidget, SentimentBadge
│   │   ├── pages/                    # Route-level pages
│   │   │   ├── auth/                 # Login.tsx, Register.tsx
│   │   │   ├── customer/             # MenuPage.tsx, CartPage.tsx, OrderTrack.tsx
│   │   │   ├── waiter/               # WaiterDashboard.tsx, TableView.tsx
│   │   │   ├── kitchen/              # KDSPage.tsx
│   │   │   ├── admin/                # AdminDashboard.tsx
│   │   │   │   ├── MenuManagement.tsx
│   │   │   │   ├── OrderManagement.tsx
│   │   │   │   ├── InventoryManagement.tsx
│   │   │   │   ├── EmployeeManagement.tsx
│   │   │   │   ├── BillingPage.tsx
│   │   │   │   ├── Analytics.tsx
│   │   │   │   └── AIFeatures.tsx
│   │   ├── context/                  # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── CartContext.tsx
│   │   │   └── SocketContext.tsx
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useSocket.ts
│   │   │   ├── useCart.ts
│   │   │   └── useFetch.ts
│   │   ├── services/                 # API service functions
│   │   │   ├── api.ts                # Axios instance with interceptors
│   │   │   ├── authService.ts
│   │   │   ├── menuService.ts
│   │   │   ├── orderService.ts
│   │   │   ├── inventoryService.ts
│   │   │   ├── analyticsService.ts
│   │   │   └── aiService.ts
│   │   ├── types/                    # TypeScript type definitions
│   │   │   ├── user.types.ts
│   │   │   ├── menu.types.ts
│   │   │   ├── order.types.ts
│   │   │   └── inventory.types.ts
│   │   ├── utils/                    # Utility functions
│   │   │   ├── formatCurrency.ts
│   │   │   ├── formatDate.ts
│   │   │   └── validators.ts
│   │   ├── router/                   # React Router configuration
│   │   │   ├── AppRouter.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── routes.ts
│   │   ├── store/                    # State management (Zustand / Context)
│   │   │   ├── authStore.ts
│   │   │   └── orderStore.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                          # Node.js + Express.js API
│   ├── src/
│   │   ├── config/                   # Environment and app config
│   │   │   ├── database.ts           # Supabase / pg client setup
│   │   │   ├── env.ts                # Typed env variable loader
│   │   │   └── socket.ts             # Socket.io initialization
│   │   ├── middleware/               # Express middleware
│   │   │   ├── auth.middleware.ts    # JWT verification
│   │   │   ├── rbac.middleware.ts    # Role permission check
│   │   │   ├── validate.middleware.ts# Request body validation
│   │   │   ├── rateLimit.middleware.ts
│   │   │   └── errorHandler.middleware.ts
│   │   ├── modules/                  # Feature modules (each self-contained)
│   │   │   ├── auth/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.service.ts
│   │   │   ├── users/
│   │   │   ├── menu/
│   │   │   │   ├── menu.routes.ts
│   │   │   │   ├── menu.controller.ts
│   │   │   │   └── menu.service.ts
│   │   │   ├── orders/
│   │   │   ├── payments/
│   │   │   ├── inventory/
│   │   │   ├── employees/
│   │   │   ├── tables/
│   │   │   ├── analytics/
│   │   │   └── ai/
│   │   ├── sockets/                  # Socket event handlers
│   │   │   ├── order.socket.ts
│   │   │   └── kds.socket.ts
│   │   ├── types/                    # TypeScript interfaces
│   │   ├── utils/                    # Helpers (logger, response formatter)
│   │   │   ├── logger.ts
│   │   │   ├── responseHelper.ts
│   │   │   └── generateQR.ts
│   │   ├── app.ts                    # Express app setup
│   │   └── server.ts                 # HTTP server + Socket.io boot
│   ├── package.json
│   └── tsconfig.json
│
├── database/                         # Database management
│   ├── migrations/                   # SQL migration files
│   │   ├── 001_create_roles.sql
│   │   ├── 002_create_users.sql
│   │   ├── 003_create_employees.sql
│   │   ├── 004_create_tables.sql
│   │   ├── 005_create_menu.sql
│   │   ├── 006_create_orders.sql
│   │   ├── 007_create_payments.sql
│   │   ├── 008_create_inventory.sql
│   │   ├── 009_create_reviews.sql
│   │   └── 010_create_analytics.sql
│   ├── seeds/                        # Seed data for development
│   │   ├── seed_roles.sql
│   │   ├── seed_menu_categories.sql
│   │   └── seed_demo_data.sql
│   └── schema.sql                    # Complete consolidated schema
│
├── ai-engine/                        # Python AI microservice
│   ├── app/
│   │   ├── main.py                   # FastAPI / Flask app entry
│   │   ├── routers/
│   │   │   ├── ocr.py
│   │   │   ├── forecast.py
│   │   │   ├── sentiment.py
│   │   │   └── chatbot.py
│   │   ├── services/
│   │   │   ├── ocr_service.py
│   │   │   ├── forecast_service.py
│   │   │   ├── sentiment_service.py
│   │   │   └── chatbot_service.py
│   │   ├── models/                   # Trained ML model files (.pkl, .joblib)
│   │   └── utils/
│   │       ├── data_loader.py
│   │       └── preprocessor.py
│   ├── notebooks/                    # Jupyter notebooks for model development
│   │   ├── sales_forecasting.ipynb
│   │   ├── sentiment_analysis.ipynb
│   │   └── inventory_prediction.ipynb
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                             # Project documentation
│   ├── SRS.md
│   ├── API_DOCS.md
│   ├── DATABASE_SCHEMA.md
│   ├── ARCHITECTURE.md
│   ├── USER_MANUAL.md
│   └── MASTER_CONTEXT.md
│
└── deployment/                       # Deployment configuration
    ├── Dockerfile.frontend
    ├── Dockerfile.backend
    ├── nginx.conf                    # Nginx reverse proxy config
    ├── .env.example                  # Environment variable template
    └── vercel.json                   # Vercel deployment config
```

---

---

# PART 7 — API ARCHITECTURE

---

## 7.1 API Design Standards

- **Style:** RESTful
- **Base URL:** `/api/v1`
- **Format:** All requests and responses use `application/json`
- **Authentication:** `Authorization: Bearer <JWT_TOKEN>` header on all protected routes
- **HTTP Methods:** GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE
- **Status Codes:** 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity, 500 Internal Server Error

---

## 7.2 Standard Response Format

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": { ... },
  "error": null
}
```

Error response:
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [ "price must be a positive number" ]
  }
}
```

---

## 7.3 API Endpoints

### Authentication — `/api/v1/auth`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| POST | `/auth/login` | Public | Login with email and password |
| POST | `/auth/register` | Super Admin | Register a new staff user |
| POST | `/auth/logout` | Authenticated | Invalidate token |
| POST | `/auth/refresh` | Authenticated | Refresh JWT token |
| POST | `/auth/forgot-password` | Public | Send password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |

---

### Users — `/api/v1/users`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| GET | `/users` | Admin/Manager | List all users |
| GET | `/users/:id` | Admin/Manager | Get single user |
| PATCH | `/users/:id` | Admin | Update user details |
| PATCH | `/users/:id/status` | Admin | Activate/deactivate account |
| GET | `/users/me` | Authenticated | Get current user profile |

---

### Menu — `/api/v1/menu`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| GET | `/menu/public` | Public | Get full menu (for QR customers) |
| GET | `/menu/categories` | Authenticated | List all categories |
| POST | `/menu/categories` | Owner/Manager | Create category |
| PUT | `/menu/categories/:id` | Owner/Manager | Update category |
| DELETE | `/menu/categories/:id` | Owner | Delete category |
| GET | `/menu/items` | Authenticated | List all menu items |
| GET | `/menu/items/:id` | Authenticated | Get single item |
| POST | `/menu/items` | Owner/Manager | Create menu item |
| PUT | `/menu/items/:id` | Owner/Manager | Update menu item |
| DELETE | `/menu/items/:id` | Owner | Delete menu item |
| PATCH | `/menu/items/:id/availability` | Owner/Manager | Toggle item availability |

---

### Tables — `/api/v1/tables`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| GET | `/tables` | Authenticated | List all tables with status |
| POST | `/tables` | Owner/Manager | Add a new table |
| PATCH | `/tables/:id/status` | Waiter/Manager | Update table status |
| GET | `/tables/:qr_token` | Public | Validate QR token, get table info |
| PATCH | `/tables/:id/assign` | Manager | Assign waiter to table |

---

### Orders — `/api/v1/orders`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| GET | `/orders` | Admin/Manager | List all orders (with filters) |
| GET | `/orders/active` | Waiter/Kitchen | List active orders |
| GET | `/orders/:id` | Authenticated | Get single order detail |
| POST | `/orders` | Customer/Waiter | Place a new order |
| PATCH | `/orders/:id/status` | Waiter/Manager | Update order status |
| PATCH | `/orders/:id/items/:itemId/status` | Kitchen | Update individual item status |
| DELETE | `/orders/:id` | Manager | Cancel an order |

---

### Payments — `/api/v1/payments`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| POST | `/payments` | Cashier | Record a payment |
| GET | `/payments` | Admin/Manager/Cashier | List payments (with date filter) |
| GET | `/payments/:id` | Cashier+ | Get payment details |
| GET | `/payments/order/:orderId` | Cashier+ | Get payment by order |

---

### Inventory — `/api/v1/inventory`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| GET | `/inventory` | Manager+ | List all inventory items |
| GET | `/inventory/:id` | Manager+ | Get single item |
| POST | `/inventory` | Owner/Manager | Create inventory item |
| PUT | `/inventory/:id` | Owner/Manager | Update item |
| PATCH | `/inventory/:id/quantity` | Manager | Adjust stock quantity |
| GET | `/inventory/low-stock` | Manager+ | Get items below reorder level |
| GET | `/inventory/transactions` | Manager+ | Transaction history |
| GET | `/inventory/transactions/:itemId` | Manager+ | Transactions for one item |

---

### Suppliers — `/api/v1/suppliers`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| GET | `/suppliers` | Manager+ | List all suppliers |
| POST | `/suppliers` | Owner/Manager | Add supplier |
| PUT | `/suppliers/:id` | Owner/Manager | Update supplier |
| DELETE | `/suppliers/:id` | Owner | Remove supplier |

---

### Purchase Orders — `/api/v1/purchase-orders`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| GET | `/purchase-orders` | Manager+ | List all POs |
| POST | `/purchase-orders` | Manager | Create PO |
| PATCH | `/purchase-orders/:id/status` | Manager | Update PO status |

---

### Employees — `/api/v1/employees`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| GET | `/employees` | Owner/Manager | List all employees |
| GET | `/employees/:id` | Owner/Manager | Get employee details |
| POST | `/employees` | Owner | Add employee (also creates user) |
| PUT | `/employees/:id` | Owner/Manager | Update employee |
| PATCH | `/employees/:id/status` | Owner | Activate/deactivate |

---

### Reviews — `/api/v1/reviews`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| POST | `/reviews` | Customer | Submit a review |
| GET | `/reviews` | Owner/Manager | List all reviews |
| GET | `/reviews/summary` | Owner/Manager | Sentiment summary stats |

---

### Analytics — `/api/v1/analytics`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| GET | `/analytics/dashboard` | Manager+ | Dashboard summary metrics |
| GET | `/analytics/sales` | Manager+ | Sales data by period |
| GET | `/analytics/top-items` | Manager+ | Best-selling menu items |
| GET | `/analytics/hourly` | Manager+ | Order volume by hour |
| GET | `/analytics/inventory-value` | Manager+ | Total inventory valuation |

---

### AI Engine — `/api/v1/ai`

| Method | Endpoint | Access | Description |
|--------|---------|--------|-------------|
| POST | `/ai/ocr` | Owner/Manager | Upload menu image for OCR |
| GET | `/ai/forecast` | Owner/Manager | Get sales forecast |
| GET | `/ai/inventory-prediction` | Owner/Manager | Get restocking recommendations |
| POST | `/ai/sentiment` | Internal | Analyze review sentiment |
| POST | `/ai/chat` | Owner/Manager | Send message to AI chatbot |

---

---

# PART 8 — SECURITY ARCHITECTURE

---

## 8.1 JWT Authentication

SmartServe AI uses **JSON Web Tokens (JWT)** for stateless authentication.

**Flow:**
1. User submits email and password to `POST /api/v1/auth/login`.
2. Backend validates credentials. If valid, issues a signed JWT.
3. JWT payload contains: `{ userId, email, role, iat, exp }`.
4. Token is signed with a secret key stored in environment variables (`JWT_SECRET`).
5. Token expires in 24 hours (configurable). Refresh tokens extend sessions.
6. All protected routes include an `auth.middleware.ts` that verifies the token signature and expiry.
7. If invalid or expired, the middleware returns `401 Unauthorized`.

**Token Storage:** Frontend stores the JWT in `httpOnly` cookies or `localStorage` (httpOnly preferred to prevent XSS access).

---

## 8.2 Role-Based Access Control (RBAC)

Every API route is protected by two middleware layers:

1. **`auth.middleware.ts`** — Verifies the JWT and attaches `req.user` to the request.
2. **`rbac.middleware.ts`** — Checks if `req.user.role` has permission to access the requested endpoint.

**Permissions are defined centrally** in a `permissions.config.ts` file mapping roles to allowed routes and methods. Middleware is applied at the router level:

```
router.get('/employees', authenticate, authorize(['owner', 'manager']), getEmployees);
```

---

## 8.3 Password Hashing

- All passwords are hashed using **bcrypt** with a **cost factor of 12** before storage.
- Plain-text passwords are never stored or logged.
- Password comparison uses `bcrypt.compare()` which is timing-attack resistant.
- Password reset tokens are generated using `crypto.randomBytes(32)` and stored as hashed values with expiry.

---

## 8.4 Input Validation

- All incoming request bodies are validated using **Zod** or **Joi** schema validators.
- Validation is applied via `validate.middleware.ts` before controller logic executes.
- Fields are checked for: type correctness, length limits, regex patterns (email, phone), and required presence.
- Any validation failure returns `422 Unprocessable Entity` with detailed error messages.

---

## 8.5 SQL Injection Protection

- All database interactions use **parameterized queries** via the `pg` library or Supabase client. Raw string concatenation into SQL is never used.
- Supabase's query builder escapes all parameters automatically.
- Database users are granted minimum required privileges (principle of least privilege).

---

## 8.6 XSS Protection

- All user-generated content (review text, notes) is sanitized using **DOMPurify** on the frontend before rendering.
- Backend uses **helmet.js** to set secure HTTP headers including `Content-Security-Policy`.
- React's default JSX escaping prevents direct XSS injection in rendered output.
- `X-XSS-Protection` and `X-Content-Type-Options` headers are set via helmet.

---

## 8.7 Rate Limiting

- **express-rate-limit** is applied to all API routes.
- Default: **100 requests per 15 minutes per IP**.
- Auth routes (login, forgot-password): **10 requests per 15 minutes per IP** (stricter to prevent brute force).
- If exceeded: `429 Too Many Requests` is returned.
- Rate limit state is stored in memory (can be upgraded to Redis for distributed deployments).

---

## 8.8 Additional Security Measures

| Measure | Implementation |
|---------|---------------|
| HTTPS | Enforced in production via Vercel / Nginx |
| CORS | Restricted to known frontend origins only |
| Helmet.js | Sets 14 security HTTP headers |
| Environment Variables | All secrets in `.env` (never committed to Git) |
| `.gitignore` | `.env` and `node_modules` excluded |
| SQL Principle of Least Privilege | DB user has only needed permissions |
| Audit Logging | All sensitive operations logged with user ID and timestamp |
| Dependency Scanning | `npm audit` run in CI pipeline |

---

---

# PART 9 — DEVELOPMENT ROADMAP

---

## Module Overview

| Module | Name | Estimated Duration |
|--------|------|--------------------|
| 1 | Foundation and Planning | Week 1 |
| 2 | Authentication System | Week 2 |
| 3 | Menu Management | Week 3 |
| 4 | QR Ordering System | Week 4 |
| 5 | Waiter Mobile Ordering | Week 5 |
| 6 | Kitchen Display System | Week 6 |
| 7 | Billing System | Week 7 |
| 8 | Inventory Management | Week 8–9 |
| 9 | Employee Management | Week 10 |
| 10 | Analytics Dashboard | Week 11 |
| 11 | OCR Menu Upload | Week 12 |
| 12 | AI Features (Full Suite) | Week 13–14 |

---

## Module 1 — Foundation and Planning ✅
**Goal:** Establish the complete project foundation before writing any code.

**Deliverables:**
- SRS Document
- Database Schema (all tables, relationships)
- API Architecture Document
- Project Folder Structure
- MASTER_CONTEXT.md
- Git Repository initialized with folder structure

---

## Module 2 — Authentication System
**Goal:** Working login/logout system with JWT and role-based access.

**Deliverables:**
- Database: `users` and `roles` tables created and seeded
- Backend: Auth routes (`/login`, `/logout`, `/refresh`)
- Backend: JWT generation, `auth.middleware`, `rbac.middleware`
- Frontend: Login page, Protected Route component, AuthContext
- Testing: All auth flows verified

---

## Module 3 — Menu Management
**Goal:** Admins can manage the full digital menu.

**Deliverables:**
- Database: `menu_categories`, `menu_items` tables
- Backend: Full CRUD API for categories and items
- Frontend: Admin menu management page (list, create, edit, delete, toggle availability)
- Image upload: Supabase Storage integration for item photos

---

## Module 4 — QR Ordering System
**Goal:** Customers can scan a QR code and place orders independently.

**Deliverables:**
- Database: `restaurant_tables` table, `orders`, `order_items`
- Backend: QR token validation endpoint, public menu endpoint, order creation
- Frontend: Customer-facing menu page, cart, checkout, order confirmation
- Real-time: Socket.io connection established; `order:new` event emitted to KDS

---

## Module 5 — Waiter Mobile Ordering System
**Goal:** Waiters can take and manage orders from their mobile device.

**Deliverables:**
- Frontend: Waiter login, table list view, order taking form
- Backend: Waiter-specific order endpoints, table assignment
- Real-time: Waiters receive `order:updated` events

---

## Module 6 — Kitchen Display System
**Goal:** Kitchen staff see and manage orders in real time.

**Deliverables:**
- Frontend: Full-screen KDS interface showing all active orders
- Backend: `order_items` status update endpoint
- Real-time: `kds:order_new`, `kds:item_updated` Socket.io events
- Order auto-routing from placement to KDS

---

## Module 7 — Billing System
**Goal:** Cashiers can process payments and generate receipts.

**Deliverables:**
- Database: `payments` table
- Backend: Payment creation, payment listing, receipt generation
- Frontend: Cashier billing interface, itemized bill view, payment method selection
- Print-ready receipt format

---

## Module 8 — Inventory Management
**Goal:** Full stock tracking with low-stock alerts and supplier management.

**Deliverables:**
- Database: `inventory`, `inventory_transactions`, `suppliers`, `purchase_orders`
- Backend: Full CRUD for all inventory entities, low-stock query
- Frontend: Inventory list with alerts, transaction history, supplier management, PO creation

---

## Module 9 — Employee Management
**Goal:** Owners and managers can manage all staff accounts.

**Deliverables:**
- Database: `employees` table
- Backend: Employee CRUD, shift assignment, account activation/deactivation
- Frontend: Employee directory, add/edit employee form, role assignment

---

## Module 10 — Analytics Dashboard
**Goal:** Visual dashboard with business performance metrics.

**Deliverables:**
- Database: `analytics` table with aggregation jobs
- Backend: Analytics query endpoints (sales, top items, revenue trends)
- Frontend: Dashboard with charts (daily revenue, order volume, top items, inventory health)
- Scheduled jobs: Daily analytics aggregation cron

---

## Module 11 — OCR Handwritten Menu Upload
**Goal:** Upload a photo of a handwritten menu; extract and digitize items.

**Deliverables:**
- AI Engine: OCR service using Tesseract or Google Vision API
- Backend: `/api/v1/ai/ocr` route forwarding to Python service
- Frontend: Image upload UI, extracted items review and edit screen, bulk save to menu

---

## Module 12 — AI Features (Full Suite)
**Goal:** Complete AI capabilities deployed and integrated.

**Deliverables:**
- **Sales Forecasting:** Train model on order history; return 7/30-day forecast
- **Inventory Prediction:** Use forecast to calculate restocking quantities
- **Sentiment Analysis:** Process all reviews; display sentiment dashboard
- **AI Chatbot:** Gemini API chatbot with restaurant data context
- Frontend: AI dashboard section with forecast charts, sentiment summary, chatbot widget

---

---

# PART 10 — MASTER_CONTEXT.md

---

```markdown
# MASTER_CONTEXT.md
# SmartServe AI — Permanent Project Context
# Version: 1.0 | Last Updated: 2025

---

## 1. PROJECT OVERVIEW

**Project Name:** SmartServe AI  
**Type:** Final Year Engineering Project  
**Description:** AI-Powered Restaurant Management System — a full-stack web application that digitizes restaurant operations including ordering, kitchen management, billing, inventory, employee management, and AI-driven decision support.

**Target Users:** Restaurant Owners, Managers, Cashiers, Waiters, Kitchen Staff, Customers

---

## 2. TECHNOLOGY STACK

### Frontend
- Framework: React.js with TypeScript
- Styling: Tailwind CSS
- State: React Context API + Zustand (for complex state)
- Routing: React Router v6
- HTTP Client: Axios
- Real-Time: Socket.io-client
- Build Tool: Vite

### Backend
- Runtime: Node.js
- Framework: Express.js with TypeScript
- Real-Time: Socket.io
- Auth: JSON Web Tokens (JWT) + bcrypt
- Validation: Zod
- Logging: Winston

### Database
- Primary DB: PostgreSQL (hosted on Supabase)
- Client: Supabase JS Client / node-postgres (pg)
- File Storage: Supabase Storage

### AI Engine
- Language: Python 3.10+
- Framework: FastAPI (HTTP API for AI services)
- Libraries: Pandas, NumPy, Scikit-learn, Pillow
- AI APIs: OpenAI API / Google Gemini API
- OCR: Tesseract / Google Vision API

### Deployment
- Version Control: GitHub
- Containerization: Docker + Docker Compose
- Frontend Hosting: Vercel
- Backend Hosting: Railway / Render
- AI Engine: Railway / Fly.io

---

## 3. FOLDER STRUCTURE

```
SmartServe-AI/
├── frontend/        # React + TypeScript + Tailwind
├── backend/         # Node.js + Express.js
├── database/        # Migrations, seeds, schema
├── ai-engine/       # Python AI microservice
├── docs/            # All documentation
└── deployment/      # Docker, Nginx, env configs
```

See `/docs/ARCHITECTURE.md` for full folder tree.

---

## 4. DATABASE OVERVIEW

**Database:** PostgreSQL on Supabase  
**Schema:** 15 core tables

| Table | Purpose |
|-------|---------|
| roles | System user roles |
| users | All authenticated users |
| employees | Staff extended profiles |
| customers | Customer records |
| restaurant_tables | Physical tables + QR tokens |
| menu_categories | Menu groupings |
| menu_items | Food/beverage items |
| orders | Order sessions |
| order_items | Line items per order |
| payments | Payment records |
| inventory | Stock items |
| inventory_transactions | Stock change audit log |
| suppliers | Vendor records |
| purchase_orders | Supplier purchase orders |
| reviews | Customer reviews + sentiment |
| analytics | Pre-aggregated metrics |

**All UUIDs use `gen_random_uuid()`.**  
**All timestamps use `DEFAULT NOW()` in UTC.**  
**All financial decimals use `DECIMAL(10,2)`.**

---

## 5. API STANDARDS

- **Base URL:** `/api/v1`
- **Auth Header:** `Authorization: Bearer <JWT>`
- **Content Type:** `application/json`
- **Response Format:**
```json
{
  "success": true | false,
  "message": "...",
  "data": { ... } | null,
  "error": null | { "code": "...", "details": [...] }
}
```
- **HTTP Status Codes:** 200, 201, 400, 401, 403, 404, 422, 429, 500
- **Pagination:** `?page=1&limit=20` query params on list endpoints
- **Filtering:** `?status=active&date=2024-01-01` query params
- **Sorting:** `?sortBy=created_at&order=desc`

---

## 6. CODING STANDARDS

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig)
- No `any` types — use proper interfaces or `unknown`
- All functions must have explicit return types
- Use `interface` for object shapes, `type` for unions/primitives

### React
- Functional components only (no class components)
- Custom hooks for reusable logic
- Components in PascalCase
- One component per file
- Props interfaces named `ComponentNameProps`

### Node.js / Express
- Async/await everywhere (no raw callbacks or `.then()` chains)
- All async route handlers wrapped in try/catch
- Controllers are thin — business logic lives in services
- Services are injected, not instantiated directly in controllers

### General
- No magic numbers — use named constants
- DRY principle: extract repeated logic into utilities
- ESLint + Prettier enforced on all files
- No `console.log` in production code — use Winston logger

---

## 7. NAMING CONVENTIONS

| Entity | Convention | Example |
|--------|-----------|---------|
| Files (TypeScript) | kebab-case | `order.service.ts` |
| React Components | PascalCase | `OrderCard.tsx` |
| Variables / Functions | camelCase | `getOrderById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Database tables | snake_case | `order_items` |
| Database columns | snake_case | `created_at` |
| API endpoints | kebab-case | `/api/v1/menu-items` |
| CSS classes | Tailwind utility classes | `bg-blue-500 px-4 py-2` |
| Environment variables | UPPER_SNAKE_CASE | `JWT_SECRET` |
| Git branches | kebab-case | `feature/menu-management` |
| Git commits | Conventional Commits | `feat: add order status update` |

---

## 8. SECURITY RULES

1. **Never commit `.env` files** — always use `.env.example` as template.
2. **Never store plain-text passwords** — always bcrypt with cost 12.
3. **All protected routes must use `authenticate` + `authorize` middleware.**
4. **Validate all request inputs** using Zod before controller logic.
5. **Use parameterized queries only** — never concatenate user input into SQL.
6. **Apply rate limiting** to all routes, stricter on auth routes.
7. **Set CORS** to frontend origin only.
8. **Use helmet.js** for HTTP security headers.
9. **JWT secret must be at least 256-bit random string.**
10. **Log all sensitive operations** (login, payment, role change) with user ID.

---

## 9. DEVELOPMENT RULES

### Module Development Rule
- Complete one module fully (backend + frontend + tests) before starting the next.
- Every new Claude session must begin by reading this MASTER_CONTEXT.md.
- State which module is being worked on at the start of each session.

### Git Workflow
- `main` — stable production-ready code only
- `develop` — active development branch
- `feature/<module-name>` — feature branches (merged into develop)
- Pull Request required to merge into `main`
- Commit message format: `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`

### Environment Variables Required
```
# Backend
PORT=3001
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
JWT_SECRET=...
JWT_EXPIRES_IN=24h
AI_ENGINE_URL=http://localhost:8000

# Frontend
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOCKET_URL=http://localhost:3001

# AI Engine
OPENAI_API_KEY=...
GEMINI_API_KEY=...
GOOGLE_VISION_API_KEY=...
```

### Module Development Checklist
Before declaring a module complete:
- [ ] Database migrations written and tested
- [ ] All API endpoints implemented and returning correct responses
- [ ] Auth + RBAC middleware applied to all routes
- [ ] Input validation on all POST/PUT/PATCH routes
- [ ] Frontend pages built and connected to API
- [ ] Real-time events wired (if applicable)
- [ ] Basic error handling in place
- [ ] No hardcoded values (all in env or config)

---

## 10. MODULE STATUS TRACKER

| Module | Status |
|--------|--------|
| 1 - Foundation & Planning | ✅ Complete |
| 2 - Authentication | 🔲 Not Started |
| 3 - Menu Management | 🔲 Not Started |
| 4 - QR Ordering System | 🔲 Not Started |
| 5 - Waiter Mobile Ordering | 🔲 Not Started |
| 6 - Kitchen Display System | 🔲 Not Started |
| 7 - Billing System | 🔲 Not Started |
| 8 - Inventory Management | 🔲 Not Started |
| 9 - Employee Management | 🔲 Not Started |
| 10 - Analytics Dashboard | 🔲 Not Started |
| 11 - OCR Menu Upload | 🔲 Not Started |
| 12 - AI Features | 🔲 Not Started |

---

*This file is the single source of truth for the SmartServe AI project.*  
*Read this file at the start of every Claude development session.*  
*Update the Module Status Tracker after each module is completed.*
```

---

---

*End of SmartServe AI Foundation Document — v1.0*