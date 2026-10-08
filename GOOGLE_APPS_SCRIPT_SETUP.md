# Google Apps Script Setup & Troubleshooting Guide

This guide ensures your Google Apps Script Web App works seamlessly with the Patient Registration API.

---

## 1. Web App Endpoint
Your configured endpoint:
```
https://script.google.com/macros/s/AKfycbwVHhPUQGMg0oJzgu2cnSfTd1Ll56Nyffc9zo33umqbYuG3paFCc8dqKGDCKuegiHs5/exec
```

---

## 2. Complete Google Apps Script Code (`Code.gs`)

In your Google Sheet, open **Extensions > Apps Script** and paste this code:

```javascript
/**
 * Patient Registration Web App Endpoint for TrustDR
 * Connected to Google Sheets ("Patients" tab)
 */

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    // Wait up to 15 seconds to ensure sequential Patient ID generation without race conditions
    lock.waitLock(15000);

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No post data received in request.");
    }

    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Patients");

    // Automatically create "Patients" tab if it does not exist
    if (!sheet) {
      sheet = ss.insertSheet("Patients");
      sheet.appendRow([
        "Patient ID",
        "Full Name",
        "Age",
        "Gender",
        "Phone",
        "Email",
        "Address",
        "Diabetes Status",
        "Diabetes Type",
        "Duration (Years)",
        "HbA1c (%)",
        "Hypertension",
        "Registered At"
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight("bold");
    }

    // Generate Sequential Patient ID (PAT-0001, PAT-0002, etc.)
    var lastRow = sheet.getLastRow();
    var nextNumber = 1;
    if (lastRow > 1) {
      var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idValues.length; i++) {
        var rawId = idValues[i][0];
        if (rawId && rawId.toString().indexOf("PAT-") === 0) {
          var num = parseInt(rawId.toString().replace("PAT-", ""), 10);
          if (!isNaN(num) && num >= nextNumber) {
            nextNumber = num + 1;
          }
        }
      }
    }

    var patientId = "PAT-" + ("0000" + nextNumber).slice(-4);
    var nowTimestamp = new Date().toISOString();

    // Append new patient row
    sheet.appendRow([
      patientId,
      data.patientName || "",
      data.age || "",
      data.gender || "",
      data.phone || "",
      data.email || "",
      data.address || "",
      data.diabetesStatus || "",
      data.diabetesType || "",
      data.diabetesDuration || "",
      data.hba1c || "",
      data.hypertension ? "Yes" : "No",
      nowTimestamp
    ]);

    lock.releaseLock();

    var responseData = {
      success: true,
      patientId: patientId,
      message: "Patient registered successfully"
    };

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var errorResponse = {
      success: false,
      error: err.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "Google Apps Script Patient Database API is online"
  })).setMimeType(ContentService.MimeType.JSON);
}
```

---

## 3. Critical Deployment Setting: "Who has access"

When deploying the Web App:

1. Click **Deploy > Manage deployments** (or **New deployment**).
2. Select type: **Web app**.
3. **Execute as**: **Me** (`your-email@gmail.com`).
4. **Who has access**: **Anyone** ⚠️ *(CRITICAL)*
   - If set to **"Only myself"** or **"Anyone with Google account"**, Google Drive blocks requests from web browsers with:
     `Page not found / Sorry, unable to open the file at present.`
   - Setting it to **"Anyone"** enables the web app to receive patient registrations without needing Google account session cookies.
5. Click **Deploy**. If updating an existing deployment, select **New version** and click **Deploy**.
