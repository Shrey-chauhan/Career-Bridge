# CareerBridge

CareerBridge is a Smart Placement & Recruitment Platform designed to connect students, companies, and college placement administrators in a centralized recruitment workflow.

## Current Status

Step 10 — Placement Analytics & Recruitment Intelligence Dashboard

## Technology Stack

- React
- Vite
- Node.js
- Express.js
- MongoDB & Mongoose
- bcryptjs (Password Hashing)
- jsonwebtoken (JWT Auth)
- Multer (Multipart Upload Middleware)
- Cloudinary (Cloud Document Storage)
- Axios
- Git / GitHub
- Postman

## Project Architecture

```text
                 CareerBridge Platform
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     Student            Company           Admin / TPO
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                     Core Services
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
 Applications          Interviews          Notifications
      │                    │                    │
      └────────────────────┼────────────────────┘
                           │
                      MongoDB Atlas
```

## Project Structure

```text
CareerBridge/
├── client/          # React Vite Frontend application
│   └── src/
│       ├── components/
│       │   ├── ProtectedRoute.jsx
│       │   ├── application/
│       │   │   └── ActivityTimeline.jsx
│       │   ├── interviews/
│       │   │   ├── InterviewHistoryList.jsx
│       │   │   ├── ScheduleInterviewModal.jsx
│       │   │   └── InterviewResultModal.jsx
│       │   ├── notifications/
│       │   │   ├── NotificationBell.jsx
│       │   │   └── NotificationDropdown.jsx
│       │   └── resume/
│       │       ├── ResumeUploader.jsx
│       │       └── ResumeCard.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── NotificationContext.jsx
│       ├── pages/
│       │   ├── admin/
│       │   │   ├── AdminDashboard.jsx
│       │   │   ├── AdminStudents.jsx
│       │   │   ├── AdminStudentDetails.jsx
│       │   │   ├── AdminCompanies.jsx
│       │   │   ├── AdminJobs.jsx
│       │   │   ├── AdminApplications.jsx
│       │   │   ├── AdminInterviews.jsx
│       │   │   ├── AdminPlacementDrives.jsx
│       │   │   ├── AdminAuditLogs.jsx
│       │   │   └── AdminAnalytics.jsx
│       │   ├── company/
│       │   │   ├── CompanyJobs.jsx
│       │   │   ├── CreateEditJob.jsx
│       │   │   ├── Applications.jsx
│       │   │   ├── ApplicationDetails.jsx
│       │   │   └── CompanyInterviews.jsx
│       │   ├── notifications/
│       │   │   └── Notifications.jsx
│       │   ├── student/
│       │   │   ├── StudentJobs.jsx
│       │   │   ├── JobDetails.jsx
│       │   │   ├── Applications.jsx
│       │   │   ├── ApplicationDetails.jsx
│       │   │   └── StudentInterviews.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── StudentProfile.jsx
│       │   └── CompanyProfile.jsx
│       ├── services/
│       │   ├── api.js
│       │   ├── studentService.js
│       │   ├── companyService.js
│       │   ├── jobService.js
│       │   ├── applicationService.js
│       │   ├── resumeService.js
│       │   ├── notificationService.js
│       │   ├── interviewService.js
│       │   ├── adminService.js
│       │   └── analyticsService.js
│       ├── App.jsx
│       └── main.jsx
└── server/          # Node.js Express Backend API
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── student.controller.js
    │   ├── company.controller.js
    │   ├── job.controller.js
    │   ├── application.controller.js
    │   ├── resume.controller.js
    │   ├── notification.controller.js
    │   ├── activity.controller.js
    │   ├── interview.controller.js
    │   ├── admin.controller.js
    │   ├── placementDrive.controller.js
    │   └── analytics.controller.js
    ├── middleware/
    │   ├── auth.middleware.js
    │   ├── role.middleware.js
    │   ├── upload.middleware.js
    │   └── error.middleware.js
    ├── models/
    │   ├── User.js
    │   ├── Student.js
    │   ├── Company.js
    │   ├── Job.js
    │   ├── Application.js
    │   ├── Resume.js
    │   ├── Notification.js
    │   ├── ApplicationActivity.js
    │   ├── Interview.js
    │   ├── PlacementDrive.js
    │   └── AdminAuditLog.js
    ├── routes/
    │   ├── health.routes.js
    │   ├── auth.routes.js
    │   ├── student.routes.js
    │   ├── company.routes.js
    │   ├── job.routes.js
    │   ├── application.routes.js
    │   ├── resume.routes.js
    │   ├── notification.routes.js
    │   ├── interview.routes.js
    │   ├── admin.routes.js
    │   └── analytics.routes.js
    ├── services/
    │   ├── auth.service.js
    │   ├── student.service.js
    │   ├── company.service.js
    │   ├── job.service.js
    │   ├── eligibility.service.js
    │   ├── application.service.js
    │   ├── storage.service.js
    │   ├── resume.service.js
    │   ├── notification.service.js
    │   ├── activity.service.js
    │   ├── interview.service.js
    │   ├── admin.service.js
    │   ├── placementDrive.service.js
    │   ├── auditLog.service.js
    │   └── analytics.service.js
    ├── utils/
    │   ├── jwt.js
    │   └── appError.js
    ├── postman/
    │   ├── CareerBridge_Auth_Collection.json
    │   ├── CareerBridge_Step3_Collection.json
    │   ├── CareerBridge_Step4_Collection.json
    │   ├── CareerBridge_Step5_Collection.json
    │   ├── CareerBridge_Step6_Collection.json
    │   ├── CareerBridge_Step7_Collection.json
    │   ├── CareerBridge_Step8_Collection.json
    │   ├── CareerBridge_Step9_Collection.json
    │   └── CareerBridge_Step10_Collection.json
    ├── app.js
    ├── server.js
    └── .env.example
```

