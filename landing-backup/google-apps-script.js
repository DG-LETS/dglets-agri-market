/* ============================================================
   DG-LETS Agri Market — Google Apps Script
   Role-specific form collector + email notifications
   Open this from inside your Google Sheet:
   Extensions → Apps Script
   ============================================================ */

/* ── Sheet tabs — one per role ── */
var SHEETS = {
  farmer:    'Farmers',
  buyer:     'Buyers',
  supplier:  'Suppliers',
  logistics: 'Logistics',
  general:   'General'
};

/* ── Headers per role ── */
var HEADERS = {
  farmer: [
    'Timestamp','Full Name','Phone','Email',
    'State','LGA','Farm Location','Products Grown',
    'Production Capacity','Source','User Agent'
  ],
  buyer: [
    'Timestamp','Full Name','Phone','Email',
    'State','LGA','Products Interested In',
    'Buying Frequency','Buyer Type','Source','User Agent'
  ],
  supplier: [
    'Timestamp','Full Name / Business','Phone','Email',
    'State','Products Supplied','Supplier Type','Source','User Agent'
  ],
  logistics: [
    'Timestamp','Full Name / Company','Phone','Email',
    'Base State','Coverage Area','Vehicle Type',
    'Delivery Capacity','Source','User Agent'
  ],
  general: [
    'Timestamp','Name','Email','Phone',
    'Role','State','LGA','Source','User Agent'
  ]
};

/* ── Notification email ── */
var NOTIFY_EMAIL = 'dgletsagritech5@gmail.com';

/* ── Get or create a named sheet tab ── */
function getOrCreateSheet(name) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/* ── Ensure headers on a sheet ── */
function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var r = sheet.getRange(1, 1, 1, headers.length);
    r.setBackground('#1e5c3a');
    r.setFontColor('#ffffff');
    r.setFontWeight('bold');
    r.setFontSize(10);
    sheet.setFrozenRows(1);
    for (var i = 1; i <= headers.length; i++) {
      sheet.setColumnWidth(i, 160);
    }
  }
}

/* ── Alternate row shading ── */
function shadeRow(sheet, rowNum, headers) {
  if (rowNum % 2 === 0) {
    sheet.getRange(rowNum, 1, 1, headers.length).setBackground('#f0f7f1');
  }
}

/* ── Send email notification ── */
function sendNotification(role, data, sheetName, rowNum) {
  try {
    var roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    var name      = data.name || data.companyName || 'Unknown';
    var subject   = '🌱 New DG-LETS ' + roleLabel + ' Signup — ' + name;

    var lines = ['New ' + roleLabel + ' signup on DG-LETS Agri Market.\n'];
    lines.push('Name:    ' + (data.name || data.companyName || '—'));
    lines.push('Phone:   ' + (data.phone   || '—'));
    lines.push('Email:   ' + (data.email   || '—'));
    lines.push('Role:    ' + roleLabel);
    lines.push('State:   ' + (data.state   || '—'));

    if (role === 'farmer') {
      lines.push('LGA:          ' + (data.lga          || '—'));
      lines.push('Farm Location:' + (data.farmLocation  || '—'));
      lines.push('Products:     ' + (data.products      || '—'));
      lines.push('Capacity:     ' + (data.capacity      || '—'));
    } else if (role === 'buyer') {
      lines.push('LGA:          ' + (data.lga           || '—'));
      lines.push('Products:     ' + (data.products      || '—'));
      lines.push('Frequency:    ' + (data.frequency     || '—'));
      lines.push('Buyer Type:   ' + (data.buyerType     || '—'));
    } else if (role === 'supplier') {
      lines.push('Products:     ' + (data.products      || '—'));
      lines.push('Supplier Type:' + (data.supplierType  || '—'));
    } else if (role === 'logistics') {
      lines.push('Coverage:     ' + (data.coverage      || '—'));
      lines.push('Vehicle Type: ' + (data.vehicleType   || '—'));
      lines.push('Capacity:     ' + (data.capacity      || '—'));
    }

    lines.push('\nSource:  ' + (data.source    || '—'));
    lines.push('Time:    ' + new Date().toLocaleString());
    lines.push('Sheet:   ' + sheetName + ' (row ' + rowNum + ')');
    lines.push('\nView sheet: https://docs.google.com/spreadsheets/d/' +
               SpreadsheetApp.getActiveSpreadsheet().getId());
    lines.push('\n— DG-LETS Agri Market\n"From Farm to Phone. Market to the World."');

    MailApp.sendEmail(NOTIFY_EMAIL, subject, lines.join('\n'));
    Logger.log('Notification sent: ' + subject);
  } catch(err) {
    Logger.log('Email failed: ' + err.toString());
  }
}

