/**
 * SHIVA HOME TUTOR — Website form-to-Google-Sheet connector
 * -----------------------------------------------------------
 * This script receives form submissions from the website (Parent Enquiry
 * form and Become-a-Tutor form), saves each one as a new row in this
 * Google Sheet (in two separate tabs), and emails YOU (the admin) a
 * notification for every new submission.
 *
 * PRIVACY: Only you can see this data.
 *  - The Google Sheet is private by default — only visible to you unless
 *    you explicitly share it with someone.
 *  - The notification email only goes to ADMIN_EMAIL below (your inbox).
 *    Parents and tutors are never emailed and never see each other's info.
 *
 * SETUP (one-time):
 * 1. Open Google Sheets → create a new blank spreadsheet
 *    (name it e.g. "Shiva Home Tutor - Leads").
 * 2. Go to Extensions → Apps Script.
 * 3. Delete any starter code in the editor, and paste in this whole file.
 * 4. Click Deploy → New deployment.
 *    - Click the gear icon next to "Select type" → choose "Web app".
 *    - Description: "Website form handler" (anything you like).
 *    - Execute as: Me.
 *    - Who has access: Anyone.
 * 5. Click Deploy. Google will ask you to authorize — allow it
 *    (click "Advanced" → "Go to project (unsafe)" if a warning appears;
 *    this is expected since it's your own script).
 * 6. Copy the "Web app URL" it gives you (ends in /exec).
 * 7. Open index.html, find the line:
 *      const SHEET_SCRIPT_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
 *    and paste your URL between the quotes. Save the file.
 * 8. Re-upload/host index.html. Submissions will now appear in your Sheet.
 *
 * NOTE: If you ever edit this script after deploying, you must create a
 * "New deployment" again (or manage deployments → edit → new version)
 * for the changes to take effect on the live URL.
 */

// Only this address receives notification emails — parents/tutors are never
// emailed or shown each other's submissions. Change if you want a different inbox.
var ADMIN_EMAIL = "shivahometutor.apply@gmail.com";

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
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
  return "A new tutor registration was just submitted on the website:\n\n" +
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
    new Date(),
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
      "Subjects", "Classes", "Preferred Area", "Mode"
    ]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([
    new Date(),
    data.name || "",
    data.mobile || "",
    data.qualification || "",
    data.experience || "",
    data.subjects || "",
    data.classes || "",
    data.area || "",
    data.mode || ""
  ]);
}

/**
 * Optional: lets you open the /exec URL in a browser to confirm it's live.
 */
function doGet(e) {
  return ContentService.createTextOutput("Shiva Home Tutor form handler is running.");
}
