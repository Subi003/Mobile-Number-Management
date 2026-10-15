/**
 * =========================================================================
 * Mobile Number Inventory & Allocation Manager - Google Apps Script Backend
 * =========================================================================
 * 
 * Instructions:
 * 1. Create a new Google Sheet at https://sheets.new
 * 2. In the Google Sheet, go to Extensions > Apps Script
 * 3. Delete any code in the editor, paste this entire file, and click Save (disk icon)
 * 4. Click 'Deploy' (top right) > 'New deployment'
 * 5. Select type: 'Web app'
 * 6. Set Description: "Mobile Inventory API"
 * 7. Set 'Execute as': "Me (your email)"
 * 8. Set 'Who has access': "Anyone" (Required for web frontend to connect without OAuth redirection)
 * 9. Click 'Deploy' and authorize access.
 * 10. Copy the Web App URL (ends with /exec) and paste it into the Settings in the website!
 *
 * Optional Security:
 * Change API_SECRET_KEY below to your chosen secret password or set in Project Settings > Script Properties.
 */

// Optional shared security key to protect write operations (leave empty to disable, or set your secret)
var API_SECRET_KEY = "admin123"; 

var SHEET_INVENTORY = "MobileInventory";
var SHEET_HISTORY = "AssignmentHistory";

var INVENTORY_HEADERS = [
  "ID",
  "Mobile Number",
  "Carrier",
  "SIM Number",
  "Plan Type",
  "Monthly Cost",
  "Status",
  "Assigned To",
  "Employee ID",
  "Department",
  "Assignment Date",
  "Purpose",
  "Notes",
  "Created At",
  "Updated At"
];

var HISTORY_HEADERS = [
  "History ID",
  "Mobile Number",
  "Action",
  "Employee Name",
  "Employee ID",
  "Department",
  "Assignment Date",
  "Return Date",
  "Purpose",
  "Notes",
  "Timestamp"
];

/**
 * Handle GET requests (read inventory, history, ping)
 */
function doGet(e) {
  try {
    initSheetsIfMissing();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getNumbers";
    var phoneNumber = (e && e.parameter && e.parameter.phoneNumber) ? e.parameter.phoneNumber : "";

    var result;
    switch (action) {
      case "ping":
        result = { success: true, message: "Google Sheets API is active and ready", timestamp: new Date().toISOString() };
        break;
      case "getNumbers":
        result = { success: true, data: fetchAllNumbers() };
        break;
      case "getHistory":
        result = { success: true, data: fetchHistory(phoneNumber) };
        break;
      case "getStats":
        result = { success: true, data: calculateStats() };
        break;
      default:
        result = { success: false, error: "Unknown action: " + action };
    }
    return respondJSON(result);
  } catch (err) {
    return respondJSON({ success: false, error: err.toString() });
  }
}

/**
 * Handle POST requests (add, edit, delete, assign, return)
 */
function doPost(e) {
  try {
    initSheetsIfMissing();

    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    // Verify Secret Key if configured
    if (API_SECRET_KEY && API_SECRET_KEY.trim() !== "") {
      var providedToken = payload.apiToken || payload.token || (e && e.parameter ? e.parameter.apiToken : "");
      if (providedToken !== API_SECRET_KEY) {
        return respondJSON({ 
          success: false, 
          error: "Unauthorized: Invalid or missing API security token. Please provide the correct API Secret Token." 
        });
      }
    }

    var action = payload.action;
    var result;

    switch (action) {
      case "saveNumber":
        result = saveNumberRecord(payload.record);
        break;
      case "assignNumber":
        result = assignNumberRecord(payload.data);
        break;
      case "returnNumber":
        result = returnNumberRecord(payload.data);
        break;
      case "deleteNumber":
        result = deleteNumberRecord(payload.id, payload.phoneNumber);
        break;
      case "bulkImport":
        result = bulkImportNumbers(payload.records);
        break;
      case "verifyAuth":
        result = { success: true, message: "Authentication verified successfully." };
        break;
      default:
        result = { success: false, error: "Unsupported POST action: " + action };
    }

    return respondJSON(result);
  } catch (err) {
    return respondJSON({ success: false, error: err.toString() });
  }
}

/**
 * Standardized JSON response with CORS headers
 */
