import { pool } from '../../database';
import { v4 as uuidv4 } from 'uuid';



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
  leave_type: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
}

export interface SalaryRecord {
  id: string;
  employee_id: string;
  month: string; // YYYY-MM
  base_salary: number;
  bonus?: number;
  deductions?: number;
  net_salary: number;
  status: 'DRAFT' | 'FINALIZED' | 'PAID';
}

class EmployeeService {
  // ============ EMPLOYEE MANAGEMENT ============

  async createEmployee(restaurantId: string, employeeData: Partial<Employee>) {
    const id = uuidv4();
    const query = `
      INSERT INTO employees (
        id, restaurant_id, name, email, phone, role, position, 
        hire_date, salary, salary_frequency, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const result = await pool.query(query, [
      id,
      restaurantId,
      employeeData.name,
      employeeData.email || null,
      employeeData.phone || null,
      employeeData.role,
      employeeData.position || null,
      employeeData.hire_date || new Date().toISOString().split('T')[0],
      employeeData.salary || null,
      employeeData.salary_frequency || 'MONTHLY',
      'ACTIVE',
    ]);
    return result.rows[0];
  }

  async getEmployeesByRestaurant(restaurantId: string, filters?: { role?: string; status?: string }) {
    let query = 'SELECT * FROM employees WHERE restaurant_id = $1';
    const params: any[] = [restaurantId];

    if (filters?.role) {
      query += ` AND role = $${params.length + 1}`;
      params.push(filters.role);
    }
    if (filters?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(filters.status);
    }

    query += ' ORDER BY name ASC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getEmployeeById(employeeId: string) {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [employeeId]);
    return result.rows[0];
  }

  async updateEmployee(employeeId: string, updates: Partial<Employee>) {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) return null;

    values.push(employeeId);
    const query = `
      UPDATE employees 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteEmployee(employeeId: string) {
    const result = await pool.query(
      'UPDATE employees SET status = $1 WHERE id = $2 RETURNING *',
      ['TERMINATED', employeeId]
    );
    return result.rows[0];
  }

  // ============ ATTENDANCE ============

  async markAttendance(restaurantId: string, employeeId: string, status: string) {
    const today = new Date().toISOString().split('T')[0];
    const checkInTime = new Date().toISOString();

    const query = `
      INSERT INTO attendance (employee_id, restaurant_id, attendance_date, check_in_time, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (employee_id, attendance_date) 
      DO UPDATE SET check_in_time = $4, status = $5, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [employeeId, restaurantId, today, checkInTime, status]);
    return result.rows[0];
  }

  async checkOutAttendance(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const checkOutTime = new Date().toISOString();

    const query = `
      UPDATE attendance 
      SET check_out_time = $1, updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $2 AND attendance_date = $3
      RETURNING *
    `;
    const result = await pool.query(query, [checkOutTime, employeeId, today]);
    return result.rows[0];
  }

  async getAttendanceReport(restaurantId: string, employeeId?: string, startDate?: string, endDate?: string) {
    let query = `
      SELECT a.*, e.name, e.role 
      FROM attendance a 
      JOIN employees e ON a.employee_id = e.id 
      WHERE a.restaurant_id = $1
    `;
    const params: any[] = [restaurantId];

    if (employeeId) {
      query += ` AND a.employee_id = $${params.length + 1}`;
      params.push(employeeId);
    }
    if (startDate) {
      query += ` AND a.attendance_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND a.attendance_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ' ORDER BY a.attendance_date DESC, a.created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  // ============ SHIFTS ============

  async createShift(restaurantId: string, shiftData: Partial<Shift>) {
    const id = uuidv4();
    const query = `
      INSERT INTO shifts (id, restaurant_id, name, start_time, end_time, break_duration_minutes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [
      id,
      restaurantId,
      shiftData.name,
      shiftData.start_time,
      shiftData.end_time,
      shiftData.break_duration_minutes || 30,
    ]);
    return result.rows[0];
  }

  async getShiftsByRestaurant(restaurantId: string) {
    const result = await pool.query('SELECT * FROM shifts WHERE restaurant_id = $1 ORDER BY start_time ASC', [
      restaurantId,
    ]);
    return result.rows;
  }

  async assignShift(employeeId: string, shiftId: string, restaurantId: string, assignedDate: string) {
    const id = uuidv4();
    const query = `
      INSERT INTO employee_shifts (id, employee_id, shift_id, restaurant_id, assigned_date)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (employee_id, assigned_date, shift_id) 
      DO UPDATE SET status = 'SCHEDULED', updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [id, employeeId, shiftId, restaurantId, assignedDate]);
    return result.rows[0];
  }

  // ============ LEAVE REQUESTS ============

  async requestLeave(employeeId: string, restaurantId: string, leaveData: Partial<LeaveRequest>) {
    const id = uuidv4();
    const durationDays =
      (new Date(leaveData.end_date!).getTime() - new Date(leaveData.start_date!).getTime()) /
        (1000 * 60 * 60 * 24) +
      1;

    const query = `
      INSERT INTO leave_requests (
        id, employee_id, restaurant_id, leave_type, start_date, end_date, 
        duration_days, reason, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await pool.query(query, [
      id,
      employeeId,
      restaurantId,
      leaveData.leave_type,
      leaveData.start_date,
      leaveData.end_date,
      Math.ceil(durationDays),
      leaveData.reason || null,
      'PENDING',
    ]);
    return result.rows[0];
  }

  async approveLeave(leaveId: string, approvedBy: string, notes?: string) {
    const query = `
      UPDATE leave_requests 
      SET status = 'APPROVED', approved_by = $1, approval_date = CURRENT_TIMESTAMP, approval_notes = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [approvedBy, notes || null, leaveId]);
    return result.rows[0];
  }

