/**
 * SHIVA HOME TUTOR — Website form-to-Google-Sheet connector (v3)
 * -----------------------------------------------------------
 * New in this version:
 *  - "Open Enquiries" tab: a job-board style list of tutoring requirements
 *    that YOU add directly in Google Sheets (including from the Sheets
 *    mobile app on your phone). The website reads this tab live and shows
 *    only rows marked Status = "Open" as cards for tutors to browse.
 *  - Mark a row "Closed" in the Sheet and it disappears from the public
 *    list automatically — no code changes needed.
 *  - When a tutor clicks "I'm Interested" on a listing and submits the
 *    registration form, the notification email now tells you exactly
 *    which posting they were responding to.
 *
 * SETUP (if you haven't deployed any version yet, start here; if you're
 * upgrading from v1/v2, skip to "UPGRADING" below):
 * 1. Google Sheets → new blank spreadsheet.
 * 2. Extensions → Apps Script → delete starter code → paste this whole file.
 * 3. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone → Deploy.
 * 4. Authorize when prompted.
 * 5. Copy the Web app URL (ends in /exec) into SHEET_SCRIPT_URL in script.js.
 *
 * UPGRADING from an earlier version:
 * 1. Open your existing Apps Script project.
 * 2. Select all existing code, delete it, paste this whole file in.
 * 3. Deploy → Manage deployments → pencil/edit icon → Version: "New version" → Deploy.
 *    (This step is required — editing code alone does not update the live URL.)
 * 4. Run the function "setupOpenEnquiriesSheet" once manually (see below) to
 *    create the "Open Enquiries" tab with the right headers and an example row.
 *
 * HOW TO ADD A NEW ENQUIRY (do this daily, from your phone or computer):
 * 1. Open your Google Sheet → "Open Enquiries" tab.
 * 2. Add a new row: Class, Subject, Area, Notes (e.g. timing/budget/gender
 *    preference), and set Status to "Open".
 * 3. That's it — it appears on the website within a few seconds (next time
 *    someone loads the page).
 *
 * HOW TO CLOSE AN ENQUIRY:
 * - Change that row's Status cell to "Closed". It disappears from the
 *   public list immediately (next page load) but stays in your Sheet
 *   as a record.
 *
 * HOW TO RUN "setupOpenEnquiriesSheet" MANUALLY (one-time):
 * 1. In the Apps Script editor, use the function dropdown near the Run
 *    button and select "setupOpenEnquiriesSheet".
 * 2. Click Run (▶). Authorize if asked.
 * 3. Check your Sheet — a new "Open Enquiries" tab should appear with
 *    headers and one example row.
 */

var ADMIN_EMAIL = "shivahometutor.apply@gmail.com";
var TIMEZONE = "Asia/Kolkata";
var ENQUIRIES_SHEET_NAME = "Open Enquiries";

function getTimestamp() {
  return Utilities.formatDate(new Date(), TIMEZONE, "dd-MM-yyyy HH:mm:ss");
}

/* ============ WRITES (form submissions from the website) ============ */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.formType === "tutor") {
      saveTutorRow(ss, data);
      notifyAdmin("New Tutor Registration", buildTutorEmailBody(data));
    } else {
      saveParentRow(ss, data);
      notifyAdmin("New Parent Enquiry", buildParentEmailBody(data));
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("doPost error: " + err.toString());
    try {
      MailApp.sendEmail({
        to: ADMIN_EMAIL,
        subject: "Shiva Home Tutor — Form submission ERROR",
        body: "A form submission failed with this error:\n\n" + err.toString() +
          "\n\nRaw data received:\n" + (e && e.postData ? e.postData.contents : "none")
      });
    } catch (mailErr) {
      Logger.log("Additionally failed to send error email: " + mailErr.toString());
    }
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveParentRow(ss, data) {
  var sheet = ss.getSheetByName("Parent Enquiries");
  if (!sheet) {
    sheet = ss.insertSheet("Parent Enquiries");
    sheet.appendRow([
      "Timestamp", "Parent Name", "Mobile Number", "Class",
      "Subject", "Area", "Preferred Timing"
    ]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    getTimestamp(),
    data.name || "",
    data.mobile || "",
    data.class || "",
    data.subject || "",
    data.area || "",
    data.timing || ""
  ]);
}

function saveTutorRow(ss, data) {
  var sheet = ss.getSheetByName("Tutor Registrations");
  if (!sheet) {
    sheet = ss.insertSheet("Tutor Registrations");
    sheet.appendRow([
      "Timestamp", "Name", "Mobile Number", "Qualification", "Experience",
      "Subjects", "Classes", "Preferred Area", "Mode", "Responding To Enquiry"
    ]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    getTimestamp(),
    data.name || "",
    data.mobile || "",
    data.qualification || "",
    data.experience || "",
    data.subjects || "",
    data.classes || "",
    data.area || "",
    data.mode || "",
    data.respondingTo || ""
  ]);
}

function notifyAdmin(subject, body) {
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: "Shiva Home Tutor — " + subject,
      body: body
    });
  } catch (err) {
    Logger.log("Email notification failed: " + err.toString());
  }
}

