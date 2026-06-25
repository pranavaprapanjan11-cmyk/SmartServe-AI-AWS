import { Router, Response } from 'express';
import employeeService from './employees.service';
import { AuthRequest, authenticate, requireRole, verifyRestaurantOwnership } from '../auth/rbac.middleware';

const router = Router();

// Middleware for all routes
router.use(authenticate);

// ============ EMPLOYEE ROUTES ============

// Create employee
router.post('/:restaurantId/employees', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const employee = await employeeService.createEmployee(restaurantId, req.body);
    res.status(201).json(employee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get all employees
router.get('/:restaurantId/employees', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { role, status } = req.query;
    const employees = await employeeService.getEmployeesByRestaurant(restaurantId, {
      role: role as string,
      status: status as string,
    });
    res.json(employees);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get single employee
router.get('/:restaurantId/employees/:employeeId', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const employee = await employeeService.getEmployeeById(employeeId);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update employee
router.put('/:restaurantId/employees/:employeeId', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const employee = await employeeService.updateEmployee(employeeId, req.body);
    res.json(employee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete employee (soft delete - mark as terminated)
router.delete('/:restaurantId/employees/:employeeId', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const employee = await employeeService.deleteEmployee(employeeId);
    res.json(employee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ATTENDANCE ROUTES ============

// Mark attendance
router.post('/:restaurantId/attendance', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { employeeId, status } = req.body;
    const attendance = await employeeService.markAttendance(restaurantId, employeeId, status || 'PRESENT');
    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Check out
router.post('/:restaurantId/attendance/checkout/:employeeId', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const attendance = await employeeService.checkOutAttendance(employeeId);
    res.json(attendance);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get attendance report
router.get('/:restaurantId/attendance', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { employeeId, startDate, endDate } = req.query;
    const report = await employeeService.getAttendanceReport(
      restaurantId,
      employeeId as string,
      startDate as string,
      endDate as string
    );
    res.json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ SHIFTS ROUTES ============

// Create shift
router.post('/:restaurantId/shifts', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const shift = await employeeService.createShift(restaurantId, req.body);
    res.status(201).json(shift);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get shifts
router.get('/:restaurantId/shifts', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const shifts = await employeeService.getShiftsByRestaurant(restaurantId);
    res.json(shifts);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Assign shift
router.post('/:restaurantId/shifts/assign', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { employeeId, shiftId, assignedDate } = req.body;
    const assignment = await employeeService.assignShift(employeeId, shiftId, restaurantId, assignedDate);
    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ LEAVE ROUTES ============

// Request leave
router.post('/:restaurantId/leave/request', async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { employeeId, ...leaveData } = req.body;
    const leave = await employeeService.requestLeave(employeeId, restaurantId, leaveData);
    res.status(201).json(leave);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Approve leave
router.post('/:restaurantId/leave/:leaveId/approve', requireRole(['OWNER', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const { leaveId } = req.params;
    const { notes } = req.body;
    const leave = await employeeService.approveLeave(leaveId, req.user!.id, notes);
    res.json(leave);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get leave requests
router.get('/:restaurantId/leave', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query;
    const leaves = await employeeService.getLeaveRequests(restaurantId, status as string);
    res.json(leaves);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ SALARY ROUTES ============

// Create salary record
router.post('/:restaurantId/salary', requireRole(['OWNER', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { employeeId, ...salaryData } = req.body;
    const salary = await employeeService.createSalaryRecord(employeeId, restaurantId, salaryData);
    res.status(201).json(salary);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Finalize salary
router.post('/:restaurantId/salary/:salaryId/finalize', requireRole(['OWNER', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const { salaryId } = req.params;
    const salary = await employeeService.finalizeSalary(salaryId);
    res.json(salary);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get salary records
router.get('/:restaurantId/salary', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { employeeId, month } = req.query;
    const records = await employeeService.getSalaryRecords(restaurantId, employeeId as string, month as string);
    res.json(records);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============ PERFORMANCE REVIEW ROUTES ============

// Create performance review
router.post('/:restaurantId/performance-review', requireRole(['RESTAURANT_OWNER', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { employeeId, ...reviewData } = req.body;
    const review = await employeeService.createPerformanceReview(employeeId, restaurantId, {
      ...reviewData,
      reviewer_id: req.user!.id,
    });
    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get performance reviews
router.get('/:restaurantId/performance-review', verifyRestaurantOwnership, async (req: AuthRequest, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { employeeId } = req.query;
    const reviews = await employeeService.getPerformanceReviews(restaurantId, employeeId as string);
    res.json(reviews);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
