-- Employee Management Schema
-- Creates tables for employees, attendance, salary, shifts, leaves, and performance

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('WAITER', 'KITCHEN_STAFF', 'CASHIER', 'MANAGER')),
    position VARCHAR(100),
    hire_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE')),
    salary DECIMAL(10, 2),
    salary_frequency VARCHAR(20) DEFAULT 'MONTHLY' CHECK (salary_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
    documents JSONB, -- Store file paths for ID, resume, etc.
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_employees_restaurant ON employees(restaurant_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_status ON employees(status);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    duration_hours DECIMAL(5, 2),
    status VARCHAR(20) DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, attendance_date)
);

CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
CREATE INDEX idx_attendance_restaurant ON attendance(restaurant_id);

-- Shifts Table
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INT DEFAULT 30,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shifts_restaurant ON shifts(restaurant_id);

-- Employee Shifts (Assignment)
CREATE TABLE IF NOT EXISTS employee_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, assigned_date, shift_id)
);

CREATE INDEX idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX idx_employee_shifts_date ON employee_shifts(assigned_date);
CREATE INDEX idx_employee_shifts_shift ON employee_shifts(shift_id);

-- Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('SICK', 'CASUAL', 'EARNED', 'UNPAID', 'MATERNITY', 'OTHER')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INT NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP,
    approval_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Salary Table
CREATE TABLE IF NOT EXISTS salary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month CHAR(7) NOT NULL, -- YYYY-MM format
    base_salary DECIMAL(10, 2) NOT NULL,
    bonus DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FINALIZED', 'PAID')),
    paid_date TIMESTAMP,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, month)
);

CREATE INDEX idx_salary_employee ON salary(employee_id);
CREATE INDEX idx_salary_month ON salary(month);
CREATE INDEX idx_salary_status ON salary(status);

-- Performance Reviews Table
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    overall_rating DECIMAL(3, 2) NOT NULL CHECK (overall_rating >= 0 AND overall_rating <= 5),
    punctuality_rating DECIMAL(3, 2),
    quality_rating DECIMAL(3, 2),
    teamwork_rating DECIMAL(3, 2),
    attitude_rating DECIMAL(3, 2),
    skills_rating DECIMAL(3, 2),
    comments TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'ACKNOWLEDGED')),
    acknowledged_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_performance_employee ON performance_reviews(employee_id);
CREATE INDEX idx_performance_period ON performance_reviews(review_period_start, review_period_end);

-- Employee Warnings/Discipline
CREATE TABLE IF NOT EXISTS disciplinary_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('WARNING', 'SUSPENSION', 'TERMINATION', 'OTHER')),
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    reason TEXT NOT NULL,
    description TEXT,
    action_date DATE NOT NULL,
    action_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'APPEALED')),
    appeal_date DATE,
    appeal_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disciplinary_employee ON disciplinary_actions(employee_id);
CREATE INDEX idx_disciplinary_date ON disciplinary_actions(action_date);