/* ── doPost — handles all form submissions ── */
function doPost(e) {
  try {
    var data    = JSON.parse(e.postData.contents);
    var role    = (data.role || 'general').toLowerCase();
    var tabName = SHEETS[role] || SHEETS.general;
    var headers = HEADERS[role] || HEADERS.general;

    var sheet = getOrCreateSheet(tabName);
    ensureHeaders(sheet, headers);

    var row;

    if (role === 'farmer') {
      row = [
        new Date(), data.name || '', data.phone || '', data.email || '',
        data.state || '', data.lga || '', data.farmLocation || '',
        data.products || '', data.capacity || '',
        data.source || 'early-access-form', data.userAgent || ''
      ];
    } else if (role === 'buyer') {
      row = [
        new Date(), data.name || '', data.phone || '', data.email || '',
        data.state || '', data.lga || '', data.products || '',
        data.frequency || '', data.buyerType || '',
        data.source || 'early-access-form', data.userAgent || ''
      ];
    } else if (role === 'supplier') {
      row = [
        new Date(), data.name || '', data.phone || '', data.email || '',
        data.state || '', data.products || '', data.supplierType || '',
        data.source || 'early-access-form', data.userAgent || ''
      ];
    } else if (role === 'logistics') {
      row = [
        new Date(), data.name || '', data.phone || '', data.email || '',
        data.state || '', data.coverage || '', data.vehicleType || '',
        data.capacity || '',
        data.source || 'early-access-form', data.userAgent || ''
      ];
    } else {
      row = [
        new Date(), data.name || '', data.email || '', data.phone || '',
        data.role || '', data.state || '', data.lga || '',
        data.source || 'early-access-form', data.userAgent || ''
      ];
    }

    sheet.appendRow(row);
    var lastRow = sheet.getLastRow();
    shadeRow(sheet, lastRow, headers);
    sendNotification(role, data, tabName, lastRow);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', role: role, row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    Logger.log('doPost error: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ── doGet — health check ── */
function doGet(e) {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var counts = {};
  var total  = 0;
  var roles  = Object.keys(SHEETS);
  for (var i = 0; i < roles.length; i++) {
    var sheetName = SHEETS[roles[i]];
    var sheet     = ss.getSheetByName(sheetName);
    var count     = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
    counts[roles[i]] = count;
    total += count;
  }
  return ContentService
    .createTextOutput(JSON.stringify({
      status:  'DG-LETS form collector is active',
      total:   total,
      counts:  counts,
      sheet:   ss.getName(),
      time:    new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── testSubmission — run manually to verify each role ── */
function testSubmission() {
  var tests = [
    { role:'farmer',   name:'Test Farmer',   phone:'08011111111', email:'farmer@test.com',   state:'Kaduna',  lga:'Chikun',  farmLocation:'Zaria Road', products:'Ginger, Turmeric', capacity:'medium',    source:'manual-test', userAgent:'test' },
    { role:'buyer',    name:'Test Buyer',    phone:'08022222222', email:'buyer@test.com',    state:'Lagos',   lga:'Ikeja',   products:'Ginger, Maize',  frequency:'monthly',  buyerType:'restaurant', source:'manual-test', userAgent:'test' },
    { role:'supplier', name:'Test Supplier', phone:'08033333333', email:'supplier@test.com', state:'Kano',    products:'Rice, Sesame', supplierType:'aggregator', source:'manual-test', userAgent:'test' },
    { role:'logistics',name:'Test Logistics',phone:'08044444444', email:'logistics@test.com',state:'Abuja',   coverage:'Kaduna-Abuja', vehicleType:'medium-truck', capacity:'5 tonnes', source:'manual-test', userAgent:'test' }
  ];

  for (var i = 0; i < tests.length; i++) {
    var data     = tests[i];
    var role     = data.role;
    var tabName  = SHEETS[role];
    var headers  = HEADERS[role];
    var sheet    = getOrCreateSheet(tabName);
    ensureHeaders(sheet, headers);

    var row;
    if (role === 'farmer')    row = [new Date(), data.name, data.phone, data.email, data.state, data.lga, data.farmLocation, data.products, data.capacity, data.source, data.userAgent];
    if (role === 'buyer')     row = [new Date(), data.name, data.phone, data.email, data.state, data.lga, data.products, data.frequency, data.buyerType, data.source, data.userAgent];
    if (role === 'supplier')  row = [new Date(), data.name, data.phone, data.email, data.state, data.products, data.supplierType, data.source, data.userAgent];
    if (role === 'logistics') row = [new Date(), data.name, data.phone, data.email, data.state, data.coverage, data.vehicleType, data.capacity, data.source, data.userAgent];

    sheet.appendRow(row);
    shadeRow(sheet, sheet.getLastRow(), headers);
    sendNotification(role, data, tabName, sheet.getLastRow());
    Logger.log('Added test row for: ' + role);
  }
  Logger.log('All test submissions done. Check your sheet and inbox.');
}

/* ── testEmailDirect — quick email sanity check ── */
function testEmailDirect() {
  MailApp.sendEmail(NOTIFY_EMAIL, 'DG-LETS Test Email', 'MailApp is working correctly.');
  Logger.log('SUCCESS — email sent to ' + NOTIFY_EMAIL);
}
