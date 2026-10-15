import { MobileRecord, AssignmentHistory, GoogleSheetsConfig } from '../types';
import { INITIAL_MOBILE_RECORDS, INITIAL_ASSIGNMENT_HISTORY } from './mockData';

const STORAGE_KEYS = {
  CONFIG: 'mnm_sheets_config',
  LOCAL_RECORDS: 'mnm_local_records',
  LOCAL_HISTORY: 'mnm_local_history',
  AUTH: 'mnm_admin_auth'
};

export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\.]/g, '');
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvGdKuu9bLSfscsXGOXJhlYxqVK8xrImftdov-hwDz0-GBHBi6gWkXS9bIt16ADyJw/exec';

export const cleanPhoneFromSheet = (phone: any): string => {
  if (!phone) return '';
  const str = phone.toString().trim();
  if (str === '#ERROR!' || str === '#VALUE!') return '';
  return str.replace(/^'/, '');
};

export const formatPhoneForSheet = (phone: string): string => {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (trimmed.startsWith('+') || trimmed.startsWith('=')) {
    return "'" + trimmed;
  }
  return trimmed;
};

export const getStoredConfig = (): GoogleSheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.scriptUrl) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed reading sheets config', e);
  }
  return {
    scriptUrl: DEFAULT_SCRIPT_URL,
    apiToken: 'admin123',
    isConnected: true,
    useDemoData: false
  };
};

export const saveStoredConfig = (config: GoogleSheetsConfig) => {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
};

export const getLocalRecords = (): MobileRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_RECORDS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local records', e);
  }
  return INITIAL_MOBILE_RECORDS;
};

export const setLocalRecords = (records: MobileRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify(records));
};

export const getLocalHistory = (): AssignmentHistory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local history', e);
  }
  return INITIAL_ASSIGNMENT_HISTORY;
};

export const setLocalHistory = (history: AssignmentHistory[]) => {
  localStorage.setItem(STORAGE_KEYS.LOCAL_HISTORY, JSON.stringify(history));
};

/**
 * Test connectivity to Google Apps Script Web App
 */
export const testGoogleSheetsConnection = async (
  scriptUrl: string,
  apiToken: string
): Promise<{ success: boolean; message: string; latencyMs?: number }> => {
  if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: 'Invalid URL. It must start with https://script.google.com/macros/s/ and end with /exec'
    };
  }

  const startTime = Date.now();
  try {
    const targetUrl = new URL(scriptUrl);
    targetUrl.searchParams.set('action', 'ping');
    if (apiToken) {
      targetUrl.searchParams.set('apiToken', apiToken);
    }

    const res = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      return {
        success: false,
        message: `HTTP ${res.status}: Failed to reach Google Apps Script web app.`
      };
    }

    const data = await res.json();
    const latency = Date.now() - startTime;

    if (data.success) {
      return {
        success: true,
        message: `Successfully connected to Google Sheets! Response time: ${latency}ms`,
        latencyMs: latency
      };
    } else {
      return {
        success: false,
        message: data.error || 'Connected to script, but received error from sheet handler.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err.message || 'Check deployment access is set to Anyone'}`
    };
  }
};

/**
 * Fetch all records (Google Sheets or Local fallback)
 */
export const fetchInventoryRecords = async (
  config: GoogleSheetsConfig
): Promise<{ success: boolean; records: MobileRecord[]; fromGoogleSheets: boolean; error?: string }> => {
  if (config.isConnected && config.scriptUrl && !config.useDemoData) {
    try {
      const url = new URL(config.scriptUrl);
      url.searchParams.set('action', 'getNumbers');
      if (config.apiToken) url.searchParams.set('apiToken', config.apiToken);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const sanitizedRecords: MobileRecord[] = json.data.map((r: any) => ({
          ...r,
          phoneNumber: cleanPhoneFromSheet(r.phoneNumber) || r.phoneNumber
        }));
        // Also cache to local storage for offline resilience
        setLocalRecords(sanitizedRecords);
        return {
          success: true,
          records: sanitizedRecords,
          fromGoogleSheets: true
        };
      } else {
        throw new Error(json.error || 'Failed to parse records from Google Sheets');
      }
    } catch (err: any) {
      console.warn('Google Sheets fetch failed, falling back to cached local data:', err);
      return {
        success: false,
        records: getLocalRecords(),
        fromGoogleSheets: false,
        error: `Could not fetch from Google Sheets: ${err.message}. Showing local cache.`
      };
    }
  }

  // Demo mode
  return {
    success: true,
    records: getLocalRecords(),
    fromGoogleSheets: false
  };
};

/**
 * Save / Update a Mobile Record with duplicate validation
 */