function respondJSON(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Clean phone number for comparison (removes spaces, dashes, parentheses)
 */
function normalizePhone(phone) {
  if (!phone) return "";
  return phone.toString().replace(/[\s\-\(\)\.]/g, "");
}

/**
 * Get or create the needed sheets
 */
function initSheetsIfMissing() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Inventory sheet
  var invSheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!invSheet) {
    invSheet = ss.insertSheet(SHEET_INVENTORY);
    invSheet.appendRow(INVENTORY_HEADERS);
    invSheet.getRange(1, 1, 1, INVENTORY_HEADERS.length).setFontWeight("bold").setBackground("#EEF2FF");
    invSheet.setFrozenRows(1);
    
    // Seed initial demo numbers if brand new
    seedSampleData(invSheet);
  }

  // 2. History sheet
  var histSheet = ss.getSheetByName(SHEET_HISTORY);
  if (!histSheet) {
    histSheet = ss.insertSheet(SHEET_HISTORY);
    histSheet.appendRow(HISTORY_HEADERS);
    histSheet.getRange(1, 1, 1, HISTORY_HEADERS.length).setFontWeight("bold").setBackground("#FEF3C7");
    histSheet.setFrozenRows(1);
  }
}

/**
 * Seed initial sample numbers into fresh sheet
 */
function seedSampleData(sheet) {
  var now = new Date().toISOString().split("T")[0];
  var samples = [
    ["num-1", "+1 (555) 234-5678", "Verizon", "8901410321111851072", "Unlimited 5G", 45, "assigned", "Sarah Jenkins", "EMP-1042", "Sales", now, "Client Meetings & Field Sales", "Corporate iPhone 14 assigned", now, now],
    ["num-2", "+1 (555) 345-6789", "AT&T", "8901410321111851073", "Business Pro 50GB", 40, "assigned", "David Kim", "EMP-1088", "Engineering", now, "On-call Production Incident Response", "Primary SRE hotline", now, now],
    ["num-3", "+1 (555) 456-7890", "T-Mobile", "8901410321111851074", "Unlimited Elite", 35, "available", "", "", "", "", "", "SIM tested and ready to allocate", now, now],
    ["num-4", "+1 (555) 567-8901", "Verizon", "8901410321111851075", "Unlimited 5G", 45, "available", "", "", "", "", "", "New batch from carrier", now, now],
    ["num-5", "+1 (555) 678-9012", "Vodafone", "8901410321111851076", "Global Roaming", 60, "reserved", "Elena Rostova", "EMP-2015", "Executive", "", "International Summit Q4", "Hold for London branch transfer", now, now]
  ];
  for (var i = 0; i < samples.length; i++) {
    sheet.appendRow(samples[i]);
  }
}

/**
 * Fetch all inventory records
 */
function fetchAllNumbers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INVENTORY);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var records = [];

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    if (!row[0] && !row[1]) continue; // skip empty

    records.push({
      id: row[0] ? row[0].toString() : "id-" + r,
      phoneNumber: row[1] ? row[1].toString() : "",
      carrier: row[2] ? row[2].toString() : "Standard",
      simNumber: row[3] ? row[3].toString() : "",
      planType: row[4] ? row[4].toString() : "",
      monthlyCost: Number(row[5]) || 0,
      status: row[6] ? row[6].toString().toLowerCase() : "available",
      assignedTo: row[7] ? row[7].toString() : "",
      employeeId: row[8] ? row[8].toString() : "",
      department: row[9] ? row[9].toString() : "",
      assignmentDate: formatDateValue(row[10]),
      purpose: row[11] ? row[11].toString() : "",
      notes: row[12] ? row[12].toString() : "",
      createdAt: formatDateValue(row[13]),
      updatedAt: formatDateValue(row[14])
    });
  }

  return records;
}

/**
 * Format date values to YYYY-MM-DD
 */
function formatDateValue(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var d = ("0" + val.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }
  return val.toString();
}

/**
 * Save (create or update) a single mobile record with duplicate check
 */
