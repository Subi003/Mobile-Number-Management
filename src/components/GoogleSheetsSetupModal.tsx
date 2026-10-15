import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Check, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  Link, 
  Zap, 
  HelpCircle,
  Database
} from 'lucide-react';
import { GoogleSheetsConfig } from '../types';
import { testGoogleSheetsConnection, saveStoredConfig } from '../services/googleSheetsService';

interface GoogleSheetsSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (newConfig: GoogleSheetsConfig) => void;
}

export const GoogleSheetsSetupModal: React.FC<GoogleSheetsSetupModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'connect' | 'guide' | 'code' | 'schema'>('connect');
  const [scriptUrl, setScriptUrl] = useState(config.scriptUrl || '');
  const [apiToken, setApiToken] = useState(config.apiToken || 'admin123');
  const [useDemoData, setUseDemoData] = useState(config.useDemoData);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * Mobile Number Inventory & Allocation Manager - Google Apps Script Backend
 * =========================================================================
 * 
 * 1. Open your Google Sheet at https://sheets.new
 * 2. Extensions > Apps Script
 * 3. Delete everything, paste this code, then click Save (Disk icon).
 * 4. Deploy > New deployment > Select 'Web app'
 * 5. Set 'Execute as': 'Me'
 * 6. Set 'Who has access': 'Anyone' (IMPORTANT for web app access)
 * 7. Deploy & copy the Web App URL (ends with /exec).
 */

var API_SECRET_KEY = "admin123"; // Must match the Secret Token in website settings
var SHEET_INVENTORY = "MobileInventory";
var SHEET_HISTORY = "AssignmentHistory";

var INVENTORY_HEADERS = [
  "ID", "Mobile Number", "Carrier", "SIM Number", "Plan Type", 
  "Monthly Cost", "Status", "Assigned To", "Employee ID", "Department", 
  "Assignment Date", "Purpose", "Notes", "Created At", "Updated At"
];

var HISTORY_HEADERS = [
  "History ID", "Mobile Number", "Action", "Employee Name", "Employee ID", 
  "Department", "Assignment Date", "Return Date", "Purpose", "Notes", "Timestamp"
];

function doGet(e) {
  try {
    initSheetsIfMissing();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getNumbers";
    var phoneNumber = (e && e.parameter && e.parameter.phoneNumber) ? e.parameter.phoneNumber : "";

    var result;
    if (action === "ping") {
      result = { success: true, message: "Google Apps Script connection verified!", timestamp: new Date().toISOString() };
    } else if (action === "getNumbers") {
      result = { success: true, data: fetchAllNumbers() };
    } else if (action === "getHistory") {
      result = { success: true, data: fetchHistory(phoneNumber) };
    } else {
      result = { success: false, error: "Unknown action: " + action };
    }
    return respondJSON(result);
  } catch (err) {
    return respondJSON({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    initSheetsIfMissing();
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    if (API_SECRET_KEY && API_SECRET_KEY.trim() !== "") {
      var token = payload.apiToken || (e && e.parameter ? e.parameter.apiToken : "");
      if (token !== API_SECRET_KEY) {
        return respondJSON({ success: false, error: "Unauthorized: Invalid API Secret Token." });
      }
    }

    var action = payload.action;
    var result;
    if (action === "saveNumber") {
      result = saveNumberRecord(payload.record);
    } else if (action === "assignNumber") {
      result = assignNumberRecord(payload.data);
    } else if (action === "returnNumber") {
      result = returnNumberRecord(payload.data);
    } else if (action === "deleteNumber") {
      result = deleteNumberRecord(payload.id, payload.phoneNumber);
    } else {
      result = { success: false, error: "Unsupported POST action: " + action };
    }
    return respondJSON(result);
  } catch (err) {
    return respondJSON({ success: false, error: err.toString() });
  }
}

function respondJSON(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function normalizePhone(p) {
  return p ? p.toString().replace(/[\\s\\-\\(\\)\\.]/g, "") : "";
}

function initSheetsIfMissing() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var invSheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!invSheet) {
    invSheet = ss.insertSheet(SHEET_INVENTORY);
    invSheet.appendRow(INVENTORY_HEADERS);
    invSheet.getRange(1, 1, 1, INVENTORY_HEADERS.length).setFontWeight("bold").setBackground("#EEF2FF");
    invSheet.setFrozenRows(1);
  }
  var histSheet = ss.getSheetByName(SHEET_HISTORY);
  if (!histSheet) {
    histSheet = ss.insertSheet(SHEET_HISTORY);
    histSheet.appendRow(HISTORY_HEADERS);
    histSheet.getRange(1, 1, 1, HISTORY_HEADERS.length).setFontWeight("bold").setBackground("#FEF3C7");
    histSheet.setFrozenRows(1);
  }
}

function fetchAllNumbers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var records = [];
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (!row[0] && !row[1]) continue;
    records.push({
      id: row[0].toString(),
      phoneNumber: row[1].toString(),
      carrier: row[2] ? row[2].toString() : "Standard",
      simNumber: row[3] ? row[3].toString() : "",
      planType: row[4] ? row[4].toString() : "",
      monthlyCost: Number(row[5]) || 0,
      status: row[6] ? row[6].toString().toLowerCase() : "available",
      assignedTo: row[7] ? row[7].toString() : "",
      employeeId: row[8] ? row[8].toString() : "",
      department: row[9] ? row[9].toString() : "",
      assignmentDate: formatDate(row[10]),
      purpose: row[11] ? row[11].toString() : "",
      notes: row[12] ? row[12].toString() : "",
      createdAt: formatDate(row[13]),
      updatedAt: formatDate(row[14])
    });
  }
  return records;
}

function formatDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var d = ("0" + val.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }
  return val.toString();
}

function saveNumberRecord(record) {
  if (!record || !record.phoneNumber) return { success: false, error: "Phone number required" };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INVENTORY);
  var data = sheet.getDataRange().getValues();
  var targetNorm = normalizePhone(record.phoneNumber);
  var targetRow = -1;

  for (var r = 1; r < data.length; r++) {
    var curId = data[r][0] ? data[r][0].toString() : "";
    var curNorm = normalizePhone(data[r][1]);
    if (record.id && curId === record.id.toString()) {
      targetRow = r + 1;
      break;
    }
    if (curNorm === targetNorm && (!record.id || curId !== record.id.toString())) {
      return { success: false, error: "Duplicate mobile number '" + record.phoneNumber + "' exists." };
    }
  }

  var now = new Date().toISOString().split("T")[0];
  var rowData = [
    record.id || ("num-" + Date.now()),
    record.phoneNumber,
    record.carrier || "Standard",
    record.simNumber || "",
    record.planType || "Standard",
    Number(record.monthlyCost) || 0,
    record.status || "available",
    record.assignedTo || "",
    record.employeeId || "",
    record.department || "",
    record.assignmentDate || (record.status === "assigned" ? now : ""),
    record.purpose || "",
    record.notes || "",
    record.createdAt || now,
    now
  ];

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { success: true, message: "Saved to Google Sheet", id: rowData[0] };
}

function assignNumberRecord(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INVENTORY);
  var values = sheet.getDataRange().getValues();
  var targetNorm = normalizePhone(data.phoneNumber);
  var targetRow = -1;

  for (var r = 1; r < values.length; r++) {
    if (normalizePhone(values[r][1]) === targetNorm || (data.id && values[r][0] == data.id)) {
      targetRow = r + 1;
      break;
    }
  }
  if (targetRow === -1) return { success: false, error: "Number not found" };

  var now = new Date().toISOString().split("T")[0];
  sheet.getRange(targetRow, 7).setValue("assigned");
  sheet.getRange(targetRow, 8).setValue(data.assignedTo);
  sheet.getRange(targetRow, 9).setValue(data.employeeId || "");
  sheet.getRange(targetRow, 10).setValue(data.department || "");
  sheet.getRange(targetRow, 11).setValue(data.assignmentDate || now);
  sheet.getRange(targetRow, 12).setValue(data.purpose || "");
  sheet.getRange(targetRow, 13).setValue(data.notes || "");
  sheet.getRange(targetRow, 15).setValue(now);

  // Append history
  var histSheet = ss.getSheetByName(SHEET_HISTORY);
  if (histSheet) {
    histSheet.appendRow([
      "hist-" + Date.now(), data.phoneNumber, "assigned", data.assignedTo,
      data.employeeId || "", data.department || "", data.assignmentDate || now,
      "", data.purpose || "", data.notes || "", new Date().toISOString()
    ]);
  }
  return { success: true, message: "Assigned successfully in Google Sheet" };
}

