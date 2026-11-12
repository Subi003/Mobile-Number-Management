# Mobile Number Inventory & Allocation Manager

A modern, responsive, full-featured Mobile Number Management Dashboard designed for tracking corporate SIM cards, employee phone lines, allocations, returns, and assignment history.

Powered by **React + TypeScript + Tailwind CSS** on the frontend, with **Google Sheets & Google Apps Script** as the 100% free serverless backend. Ready to host for $0/mo on **GitHub Pages (`.github.io`)**.

---

## 🌟 Key Features

- **Executive KPI Dashboard**: Live metrics for Total Numbers, Available Numbers, Assigned Numbers, Reserved/Maintenance, and Monthly Cellular Spend ($).
- **CRUD Inventory Operations**: Add new mobile numbers, edit telecom plan parameters, update carrier details, and delete obsolete numbers.
- **Duplicate Prevention**: Strict validation ensures no duplicate phone numbers can be created either locally or in Google Sheets.
- **Employee Line Allocation**: Seamless assignment workflow capturing employee name, ID, department, assignment date, purpose, and equipment notes.
- **Return & De-allocation Workflow**: Return allocated numbers with reason (e.g. project completed, employee resignation, upgrade) and automatically return them to the available pool.
- **Complete Audit Trail**: Immutable history log of all creations, assignments, and returns with timestamps, viewable in a visual timeline and exportable to CSV.
- **Search & Multi-Dimensional Filtering**: Search by phone number, employee name, employee ID, department, carrier, or purpose. Filter by status (Available, Assigned, Reserved, Maintenance) and department.
- **Free Google Sheets Integration**: All inventory and history persist in your own private Google Sheet using Google Apps Script with zero server hosting bills.
- **Protected Write Operations & Authentication**: Admin session authentication protects employee PII and prevents unauthorized API writes.
- **GitHub Pages Ready**: Configured with relative asset URLs (`base: './'`) and ready for 1-click GitHub Actions deployment.

---

## 🚀 2-Minute Google Sheets Backend Setup

1. Open a new Google Sheet at **[sheets.new](https://sheets.new)** and give it a title (e.g., *Company Mobile Inventory*).
2. Go to **Extensions > Apps Script**.
3. Delete any boilerplate code, and paste the code from `/google-apps-script/Code.gs` (or copy it from the in-app *Google Sheets Setup* modal).
4. Click **Save** (disk icon).
5. Click **Deploy** (top right) > **New deployment**.
   - **Type**: Select **Web app** (gear icon)
   - **Description**: `Mobile Inventory API`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` *(Crucial so the web app can communicate with the sheet)*
6. Click **Deploy**, authorize access with your Google account, and copy the **Web App URL** (ends with `/exec`).
7. In the website header, click the **Sheets Connected / Demo Mode** button, paste your Web App URL, and click **Save Configuration**.
8. Click **Test Connection** to verify immediate connectivity!

The script will automatically generate two sheets:
- `MobileInventory`: All registered phone lines, carriers, statuses, and assignees.
- `AssignmentHistory`: Audit trail of every assignment and return.

---

## 🌐 Free Deployment to GitHub Pages (`.github.io`)

1. Create a repository on GitHub: `https://github.com/new`
2. Push your project:
   ```bash
   git init
   git add .
   git commit -m "Deploy Mobile Inventory Dashboard"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/mobile-inventory.git
   git push -u origin main
   ```
3. In your repository on GitHub:
   - Go to **Settings > Pages**
   - Under **Build and deployment > Source**, choose **GitHub Actions**
   - The included workflow file `.github/workflows/deploy.yml` will automatically build and publish your dashboard to `https://YOUR_USERNAME.github.io/mobile-inventory/`!

---

## 🔐 Default Authentication Credentials

Write operations (adding numbers, assigning staff, recording returns, deleting) are protected:
- **Default Username**: `admin`
- **Default Password / Secret**: `admin123`
*(You can customize this in the website or in `Code.gs` via `API_SECRET_KEY`)*
