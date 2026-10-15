export type StatusType = 'available' | 'assigned' | 'reserved' | 'maintenance';

export interface MobileRecord {
  id: string;
  phoneNumber: string;
  carrier: string;
  simNumber?: string;
  planType?: string;
  monthlyCost?: number;
  status: StatusType;
  assignedTo?: string;
  employeeId?: string;
  department?: string;
  assignmentDate?: string;
  purpose?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignmentHistory {
  id: string;
  phoneNumber: string;
  action: 'assigned' | 'returned' | 'reassigned' | 'created';
  employeeName: string;
  employeeId?: string;
  department?: string;
  assignmentDate?: string;
  returnDate?: string;
  purpose?: string;
  notes?: string;
  timestamp: string;
}

export interface GoogleSheetsConfig {
  scriptUrl: string;
  apiToken: string;
  isConnected: boolean;
  sheetName?: string;
  lastSynced?: string;
  useDemoData: boolean;
}

export interface AdminAuth {
  isAuthenticated: boolean;
  username: string;
  role: 'admin' | 'manager' | 'viewer';
  loginTime?: string;
}

export interface StatsSummary {
  total: number;
  available: number;
  assigned: number;
  reserved: number;
  maintenance: number;
  totalMonthlySpend: number;
  utilizationRate: number;
}
