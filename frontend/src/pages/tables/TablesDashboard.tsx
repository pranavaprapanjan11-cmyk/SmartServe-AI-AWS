// File: frontend/src/pages/tables/TablesDashboard.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as tableService from '../../services/tableService';
import * as orderService from '../../services/orderService';
import { triggerLiveActivity } from '../../utils/activityTrigger';

interface ActiveAnimation {
  id: string;
  type: 'waiter' | 'food' | 'chef' | 'cleaning' | 'payment';
  tableNumber: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const SECTIONS = ['Main Hall', 'VIP', 'Outdoor', 'Family Area', 'Rooftop'];

const TablesDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const currentRole = user?.role || '';
  
  // Access control flags
  const isOwnerOrManager = ['OWNER', 'RESTAURANT_OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(currentRole);
  const isWaiter = currentRole === 'WAITER';
  const isCashier = currentRole === 'CASHIER';
  const canManage = isOwnerOrManager || isWaiter;

  // State
  const [tables, setTables] = useState<tableService.RestaurantTable[]>([]);
  const [orders, setOrders] = useState<orderService.Order[]>([]);
  const [activeSection, setActiveSection] = useState<string>('Main Hall');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected table context
  const [selectedTable, setSelectedTable] = useState<tableService.RestaurantTable | null>(null);
  const [showSeatModal, setShowSeatModal] = useState<boolean>(false);
  const [showReserveModal, setShowReserveModal] = useState<boolean>(false);
  
  // Seating form
  const [waiterName, setWaiterName] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(2);

  // Reservation form
  const [reservedFor, setReservedFor] = useState<string>('');
  const [reservedPhone, setReservedPhone] = useState<string>('');
  const [reservationTime, setReservationTime] = useState<string>('');
  const [isEditingReservation, setIsEditingReservation] = useState<boolean>(false);

  // Live animation state
  const [animations, setAnimations] = useState<ActiveAnimation[]>([]);

  // Ref to floor container
  const floorRef = useRef<HTMLDivElement>(null);

  // Fetch tables and orders
  const fetchTablesAndOrders = async () => {
    if (!token) return;
    try {
      // Don't show full screen spinner on re-fetch if we already have data
      if (tables.length === 0) setLoading(true);
      const [tablesData, ordersData] = await Promise.all([
        tableService.getTables(token),
        orderService.getOrders(token)
      ]);
      setTables(tablesData);
      setOrders(ordersData);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch tables and orders:', err);
      setError('Failed to fetch floor plan tables and live orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesAndOrders();

    // Listen to global order/table activities to trigger living animations on the floor twin
    const handleGlobalActivity = (e: any) => {
      const { type, data } = e.detail;
      const tableNum = Number(data?.tableNumber || data?.table_number || 1);
      
      // Look up target table in local data
      const targetTable = tables.find(t => t.table_number === tableNum);
      if (!targetTable) return;

      const targetX = targetTable.position_x + 40;
      const targetY = targetTable.position_y + 40;

      const animId = Math.random().toString(36).substring(2, 9);

      if (type === 'orderCreated') {
        // Waiter character walks from table to kitchen (let's assume kitchen is top-right corner)
        setAnimations(prev => [...prev, {
          id: animId,
          type: 'waiter',
          tableNumber: tableNum,
          startX: targetX,
          startY: targetY,
          endX: 720,
          endY: 40
        }]);
        setTimeout(() => removeAnim(animId), 2500);
      } else if (type === 'orderServed') {
        // Food tray travels from kitchen (top-right) to table
        setAnimations(prev => [...prev, {
          id: animId,
          type: 'food',
          tableNumber: tableNum,
          startX: 720,
          startY: 40,
          endX: targetX,
          endY: targetY
        }]);
        setTimeout(() => removeAnim(animId), 2500);
      } else if (type === 'paymentSuccess') {
        // Payment cash confirmation pulse
        setAnimations(prev => [...prev, {
          id: animId,
          type: 'payment',
          tableNumber: tableNum,
          startX: targetX,
          startY: targetY,
          endX: targetX,
          endY: targetY
        }]);
        setTimeout(() => removeAnim(animId), 2000);
      }

      fetchTablesAndOrders();
    };

    window.addEventListener('liveActivityEvent', handleGlobalActivity);
    return () => window.removeEventListener('liveActivityEvent', handleGlobalActivity);
  }, [token, tables]);

  const removeAnim = (id: string) => {
    setAnimations(prev => prev.filter(a => a.id !== id));
  };

  // Drag handler
  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!isEditMode || !isOwnerOrManager) return;
    e.preventDefault();
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialTableX = table.position_x;
    const initialTableY = table.position_y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      setTables(prev => prev.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            position_x: Math.max(0, Math.min(760, initialTableX + deltaX)),
            position_y: Math.max(0, Math.min(560, initialTableY + deltaY))
          };
        }
        return t;
      }));
    };

    const handleMouseUp = async (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const deltaX = upEvent.clientX - startX;
      const deltaY = upEvent.clientY - startY;
      const finalX = Math.max(0, Math.min(760, initialTableX + deltaX));
      const finalY = Math.max(0, Math.min(560, initialTableY + deltaY));
      
      try {
        await tableService.updateTable(tableId, { position_x: finalX, position_y: finalY }, token!);
      } catch (err) {
        console.error('Failed to save table position:', err);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Add table
  const handleAddTable = async () => {
    if (!token || !isOwnerOrManager) return;
    try {
      const tableNumbers = tables.map(t => t.table_number);
      const nextNumber = tableNumbers.length > 0 ? Math.max(...tableNumbers) + 1 : 1;
      
      const newTable = await tableService.createTable({
        table_number: nextNumber,
        capacity: 4,
        section: activeSection,
        shape: 'square',
        position_x: 120,
        position_y: 120
      }, token);

      setTables(prev => [...prev, newTable]);
      setSelectedTable(newTable);
    } catch (err) {
      console.error('Failed to add table:', err);
      setError('Failed to add table.');
    }
  };

  // Delete table
  const handleDeleteTable = async (id: string) => {
    if (!token || !isOwnerOrManager) return;
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await tableService.deleteTable(id, token);
      setTables(prev => prev.filter(t => t.id !== id));
      setSelectedTable(null);
    } catch (err) {
      console.error('Failed to delete table:', err);
    }
  };

  // Seating
  const handleQuickSeat = async (table: tableService.RestaurantTable) => {
    if (!token || !canManage) return;
    try {
      const updated = await tableService.updateTable(table.id, {
        status: tableService.TableStatus.OCCUPIED
      }, token);
      
      setTables(prev => prev.map(t => t.id === table.id ? updated : t));
      setSelectedTable(updated);
      triggerLiveActivity('tableOccupied', { tableNumber: table.table_number, seats: table.capacity });
      setShowSeatModal(false);
    } catch (err) {
      console.error('Quick seating failed:', err);
    }
  };

  const handleCreateOrderRedirect = (tableNum: number) => {
    navigate(`/waiter/orders/create?table=${tableNum}`);
  };

  const handleCompleteCleaning = async (table: tableService.RestaurantTable) => {
    if (!token || !canManage) return;
    try {
      const updated = await tableService.updateTable(table.id, {
        status: tableService.TableStatus.AVAILABLE
      }, token);
      
      setTables(prev => prev.map(t => t.id === table.id ? updated : t));
      setSelectedTable(updated);
      triggerLiveActivity('tableAvailable', { tableNumber: table.table_number });
    } catch (err) {
      console.error('Cleaning completion failed:', err);
    }
  };

  const handleRequestBill = async (orderId: string) => {
    if (!token || !selectedTable) return;
    try {
      await orderService.updateOrderStatus(orderId, orderService.OrderStatus.BILL_REQUESTED, token);
      const [tablesData, ordersData] = await Promise.all([
        tableService.getTables(token),
        orderService.getOrders(token)
      ]);
      setTables(tablesData);
      setOrders(ordersData);
      const updatedTable = tablesData.find(t => t.id === selectedTable.id);
      if (updatedTable) {
        setSelectedTable(updatedTable);
      }
    } catch (err) {
      console.error('Failed to request bill:', err);
    }
  };

  const handleToggleOutOfService = async (table: tableService.RestaurantTable) => {
    if (!token || !isOwnerOrManager) return;
    const newStatus = table.status === tableService.TableStatus.OUT_OF_SERVICE 
      ? tableService.TableStatus.AVAILABLE 
      : tableService.TableStatus.OUT_OF_SERVICE;

    try {
      const updated = await tableService.updateTable(table.id, {
        status: newStatus
      }, token);
      setTables(prev => prev.map(t => t.id === table.id ? updated : t));
      setSelectedTable(updated);
    } catch (err) {
      console.error('Toggling out of service failed:', err);
    }
  };

  // Reservation details
  const handleSaveReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTable || !canManage) return;
    try {
      const payload = {
        reserved_for: reservedFor,
        reserved_phone: reservedPhone,
        reservation_time: new Date(reservationTime).toISOString()
      };

      const updated = isEditingReservation 
        ? await tableService.editReservation(selectedTable.id, payload, token)
        : await tableService.reserveTable(selectedTable.id, payload, token);

      setTables(prev => prev.map(t => t.id === selectedTable.id ? updated : t));
      setSelectedTable(updated);
      setShowReserveModal(false);
      setIsEditingReservation(false);
      setReservedFor('');
      setReservedPhone('');
      setReservationTime('');
      
      triggerLiveActivity('notificationsBadge');
    } catch (err) {
      console.error('Saving reservation failed:', err);
    }
  };

  const handleCancelReservation = async (table: tableService.RestaurantTable) => {
    if (!token || !canManage) return;
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      const updated = await tableService.cancelReservation(table.id, token);
      setTables(prev => prev.map(t => t.id === table.id ? updated : t));
      setSelectedTable(updated);
    } catch (err) {
      console.error('Canceling reservation failed:', err);
    }
  };

  // Helpers to get table active order details
  const getActiveOrderForTable = (tableNumber: number, currentOrderId?: string | null) => {
    if (currentOrderId) {
      return orders.find(o => o.id === currentOrderId);
    }
    // Fallback: match by table number where status is not PAID
    return orders.find(o => o.table_number === tableNumber && o.status !== orderService.OrderStatus.PAID);
  };

  // Get table border and colors matching state
  const getTableClasses = (table: tableService.RestaurantTable) => {
    const isSelected = selectedTable?.id === table.id;
    const base = `absolute flex flex-col justify-between p-3 border transition-all duration-300 ${
      isEditMode ? 'cursor-move ring-1 ring-cyan-400/30' : 'cursor-pointer hover:scale-102 hover:shadow-lg'
    } ${isSelected ? 'ring-2 ring-cyan-400' : ''}`;
    
    let shapeClass = 'rounded-2xl';
    let sizeClass = 'w-24 h-24';
    if (table.shape === 'round') shapeClass = 'rounded-full';
    if (table.shape === 'rectangle') sizeClass = 'w-36 h-24';

    let colorClass = '';
    switch (table.status) {
      case tableService.TableStatus.AVAILABLE:
        colorClass = 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300 shadow-emerald-500/5';
        break;
      case tableService.TableStatus.OCCUPIED:
        colorClass = 'border-rose-500/30 bg-rose-500/5 text-rose-300 shadow-rose-500/5';
        break;
      case tableService.TableStatus.RESERVED:
        colorClass = 'border-amber-500/30 bg-amber-500/5 text-amber-300 shadow-amber-500/5';
        break;
      case tableService.TableStatus.CLEANING:
        colorClass = 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300 shadow-cyan-500/5';
        break;
      case tableService.TableStatus.OUT_OF_SERVICE:
        colorClass = 'border-slate-500/30 bg-slate-500/5 text-slate-400 shadow-none';
        break;
    }

    return `${base} ${shapeClass} ${sizeClass} ${colorClass}`;
  };

  const sectionTables = tables.filter(t => t.section === activeSection);
  const totalInSec = sectionTables.length;
  const availInSec = sectionTables.filter(t => t.status === tableService.TableStatus.AVAILABLE).length;
  const occupiedInSec = sectionTables.filter(t => t.status === tableService.TableStatus.OCCUPIED).length;
  const reservedInSec = sectionTables.filter(t => t.status === tableService.TableStatus.RESERVED).length;
  const cleaningInSec = sectionTables.filter(t => t.status === tableService.TableStatus.CLEANING).length;

  return (
    <div className="space-y-6 text-white pb-16">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">OPERATIONS CONTROL</p>
          <h1 className="mt-1 text-3xl font-bold tracking-wide">Table Floor Management</h1>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {isOwnerOrManager && (
            <>
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition border ${
                  isEditMode 
                    ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/10' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {isEditMode ? 'Save Layout' : 'Edit Floor Plan'}
              </button>
              <button
                onClick={handleAddTable}
                className="rounded-full bg-cyan-500 hover:bg-cyan-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 transition"
              >
                Add Table
              </button>
            </>
          )}
          <button
            onClick={fetchTablesAndOrders}
            className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition"
          >
            Refresh Floor
          </button>
        </div>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4">
          <p className="text-3xs font-extrabold uppercase tracking-widest text-slate-500">Total Tables</p>
          <p className="mt-1.5 text-2xl font-bold text-cyan-300">{totalInSec}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
          <p className="text-3xs font-extrabold uppercase tracking-widest text-emerald-400">🟢 Available</p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-300">{availInSec}</p>
        </div>
        <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4">
          <p className="text-3xs font-extrabold uppercase tracking-widest text-rose-400">🔴 Occupied</p>
          <p className="mt-1.5 text-2xl font-bold text-rose-300">{occupiedInSec}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4">
          <p className="text-3xs font-extrabold uppercase tracking-widest text-amber-400">🟡 Reserved</p>
          <p className="mt-1.5 text-2xl font-bold text-amber-300">{reservedInSec}</p>
        </div>
        <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4">
          <p className="text-3xs font-extrabold uppercase tracking-widest text-cyan-400">🔵 Cleaning</p>
          <p className="mt-1.5 text-2xl font-bold text-cyan-300">{cleaningInSec}</p>
        </div>
      </div>

      {/* Main interface layout */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        
        {/* Floor panel */}
        <div className="space-y-4">
          {/* Section Selector */}
          <div className="flex border-b border-white/5 space-x-1 pb-1">
            {SECTIONS.map(sec => (
              <button
                key={sec}
                onClick={() => {
                  setActiveSection(sec);
                  setSelectedTable(null);
                }}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  activeSection === sec 
                    ? 'border-b-2 border-cyan-400 text-cyan-300' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Blueprint Canvas */}
          <div 
            ref={floorRef}
            className="relative h-[650px] w-full rounded-[2rem] border border-cyan-500/10 bg-[#070b13] overflow-hidden shadow-2xl"
          >
            {/* Grid blueprint overlays */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Kitchen Station overlay representing top right area */}
            <div className="absolute top-4 right-4 z-10 flex flex-col items-center justify-center border border-white/10 rounded-2xl bg-slate-950/80 px-4 py-3 backdrop-blur-md">
              <span className="text-sm font-extrabold text-cyan-400 uppercase tracking-widest">KITCHEN</span>
              <span className="text-[10px] text-slate-500 font-semibold mt-1">👨‍🍳 Dispatch Station</span>
            </div>

            {/* Warning banner in edit mode */}
            {isEditMode && (
              <div className="absolute top-4 left-4 z-10 max-w-md rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 tracking-wide">
                🛠️ FLOOR PLAN EDITOR ACTIVE — Drag and drop tables to reposition them. Coordinates auto-save.
              </div>
            )}

            {/* List Tables */}
            {loading && tables.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              </div>
            ) : sectionTables.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-500">
                <span className="text-3xl">🪑</span>
                <p className="mt-2 text-xs uppercase tracking-wider">No tables in this section</p>
                {isOwnerOrManager && (
                  <button 
                    onClick={handleAddTable}
                    className="mt-4 rounded-full bg-cyan-500/10 border border-cyan-400/20 px-4 py-1.5 text-2xs text-cyan-300 uppercase font-bold"
                  >
                    Create Table
                  </button>
                )}
              </div>
            ) : (
              sectionTables.map(table => {
                const activeOrder = getActiveOrderForTable(table.table_number, table.current_order_id);
                
                return (
                  <div
                    key={table.id}
                    style={{
                      left: `${table.position_x}px`,
                      top: `${table.position_y}px`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, table.id)}
                    onClick={() => !isEditMode && setSelectedTable(table)}
                    className={getTableClasses(table)}
                  >
                    {/* Top Bar: Table Number */}
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-bold text-white uppercase">T{table.table_number}</span>
                      <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-widest">
                        👤 {table.capacity}
                      </span>
                    </div>

                    {/* Body visual animations / states */}
                    <div className="flex flex-col items-center justify-center flex-1 my-1">
                      {table.status === tableService.TableStatus.CLEANING && (
                        <div className="flex flex-col items-center">
                          <motion.span 
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                            className="text-lg"
                          >
                            🧹
                          </motion.span>
                          <span className="text-[8px] text-cyan-400 mt-1 uppercase tracking-widest font-bold">
                            Cleaning
                          </span>
                        </div>
                      )}
                      
                      {table.status === tableService.TableStatus.RESERVED && (
                        <div className="flex flex-col items-center">
                          <motion.span
                            animate={{ scale: [0.95, 1.05, 0.95] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-lg text-amber-300"
                          >
                            🎗️
                          </motion.span>
                          <span className="text-[8px] text-amber-300 mt-1 uppercase tracking-widest font-bold">
                            Reserved
                          </span>
                        </div>
                      )}

                      {table.status === tableService.TableStatus.OCCUPIED && (
                        <div className="flex flex-col items-center">
                          {activeOrder?.status === orderService.OrderStatus.PREPARING ? (
                            // Chef cooking heat pulse
                            <motion.div
                              animate={{ scale: [1, 1.1, 1], filter: ['drop-shadow(0 0 2px rgba(245,158,11,0.5))', 'drop-shadow(0 0 8px rgba(245,158,11,0.8))', 'drop-shadow(0 0 2px rgba(245,158,11,0.5))'] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="text-xl"
                            >
                              👨‍🍳🔥
                            </motion.div>
                          ) : activeOrder?.status === orderService.OrderStatus.READY ? (
                            // Ready tray glowing glow
                            <motion.div
                              animate={{ y: [0, -3, 0] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="text-xl filter drop-shadow(0 0 6px #10b981)"
                            >
                              🛎️🍕
                            </motion.div>
                          ) : activeOrder?.status === orderService.OrderStatus.SERVED ? (
                            // Food served on table
                            <span className="text-xl">🍽️</span>
                          ) : activeOrder?.status === ('BILL_REQUESTED' as any) || activeOrder?.status === ('CHECKOUT_OPEN' as any) || activeOrder?.status === ('ON_HOLD' as any) ? (
                            // Bill requested / Checkout
                            <motion.span
                              animate={{ scale: [1, 1.15, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="text-xl filter drop-shadow(0 0 4px #fbbf24)"
                            >
                              🧾💵
                            </motion.span>
                          ) : (
                            // Ticket / Waiter walking state
                            <span className="text-lg">🚶👔</span>
                          )}
                          <span className="text-[8px] text-slate-400 mt-1 font-semibold truncate max-w-[80px]">
                            {activeOrder ? activeOrder.status : 'Occupied'}
                          </span>
                        </div>
                      )}

                      {table.status === tableService.TableStatus.OUT_OF_SERVICE && (
                        <span className="text-[10px] uppercase text-slate-500 tracking-widest font-extrabold">
                          🛠️ OOS
                        </span>
                      )}

                      {table.status === tableService.TableStatus.AVAILABLE && (
                        <div className="flex flex-col items-center">
                          <motion.span
                            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.7, 1, 0.7] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="h-2 w-2 rounded-full bg-emerald-400"
                          />
                          <span className="text-[8px] text-emerald-400 mt-1 uppercase tracking-widest font-bold">
                            Free
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Table status badge footer */}
                    <div className="flex justify-between items-center text-4xs uppercase tracking-widest font-bold text-slate-500">
                      <span>{table.shape}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        table.status === tableService.TableStatus.AVAILABLE ? 'bg-emerald-400' :
                        table.status === tableService.TableStatus.OCCUPIED ? 'bg-rose-500' :
                        table.status === tableService.TableStatus.RESERVED ? 'bg-amber-400' :
                        table.status === tableService.TableStatus.CLEANING ? 'bg-cyan-400' : 'bg-slate-500'
                      }`} />
                    </div>
                  </div>
                );
              })
            )}

            {/* Rendering Floating micro-animations (Waiter / Food Tray Overlay) */}
            <AnimatePresence>
              {animations.map(anim => (
                <motion.div
                  key={anim.id}
                  initial={{ x: anim.startX - 15, y: anim.startY - 15, opacity: 0, scale: 0.5 }}
                  animate={{ x: anim.endX - 15, y: anim.endY - 15, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.2, ease: 'easeInOut' }}
                  className="absolute pointer-events-none z-30 flex items-center justify-center h-8 w-8 rounded-full bg-slate-900/90 border border-cyan-400/50 shadow-xl"
                >
                  <span className="text-sm">
                    {anim.type === 'waiter' ? '🏃👔' : anim.type === 'food' ? '🛎️🍕' : '💳💰'}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Details Panel Sidebar (Right) */}
        <div>
          <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl h-full flex flex-col justify-between">
            {selectedTable ? (() => {
              const activeOrder = getActiveOrderForTable(selectedTable.table_number, selectedTable.current_order_id);
              
              return (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Table Operations</p>
                      {isOwnerOrManager && (
                        <button
                          onClick={() => handleDeleteTable(selectedTable.id)}
                          className="text-3xs font-bold uppercase tracking-widest text-rose-400 hover:text-rose-300"
                        >
                          Delete Table
                        </button>
                      )}
                    </div>
                    <h2 className="mt-2 text-4xl font-bold text-white tracking-tight">Table {selectedTable.table_number}</h2>
                    <p className="text-xs text-slate-400 mt-1">Section: {selectedTable.section} | Shape: {selectedTable.shape} | Capacity: {selectedTable.capacity} seats</p>
                  </div>

                  <hr className="border-white/5" />

                  {/* Status indicator row */}
                  <div className="rounded-3xl border border-white/5 bg-[#0a0e1a] p-4 flex items-center justify-between">
                    <div>
                      <p className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Current Status</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        {selectedTable.status === tableService.TableStatus.OCCUPIED && activeOrder
                          ? `OCCUPIED (${activeOrder.status})` 
                          : selectedTable.status}
                      </p>
                    </div>
                    <span className={`h-4.5 w-4.5 rounded-full ${
                      selectedTable.status === tableService.TableStatus.AVAILABLE ? 'bg-emerald-400 animate-pulse' :
                      selectedTable.status === tableService.TableStatus.OCCUPIED ? 'bg-rose-500' :
                      selectedTable.status === tableService.TableStatus.RESERVED ? 'bg-amber-400 animate-pulse' :
                      selectedTable.status === tableService.TableStatus.CLEANING ? 'bg-cyan-400' : 'bg-slate-500'
                    }`} />
                  </div>

                  {/* Reservation Detail details */}
                  {selectedTable.status === tableService.TableStatus.RESERVED && (
                    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                      <p className="text-4xs font-extrabold uppercase tracking-widest text-amber-400">Reservation Information</p>
                      <p className="text-sm font-semibold">Reserved for: <span className="text-white">{selectedTable.reserved_for}</span></p>
                      <p className="text-2xs text-slate-400">Phone: {selectedTable.reserved_phone}</p>
                      <p className="text-2xs text-slate-400">Time: {selectedTable.reservation_time ? new Date(selectedTable.reservation_time).toLocaleString() : ''}</p>
                      
                      {canManage && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => {
                              setReservedFor(selectedTable.reserved_for || '');
                              setReservedPhone(selectedTable.reserved_phone || '');
                              const d = new Date(selectedTable.reservation_time || '');
                              const tzoffset = d.getTimezoneOffset() * 60000;
                              const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, -1).substring(0, 16);
                              setReservationTime(localISOTime);
                              setIsEditingReservation(true);
                              setShowReserveModal(true);
                            }}
                            className="flex-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 py-1.5 text-4xs font-bold uppercase tracking-widest transition"
                          >
                            Modify
                          </button>
                          <button
                            onClick={() => handleCancelReservation(selectedTable)}
                            className="flex-1 rounded-full bg-rose-500/15 border border-rose-500/20 text-rose-300 hover:bg-rose-500/25 py-1.5 text-4xs font-bold uppercase tracking-widest transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Occupancy and Active Orders Info */}
                  {selectedTable.status === tableService.TableStatus.OCCUPIED && (
                    <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2.5">
                      <p className="text-4xs font-extrabold uppercase tracking-widest text-rose-400">Active Session Details</p>
                      {selectedTable.last_occupied_at && (
                        <p className="text-3xs text-slate-400">Seated since: {new Date(selectedTable.last_occupied_at).toLocaleTimeString()}</p>
                      )}
                      
                      {activeOrder ? (
                        <div className="space-y-3 pt-1">
                          <div className="text-2xs text-slate-300">
                            <p>Order ID: <span className="font-semibold text-white truncate inline-block max-w-[150px] align-bottom">{activeOrder.id}</span></p>
                            <p className="mt-1">Server/Waiter: <span className="font-semibold text-white">{activeOrder.waiter_name || 'Assigned'}</span></p>
                            <p className="mt-1">Total Bill: <span className="font-semibold text-emerald-400">₹{activeOrder.total_amount?.toFixed(2)}</span></p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/waiter/orders/${activeOrder.id}`)}
                              className="flex-1 rounded-full bg-rose-500 text-slate-950 font-bold hover:bg-rose-600 py-2 text-3xs uppercase tracking-widest transition"
                            >
                              View Ticket
                            </button>
                            {activeOrder.status === orderService.OrderStatus.SERVED ? (
                              <button
                                onClick={() => handleRequestBill(activeOrder.id)}
                                className="flex-1 rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-600 py-2 text-3xs uppercase tracking-widest transition"
                              >
                                Request Bill
                              </button>
                            ) : (
                              (activeOrder.status === orderService.OrderStatus.BILL_REQUESTED ||
                               activeOrder.status === orderService.OrderStatus.CHECKOUT_OPEN ||
                               activeOrder.status === orderService.OrderStatus.ON_HOLD) && (
                                <button
                                  onClick={() => navigate(`/billing/editor?orderId=${activeOrder.id}`)}
                                  className="flex-1 rounded-full bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-600 py-2 text-3xs uppercase tracking-widest transition"
                                >
                                  Checkout Bill
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <p className="text-2xs text-slate-400">Table occupied without active order (Quick seated).</p>
                          {!isCashier && (
                            <button
                              onClick={() => handleCreateOrderRedirect(selectedTable.table_number)}
                              className="w-full rounded-full bg-rose-500 text-slate-950 font-bold hover:bg-rose-600 py-2 text-3xs uppercase tracking-widest transition"
                            >
                              Create Order Ticket
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Operations Actions drawer details based on status */}
                  {canManage && (
                    <div className="space-y-3 pt-4">
                      <h4 className="text-4xs font-extrabold uppercase tracking-widest text-slate-500">Available Operations</h4>
                      
                      {selectedTable.status === tableService.TableStatus.AVAILABLE && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleQuickSeat(selectedTable)}
                            className="rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20 py-2.5 text-xs font-bold uppercase tracking-wider transition"
                          >
                            Quick Seat
                          </button>
                          <button
                            onClick={() => handleCreateOrderRedirect(selectedTable.table_number)}
                            className="rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-600 py-2.5 text-xs font-bold uppercase tracking-wider transition"
                          >
                            Take Order
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingReservation(false);
                              setReservedFor('');
                              setReservedPhone('');
                              setReservationTime('');
                              setShowReserveModal(true);
                            }}
                            className="col-span-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 py-2.5 text-xs font-bold uppercase tracking-wider transition"
                          >
                            Book Reservation
                          </button>
                        </div>
                      )}

                      {selectedTable.status === tableService.TableStatus.CLEANING && (
                        <button
                          onClick={() => handleCompleteCleaning(selectedTable)}
                          className="w-full rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-600 py-3 text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-cyan-500/15"
                        >
                          Mark Cleaning Completed
                        </button>
                      )}

                      {selectedTable.status === tableService.TableStatus.RESERVED && (
                        <button
                          onClick={() => handleQuickSeat(selectedTable)}
                          className="w-full rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider transition"
                        >
                          Seat Customer (Seat Now)
                        </button>
                      )}

                      {isOwnerOrManager && (
                        <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                          <button
                            onClick={() => handleToggleOutOfService(selectedTable)}
                            className={`w-full rounded-full border py-2 text-2xs font-bold uppercase tracking-widest transition ${
                              selectedTable.status === tableService.TableStatus.OUT_OF_SERVICE
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                                : 'bg-slate-500/15 border-slate-500/30 text-slate-300 hover:bg-slate-500/25'
                            }`}
                          >
                            {selectedTable.status === tableService.TableStatus.OUT_OF_SERVICE 
                              ? 'Mark Available' 
                              : 'Set Out of Service'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="flex flex-col items-center justify-center text-slate-500 py-24 my-auto">
                <span className="text-5xl mb-4">🍽️</span>
                <p className="text-xs uppercase tracking-wider text-center">Select any table card on floor layout for control panel & settings.</p>
              </div>
            )}

            {/* Quick blueprint layout instructions */}
            <div className="border-t border-white/5 pt-4 text-center">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                SmartServe Restaurant OS v2.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Modal Dialog */}
      {showReserveModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <h3 className="text-xl font-bold">
              {isEditingReservation ? 'Modify Reservation' : `Reserve Table ${selectedTable.table_number}`}
            </h3>
            
            <form onSubmit={handleSaveReservation} className="mt-4 space-y-4">
              <div>
                <label className="block text-3xs font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={reservedFor}
                  onChange={(e) => setReservedFor(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  value={reservedPhone}
                  onChange={(e) => setReservedPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  Reservation Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="flex-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 py-2.5 text-xs font-bold uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 py-2.5 text-xs font-bold uppercase tracking-wider transition"
                >
                  {isEditingReservation ? 'Save Changes' : 'Book Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesDashboard;