## Analytics Metric Formulas
- **Placement Rate**: `(Placed Candidates / Participating Students) * 100`
- **Participation Rate**: `(Students with >= 1 Application / Total Registered Students) * 100`
- **Application Shortlist Conversion**: `(Shortlisted Applications / Total Applications) * 100`
- **Interview Selection Conversion**: `(Passed Interviews / Completed Interviews) * 100`
- **Period Growth Rate**: `((Current Metric - Previous Metric) / Previous Metric) * 100` (safe zero handling)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register student/company user
- `POST /api/auth/login` — Authenticate user & issue JWT
- `GET /api/auth/me` — Get active user profile
- `POST /api/auth/logout` — End user session

### Profiles (`/api/students`, `/api/companies`)
- `GET/POST/PUT /api/students/profile` — Student profile CRUD
- `GET/POST/PUT /api/companies/profile` — Company profile CRUD

### Job Management — Company (`/api/jobs`)
- `POST /api/jobs` — Create job draft or publish directly (Protected: `COMPANY`)
- `GET /api/jobs/company` — Get company's job postings (Protected: `COMPANY`)
- `GET /api/jobs/company/:id` — Get company job by ID (Protected: `COMPANY`)
- `PUT /api/jobs/company/:id` — Update company job (Protected: `COMPANY`)
- `DELETE /api/jobs/company/:id` — Delete company job (Protected: `COMPANY`)
- `PATCH /api/jobs/company/:id/publish` — Publish job (Protected: `COMPANY`)
- `PATCH /api/jobs/company/:id/close` — Close job (Protected: `COMPANY`)

### Job Discovery & Eligibility Engine — Student (`/api/jobs`)
- `GET /api/jobs` — Search, filter, and paginate published jobs (Protected: `STUDENT`)
- `GET /api/jobs/:id` — Get published job details with computed eligibility (Protected: `STUDENT`)
- `GET /api/jobs/:id/eligibility` — Evaluate eligibility breakdown (Protected: `STUDENT`)

