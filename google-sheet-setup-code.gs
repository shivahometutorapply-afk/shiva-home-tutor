/**
 * SHIVA HOME TUTOR — Website form-to-Google-Sheet connector (v4)
 * -----------------------------------------------------------
 * This version adds full support for the "New Tuition Enquiries / Teacher
 * Apply" page (teacher-enquiries.html):
 *  - Richer "Open Enquiries" tab: Class, Subject, Gender, Location, Mode,
 *    Days, Timing, Fees, Board, Requirements, Status, Posted.
 *  - Status now supports 4 states: Open, Shortlisting, Teacher Selected,
 *    Closed. Only "Open" rows show an active "Apply" button on the site —
 *    everything else shows "Applications Closed" automatically.
 *  - A new "Teacher Applications" tab, separate from the homepage's
 *    "Tutor Registrations" tab, storing the fuller application fields.
 *  - Optional resume/photo upload: files are converted to base64 in the
 *    browser, sent here, and saved to a Google Drive folder in your
 *    account. The admin email includes a link to each file.
 *  - Admin notification email is now formatted exactly per spec, with
 *    subject "New Teacher Application – Shiva Home Tutor" and every
 *    field clearly labelled.
 *
 * Existing functionality (Parent Enquiry form and the homepage's simpler
 * "Become a Tutor" form) is unchanged and still works.
 *
 * SETUP / UPGRADING:
 * 1. Open your existing Apps Script project (or create one — see the
 *    README for first-time setup).
 * 2. Select all code, delete it, paste this whole file in.
 * 3. Deploy → Manage deployments → pencil/edit icon → Version: "New
 *    version" → Deploy. (Required every time you change this code.)
 * 4. If you previously ran the old enquiry-board setup, OPEN YOUR SHEET
 *    and delete the old "Open Enquiries" tab (right-click its tab name
 *    at the bottom → Delete). This version uses a different set of
 *    columns, so the tab needs to be recreated fresh.
 * 5. In the Apps Script editor, use the function dropdown near Run and
 *    select "setupOpenEnquiriesSheet" → click Run (▶) → authorize if
 *    asked. This creates the "Open Enquiries" tab with the new columns,
 *    a Status dropdown, and one example row.
 * 6. The "Teacher Applications" tab is created automatically the first
 *    time a teacher applies — no manual setup needed for it.
 *
 * DAILY USE — ADDING / EDITING / CLOSING AN ENQUIRY:
 * - Add: open the Sheet (phone or computer) → "Open Enquiries" tab →
 *   add a new row with an ID, the details, and Status = Open.
 * - Edit: just edit any cell directly — changes appear on the website
 *   next time someone loads the page.
 * - Change status: click the Status cell → pick Open / Shortlisting /
 *   Teacher Selected / Closed from the dropdown.
 * - Remove: right-click the row number → Delete row.
 */

var ADMIN_EMAIL = "shivahometutor.apply@gmail.com";
var TIMEZONE = "Asia/Kolkata";
var ENQUIRIES_SHEET_NAME = "Open Enquiries";
var APPLICATIONS_SHEET_NAME = "Teacher Applications";
var UPLOADS_FOLDER_NAME = "Shiva Home Tutor - Teacher Uploads";
var MAX_FILE_BASE64_CHARS = 7000000; // ~5MB file, generous safety cap

function getTimestamp() {
  return Utilities.formatDate(new Date(), TIMEZONE, "dd-MM-yyyy HH:mm:ss");
}

/* ============================================================
   WRITES — form submissions from the website
   ============================================================ */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.formType === "teacherApplication") {
      handleTeacherApplication(ss, data);
    } else if (data.formType === "tutor") {
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
          "\n\nRaw data received (first 2000 chars):\n" +
          (e && e.postData ? e.postData.contents.substring(0, 2000) : "none")
      });
    } catch (mailErr) {
      Logger.log("Additionally failed to send error email: " + mailErr.toString());
    }
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ---------- Existing simple flows (unchanged) ---------- */