function returnNumberRecord(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INVENTORY);
  var values = sheet.getDataRange().getValues();
  var targetNorm = normalizePhone(data.phoneNumber);
  var targetRow = -1;
  var prevName = "", prevId = "", prevDept = "", prevDate = "", prevPurpose = "";

  for (var r = 1; r < values.length; r++) {
    if (normalizePhone(values[r][1]) === targetNorm || (data.id && values[r][0] == data.id)) {
      targetRow = r + 1;
      prevName = values[r][7];
      prevId = values[r][8];
      prevDept = values[r][9];
      prevDate = formatDate(values[r][10]);
      prevPurpose = values[r][11];
      break;
    }
  }
  if (targetRow === -1) return { success: false, error: "Number not found" };

  var now = new Date().toISOString().split("T")[0];
  sheet.getRange(targetRow, 7).setValue("available");
  sheet.getRange(targetRow, 8).setValue("");
  sheet.getRange(targetRow, 9).setValue("");
  sheet.getRange(targetRow, 10).setValue("");
  sheet.getRange(targetRow, 11).setValue("");
  sheet.getRange(targetRow, 12).setValue("");
  sheet.getRange(targetRow, 13).setValue("Returned on " + (data.returnDate || now) + ". " + (data.notes || ""));
  sheet.getRange(targetRow, 15).setValue(now);

  var histSheet = ss.getSheetByName(SHEET_HISTORY);
  if (histSheet) {
    histSheet.appendRow([
      "hist-" + Date.now(), data.phoneNumber, "returned", prevName || "Employee",
      prevId, prevDept, prevDate, data.returnDate || now, prevPurpose, data.notes || "", new Date().toISOString()
    ]);
  }
  return { success: true, message: "Returned successfully in Google Sheet" };
}

function deleteNumberRecord(id, phone) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INVENTORY);
  var values = sheet.getDataRange().getValues();
  var targetNorm = normalizePhone(phone);
  for (var r = 1; r < values.length; r++) {
    if ((id && values[r][0] == id) || (targetNorm && normalizePhone(values[r][1]) === targetNorm)) {
      sheet.deleteRow(r + 1);
      return { success: true, message: "Deleted row" };
    }
  }
  return { success: false, error: "Record not found" };
}