### Application Management & Recruitment Workflow (`/api/applications`)
- `POST /api/applications` — Submit job application with backend eligibility check (Protected: `STUDENT`)
- `GET /api/applications/my` — Get paginated applications submitted by active student (Protected: `STUDENT`)
- `GET /api/applications/:id` — Get single student application details (Protected: `STUDENT`)
- `PATCH /api/applications/:id/withdraw` — Withdraw an APPLIED application (Protected: `STUDENT`)
- `GET /api/applications/company` — Search, filter, and paginate company applicants (Protected: `COMPANY`)
- `GET /api/applications/company/:id` — View detailed candidate profile & application (Protected: `COMPANY`)
- `PATCH /api/applications/company/:id/shortlist` — Shortlist candidate (`APPLIED` → `SHORTLISTED`) (Protected: `COMPANY`)
- `PATCH /api/applications/company/:id/reject` — Reject candidate with optional feedback (`APPLIED` → `REJECTED`) (Protected: `COMPANY`)
- `PATCH /api/applications/company/:id/notes` — Save internal private recruiter notes (Protected: `COMPANY`)
- `GET /api/applications/:id/activity` — Get application activity audit timeline (Protected: `STUDENT` owner / `COMPANY` reviewer / `ADMIN`)

### Resume Management & Secure Document System (`/api/resumes`)
- `POST /api/resumes` — Upload / replace resume document (PDF/DOCX, max 5MB, versioned) (Protected: `STUDENT`)
- `GET /api/resumes/me` — Get active resume document metadata (Protected: `STUDENT`)
- `GET /api/resumes/:id` — Secure authorized document retrieval (Protected: `STUDENT` owner / `COMPANY` applicant reviewer / `ADMIN`)
- `DELETE /api/resumes/:id` — Delete / deactivate active resume document (Protected: `STUDENT`)

### Notification System (`/api/notifications`)
- `GET /api/notifications` — Get user notifications (paginated, supports `isRead` status filter) (Protected)
- `GET /api/notifications/unread-count` — Get total unread count for logged in user (Protected)
- `PATCH /api/notifications/:id/read` — Mark single notification as read (Protected)
- `PATCH /api/notifications/read-all` — Mark all user notifications as read (Protected)
- `DELETE /api/notifications/:id` — Delete notification record (Protected)

### Interview Management System (`/api/interviews`)
- `POST /api/interviews` — Schedule candidate interview round (Protected: `COMPANY`)
- `GET /api/interviews` — List interviews (paginated, supports `timeframe` & `status` filters) (Protected: `STUDENT` / `COMPANY`)
- `GET /api/interviews/:id` — Get single interview details with role-based evaluation masking (Protected: `STUDENT` owner / `COMPANY` owner / `ADMIN`)
- `PATCH /api/interviews/:id/reschedule` — Reschedule interview date, time, and location (Protected: `COMPANY`)
- `PATCH /api/interviews/:id/cancel` — Cancel scheduled interview with optional reason (Protected: `STUDENT` / `COMPANY`)
- `PATCH /api/interviews/:id/confirm` — Confirm interview attendance (Protected: `STUDENT`)
- `PATCH /api/interviews/:id/complete` — Mark interview as completed (Protected: `COMPANY`)
- `PATCH /api/interviews/:id/result` — Record evaluation result (`PASSED`, `FAILED`, `NEXT_ROUND`) & internal feedback (Protected: `COMPANY`)
- `PATCH /api/interviews/:id/no-show` — Mark candidate as no-show (Protected: `COMPANY`)

