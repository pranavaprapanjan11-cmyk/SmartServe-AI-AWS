import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ProtectedRoute from './routes/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import AppShell from './components/Layout/AppShell'
import CommandCenter from './pages/command-center/CommandCenter'
import DigitalTwin from './pages/restaurant/DigitalTwin'
import MenuMatrix from './pages/menu/MenuMatrix'
import OcrPanel from './pages/ocr/OcrPanel'
import OCRUpload from './pages/ocr/OCRUpload'
import OCRReview from './pages/ocr/OCRReview'
import AiOptimizer from './pages/ai/AiOptimizer'
import AIDashboard from './pages/ai/AIDashboard'
import AIAssistant from './pages/ai/AIAssistant'
import AIOperationsDashboard from './pages/ai-operations/AIOperationsDashboard'
import AddMenuItem from './pages/menu/AddMenuItem'
import EditMenuItem from './pages/menu/EditMenuItem'
import RestaurantConfig from './pages/config/RestaurantConfig'
import BillingEditor from './pages/billing/BillingEditor'
import BillingDashboard from './pages/billing/BillingDashboard'
import InventoryDashboard from './pages/inventory/InventoryDashboard'
import InventoryItems from './pages/inventory/InventoryItems'
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard'
import RecipeMapper from './pages/inventory/RecipeMapper'
import Suppliers from './pages/inventory/Suppliers'
import PurchaseOrders from './pages/inventory/PurchaseOrders'
import StockMovements from './pages/inventory/StockMovements'
import InventoryAlerts from './pages/inventory/InventoryAlerts'
import Wastage from './pages/inventory/Wastage'
import Reconciliation from './pages/inventory/Reconciliation'
import WaiterDashboard from './pages/orders/WaiterDashboard'
import CreateOrder from './pages/orders/CreateOrder'
import OrderDetails from './pages/orders/OrderDetails'
import KitchenDashboard from './pages/kitchen/KitchenDashboard'
import TablesDashboard from './pages/tables/TablesDashboard'
import CRMDashboard from './pages/crm/CRMDashboard'
import CustomersList from './pages/crm/CustomersList'
import ReservationsManager from './pages/crm/ReservationsManager'
import WaitlistManager from './pages/crm/WaitlistManager'
import EmployeesPage from './pages/employees/EmployeesPage'
import WorkspacePage from './pages/workspace/WorkspacePage'

const Analytics: React.FC = () => (
  <div className="rounded-[2rem] border surface-border surface-panel p-10 text-white shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
    <h1 className="text-3xl font-semibold">Analytics</h1>
    <p className="mt-4 text-slate-400">Sales and performance analytics placeholder.</p>
  </div>
)

const Billing: React.FC = () => (
  <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-10 text-white shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
    <h1 className="text-3xl font-semibold">Billing</h1>
    <p className="mt-4 text-slate-400">Billing and invoicing management placeholder.</p>
  </div>
)