export const saveMobileRecord = async (
  record: Partial<MobileRecord>,
  config: GoogleSheetsConfig
): Promise<{ success: boolean; record?: MobileRecord; message?: string; error?: string }> => {
  const currentRecords = getLocalRecords();
  const normalizedTarget = normalizePhoneNumber(record.phoneNumber || '');

  // 1. Client-side duplicate check
  const duplicate = currentRecords.find(
    r => normalizePhoneNumber(r.phoneNumber) === normalizedTarget && r.id !== record.id
  );

  if (duplicate) {
    return {
      success: false,
      error: `Mobile number ${record.phoneNumber} already exists in inventory (assigned to ${duplicate.assignedTo || 'Unassigned'}). Duplicate numbers are forbidden.`
    };
  }

  const now = new Date().toISOString().split('T')[0];
  const recordToSave: MobileRecord = {
    id: record.id || `num-${Date.now()}`,
    phoneNumber: record.phoneNumber || '',
    carrier: record.carrier || 'Verizon',
    simNumber: record.simNumber || '',
    planType: record.planType || 'Standard Voice/Data',
    monthlyCost: record.monthlyCost !== undefined ? Number(record.monthlyCost) : 40,
    status: record.status || 'available',
    assignedTo: record.assignedTo || '',
    employeeId: record.employeeId || '',
    department: record.department || '',
    assignmentDate: record.assignmentDate || (record.status === 'assigned' ? now : ''),
    purpose: record.purpose || '',
    notes: record.notes || '',
    createdAt: record.createdAt || now,
    updatedAt: now
  };

  // If connected to Google Sheets
  if (config.isConnected && config.scriptUrl && !config.useDemoData) {
    try {
      const payload = {
        action: 'saveNumber',
        record: {
          ...recordToSave,
          phoneNumber: formatPhoneForSheet(recordToSave.phoneNumber)
        },
        apiToken: config.apiToken
      };

      const res = await fetch(config.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const resJson = await res.json();
      if (!resJson.success) {
        return { success: false, error: resJson.error || 'Failed saving to Google Sheets' };
      }
    } catch (err: any) {
      return { success: false, error: `Google Sheets error: ${err.message}` };
    }
  }

  // Update local store
  const existingIdx = currentRecords.findIndex(r => r.id === recordToSave.id);
  let updatedRecords: MobileRecord[];
  if (existingIdx >= 0) {
    updatedRecords = [...currentRecords];
    updatedRecords[existingIdx] = recordToSave;
  } else {
    updatedRecords = [recordToSave, ...currentRecords];
  }
  setLocalRecords(updatedRecords);

  return { success: true, record: recordToSave, message: 'Record saved successfully.' };
};

/**
 * Assign a number to an employee
 */
export const assignMobileRecord = async (
  assignmentData: {
    id?: string;
    phoneNumber: string;
    assignedTo: string;
    employeeId: string;
    department: string;
    assignmentDate: string;
    purpose: string;
    notes?: string;
  },
  config: GoogleSheetsConfig
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const now = new Date().toISOString().split('T')[0];
  const records = getLocalRecords();
  const targetIndex = records.findIndex(
    r => (assignmentData.id && r.id === assignmentData.id) ||
         normalizePhoneNumber(r.phoneNumber) === normalizePhoneNumber(assignmentData.phoneNumber)
  );

  if (targetIndex === -1) {
    return { success: false, error: 'Mobile record not found in inventory.' };
  }

  // Google Sheets write
  if (config.isConnected && config.scriptUrl && !config.useDemoData) {
    try {
      const payload = {
        action: 'assignNumber',
        data: assignmentData,
        apiToken: config.apiToken
      };

      const res = await fetch(config.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.success) {
        return { success: false, error: json.error || 'Failed assigning in Google Sheets' };
      }
    } catch (err: any) {
      return { success: false, error: `Google Sheets error: ${err.message}` };
    }
  }

  // Update local state
  records[targetIndex] = {
    ...records[targetIndex],
    status: 'assigned',
    assignedTo: assignmentData.assignedTo,
    employeeId: assignmentData.employeeId,
    department: assignmentData.department,
    assignmentDate: assignmentData.assignmentDate || now,
    purpose: assignmentData.purpose,
    notes: assignmentData.notes || records[targetIndex].notes,
    updatedAt: now
  };
  setLocalRecords(records);

  // Add to local history
  const history = getLocalHistory();
  const newHist: AssignmentHistory = {
    id: `hist-${Date.now()}`,
    phoneNumber: assignmentData.phoneNumber,
    action: 'assigned',
    employeeName: assignmentData.assignedTo,
    employeeId: assignmentData.employeeId,
    department: assignmentData.department,
    assignmentDate: assignmentData.assignmentDate || now,
    purpose: assignmentData.purpose,
    notes: assignmentData.notes || 'Assigned to staff',
    timestamp: new Date().toISOString()
  };
  setLocalHistory([newHist, ...history]);

  return { success: true, message: `Assigned ${assignmentData.phoneNumber} to ${assignmentData.assignedTo}` };
};

/**
 * Return / Release a number back to available pool
 */
export const returnMobileRecord = async (
  returnData: {
    id?: string;
    phoneNumber: string;
    returnDate: string;
    notes?: string;
  },
  config: GoogleSheetsConfig
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const records = getLocalRecords();
  const targetIndex = records.findIndex(
    r => (returnData.id && r.id === returnData.id) ||
         normalizePhoneNumber(r.phoneNumber) === normalizePhoneNumber(returnData.phoneNumber)
  );

  if (targetIndex === -1) {
    return { success: false, error: 'Mobile record not found in inventory.' };
  }

  const prev = records[targetIndex];
  const now = new Date().toISOString().split('T')[0];

  // Google Sheets write
  if (config.isConnected && config.scriptUrl && !config.useDemoData) {
    try {
      const payload = {
        action: 'returnNumber',
        data: {
          ...returnData,
          assignedTo: prev.assignedTo,
          employeeId: prev.employeeId,
          department: prev.department,
          assignmentDate: prev.assignmentDate,
          purpose: prev.purpose
        },
        apiToken: config.apiToken
      };

      const res = await fetch(config.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.success) {
        return { success: false, error: json.error || 'Failed updating return in Google Sheets' };
      }
    } catch (err: any) {
      return { success: false, error: `Google Sheets error: ${err.message}` };
    }
  }

  // Update local record
  records[targetIndex] = {
    ...records[targetIndex],
    status: 'available',
    assignedTo: '',
    employeeId: '',
    department: '',
    assignmentDate: '',
    purpose: '',
    notes: `Returned on ${returnData.returnDate || now}. ${returnData.notes || 'Returned to pool'}`.trim(),
    updatedAt: now
  };
  setLocalRecords(records);

  // Add return history entry
  const history = getLocalHistory();
  const histEntry: AssignmentHistory = {
    id: `hist-${Date.now()}`,
    phoneNumber: prev.phoneNumber,
    action: 'returned',
    employeeName: prev.assignedTo || 'Unassigned',
    employeeId: prev.employeeId || '',
    department: prev.department || '',
    assignmentDate: prev.assignmentDate || '',
    returnDate: returnData.returnDate || now,
    purpose: prev.purpose || '',
    notes: returnData.notes || 'Returned to available pool',
    timestamp: new Date().toISOString()
  };
  setLocalHistory([histEntry, ...history]);

  return { success: true, message: `Successfully returned ${prev.phoneNumber} to available inventory.` };
};

/**
 * Delete a number record
 */
export const deleteMobileRecord = async (
  id: string,
  phoneNumber: string,
  config: GoogleSheetsConfig
): Promise<{ success: boolean; message?: string; error?: string }> => {
  if (config.isConnected && config.scriptUrl && !config.useDemoData) {
    try {
      const payload = {
        action: 'deleteNumber',
        id,
        phoneNumber,
        apiToken: config.apiToken
      };

      const res = await fetch(config.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!json.success) {
        return { success: false, error: json.error || 'Failed deleting from Google Sheets' };
      }
    } catch (err: any) {
      return { success: false, error: `Google Sheets error: ${err.message}` };
    }
  }

  const records = getLocalRecords().filter(r => r.id !== id && r.phoneNumber !== phoneNumber);
  setLocalRecords(records);
  return { success: true, message: 'Record deleted from inventory.' };
};

/**
 * Fetch assignment history
 */
export const fetchHistoryRecords = async (
  config: GoogleSheetsConfig,
  phoneNumber?: string
): Promise<AssignmentHistory[]> => {
  if (config.isConnected && config.scriptUrl && !config.useDemoData) {
    try {
      const url = new URL(config.scriptUrl);
      url.searchParams.set('action', 'getHistory');
      if (phoneNumber) url.searchParams.set('phoneNumber', phoneNumber);
      if (config.apiToken) url.searchParams.set('apiToken', config.apiToken);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const sanitized = json.data.map((h: any) => ({
            ...h,
            phoneNumber: cleanPhoneFromSheet(h.phoneNumber) || h.phoneNumber
          }));
          return sanitized;
        }
      }
    } catch (e) {
      console.warn('Failed fetching history from Google Sheets, using local:', e);
    }
  }

  const local = getLocalHistory();
  if (phoneNumber) {
    const norm = normalizePhoneNumber(phoneNumber);
    return local.filter(h => normalizePhoneNumber(h.phoneNumber) === norm);
  }
  return local;
};