function saveParentRow(ss, data) {
  var sheet = ss.getSheetByName("Parent Enquiries");
  if (!sheet) {
    sheet = ss.insertSheet("Parent Enquiries");
    sheet.appendRow(["Timestamp", "Parent Name", "Mobile Number", "Class", "Subject", "Area", "Preferred Timing"]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([getTimestamp(), data.name || "", data.mobile || "", data.class || "", data.subject || "", data.area || "", data.timing || ""]);
}

function saveTutorRow(ss, data) {
  var sheet = ss.getSheetByName("Tutor Registrations");
  if (!sheet) {
    sheet = ss.insertSheet("Tutor Registrations");
    sheet.appendRow(["Timestamp", "Name", "Mobile Number", "Qualification", "Experience", "Subjects", "Classes", "Preferred Area", "Mode", "Responding To Enquiry"]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([getTimestamp(), data.name || "", data.mobile || "", data.qualification || "", data.experience || "", data.subjects || "", data.classes || "", data.area || "", data.mode || "", data.respondingTo || ""]);
}

function buildParentEmailBody(data) {
  return "A new parent enquiry was just submitted on the website:\n\n" +
    "Parent Name: " + (data.name || "") + "\n" +
    "Mobile Number: " + (data.mobile || "") + "\n" +
    "Class: " + (data.class || "") + "\n" +
    "Subject: " + (data.subject || "") + "\n" +
    "Area: " + (data.area || "") + "\n" +
    "Preferred Timing: " + (data.timing || "") + "\n\n" +
    "Saved in the 'Parent Enquiries' tab. Sent only to you, the admin.";
}

function buildTutorEmailBody(data) {
  var respondingLine = data.respondingTo ? "\n*** Responding to posted enquiry: " + data.respondingTo + " ***\n" : "";
  return "A new tutor registration was just submitted on the website:\n" + respondingLine + "\n" +
    "Name: " + (data.name || "") + "\n" +
    "Mobile Number: " + (data.mobile || "") + "\n" +
    "Qualification: " + (data.qualification || "") + "\n" +
    "Experience: " + (data.experience || "") + "\n" +
    "Subjects: " + (data.subjects || "") + "\n" +
    "Classes: " + (data.classes || "") + "\n" +
    "Preferred Area: " + (data.area || "") + "\n" +
    "Mode: " + (data.mode || "") + "\n\n" +
    "Saved in the 'Tutor Registrations' tab. Sent only to you, the admin.";
}

/* ---------- New: Teacher Application (teacher-enquiries.html) ---------- */

function handleTeacherApplication(ss, data) {
  var resumeLink = saveUploadedFile(data.resumeName, data.resumeBase64, data.resumeMimeType, "Resume");
  var photoLink = saveUploadedFile(data.photoName, data.photoBase64, data.photoMimeType, "Photo");

  saveApplicationRow(ss, data, resumeLink, photoLink);
  notifyAdmin("New Teacher Application", buildApplicationEmailBody(data, resumeLink, photoLink));
}

function saveApplicationRow(ss, data, resumeLink, photoLink) {
  var sheet = ss.getSheetByName(APPLICATIONS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(APPLICATIONS_SHEET_NAME);
    sheet.appendRow([
      "Timestamp", "Enquiry ID", "Enquiry Summary", "Full Name", "WhatsApp Number", "Email",
      "Gender", "Qualification", "Experience", "Subjects", "Classes", "Boards",
      "Current Location", "Preferred Areas", "Teaching Mode", "Available Days",
      "Available Time", "Expected Fees", "Introduction", "Resume Link", "Photo Link"
    ]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    getTimestamp(),
    data.enquiryId || "",
    data.enquirySummary || "",
    data.name || "",
    data.whatsapp || "",
    data.email || "",
    data.gender || "",
    data.qualification || "",
    data.experience || "",
    data.subjects || "",
    data.classes || "",
    data.boards || "",
    data.currentLocation || "",
    data.preferredAreas || "",
    data.mode || "",
    data.availableDays || "",
    data.availableTime || "",
    data.expectedFees || "",
    data.introduction || "",
    resumeLink || "",
    photoLink || ""
  ]);
}

function buildApplicationEmailBody(data, resumeLink, photoLink) {
  return "New Teacher Application – Shiva Home Tutor\n" +
    "=========================================\n\n" +
    "ENQUIRY APPLIED FOR\n" +
    "Enquiry ID: " + (data.enquiryId || "Not specified") + "\n" +
    "Tuition Requirement: " + (data.enquirySummary || "Not specified") + "\n\n" +
    "TEACHER DETAILS\n" +
    "Name: " + (data.name || "") + "\n" +
    "WhatsApp Number: " + (data.whatsapp || "") + "\n" +
    "Email: " + (data.email || "") + "\n" +
    "Gender: " + (data.gender || "") + "\n" +
    "Qualification: " + (data.qualification || "") + "\n" +
    "Teaching Experience: " + (data.experience || "") + "\n" +
    "Subjects: " + (data.subjects || "") + "\n" +
    "Classes: " + (data.classes || "") + "\n" +
    "Boards: " + (data.boards || "") + "\n" +
    "Current Location: " + (data.currentLocation || "") + "\n" +
    "Preferred Teaching Areas: " + (data.preferredAreas || "") + "\n" +
    "Teaching Mode: " + (data.mode || "") + "\n" +
    "Available Days: " + (data.availableDays || "") + "\n" +
    "Available Time: " + (data.availableTime || "") + "\n" +
    "Expected Fees: " + (data.expectedFees || "") + "\n\n" +
    "INTRODUCTION\n" + (data.introduction || "(none provided)") + "\n\n" +
    "ATTACHMENTS\n" +
    "Resume: " + (resumeLink || "(not provided)") + "\n" +
    "Profile Photo: " + (photoLink || "(not provided)") + "\n\n" +
    "-----------------------------------------\n" +
    "Saved in the 'Teacher Applications' tab of your Google Sheet.\n" +
    "This message is only sent to you (the admin).";
}

/**
 * Decodes a base64 file sent from the browser and saves it to a Drive
 * folder, returning a shareable link. Returns "" if no file was sent,
 * and fails gracefully (logs + returns "") if the upload itself errors,
 * so a broken upload never blocks the rest of the application.
 */
function saveUploadedFile(fileName, base64Data, mimeType, label) {
  if (!base64Data) return "";
  try {
    if (base64Data.length > MAX_FILE_BASE64_CHARS) {
      Logger.log(label + " upload skipped: file too large.");
      return "";
    }
    var folder = getOrCreateUploadsFolder();
    var cleanBase64 = base64Data.indexOf(",") > -1 ? base64Data.split(",")[1] : base64Data;
    var bytes = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(bytes, mimeType || "application/octet-stream", fileName || (label + "_" + getTimestamp()));
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log(label + " upload failed: " + err.toString());
    return "";
  }
}

function getOrCreateUploadsFolder() {
  var folders = DriveApp.getFoldersByName(UPLOADS_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(UPLOADS_FOLDER_NAME);
}

function notifyAdmin(subject, body) {
  try {
    MailApp.sendEmail({ to: ADMIN_EMAIL, subject: "Shiva Home Tutor — " + subject, body: body });
  } catch (err) {
    Logger.log("Email notification failed: " + err.toString());
  }
}

/* ============================================================
   READS — public Open Enquiries feed for the website
   ============================================================ */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "enquiries";

  if (action === "ping") {
    return ContentService.createTextOutput("Shiva Home Tutor form handler is running. Timestamp: " + getTimestamp());
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(ENQUIRIES_SHEET_NAME);
    var enquiries = [];

    if (sheet) {
      var values = sheet.getDataRange().getValues();
      // Header row: ID | Class | Subject | Gender | Location | Mode | Days |
      //             Timing | Fees | Board | Requirements | Status | Posted
      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        if (!row[0]) continue; // skip blank rows
        enquiries.push({
          id: row[0] || "",
          class: row[1] || "",
          subject: row[2] || "",
          gender: row[3] || "",
          location: row[4] || "",
          mode: row[5] || "",
          days: row[6] || "",
          timing: row[7] || "",
          fees: row[8] || "",
          board: row[9] || "",
          requirements: row[10] || "",
          status: row[11] || "",
          posted: row[12] || ""
        });
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

/* ============================================================
   ONE-TIME SETUP
   ============================================================ */

/**
 * Run manually once (see instructions above). Creates the "Open Enquiries"
 * tab with the new column layout, a Status dropdown, and one example row.
 * If a tab with this name already exists, delete it first in the Sheet
 * before running this, so it can be recreated with the new columns.
 */
function setupOpenEnquiriesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ENQUIRIES_SHEET_NAME);
  if (sheet) {
    Logger.log("'" + ENQUIRIES_SHEET_NAME + "' already exists. Delete that tab in the Sheet first, then run this again to recreate it with the new columns.");
    return;
  }
  sheet = ss.insertSheet(ENQUIRIES_SHEET_NAME);
  sheet.appendRow(["ID", "Class", "Subject", "Gender", "Location", "Mode", "Days", "Timing", "Fees", "Board", "Requirements", "Status", "Posted"]);
  sheet.setFrozenRows(1);
  sheet.appendRow([
    "E1", "Class 9", "Maths", "Any", "Sector 54, Gurgaon", "Home Tuition",
    "3 days/week", "Evenings, 6-7 PM", "\u20b98,000/month", "CBSE",
    "Looking for a patient tutor, prior CBSE experience preferred.",
    "Open", getTimestamp()
  ]);

  var statusRange = sheet.getRange(2, 12, 300, 1); // column L, rows 2-301
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Open", "Shortlisting", "Teacher Selected", "Closed"], true)
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
  saveParentRow(ss, { name: "TEST Parent", mobile: "9999999999", class: "Test Class", subject: "Test Subject", area: "Test Area", timing: "Test Timing" });
  Logger.log("Test row added at " + getTimestamp() + " — check the 'Parent Enquiries' tab.");
}