const Welcome: React.FC = () => {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center surface-bg px-4 py-16 text-theme-primary">
      <div className="mx-auto max-w-3xl rounded-[2rem] border surface-border surface-panel-strong p-10 shadow-soft-lg backdrop-blur-xl">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-accent">SmartServe AI</p>
          <h1 className="mt-6 font-display text-5xl font-semibold text-theme-primary">Restaurant Operating System</h1>
          <p className="mt-4 text-lg text-theme-secondary">The new unified restaurant control interface for menu, operations, and service flow.</p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/auth/login" className="rounded-3xl bg-accent px-8 py-3 text-sm font-semibold text-[var(--surface)] transition hover:brightness-110">
              Sign In
            </Link>
            <Link to="/auth/register" className="rounded-3xl bg-accent-2-soft px-8 py-3 text-sm font-semibold text-accent-2 transition hover:brightness-110">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<CommandCenter />} />
        <Route path="/digital-twin" element={<DigitalTwin />} />
        <Route path="/tables" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","WAITER","CASHIER","SUPER_ADMIN"]}><TablesDashboard /></ProtectedRoute>} />
        <Route path="/menu" element={<MenuMatrix />} />
        <Route path="/menu/add" element={<AddMenuItem />} />
        <Route path="/menu/edit/:id" element={<EditMenuItem />} />
        <Route path="/ocr" element={<OcrPanel />} />
        <Route path="/ocr/upload" element={<OCRUpload />} />
        <Route path="/ocr/review" element={<OCRReview />} />
        <Route path="/ai-optimizer" element={<AiOptimizer />} />
        <Route path="/ai" element={<AIDashboard />} />
        <Route path="/ai-assistant" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","SUPER_ADMIN"]}><AIAssistant /></ProtectedRoute>} />
        <Route path="/orders" element={<Navigate to="/waiter/dashboard" replace />} />
        <Route path="/waiter/dashboard" element={<ProtectedRoute roles={["WAITER","MANAGER","OWNER","RESTAURANT_OWNER","SUPER_ADMIN"]}><WaiterDashboard /></ProtectedRoute>} />
        <Route path="/waiter/orders/create" element={<ProtectedRoute roles={["WAITER","MANAGER","OWNER","RESTAURANT_OWNER","SUPER_ADMIN"]}><CreateOrder /></ProtectedRoute>} />
        <Route path="/waiter/orders/:id" element={<ProtectedRoute roles={["WAITER","MANAGER","OWNER","RESTAURANT_OWNER","SUPER_ADMIN"]}><OrderDetails /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","CHEF","SUPER_ADMIN"]}><InventoryDashboard /></ProtectedRoute>} />
        <Route path="/inventory/items" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","CHEF","SUPER_ADMIN"]}><InventoryItems /></ProtectedRoute>} />
        <Route path="/inventory/recipes" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","CHEF","SUPER_ADMIN"]}><RecipeMapper /></ProtectedRoute>} />
        <Route path="/inventory/suppliers" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","CHEF","SUPER_ADMIN"]}><Suppliers /></ProtectedRoute>} />
        <Route path="/inventory/purchase-orders" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","CHEF","SUPER_ADMIN"]}><PurchaseOrders /></ProtectedRoute>} />
        <Route path="/inventory/transactions" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","CHEF","SUPER_ADMIN"]}><StockMovements /></ProtectedRoute>} />
        <Route path="/inventory/alerts" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","CHEF","SUPER_ADMIN"]}><InventoryAlerts /></ProtectedRoute>} />
        <Route path="/inventory/wastage" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","CHEF","SUPER_ADMIN"]}><Wastage /></ProtectedRoute>} />
        <Route path="/inventory/reconciliation" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","CHEF","SUPER_ADMIN"]}><Reconciliation /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","SUPER_ADMIN"]}><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="/ai-operations" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","SUPER_ADMIN"]}><AIOperationsDashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","SUPER_ADMIN"]}><RestaurantConfig /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute roles={["CASHIER","MANAGER","OWNER","RESTAURANT_OWNER","SUPER_ADMIN"]}><BillingDashboard /></ProtectedRoute>} />
        <Route path="/billing/editor" element={<ProtectedRoute roles={["CASHIER","MANAGER","OWNER","RESTAURANT_OWNER","SUPER_ADMIN"]}><BillingEditor /></ProtectedRoute>} />
        <Route path="/crm" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","SUPER_ADMIN","WAITER","CASHIER"]}><CRMDashboard /></ProtectedRoute>} />
        <Route path="/crm/customers" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","SUPER_ADMIN"]}><CustomersList /></ProtectedRoute>} />
        <Route path="/crm/reservations" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","SUPER_ADMIN","WAITER"]}><ReservationsManager /></ProtectedRoute>} />
        <Route path="/crm/waitlist" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","SUPER_ADMIN","WAITER"]}><WaitlistManager /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","SUPER_ADMIN"]}><EmployeesPage /></ProtectedRoute>} />
        <Route path="/workspace" element={<ProtectedRoute roles={["OWNER","RESTAURANT_OWNER","MANAGER","SUPER_ADMIN"]}><WorkspacePage /></ProtectedRoute>} />
        <Route path="/kitchen" element={<ProtectedRoute roles={["CHEF","MANAGER","OWNER","RESTAURANT_OWNER","SUPER_ADMIN"]}><KitchenDashboard/></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
