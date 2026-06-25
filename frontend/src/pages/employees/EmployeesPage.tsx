import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as empService from '../../services/employeeService';
import { Employee, Attendance, Shift, LeaveRequest, SalaryRecord, PerformanceReview } from '../../services/employeeService';

const EmployeesPage: React.FC = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'shifts' | 'performance' | 'leaves' | 'salary'>('directory');
  
  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals / Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form fields
  const [empForm, setEmpForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'WAITER' as Employee['role'],
    position: '',
    salary: 0,
    salary_frequency: 'MONTHLY' as Employee['salary_frequency'],
    hire_date: new Date().toISOString().split('T')[0]
  });
  
  const [reviewForm, setReviewForm] = useState({
    employeeId: '',
    review_period_start: new Date().toISOString().split('T')[0],
    review_period_end: new Date().toISOString().split('T')[0],
    overall_rating: 5,
    punctuality_rating: 5,
    quality_rating: 5,
    teamwork_rating: 5,
    attitude_rating: 5,
    skills_rating: 5,
    comments: '',
    strengths: '',
    areas_for_improvement: ''
  });
  
  const [shiftForm, setShiftForm] = useState({
    name: '',
    start_time: '09:00',
    end_time: '17:00',
    break_duration_minutes: 30
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    shiftId: '',
    assignedDate: new Date().toISOString().split('T')[0]
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leave_type: 'CASUAL',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: ''
  });
  
  const [salaryForm, setSalaryForm] = useState({
    employeeId: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
    base_salary: 0,
    bonus: 0,
    deductions: 0,
    notes: ''
  });

  // Resolve restaurant ID
  const restaurantId = user?.role === 'OWNER' || user?.role === 'RESTAURANT_OWNER' 
    ? user?.id 
    : (user as any)?.restaurantId || user?.id || '';

  useEffect(() => {
    if (token && restaurantId) {
      loadData();
    }
  }, [token, restaurantId, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'directory') {
        const data = await empService.getEmployees(restaurantId, token!);
        setEmployees(data);
      } else if (activeTab === 'attendance') {
        const [empData, attData] = await Promise.all([
          empService.getEmployees(restaurantId, token!),
          empService.getAttendanceReport(restaurantId, token!)
        ]);
        setEmployees(empData);
        setAttendances(attData);
      } else if (activeTab === 'shifts') {
        const [empData, shiftData] = await Promise.all([
          empService.getEmployees(restaurantId, token!),
          empService.getShifts(restaurantId, token!)
        ]);
        setEmployees(empData);
        setShifts(shiftData);
      } else if (activeTab === 'performance') {
        const [empData, revData] = await Promise.all([
          empService.getEmployees(restaurantId, token!),
          empService.getPerformanceReviews(restaurantId, token!)
        ]);
        setEmployees(empData);
        setReviews(revData);
      } else if (activeTab === 'leaves') {
        const [empData, leaveData] = await Promise.all([
          empService.getEmployees(restaurantId, token!),
          empService.getLeaveRequests(restaurantId, token!)
        ]);
        setEmployees(empData);
        setLeaves(leaveData);
      } else if (activeTab === 'salary') {
        const [empData, salaryData] = await Promise.all([
          empService.getEmployees(restaurantId, token!),
          empService.getSalaryRecords(restaurantId, token!)
        ]);
        setEmployees(empData);
        setSalaries(salaryData);
      }
    } catch (err: any) {
      console.error('Error loading employee data', err);
      setError(err?.response?.data?.error || 'Failed to fetch employee details.');
    } finally {
      setLoading(false);
    }
  };

  // CRUD handlers
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await empService.createEmployee(restaurantId, empForm, token!);
      setShowAddModal(false);
      // Reset form
      setEmpForm({
        name: '',
        email: '',
        phone: '',
        role: 'WAITER',
        position: '',
        salary: 0,
        salary_frequency: 'MONTHLY',
        hire_date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add employee');
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      await empService.updateEmployee(restaurantId, selectedEmployee.id, empForm, token!);
      setShowEditModal(false);
      setSelectedEmployee(null);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to terminate/soft delete this employee?')) return;
    try {
      await empService.deleteEmployee(restaurantId, employeeId, token!);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to terminate employee');
    }
  };

  // Attendance handlers
  const handleMarkAttendance = async (employeeId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY') => {
    try {
      await empService.markAttendance(restaurantId, { employeeId, status }, token!);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to log attendance');
    }
  };

  const handleCheckOut = async (employeeId: string) => {
    try {
      await empService.checkOutAttendance(restaurantId, employeeId, token!);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to checkout employee');
    }
  };

  // Shift handlers
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await empService.createShift(restaurantId, shiftForm, token!);
      setShowShiftModal(false);
      setShiftForm({ name: '', start_time: '09:00', end_time: '17:00', break_duration_minutes: 30 });
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create shift');
    }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await empService.assignShift(restaurantId, assignForm, token!);
      setShowAssignModal(false);
      setAssignForm({ employeeId: '', shiftId: '', assignedDate: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to assign shift');
    }
  };

  // Performance handlers
  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await empService.createPerformanceReview(restaurantId, reviewForm, token!);
      setShowReviewModal(false);
      setReviewForm({
        employeeId: '',
        review_period_start: new Date().toISOString().split('T')[0],
        review_period_end: new Date().toISOString().split('T')[0],
        overall_rating: 5,
        punctuality_rating: 5,
        quality_rating: 5,
        teamwork_rating: 5,
        attitude_rating: 5,
        skills_rating: 5,
        comments: '',
        strengths: '',
        areas_for_improvement: ''
      });
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit review');
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const start = new Date(leaveForm.start_date);
      const end = new Date(leaveForm.end_date);
      const duration_days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
      
      await empService.requestLeave(restaurantId, {
        ...leaveForm,
        duration_days
      }, token!);
      setShowLeaveModal(false);
      setLeaveForm({
        employeeId: '',
        leave_type: 'CASUAL',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit leave request');
    }
  };

  const handleApproveLeave = async (leaveId: string, actionStatus: string) => {
    try {
      await empService.approveLeave(restaurantId, leaveId, { notes: actionStatus }, token!);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update leave request status');
    }
  };

  const handleCreateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const net_salary = Number(salaryForm.base_salary) + Number(salaryForm.bonus) - Number(salaryForm.deductions);
      await empService.createSalaryRecord(restaurantId, {
        ...salaryForm,
        base_salary: Number(salaryForm.base_salary),
        bonus: Number(salaryForm.bonus),
        deductions: Number(salaryForm.deductions),
        net_salary
      }, token!);
      setShowSalaryModal(false);
      setSalaryForm({
        employeeId: '',
        month: new Date().toISOString().slice(0, 7),
        base_salary: 0,
        bonus: 0,
        deductions: 0,
        notes: ''
      });
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create salary record');
    }
  };

  const handleFinalizeSalary = async (salaryId: string) => {
    try {
      await empService.finalizeSalary(restaurantId, salaryId, token!);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to finalize salary record');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'INACTIVE': return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'ON_LEAVE': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'TERMINATED': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setEmpForm({
      name: emp.name,
      email: emp.email || '',
      phone: emp.phone || '',
      role: emp.role,
      position: emp.position || '',
      salary: emp.salary || 0,
      salary_frequency: emp.salary_frequency || 'MONTHLY',
      hire_date: emp.hire_date.split('T')[0]
    });
    setShowEditModal(true);
  };

  return (
    <div className="flex h-full flex-col p-8 text-white overflow-y-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Restaurant HR</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Employee Management</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Coordinate shifts, track attendance, log daily check-ins, manage salaries, and review staff performance reviews.
          </p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'directory' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold hover:bg-cyan-600 transition"
            >
              Add Employee
            </button>
          )}
          {activeTab === 'shifts' && (
            <>
              <button
                onClick={() => setShowShiftModal(true)}
                className="rounded-xl border border-white/10 bg-slate-950/70 px-5 py-2.5 text-sm font-semibold hover:bg-slate-900 transition"
              >
                Create Shift
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold hover:bg-cyan-600 transition"
              >
                Assign Shift
              </button>
            </>
          )}
          {activeTab === 'performance' && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold hover:bg-cyan-600 transition"
            >
              Submit Review
            </button>
          )}
          {activeTab === 'leaves' && (
            <button
              onClick={() => setShowLeaveModal(true)}
              className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold hover:bg-cyan-600 transition"
            >
              Request Leave
            </button>
          )}
          {activeTab === 'salary' && (
            <button
              onClick={() => setShowSalaryModal(true)}
              className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold hover:bg-cyan-600 transition"
            >
              Create Salary Record
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 space-x-6 text-sm overflow-x-auto">
        {(['directory', 'attendance', 'shifts', 'performance', 'leaves', 'salary'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 font-semibold uppercase tracking-wider transition whitespace-nowrap ${
              activeTab === tab ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'directory' ? 'Staff Directory' : 
             tab === 'performance' ? 'Performance Reviews' : 
             tab === 'leaves' ? 'Leave Requests' : 
             tab === 'salary' ? 'Salary Records' : tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading details...</div>
        ) : (
          <>
            {/* DIRECTORY TAB */}
            {activeTab === 'directory' && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-white/5 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Name / Contact</th>
                      <th className="px-6 py-4">Role / Position</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Salary</th>
                      <th className="px-6 py-4">Hire Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No employees found.</td>
                      </tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{emp.name}</div>
                            <div className="text-xs text-slate-500">{emp.email || emp.phone || 'No Contact Info'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-200">{emp.role}</span>
                            {emp.position && <div className="text-xs text-slate-500">{emp.position}</div>}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full border ${getStatusColor(emp.status)}`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {emp.salary ? `₹${Number(emp.salary).toLocaleString()} (${emp.salary_frequency})` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(emp.hire_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold"
                            >
                              Edit
                            </button>
                            {emp.status !== 'TERMINATED' && (
                              <button
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="text-red-400 hover:text-red-300 text-xs font-semibold"
                              >
                                Terminate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === 'attendance' && (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                {/* Active Check-In Console */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6">
                  <h2 className="text-lg font-semibold mb-4">Daily Attendance Console</h2>
                  <div className="space-y-4">
                    {employees.filter(e => e.status === 'ACTIVE').map(emp => {
                      const todayAtt = attendances.find(
                        a => a.employee_id === emp.id && 
                        a.attendance_date === new Date().toISOString().split('T')[0]
                      );
                      
                      return (
                        <div key={emp.id} className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-white/5">
                          <div>
                            <p className="font-semibold">{emp.name}</p>
                            <p className="text-xs text-slate-500">{emp.role}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {todayAtt ? (
                              <>
                                <span className={`px-2 py-0.5 text-2xs font-extrabold uppercase rounded border ${
                                  todayAtt.status === 'PRESENT' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/20 text-amber-400 bg-amber-500/10'
                                }`}>
                                  {todayAtt.status}
                                </span>
                                {todayAtt.check_in_time && (
                                  <span className="text-xs text-slate-400">
                                    In: {new Date(todayAtt.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                                {todayAtt.check_out_time ? (
                                  <span className="text-xs text-slate-400">
                                    Out: {new Date(todayAtt.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleCheckOut(emp.id)}
                                    className="px-3 py-1 rounded bg-rose-500 text-xs font-semibold hover:bg-rose-600 transition"
                                  >
                                    Check Out
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleMarkAttendance(emp.id, 'PRESENT')}
                                  className="px-2.5 py-1 bg-emerald-500 rounded text-xs font-semibold hover:bg-emerald-600 transition"
                                >
                                  Check In
                                </button>
                                <button
                                  onClick={() => handleMarkAttendance(emp.id, 'LATE')}
                                  className="px-2.5 py-1 bg-amber-500 rounded text-xs font-semibold hover:bg-amber-600 transition"
                                >
                                  Late
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* History Log */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6">
                  <h2 className="text-lg font-semibold mb-4">Recent Attendance Logs</h2>
                  <div className="space-y-3 overflow-y-auto max-h-[450px] pr-2">
                    {attendances.length === 0 ? (
                      <p className="text-center text-slate-500 py-8 text-sm">No historical logs recorded.</p>
                    ) : (
                      attendances.map(a => (
                        <div key={a.id} className="text-xs p-3 rounded-lg bg-slate-950/20 border border-white/5 space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span>{a.name || 'Staff Member'}</span>
                            <span className="text-slate-400">{new Date(a.attendance_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>{a.role} | Status: <strong className="text-cyan-400">{a.status}</strong></span>
                            {a.check_in_time && (
                              <span>
                                {new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {a.check_out_time ? ` - ${new Date(a.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SHIFTS TAB */}
            {activeTab === 'shifts' && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Available Shifts */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6">
                  <h2 className="text-lg font-semibold mb-4">Configured Shifts</h2>
                  <div className="space-y-4">
                    {shifts.length === 0 ? (
                      <p className="text-center text-slate-500 py-8 text-sm">No shifts configured yet.</p>
                    ) : (
                      shifts.map(sh => (
                        <div key={sh.id} className="p-4 bg-slate-950/40 rounded-xl border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-white">{sh.name}</p>
                            <p className="text-xs text-slate-400">Timings: {sh.start_time} - {sh.end_time}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded">Break: {sh.break_duration_minutes} min</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Shift Schedule instructions or info */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Shift Scheduling</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Assign shift rotations to employees based on operating requirements. You can schedule morning, afternoon, night, and special event shifts here.
                    </p>
                    <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                      Use the "Assign Shift" button in the top right to schedule an employee on a calendar day.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/5 text-xs text-slate-500">
                    * Shift assignments automatically update employee dashboards and task priorities.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6">
                <h2 className="text-lg font-semibold mb-6">Staff Performance Reviews</h2>
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <p className="text-center text-slate-500 py-8 text-sm">No reviews submitted yet.</p>
                  ) : (
                    reviews.map(r => {
                      const emp = employees.find(e => e.id === r.employee_id);
                      return (
                        <div key={r.id} className="p-5 bg-slate-950/40 rounded-xl border border-white/5 space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-white">{emp?.name || 'Staff Member'}</p>
                              <p className="text-xs text-slate-500">Period: {new Date(r.review_period_start).toLocaleDateString()} - {new Date(r.review_period_end).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 text-xs text-cyan-400 font-bold">
                              Overall Rating: {r.overall_rating} / 5
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-2xs uppercase text-slate-400 pt-2 border-t border-white/5">
                            <div>Punctuality: <strong className="text-white">{r.punctuality_rating}</strong></div>
                            <div>Quality: <strong className="text-white">{r.quality_rating}</strong></div>
                            <div>Teamwork: <strong className="text-white">{r.teamwork_rating}</strong></div>
                            <div>Attitude: <strong className="text-white">{r.attitude_rating}</strong></div>
                            <div>Skills: <strong className="text-white">{r.skills_rating}</strong></div>
                          </div>
                          {r.comments && (
                            <p className="text-slate-300 text-xs italic mt-2">"{r.comments}"</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* LEAVES TAB */}
            {activeTab === 'leaves' && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6">
                <h2 className="text-lg font-semibold mb-6">Leave Requests</h2>
                <div className="space-y-4">
                  {leaves.length === 0 ? (
                    <p className="text-center text-slate-500 py-8 text-sm">No leave requests found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-white/5 text-xs uppercase text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3">Leave Type</th>
                            <th className="px-4 py-3">Dates</th>
                            <th className="px-4 py-3">Days</th>
                            <th className="px-4 py-3">Reason</th>
                            <th className="px-4 py-3 text-xs uppercase text-slate-400">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {leaves.map((l) => {
                            const emp = employees.find(e => e.id === l.employee_id);
                            return (
                              <tr key={l.id} className="hover:bg-white/5 transition">
                                <td className="px-4 py-3 font-semibold text-white">{emp?.name || 'Unknown'}</td>
                                <td className="px-4 py-3 text-xs">{l.leave_type}</td>
                                <td className="px-4 py-3 text-xs">
                                  {new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-xs font-semibold">{l.duration_days}</td>
                                <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">{l.reason || '-'}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 text-2xs font-bold rounded-md uppercase ${
                                    l.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                                    l.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {l.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {l.status === 'PENDING' && (
                                    <div className="flex justify-end gap-2">
                                      <button 
                                        onClick={() => handleApproveLeave(l.id, 'APPROVED')} 
                                        className="text-xs text-green-400 hover:text-green-300 font-semibold"
                                      >
                                        Approve
                                      </button>
                                      <button 
                                        onClick={() => handleApproveLeave(l.id, 'REJECTED')} 
                                        className="text-xs text-red-400 hover:text-red-300 font-semibold"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SALARIES TAB */}
            {activeTab === 'salary' && (
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6">
                <h2 className="text-lg font-semibold mb-6">Salary Records</h2>
                <div className="space-y-4">
                  {salaries.length === 0 ? (
                    <p className="text-center text-slate-500 py-8 text-sm">No salary records found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-white/5 text-xs uppercase text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3">Month</th>
                            <th className="px-4 py-3">Base Salary</th>
                            <th className="px-4 py-3">Bonus</th>
                            <th className="px-4 py-3">Deductions</th>
                            <th className="px-4 py-3">Net Salary</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {salaries.map((s) => {
                            const emp = employees.find(e => e.id === s.employee_id);
                            return (
                              <tr key={s.id} className="hover:bg-white/5 transition">
                                <td className="px-4 py-3 font-semibold text-white">{emp?.name || 'Unknown'}</td>
                                <td className="px-4 py-3 text-xs">{s.month}</td>
                                <td className="px-4 py-3 text-xs">₹{s.base_salary}</td>
                                <td className="px-4 py-3 text-xs text-green-400">+₹{s.bonus || 0}</td>
                                <td className="px-4 py-3 text-xs text-red-400">-₹{s.deductions || 0}</td>
                                <td className="px-4 py-3 font-bold text-white">₹{s.net_salary}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 text-2xs font-bold rounded-md uppercase ${
                                    s.status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                                    s.status === 'FINALIZED' ? 'bg-cyan-500/20 text-cyan-400' :
                                    'bg-amber-500/20 text-amber-400'
                                  }`}>
                                    {s.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {s.status === 'DRAFT' && (
                                    <button 
                                      onClick={() => handleFinalizeSalary(s.id)} 
                                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                                    >
                                      Finalize
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAddEmployee} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-4 text-slate-200">
            <h3 className="text-lg font-semibold text-white">Add New Employee</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={empForm.name}
                  onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={empForm.email}
                    onChange={e => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={empForm.phone}
                    onChange={e => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Role</label>
                  <select
                    value={empForm.role}
                    onChange={e => setEmpForm({ ...empForm, role: e.target.value as any })}
                    className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="WAITER">Waiter</option>
                    <option value="KITCHEN_STAFF">Kitchen Staff</option>
                    <option value="CASHIER">Cashier</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Position / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Waiter"
                    value={empForm.position}
                    onChange={e => setEmpForm({ ...empForm, position: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Salary Amount (₹)</label>
                  <input
                    type="number"
                    value={empForm.salary}
                    onChange={e => setEmpForm({ ...empForm, salary: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Salary Frequency</label>
                  <select
                    value={empForm.salary_frequency}
                    onChange={e => setEmpForm({ ...empForm, salary_frequency: e.target.value as any })}
                    className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Hire Date</label>
                <input
                  type="date"
                  value={empForm.hire_date}
                  onChange={e => setEmpForm({ ...empForm, hire_date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 text-sm font-semibold hover:bg-cyan-600 transition"
              >
                Add Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleEditEmployee} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-4 text-slate-200">
            <h3 className="text-lg font-semibold text-white">Edit Employee Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={empForm.name}
                  onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={empForm.email}
                    onChange={e => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={empForm.phone}
                    onChange={e => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Role</label>
                  <select
                    value={empForm.role}
                    onChange={e => setEmpForm({ ...empForm, role: e.target.value as any })}
                    className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="WAITER">Waiter</option>
                    <option value="KITCHEN_STAFF">Kitchen Staff</option>
                    <option value="CASHIER">Cashier</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Position / Title</label>
                  <input
                    type="text"
                    value={empForm.position}
                    onChange={e => setEmpForm({ ...empForm, position: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Salary Amount (₹)</label>
                  <input
                    type="number"
                    value={empForm.salary}
                    onChange={e => setEmpForm({ ...empForm, salary: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Salary Frequency</label>
                  <select
                    value={empForm.salary_frequency}
                    onChange={e => setEmpForm({ ...empForm, salary_frequency: e.target.value as any })}
                    className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setSelectedEmployee(null); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 text-sm font-semibold hover:bg-cyan-600 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE SHIFT MODAL */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateShift} className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-4 text-slate-200">
            <h3 className="text-lg font-semibold text-white">Create Daily Shift</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Shift Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Shift"
                  value={shiftForm.name}
                  onChange={e => setShiftForm({ ...shiftForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.start_time}
                    onChange={e => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.end_time}
                    onChange={e => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Break Duration (minutes)</label>
                <input
                  type="number"
                  value={shiftForm.break_duration_minutes}
                  onChange={e => setShiftForm({ ...shiftForm, break_duration_minutes: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 text-sm font-semibold hover:bg-cyan-600 transition"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ASSIGN SHIFT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAssignShift} className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-4 text-slate-200">
            <h3 className="text-lg font-semibold text-white">Assign Shift Rotation</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Employee</label>
                <select
                  required
                  value={assignForm.employeeId}
                  onChange={e => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Shift</label>
                <select
                  required
                  value={assignForm.shiftId}
                  onChange={e => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">-- Choose Shift --</option>
                  {shifts.map(sh => (
                    <option key={sh.id} value={sh.id}>{sh.name} ({sh.start_time} - {sh.end_time})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={assignForm.assignedDate}
                  onChange={e => setAssignForm({ ...assignForm, assignedDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 text-sm font-semibold hover:bg-cyan-600 transition"
              >
                Assign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PERFORMANCE REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleCreateReview} className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-4 text-slate-200 my-8">
            <h3 className="text-lg font-semibold text-white">Log Performance Review</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Employee</label>
                <select
                  required
                  value={reviewForm.employeeId}
                  onChange={e => setReviewForm({ ...reviewForm, employeeId: e.target.value })}
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Review Period Start</label>
                  <input
                    type="date"
                    required
                    value={reviewForm.review_period_start}
                    onChange={e => setReviewForm({ ...reviewForm, review_period_start: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Review Period End</label>
                  <input
                    type="date"
                    required
                    value={reviewForm.review_period_end}
                    onChange={e => setReviewForm({ ...reviewForm, review_period_end: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Metrics Ratings (1 - 5)</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block mb-1">Overall Rating</label>
                    <input
                      type="number" min="1" max="5" required
                      value={reviewForm.overall_rating}
                      onChange={e => setReviewForm({ ...reviewForm, overall_rating: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Punctuality</label>
                    <input
                      type="number" min="1" max="5" required
                      value={reviewForm.punctuality_rating}
                      onChange={e => setReviewForm({ ...reviewForm, punctuality_rating: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Quality of Work</label>
                    <input
                      type="number" min="1" max="5" required
                      value={reviewForm.quality_rating}
                      onChange={e => setReviewForm({ ...reviewForm, quality_rating: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Teamwork</label>
                    <input
                      type="number" min="1" max="5" required
                      value={reviewForm.teamwork_rating}
                      onChange={e => setReviewForm({ ...reviewForm, teamwork_rating: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Attitude</label>
                    <input
                      type="number" min="1" max="5" required
                      value={reviewForm.attitude_rating}
                      onChange={e => setReviewForm({ ...reviewForm, attitude_rating: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Job Skills</label>
                    <input
                      type="number" min="1" max="5" required
                      value={reviewForm.skills_rating}
                      onChange={e => setReviewForm({ ...reviewForm, skills_rating: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Review Comments</label>
                <textarea
                  value={reviewForm.comments}
                  onChange={e => setReviewForm({ ...reviewForm, comments: e.target.value })}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 text-sm font-semibold hover:bg-cyan-600 transition"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REQUEST LEAVE MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateLeave} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-4 text-slate-200">
            <h3 className="text-lg font-semibold text-white">Request Leave</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Employee</label>
                <select
                  required
                  value={leaveForm.employeeId}
                  onChange={e => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Leave Type</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={e => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.start_date}
                    onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.end_date}
                    onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Reason</label>
                <textarea
                  required
                  placeholder="Reason for leave request"
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 text-sm font-semibold hover:bg-cyan-600 transition"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE SALARY RECORD MODAL */}
      {showSalaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateSalary} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-4 text-slate-200">
            <h3 className="text-lg font-semibold text-white">Create Salary Record</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Employee</label>
                <select
                  required
                  value={salaryForm.employeeId}
                  onChange={e => {
                    const emp = employees.find(emp => emp.id === e.target.value);
                    setSalaryForm({ 
                      ...salaryForm, 
                      employeeId: e.target.value,
                      base_salary: emp?.salary ? Number(emp.salary) : 0
                    });
                  }}
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Salary Month (YYYY-MM)</label>
                <input
                  type="month"
                  required
                  value={salaryForm.month}
                  onChange={e => setSalaryForm({ ...salaryForm, month: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Base Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={salaryForm.base_salary}
                    onChange={e => setSalaryForm({ ...salaryForm, base_salary: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Bonus (₹)</label>
                  <input
                    type="number"
                    value={salaryForm.bonus}
                    onChange={e => setSalaryForm({ ...salaryForm, bonus: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Deductions (₹)</label>
                  <input
                    type="number"
                    value={salaryForm.deductions}
                    onChange={e => setSalaryForm({ ...salaryForm, deductions: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Notes</label>
                <textarea
                  placeholder="Optional notes or comment"
                  value={salaryForm.notes}
                  onChange={e => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowSalaryModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 text-sm font-semibold hover:bg-cyan-600 transition"
              >
                Create Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