function saveNumberRecord(record) {
  if (!record || !record.phoneNumber) {
    return { success: false, error: "Mobile number is required." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INVENTORY);
  var data = sheet.getDataRange().getValues();
  
  var normalizedTarget = normalizePhone(record.phoneNumber);
  var now = new Date().toISOString().split("T")[0];
  var existingRowIndex = -1;

  for (var r = 1; r < data.length; r++) {
    var currentId = data[r][0] ? data[r][0].toString() : "";
    var currentPhone = normalizePhone(data[r][1]);

    // Same ID match (Editing existing record)
    if (record.id && currentId === record.id.toString()) {
      existingRowIndex = r + 1; // 1-based index in Sheet
      break;
    }

    // Duplicate Phone Check for a new record or changed number
    if (currentPhone === normalizedTarget && (!record.id || currentId !== record.id.toString())) {
      return { 
        success: false, 
        error: "Mobile number '" + record.phoneNumber + "' already exists in inventory (Row " + (r + 1) + "). Duplicate numbers are not allowed." 
      };
    }
  }

  var rowData = [
    record.id || ("num-" + Date.now()),
    record.phoneNumber,
    record.carrier || "Standard",
    record.simNumber || "",
    record.planType || "Standard Voice/Data",
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

  if (existingRowIndex > 0) {
    // Update existing row
    sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Append new row
    sheet.appendRow(rowData);
    // Log creation in history
    logHistoryEntry({
      phoneNumber: record.phoneNumber,
      action: "created",
      employeeName: record.assignedTo || "System",
      employeeId: record.employeeId || "N/A",
      department: record.department || "Inventory",
      assignmentDate: record.assignmentDate || now,
      purpose: "Initial Registration",
      notes: record.notes || "Added to inventory"
    });
  }

  return { success: true, message: "Record saved successfully.", id: rowData[0] };
}

/**
 * Assign a mobile number to an employee
 */
function assignNumberRecord(data) {
  if (!data || !data.phoneNumber || !data.assignedTo) {
    return { success: false, error: "Phone number and Assignee Name are required." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INVENTORY);
  var values = sheet.getDataRange().getValues();

  var normalizedTarget = normalizePhone(data.phoneNumber);
  var targetRow = -1;

  for (var r = 1; r < values.length; r++) {
    var curPhone = normalizePhone(values[r][1]);
    var curId = values[r][0] ? values[r][0].toString() : "";

    if ((data.id && curId === data.id.toString()) || curPhone === normalizedTarget) {
      targetRow = r + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, error: "Number not found in inventory." };
  }

  var now = new Date().toISOString().split("T")[0];
  var assignDate = data.assignmentDate || now;

  // Columns:
  // 7: Status (G)
  // 8: Assigned To (H)
  // 9: Employee ID (I)
  // 10: Department (J)
  // 11: Assignment Date (K)
  // 12: Purpose (L)
  // 13: Notes (M)
  // 15: Updated At (O)

  sheet.getRange(targetRow, 7).setValue("assigned");
  sheet.getRange(targetRow, 8).setValue(data.assignedTo);
  sheet.getRange(targetRow, 9).setValue(data.employeeId || "");
  sheet.getRange(targetRow, 10).setValue(data.department || "");
  sheet.getRange(targetRow, 11).setValue(assignDate);
  sheet.getRange(targetRow, 12).setValue(data.purpose || "Business Communication");
  sheet.getRange(targetRow, 13).setValue(data.notes || "");
  sheet.getRange(targetRow, 15).setValue(now);

  // Write History row
  logHistoryEntry({
    phoneNumber: data.phoneNumber,
    action: "assigned",
    employeeName: data.assignedTo,
    employeeId: data.employeeId || "",
    department: data.department || "",
    assignmentDate: assignDate,
    returnDate: "",
    purpose: data.purpose || "Business Communication",
    notes: data.notes || "Assigned via web dashboard"
  });

  return { success: true, message: "Number successfully assigned to " + data.assignedTo };
}

/**
 * Return / Unassign a mobile number
 */
function returnNumberRecord(data) {
  if (!data || !data.phoneNumber) {
    return { success: false, error: "Phone number is required to process return." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INVENTORY);
  var values = sheet.getDataRange().getValues();

  var normalizedTarget = normalizePhone(data.phoneNumber);
  var targetRow = -1;
  var prevAssignee = "";
  var prevEmpId = "";
  var prevDept = "";
  var prevAssignDate = "";
  var prevPurpose = "";

  for (var r = 1; r < values.length; r++) {
    var curPhone = normalizePhone(values[r][1]);
    var curId = values[r][0] ? values[r][0].toString() : "";

    if ((data.id && curId === data.id.toString()) || curPhone === normalizedTarget) {
      targetRow = r + 1;
      prevAssignee = values[r][7];
      prevEmpId = values[r][8];
      prevDept = values[r][9];
      prevAssignDate = formatDateValue(values[r][10]);
      prevPurpose = values[r][11];
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, error: "Number not found in inventory." };
  }

  var now = new Date().toISOString().split("T")[0];
  var returnDate = data.returnDate || now;
  var returnNotes = data.notes || "Device & SIM returned to pool";

  // Reset inventory row to available
  sheet.getRange(targetRow, 7).setValue("available");
  sheet.getRange(targetRow, 8).setValue("");
  sheet.getRange(targetRow, 9).setValue("");
  sheet.getRange(targetRow, 10).setValue("");
  sheet.getRange(targetRow, 11).setValue("");
  sheet.getRange(targetRow, 12).setValue("");
  sheet.getRange(targetRow, 13).setValue("Returned on " + returnDate + ". " + returnNotes);
  sheet.getRange(targetRow, 15).setValue(now);

  // Log in history
  logHistoryEntry({
    phoneNumber: data.phoneNumber,
    action: "returned",
    employeeName: prevAssignee || (data.assignedTo || "Former Employee"),
    employeeId: prevEmpId || (data.employeeId || ""),
    department: prevDept || (data.department || ""),
    assignmentDate: prevAssignDate || "",
    returnDate: returnDate,
    purpose: prevPurpose || (data.purpose || ""),
    notes: returnNotes
  });

  return { success: true, message: "Number successfully returned to available pool." };
}

/**
 * Delete a number from inventory
 */
function deleteNumberRecord(id, phoneNumber) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_INVENTORY);
  var values = sheet.getDataRange().getValues();

  var targetRow = -1;
  var normalizedPhone = normalizePhone(phoneNumber);

  for (var r = 1; r < values.length; r++) {
    var curId = values[r][0] ? values[r][0].toString() : "";
    var curPhone = normalizePhone(values[r][1]);

    if ((id && curId === id.toString()) || (normalizedPhone && curPhone === normalizedPhone)) {
      targetRow = r + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return { success: false, error: "Record not found to delete." };
  }

  sheet.deleteRow(targetRow);
  return { success: true, message: "Record deleted from Google Sheet." };
}

/**
 * Log entry into AssignmentHistory sheet
 */
function logHistoryEntry(entry) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_HISTORY);
  if (!sheet) return;

  var histId = "hist-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  var now = new Date().toISOString();

  sheet.appendRow([
    histId,
    entry.phoneNumber,
    entry.action || "assigned",
    entry.employeeName || "",
    entry.employeeId || "",
    entry.department || "",
    entry.assignmentDate || "",
    entry.returnDate || "",
    entry.purpose || "",
    entry.notes || "",
    now
  ]);
}

/**
 * Fetch assignment history records
 */
function fetchHistory(phoneNumberFilter) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_HISTORY);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var records = [];
  var filterNorm = normalizePhone(phoneNumberFilter);

  for (var r = data.length - 1; r >= 1; r--) {
    var row = data[r];
    if (!row[0] && !row[1]) continue;

    var curPhone = row[1] ? row[1].toString() : "";
    if (filterNorm && normalizePhone(curPhone) !== filterNorm) {
      continue;
    }

    records.push({
      id: row[0] ? row[0].toString() : "hist-" + r,
      phoneNumber: curPhone,
      action: row[2] ? row[2].toString().toLowerCase() : "assigned",
      employeeName: row[3] ? row[3].toString() : "",
      employeeId: row[4] ? row[4].toString() : "",
      department: row[5] ? row[5].toString() : "",
      assignmentDate: formatDateValue(row[6]),
      returnDate: formatDateValue(row[7]),
      purpose: row[8] ? row[8].toString() : "",
      notes: row[9] ? row[9].toString() : "",
      timestamp: formatDateValue(row[10])
    });
  }

  return records;
}

/**
 * Calculate high-level stats directly from spreadsheet
 */
function calculateStats() {
  var records = fetchAllNumbers();
  var total = records.length;
  var available = 0;
  var assigned = 0;
  var reserved = 0;
  var maintenance = 0;
  var totalMonthlyCost = 0;

  for (var i = 0; i < records.length; i++) {
    var st = records[i].status;
    if (st === "available") available++;
    else if (st === "assigned") assigned++;
    else if (st === "reserved") reserved++;
    else if (st === "maintenance") maintenance++;
    
    totalMonthlyCost += records[i].monthlyCost || 0;
  }

  return {
    total: total,
    available: available,
    assigned: assigned,
    reserved: reserved,
    maintenance: maintenance,
    totalMonthlyCost: totalMonthlyCost
  };
}
