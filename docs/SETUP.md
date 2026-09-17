# DG-LETS Google Sheets Form Collector — Setup Guide

Everything is automated. You only need to do these 4 steps once.

---

## Step 1 — Create the Google Sheet

1. Go to https://sheets.google.com
2. Click **Blank spreadsheet**
3. Rename it: **DG-LETS Early Access Signups**
   (click "Untitled spreadsheet" at the top and type the name)

> Headers are created automatically by the script — you don't need to type anything.

---

## Step 2 — Add the Apps Script

1. In your spreadsheet click **Extensions → Apps Script**
2. A new tab opens with a code editor
3. Select **all the existing code** (Ctrl+A) and **delete it**
4. Open the file: `landing/google-apps-script.js` in this project
5. Copy the entire contents and paste it into the Apps Script editor
6. Press **Ctrl+S** to save
7. Name the project: **DG-LETS Form Handler** → click OK

---

## Step 3 — Deploy as Web App

1. Click **Deploy** (top right) → **New deployment**
2. Click the **gear icon ⚙️** next to "Select type" → choose **Web app**
3. Fill in:
   - Description: `DG-LETS form collector`
   - Execute as: **Me (your Google account)**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Click **Authorize access** → choose your Google account → Allow
6. Click **Deploy** again if prompted
7. **Copy the Web app URL** — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

---

## Step 4 — Paste URL into app.js

1. Open `landing/app.js`
2. Find line 9:
   ```js
   const SHEET_URL = 'PASTE_YOUR_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `PASTE_YOUR_APPS_SCRIPT_URL_HERE` with your copied URL:
   ```js
   const SHEET_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
   ```
4. Save the file
5. Commit and push:
   ```
   git add landing/app.js
   git commit -m "feat: connect Google Sheets form collector"
   git push
   ```

---

## Verification

After pasting the URL, open `index.html` in your browser and check the
browser console (F12 → Console). You should see:

```
[DG-LETS] ✅ Sheet connected — "DG-LETS Early Access Signups" — 0 signup(s) so far
```

To check all locally saved signups at any time, open the browser console and run:
```js
viewLocalSignups()
```

---

## What gets collected

| Column     | Example                    |
|------------|----------------------------|
| Timestamp  | 27/08/2026 09:41:00        |
| Full Name  | Musa Abdullahi             |
| Email      | musa@example.com           |
| Phone      | 08012345678                |
| Role       | farmer                     |
| State      | Kaduna                     |
| LGA        | Chikun                     |
| Source     | early-access-form          |
| User Agent | Chrome/126 (Android)       |

---

## Troubleshooting

**No data appearing in sheet?**
- Make sure "Who has access" is set to **Anyone** (not "Anyone with Google account")
- Re-deploy after any script changes — old deployments don't update automatically

**CORS error in console?**
- This is normal with `mode: 'no-cors'`. The data still sends correctly.
  Apps Script doesn't return readable responses in no-cors mode.

**Want to test manually?**
- In Apps Script editor, click **Run → testSubmission**
- Check your spreadsheet for a test row