### Admin / TPO Placement Management System (`/api/admin`)
- `GET /api/admin/dashboard` — Get placement dashboard summary metrics (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/students` — Get paginated student directory with search & course/year filters (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/students/:id` — Get detailed student profile with application and interview history (Protected: `ADMIN` / `TPO`)
- `PATCH /api/admin/students/:id/status` — Activate or deactivate student account (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/companies` — Get corporate recruiter directory with verification status filter (Protected: `ADMIN` / `TPO`)
- `PATCH /api/admin/companies/:id/verify` — Approve or reject company credentials (`VERIFIED` / `REJECTED`) (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/jobs` — Monitor all corporate job postings (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/applications` — Monitor placement applications pipeline (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/interviews` — Monitor global interview schedule rounds (Protected: `ADMIN` / `TPO`)
- `POST /api/admin/drives` — Create campus placement drive event (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/drives` — List campus placement drives (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/drives/:id` — Get placement drive details with job metrics (Protected: `ADMIN` / `TPO`)
- `PUT /api/admin/drives/:id` — Update placement drive details or status (Protected: `ADMIN` / `TPO`)
- `PATCH /api/admin/drives/:id/jobs` — Associate jobs with placement drive (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/audit-logs` — Retrieve security and administrative audit trail logs (Protected: `ADMIN` / `TPO`)

### Placement Analytics & Intelligence (`/api/admin/analytics`)
- `GET /api/admin/analytics/overview` — Executive KPIs, participation rates, and period-over-period growth rates (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/analytics/funnel` — 5-Stage recruitment conversion funnel metrics (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/analytics/trends` — Time-series monthly/weekly application volume trends (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/analytics/companies` — Corporate recruiter performance table & selection rates (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/analytics/jobs` — Top job postings performance table & shortlist conversion (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/analytics/branches` — Course & branch performance breakdown with placement rates (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/analytics/interviews` — Interview status & evaluation result distribution (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/analytics/drives` — Campus placement drives performance comparison (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/analytics/insights` — Dynamic rule-based insights and bottleneck detection warnings (Protected: `ADMIN` / `TPO`)
- `GET /api/admin/analytics/export/:type` — Filter-aware CSV report download for companies, jobs, branches, and drives (Protected: `ADMIN` / `TPO`)

## Deterministic Eligibility Engine Rules
The eligibility engine evaluates student profile data against job rules and returns exact failure reasons:
- **CGPA**: `student.cgpa >= job.eligibility.minimumCgpa`
- **Backlogs**: `student.backlogs <= job.eligibility.maximumBacklogs`
- **Branch**: `student.branch` in `job.eligibility.allowedBranches`
- **Graduation Year**: `student.graduationYear` in `job.eligibility.graduationYears`
- **Skills**: Case-insensitive check ensuring `student.skills` includes all `job.eligibility.requiredSkills`

## Local Development

### Setup & Run
1. Start backend server:
   ```bash
   cd server
   npm run dev
   ```
2. Start frontend client:
   ```bash
   cd client
   npm run dev
   ```

### Development Database Seeding
To populate MongoDB with deterministic development/test placement data:

```bash
cd server
npm run seed
```

To clear existing seed data:
```bash
cd server
npm run seed:clear
```

#### Seed Generated Counts (250 Users Total)
- **Users**: 250 (220 Students, 25 Companies, 3 TPOs, 2 Admins)
- **Student Profiles**: 220
- **Company Profiles**: 25
- **Resumes**: 180
- **Job Postings**: 90
- **Applications**: 2500
- **Interviews**: 500
- **Placement Drives**: 25
- **Activities**: 3500
- **Notifications**: 1200
- **Audit Logs**: 600

*Default Development Password for All Seeded Users*: `Password@123`  
*Note*: All seeded data consists of synthetic development records. Seeding is disabled when `NODE_ENV === 'production'`.

## Production Deployment Guide (Render)

This platform includes a pre-configured `render.yaml` Infrastructure-as-Code Blueprint for 1-click deployment to [Render](https://render.com).

### Option 1: 1-Click Render Blueprint Deployment
1. Push your repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** $\rightarrow$ **Blueprints**.
4. Connect your GitHub repository (`Vikastiwari777/Carrer-Bridge-`).
5. Render will automatically detect `render.yaml` and configure both web services.
6. Fill in the required environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas production connection URI.
   - `CLIENT_URL`: Your deployed frontend URL (e.g. `https://careerbridge-frontend.onrender.com`).
   - `VITE_API_URL`: Your deployed backend API URL (e.g. `https://careerbridge-backend.onrender.com/api`).
7. Click **Apply**.

### Option 2: Manual Render Web Service Setup

#### Backend Web Service (`careerbridge-backend`)
- **Environment**: `Node`
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start` (`node server.js`)
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `10000` (Render handles this automatically)
  - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/careerbridge`
  - `JWT_SECRET`: Random 32+ character key
  - `JWT_EXPIRES_IN`: `7d`
  - `CLIENT_URL`: `https://careerbridge-frontend.onrender.com`

#### Frontend Static Site (`careerbridge-frontend`)
- **Environment**: `Static Site`
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Rewrite Rule**: Single Page App rule (`/*` $\rightarrow$ `/index.html`)
- **Environment Variables**:
  - `VITE_API_URL`: `https://careerbridge-backend.onrender.com/api`