function fetchHistory(phoneFilter) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_HISTORY);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var normFilter = normalizePhone(phoneFilter);
  var results = [];
  for (var r = data.length - 1; r >= 1; r--) {
    var cur = data[r];
    if (normFilter && normalizePhone(cur[1]) !== normFilter) continue;
    results.push({
      id: cur[0] ? cur[0].toString() : "hist-" + r,
      phoneNumber: cur[1] ? cur[1].toString() : "",
      action: cur[2] ? cur[2].toString().toLowerCase() : "assigned",
      employeeName: cur[3] ? cur[3].toString() : "",
      employeeId: cur[4] ? cur[4].toString() : "",
      department: cur[5] ? cur[5].toString() : "",
      assignmentDate: formatDate(cur[6]),
      returnDate: formatDate(cur[7]),
      purpose: cur[8] ? cur[8].toString() : "",
      notes: cur[9] ? cur[9].toString() : "",
      timestamp: formatDate(cur[10])
    });
  }
  return results;
}`;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testGoogleSheetsConnection(scriptUrl.trim(), apiToken.trim());
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = () => {
    const isConn = testResult?.success || (scriptUrl.trim().startsWith('https://script.google.com/macros/s/') && !useDemoData);
    const updated: GoogleSheetsConfig = {
      scriptUrl: scriptUrl.trim(),
      apiToken: apiToken.trim(),
      isConnected: Boolean(isConn),
      useDemoData: useDemoData
    };
    saveStoredConfig(updated);
    onSaveConfig(updated);
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50/50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Google Sheets Backend Setup</h3>
              <p className="text-xs text-slate-500">Connect Google Apps Script for live spreadsheet storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center gap-2 shrink-0">
          {[
            { id: 'connect', label: 'Connection Settings', icon: Link },
            { id: 'guide', label: 'Setup Guide (3 Steps)', icon: Zap },
            { id: 'code', label: 'View Apps Script Code', icon: FileSpreadsheet },
            { id: 'schema', label: 'Spreadsheet Schema', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-800 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: CONNECT */}
          {activeTab === 'connect' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">100% Free Backend on Google Infrastructure</strong>
                  <span>
                    Your phone records, assignments, and audit trails are stored in your own private Google Sheet.
                    Any edits made on this website automatically write to your spreadsheet in real time!
                  </span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Operation Mode</div>
                  <div className="text-[11px] text-slate-500">
                    {useDemoData ? 'Using rich sample data in browser cache' : 'Syncing directly with your Google Sheet'}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setUseDemoData(false)}
                    className={`px-3 py-1 rounded font-semibold transition-colors cursor-pointer ${
                      !useDemoData ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Live Google Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseDemoData(true)}
                    className={`px-3 py-1 rounded font-semibold transition-colors cursor-pointer ${
                      useDemoData ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Demo Mode
                  </button>
                </div>
              </div>

              {/* Script URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Apps Script Web App URL
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    value={scriptUrl}
                    onChange={e => {
                      setScriptUrl(e.target.value);
                      setTestResult(null);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Obtained after clicking <strong>Deploy &gt; New deployment &gt; Web app</strong> in Apps Script.
                </p>
              </div>

              {/* API Security Token */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Secret Token (Protects Write Operations)
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={apiToken}
                    onChange={e => setApiToken(e.target.value)}
                    placeholder="admin123"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Must match the <code>API_SECRET_KEY</code> variable inside your Google Apps Script file.
                </p>
              </div>

              {/* Live Test Button & Feedback */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !scriptUrl.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
                  <span>{testing ? 'Pinging Google Sheets...' : 'Test Connection'}</span>
                </button>

                {testResult && (
                  <div className={`mt-3 p-3 rounded-lg text-xs flex items-start gap-2 border ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">{testResult.success ? 'Connection Successful!' : 'Connection Error'}</div>
                      <div>{testResult.message}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div className="space-y-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Step 1: Create a Google Sheet</span>
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <span>Open sheets.new</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-slate-600">
                    Open a new Google Sheet. You can name it <strong>"Company Mobile Number Inventory"</strong>.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900">
                    Step 2: Open Extensions &gt; Apps Script
                  </div>
                  <p className="text-slate-600">
                    In the Google Sheet top menu, click <strong>Extensions &gt; Apps Script</strong>.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Step 3: Paste Code &amp; Deploy as Web App</span>
                    <button
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-bold transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <p className="text-slate-600">
                    Replace everything in the Apps Script editor with the code from the <strong>View Apps Script Code</strong> tab, then save.
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1 text-slate-600">
                    <div>1. Click <strong>Deploy</strong> (top right) &gt; <strong>New deployment</strong></div>
                    <div>2. Select type: <strong>Web app</strong> (gear icon)</div>
                    <div>3. Description: <strong>Mobile API</strong></div>
                    <div>4. Execute as: <strong>Me (your email)</strong></div>
                    <div>5. Who has access: <strong>Anyone</strong> (Crucial for web app connection)</div>
                    <div>6. Click <strong>Deploy</strong>, grant permissions, and copy the <strong>Web App URL</strong>!</div>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900">
                    Step 4: Paste URL &amp; Done!
                  </div>
                  <p className="text-slate-600">
                    Paste the copied URL in the <strong>Connection Settings</strong> tab and click <strong>Save &amp; Connect</strong>.
                    The script will automatically create the <code>MobileInventory</code> and <code>AssignmentHistory</code> tabs with formatted headers!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE VIEWER */}
          {activeTab === 'code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Google Apps Script (Code.gs)</span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Entire Code'}</span>
                </button>
              </div>
              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-80 text-xs font-mono text-emerald-300">
                <pre>{APPS_SCRIPT_CODE}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: SPREADSHEET SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-4 text-xs text-slate-700">
              <p>
                The Google Apps Script automatically initializes two sheets when first accessed:
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  Sheet 1: <code>MobileInventory</code>
                </div>
                <p className="text-[11px] text-slate-600">
                  Holds current inventory status for all registered mobile numbers:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span>1. ID</span>
                  <span>2. Mobile Number</span>
                  <span>3. Carrier</span>
                  <span>4. SIM Number</span>
                  <span>5. Plan Type</span>
                  <span>6. Monthly Cost</span>
                  <span>7. Status</span>
                  <span>8. Assigned To</span>
                  <span>9. Employee ID</span>
                  <span>10. Department</span>
                  <span>11. Assignment Date</span>
                  <span>12. Purpose</span>
                  <span>13. Notes</span>
                  <span>14. Created At</span>
                  <span>15. Updated At</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Sheet 2: <code>AssignmentHistory</code>
                </div>
                <p className="text-[11px] text-slate-600">
                  Maintains an immutable historical record of all line allocations and returns:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span>1. History ID</span>
                  <span>2. Mobile Number</span>
                  <span>3. Action</span>
                  <span>4. Employee Name</span>
                  <span>5. Employee ID</span>
                  <span>6. Department</span>
                  <span>7. Assignment Date</span>
                  <span>8. Return Date</span>
                  <span>9. Purpose</span>
                  <span>10. Notes</span>
                  <span>11. Timestamp</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {useDemoData ? 'Demo mode is active' : 'Live Google Sheets is enabled'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-200 transition-all cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
