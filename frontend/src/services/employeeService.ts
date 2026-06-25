import axios from 'axios';
import { API_BASE } from '../config';

function getAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface Employee {
  id: string;
  restaurant_id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'WAITER' | 'KITCHEN_STAFF' | 'CASHIER' | 'MANAGER';
  position?: string;
  hire_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE';
  salary?: number;
  salary_frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface Attendance {
  id: string;
  employee_id: string;
  name?: string;
  role?: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  duration_hours?: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
}

export interface Shift {
  id: string;
  restaurant_id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_duration_minutes?: number;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  name?: string;
  role?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approved_by?: string;
  approval_date?: string;
  approval_notes?: string;
}

export interface SalaryRecord {
  id: string;
  employee_id: string;
  month: string;
  base_salary: number;
  bonus?: number;
  deductions?: number;
  net_salary: number;
  status: 'DRAFT' | 'FINALIZED' | 'PAID';
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  review_period_start: string;
  review_period_end: string;
  reviewer_id: string;
  overall_rating: number;
  punctuality_rating: number;
  quality_rating: number;
  teamwork_rating: number;
  attitude_rating: number;
  skills_rating: number;
  comments?: string;
  strengths?: string;
  areas_for_improvement?: string;
  status: 'DRAFT' | 'SUBMITTED';
}

export async function getEmployees(restaurantId: string, token: string, filters?: { role?: string; status?: string }): Promise<Employee[]> {
  const params = new URLSearchParams();
  if (filters?.role) params.append('role', filters.role);
  if (filters?.status) params.append('status', filters.status);
  
  const res = await axios.get<Employee[]>(`${API_BASE}/restaurants/${restaurantId}/employees?${params.toString()}`, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function createEmployee(restaurantId: string, data: Partial<Employee>, token: string): Promise<Employee> {
  const res = await axios.post<Employee>(`${API_BASE}/restaurants/${restaurantId}/employees`, data, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function updateEmployee(restaurantId: string, employeeId: string, data: Partial<Employee>, token: string): Promise<Employee> {
  const res = await axios.put<Employee>(`${API_BASE}/restaurants/${restaurantId}/employees/${employeeId}`, data, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function deleteEmployee(restaurantId: string, employeeId: string, token: string): Promise<Employee> {
  const res = await axios.delete<Employee>(`${API_BASE}/restaurants/${restaurantId}/employees/${employeeId}`, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

// Attendance
export async function markAttendance(restaurantId: string, data: { employeeId: string; status: string }, token: string): Promise<Attendance> {
  const res = await axios.post<Attendance>(`${API_BASE}/restaurants/${restaurantId}/attendance`, data, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function checkOutAttendance(restaurantId: string, employeeId: string, token: string): Promise<Attendance> {
  const res = await axios.post<Attendance>(`${API_BASE}/restaurants/${restaurantId}/attendance/checkout/${employeeId}`, {}, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function getAttendanceReport(restaurantId: string, token: string, filters?: { employeeId?: string; startDate?: string; endDate?: string }): Promise<Attendance[]> {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const res = await axios.get<Attendance[]>(`${API_BASE}/restaurants/${restaurantId}/attendance?${params.toString()}`, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

// Shifts
export async function getShifts(restaurantId: string, token: string): Promise<Shift[]> {
  const res = await axios.get<Shift[]>(`${API_BASE}/restaurants/${restaurantId}/shifts`, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function createShift(restaurantId: string, data: Partial<Shift>, token: string): Promise<Shift> {
  const res = await axios.post<Shift>(`${API_BASE}/restaurants/${restaurantId}/shifts`, data, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function assignShift(restaurantId: string, data: { employeeId: string; shiftId: string; assignedDate: string }, token: string): Promise<any> {
  const res = await axios.post(`${API_BASE}/restaurants/${restaurantId}/shifts/assign`, data, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

// Leaves
export async function getLeaveRequests(restaurantId: string, token: string, status?: string): Promise<LeaveRequest[]> {
  const url = status 
    ? `${API_BASE}/restaurants/${restaurantId}/leave?status=${status}`
    : `${API_BASE}/restaurants/${restaurantId}/leave`;
  const res = await axios.get<LeaveRequest[]>(url, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function requestLeave(restaurantId: string, data: Partial<LeaveRequest> & { employeeId: string }, token: string): Promise<LeaveRequest> {
  const res = await axios.post<LeaveRequest>(`${API_BASE}/restaurants/${restaurantId}/leave/request`, data, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function approveLeave(restaurantId: string, leaveId: string, data: { notes: string }, token: string): Promise<LeaveRequest> {
  const res = await axios.post<LeaveRequest>(`${API_BASE}/restaurants/${restaurantId}/leave/${leaveId}/approve`, data, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

// Salaries
export async function getSalaryRecords(restaurantId: string, token: string, filters?: { employeeId?: string; month?: string }): Promise<SalaryRecord[]> {
  const params = new URLSearchParams();
  if (filters?.employeeId) params.append('employeeId', filters.employeeId);
  if (filters?.month) params.append('month', filters.month);

  const res = await axios.get<SalaryRecord[]>(`${API_BASE}/restaurants/${restaurantId}/salary?${params.toString()}`, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function createSalaryRecord(restaurantId: string, data: Partial<SalaryRecord> & { employeeId: string }, token: string): Promise<SalaryRecord> {
  const res = await axios.post<SalaryRecord>(`${API_BASE}/restaurants/${restaurantId}/salary`, data, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function finalizeSalary(restaurantId: string, salaryId: string, token: string): Promise<SalaryRecord> {
  const res = await axios.post<SalaryRecord>(`${API_BASE}/restaurants/${restaurantId}/salary/${salaryId}/finalize`, {}, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

// Performance Reviews
export async function getPerformanceReviews(restaurantId: string, token: string, employeeId?: string): Promise<PerformanceReview[]> {
  const url = employeeId
    ? `${API_BASE}/restaurants/${restaurantId}/performance-review?employeeId=${employeeId}`
    : `${API_BASE}/restaurants/${restaurantId}/performance-review`;
  const res = await axios.get<PerformanceReview[]>(url, {
    headers: getAuthHeader(token),
  });
  return res.data;
}

export async function createPerformanceReview(restaurantId: string, data: Partial<PerformanceReview> & { employeeId: string }, token: string): Promise<PerformanceReview> {
  const res = await axios.post<PerformanceReview>(`${API_BASE}/restaurants/${restaurantId}/performance-review`, data, {
    headers: getAuthHeader(token),
  });
  return res.data;
}