function buildParentEmailBody(data) {
  return "A new parent enquiry was just submitted on the website:\n\n" +
    "Parent Name: " + (data.name || "") + "\n" +
    "Mobile Number: " + (data.mobile || "") + "\n" +
    "Class: " + (data.class || "") + "\n" +
    "Subject: " + (data.subject || "") + "\n" +
    "Area: " + (data.area || "") + "\n" +
    "Preferred Timing: " + (data.timing || "") + "\n\n" +
    "This has also been saved in the 'Parent Enquiries' tab of your Google Sheet.\n" +
    "This message is only sent to you (the admin) — not to the parent.";
}

function buildTutorEmailBody(data) {
  var respondingLine = data.respondingTo
    ? "\n*** This tutor is responding to your posted enquiry: " + data.respondingTo + " ***\n"
    : "";
  return "A new tutor registration was just submitted on the website:\n" +
    respondingLine + "\n" +
    "Name: " + (data.name || "") + "\n" +
    "Mobile Number: " + (data.mobile || "") + "\n" +
    "Qualification: " + (data.qualification || "") + "\n" +
    "Experience: " + (data.experience || "") + "\n" +
    "Subjects: " + (data.subjects || "") + "\n" +
    "Classes: " + (data.classes || "") + "\n" +
    "Preferred Area: " + (data.area || "") + "\n" +
    "Mode: " + (data.mode || "") + "\n\n" +
    "This has also been saved in the 'Tutor Registrations' tab of your Google Sheet.\n" +
    "This message is only sent to you (the admin) — not to the tutor.";
}

/* ============ READS (public Open Enquiries feed for the website) ============ */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "enquiries";

  if (action === "ping") {
    return ContentService.createTextOutput("Shiva Home Tutor form handler is running. Timestamp: " + getTimestamp());
  }

  // Default: return the list of OPEN enquiries as JSON for the website to render.
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(ENQUIRIES_SHEET_NAME);
    var enquiries = [];

    if (sheet) {
      var values = sheet.getDataRange().getValues();
      // Expected header row: ID | Class | Subject | Area | Notes | Status | Posted
      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        var status = (row[5] || "").toString().trim().toLowerCase();
        if (status === "open") {
          enquiries.push({
            id: row[0] || ("row" + (i + 1)),
            class: row[1] || "",
            subject: row[2] || "",
            area: row[3] || "",
            notes: row[4] || "",
            posted: row[6] || ""
          });
        }
      }
    }

    var output = ContentService.createTextOutput(JSON.stringify({ enquiries: enquiries }));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;

  } catch (err) {
    Logger.log("doGet error: " + err.toString());
    var errOutput = ContentService.createTextOutput(JSON.stringify({ enquiries: [], error: err.toString() }));
    errOutput.setMimeType(ContentService.MimeType.JSON);
    return errOutput;
  }
}

/**
 * Run this once manually (see instructions above) to create the
 * "Open Enquiries" tab with the right headers and an example row.
 * Safe to run again later — it won't duplicate the tab if it already exists.
 */
function setupOpenEnquiriesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ENQUIRIES_SHEET_NAME);
  if (sheet) {
    Logger.log("'" + ENQUIRIES_SHEET_NAME + "' already exists — no changes made.");
    return;
  }
  sheet = ss.insertSheet(ENQUIRIES_SHEET_NAME);
  sheet.appendRow(["ID", "Class", "Subject", "Area", "Notes", "Status", "Posted"]);
  sheet.setFrozenRows(1);
  sheet.appendRow([
    "E1", "Class 9", "Maths", "Sector 54, Gurgaon",
    "Evenings preferred, 3 days/week", "Open", getTimestamp()
  ]);

  // Add a dropdown (data validation) on the Status column so it's hard to typo.
  var statusRange = sheet.getRange(2, 6, 200, 1); // column F, rows 2-201
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Open", "Closed"], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(rule);

  Logger.log("Created '" + ENQUIRIES_SHEET_NAME + "' with headers, one example row, and a Status dropdown.");
}

/**
 * Optional test — writes one dummy row to "Parent Enquiries" so you can
 * confirm the Sheet + timestamp + permissions all work, independent of
 * the website.
 */
function testAppend() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  saveParentRow(ss, {
    name: "TEST Parent", mobile: "9999999999", class: "Test Class",
    subject: "Test Subject", area: "Test Area", timing: "Test Timing"
  });
  Logger.log("Test row added at " + getTimestamp() + " — check the 'Parent Enquiries' tab.");
}