  async getLeaveRequests(restaurantId: string, status?: string) {
    let query = `
      SELECT lr.*, e.name, e.role 
      FROM leave_requests lr 
      JOIN employees e ON lr.employee_id = e.id 
      WHERE lr.restaurant_id = $1
    `;
    const params: any[] = [restaurantId];

    if (status) {
      query += ` AND lr.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ' ORDER BY lr.start_date DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  // ============ SALARY ============

  async createSalaryRecord(employeeId: string, restaurantId: string, salaryData: Partial<SalaryRecord>) {
    const id = uuidv4();
    const netSalary = (salaryData.base_salary || 0) + (salaryData.bonus || 0) - (salaryData.deductions || 0);

    const query = `
      INSERT INTO salary (
        id, employee_id, restaurant_id, month, base_salary, 
        bonus, deductions, net_salary, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (employee_id, month) 
      DO UPDATE SET base_salary = $5, bonus = $6, deductions = $7, net_salary = $8
      RETURNING *
    `;
    const result = await pool.query(query, [
      id,
      employeeId,
      restaurantId,
      salaryData.month,
      salaryData.base_salary,
      salaryData.bonus || 0,
      salaryData.deductions || 0,
      netSalary,
      'DRAFT',
    ]);
    return result.rows[0];
  }

  async finalizeSalary(salaryId: string) {
    const query = `
      UPDATE salary 
      SET status = 'FINALIZED', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [salaryId]);
    return result.rows[0];
  }

  async getSalaryRecords(restaurantId: string, employeeId?: string, month?: string) {
    let query = 'SELECT * FROM salary WHERE restaurant_id = $1';
    const params: any[] = [restaurantId];

    if (employeeId) {
      query += ` AND employee_id = $${params.length + 1}`;
      params.push(employeeId);
    }
    if (month) {
      query += ` AND month = $${params.length + 1}`;
      params.push(month);
    }

    query += ' ORDER BY month DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  // ============ PERFORMANCE REVIEWS ============

  async createPerformanceReview(employeeId: string, restaurantId: string, reviewData: any) {
    const id = uuidv4();
    const query = `
      INSERT INTO performance_reviews (
        id, employee_id, restaurant_id, review_period_start, review_period_end,
        reviewer_id, overall_rating, punctuality_rating, quality_rating, 
        teamwork_rating, attitude_rating, skills_rating, comments, 
        strengths, areas_for_improvement, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'DRAFT')
      RETURNING *
    `;
    const result = await pool.query(query, [
      id,
      employeeId,
      restaurantId,
      reviewData.review_period_start,
      reviewData.review_period_end,
      reviewData.reviewer_id,
      reviewData.overall_rating,
      reviewData.punctuality_rating,
      reviewData.quality_rating,
      reviewData.teamwork_rating,
      reviewData.attitude_rating,
      reviewData.skills_rating,
      reviewData.comments || null,
      reviewData.strengths || null,
      reviewData.areas_for_improvement || null,
    ]);
    return result.rows[0];
  }

  async getPerformanceReviews(restaurantId: string, employeeId?: string) {
    let query = 'SELECT * FROM performance_reviews WHERE restaurant_id = $1';
    const params: any[] = [restaurantId];

    if (employeeId) {
      query += ` AND employee_id = $${params.length + 1}`;
      params.push(employeeId);
    }

    query += ' ORDER BY review_period_end DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }
}

export default new EmployeeService();
