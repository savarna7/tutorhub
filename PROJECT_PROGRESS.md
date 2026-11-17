# TutorHub — Project Progress & Handoff

**Last updated:** 17 November 2026

## 1. Project Overview

TutorHub is an independent full-stack tutoring marketplace portfolio project. Students can discover tutors and request tutoring sessions, while tutors can manage their profiles and incoming bookings.

The project is being developed to demonstrate practical full-stack development skills for internships and software engineering roles.

### Technology Stack

- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL 18.6
- **Authentication:** bcrypt, JWT, HttpOnly cookies
- **Database driver:** pg
- **Email service:** Resend
- **Other dependencies:** CORS, cookie-parser, dotenv
- **Version control:** Git and GitHub

## 2. Development Environment

- Project directory: `~/Desktop/tutorhub`
- Machine: MacBook Air, Apple Silicon
- Node.js: v24.20.0
- npm: 11.19.0
- Git: 2.54.0
- PostgreSQL: 18.6 (Homebrew)
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001/api`

Port 5000 previously returned an AirTunes-related HTTP 403, so port 5001 is used for local backend testing.

**Security reminder:** Never put `.env` secrets, database passwords, JWT secrets, or API keys in this document or commit them to Git.

## 3. Git History and Current Working Tree

Current branch: `main`

### Known commits

| Commit | Description |
|---|---|
| `8a89731` | Build initial TutorHub React landing page |
| `3a12c7d` | Set up Express backend and PostgreSQL connection |
| `1465414` | Add booking APIs with validation and conflict prevention |
| `77afa5f` | Implement user authentication and protect booking routes |
| `fdc7a83` | Connect React frontend with authentication APIs |
| `f2f045a` | Add React auth context and dynamic navbar |

### Current working-tree status

The latest inspected Git status showed multiple modified and untracked files across the frontend and backend.

Outstanding changes include:
- Authentication and session management.
- Booking functionality.
- Profile management.
- Tutor discovery and tutor detail pages.
- Student and tutor dashboards.
- Email verification.
- Responsive UI improvements.
- Project progress documentation.

The latest production build passed successfully.

**No new commits were made during the latest UI-polish session.**

Before committing:
- Run `git status --short`.
- Review relevant diffs.
- Inspect untracked files.
- Confirm `.env` files are ignored and not tracked.
- Avoid staging the entire project blindly.
- Preserve all existing uncommitted work.

Do not use destructive commands such as `git reset --hard` or `git restore` unless explicitly approved.

## 4. Project Structure

Known high-level structure:

```text
tutorhub/
├── .gitignore
├── README.md
├── PROJECT_PROGRESS.md
├── client/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Tutors.jsx
│       │   ├── TutorProfile.jsx
│       │   ├── StudentDashboard.jsx
│       │   ├── TutorDashboard.jsx
│       │   ├── Profile.jsx
│       │   └── VerifyEmailChange.jsx
│       └── services/
│           ├── authService.js
│           ├── bookingService.js
│           ├── profileService.js
│           └── tutorService.js
└── server/
    └── src/
        ├── server.js
        ├── app.js
        ├── db/
        │   └── pool.js
        ├── middleware/
        │   └── authMiddleware.js
        ├── routes/
        │   ├── authRoutes.js
        │   ├── bookingRoutes.js
        │   ├── profileRoutes.js
        │   └── tutorRoutes.js
        └── services/
            └── emailService.js
```

This is a known high-level structure, not an exhaustive freshly generated listing.

## 5. Database Design

Database name: `tutorhub`

The known schema contains seven tables.

### users

| Column | Type |
|---|---|
| id | bigint, identity primary key |
| full_name | varchar(100), NOT NULL |
| email | varchar(255), UNIQUE, NOT NULL |
| password_hash | text, NOT NULL |
| phone | varchar(20) |
| created_at | timestamptz |
| updated_at | timestamptz |

### students

| Column | Type |
|---|---|
| user_id | bigint, primary key, FK to users |
| education_level | varchar(100) |
| learning_goals | text |
| created_at | timestamptz |
| updated_at | timestamptz |

### tutors

| Column | Type |
|---|---|
| user_id | bigint, primary key, FK to users |
| qualification | varchar(150) |
| experience_years | numeric(4,1) |
| hourly_rate | numeric(10,2), NOT NULL |
| bio | text |
| created_at | timestamptz |
| updated_at | timestamptz |

Hourly rate has a non-negative check constraint.

### subjects

| Column | Type |
|---|---|
| id | bigint, identity primary key |
| name | varchar(100), UNIQUE |
| description | text |
| created_at | timestamptz |

### tutor_subjects

| Column | Type |
|---|---|
| tutor_id | bigint, FK to tutors |
| subject_id | bigint, FK to subjects |
| assigned_at | timestamptz |

Composite primary key: `(tutor_id, subject_id)`.

### bookings

| Column | Type |
|---|---|
| id | bigint, identity primary key |
| student_id | bigint, FK to students |
| tutor_id | bigint, FK to tutors |
| subject_id | bigint, FK to subjects |
| session_start | timestamptz |
| session_end | timestamptz |
| duration_minutes | integer |
| hourly_rate_at_booking | numeric(10,2) |
| status | varchar(20) |
| created_at | timestamptz |
| updated_at | timestamptz |

Constraints include:
- Duration must be positive.
- Booking price must be non-negative.
- Allowed statuses: `pending`, `confirmed`, `completed`, `cancelled`, `rejected`.
- `(tutor_id, subject_id)` references `tutor_subjects`.

### email_change_requests

Supports email-change verification.

Known columns:
- id
- user_id referencing users with ON DELETE CASCADE
- new_email
- token_hash
- expires_at
- created_at
- used_at

Verification tokens are securely generated. Their SHA-256 hashes are stored instead of raw tokens. Requests expire after 30 minutes.

### Booking conflict prevention

The database uses the `btree_gist` extension and an exclusion constraint named `bookings_no_tutor_overlap`.

It prevents overlapping bookings for the same tutor when their status is `pending` or `confirmed`.

The time range uses `[)`, allowing one session to start exactly when another ends.

**Preserve this database-level protection.**

## 6. Multiple-Role Architecture

One account can be:
- A student.
- A tutor.
- Both a student and a tutor.

The `users` table stores shared account information. Optional rows in `students` and `tutors` represent the user's roles.

Registration creates the requested profile rows in a PostgreSQL transaction.

Example authenticated user:

```js
{
    id: "1",
    fullName: "Example User",
    email: "example@email.com",
    roles: ["student", "tutor"]
}
```

A dual-role account can access both dashboards and its own student and tutor booking views.

## 7. Backend Implementation

### Application setup

The Express application:
- Configures CORS for `http://localhost:5173`.
- Enables credentials.
- Enables JSON parsing and cookie-parser.
- Mounts authentication, booking, tutor and profile routes.
- Provides health and database-test endpoints.

### Authentication

Implemented endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Registration:
- Supports Student, Tutor and Both roles.
- Collects role-specific information during registration.
- Student fields: education level and learning goals.
- Tutor fields: qualification, experience, subjects, hourly rate and bio.
- Validates selected subject IDs against the subjects catalog.
- Creates the user and associated student/tutor profiles in a PostgreSQL transaction.
- Saves tutor subject assignments in `tutor_subjects` within the same transaction.
- Hashes passwords using bcrypt with cost factor 12.
- Prevents duplicate email registration.

Login:
- Retrieves the account and associated roles.
- Verifies the password with `bcrypt.compare()`.
- Generates a JWT containing the account ID in `sub`.
- Stores the JWT in an HttpOnly cookie named `token`.
- Does not expose the JWT to frontend JavaScript.

Session restoration:
- `/me` retrieves the authenticated user's current information and roles.
- The frontend restores the login session after refresh.

Logout:
- Clears the authentication cookie.

### Authentication middleware

`server/src/middleware/authMiddleware.js`:
- Reads the JWT from `req.cookies.token`.
- Verifies it using `JWT_SECRET`.
- Extracts the account ID from `sub`.
- Adds the authenticated user ID to `req.user`.
- Rejects missing, invalid or expired tokens.

### Booking routes

Implemented functionality:
- Retrieve student bookings.
- Retrieve tutor bookings.
- Create bookings.
- Update booking status through the tutor workflow.

Booking creation:
- Requires authentication.
- Uses the authenticated account ID as the student ID.
- Checks that the account has a student profile.
- Validates request data and IDs.
- Validates timezone-qualified session dates.
- Retrieves the tutor's actual hourly rate from PostgreSQL.
- Calculates the session end time.
- Validates the tutor-subject relationship.
- Handles overlapping booking errors.

Authorization:
- Students can retrieve only their own bookings.
- Tutors can retrieve only their own incoming bookings.
- Tutors can accept or reject only their own pending bookings.
- Only pending bookings can be updated through the implemented accept/reject workflow.

A complete cancellation and completion workflow still requires review.

### Tutor routes

Tutor listing and tutor detail functionality are implemented in `server/src/routes/tutorRoutes.js`.

The frontend consumes the tutor data through its tutor service.

### Profile routes

`server/src/routes/profileRoutes.js` supports:
- Retrieving the authenticated user's profile.
- Updating shared account details.
- Updating student profile details.
- Updating tutor profile details.
- Requesting an email change.
- Verifying an email change.

Additional tutor profile functionality:
- Retrieves available subjects through `GET /api/tutors/subjects`.
- Retrieves the authenticated user's existing subject assignments through `GET /api/profiles/me`.
- Updates tutor details and subject assignments through `PUT /api/profiles/tutor`.
- Validates selected subject IDs.
- Replaces previous subject assignments with the newly selected subjects.
- Uses a PostgreSQL transaction so tutor details and subject assignments are updated together.
- Returns the updated tutor profile, including selected subjects.

### Email service

`server/src/services/emailService.js` uses Resend to send verification emails.

Development/testing sender:
`TutorHub <onboarding@resend.dev>`

Resend's test sender has recipient restrictions until a sending domain is verified.

For production:
- Verify a sending domain.
- Update the sender configuration.
- Configure the production client URL.
- Keep `RESEND_API_KEY` in `server/.env`.
- Never commit API keys.

## 8. Frontend Implementation

### Routing

`client/src/App.jsx` uses React Router.

Routes include:
- `/` — Home
- `/tutors` — Tutor discovery
- `/tutors/:tutorId` — Tutor detail
- `/login` — Login
- `/register` — Registration
- `/verify-email-change` — Email verification
- `/profile` — Profile management
- `/student/dashboard` — Student dashboard
- `/tutor/dashboard` — Tutor dashboard

Protected routes use `ProtectedRoute.jsx` and role checks.

### Authentication context

`AuthContext.jsx`:
- Maintains the current user and loading state.
- Restores sessions through the current-user API.
- Provides login and logout.
- Exposes `isAuthenticated`, `user`, `loading` and `refreshUser`.

### Navbar

`Navbar.jsx`:
- Displays TutorHub navigation.
- Shows Login and Sign Up when logged out.
- Displays the logged-in user's name.
- Displays dashboard links according to the user's roles.
- Provides logout functionality.

### Login and registration

Login:
- Calls the login API.
- Updates AuthContext after successful login.
- Redirects student and dual-role accounts to the student dashboard by default.
- Redirects tutor-only accounts to the tutor dashboard.
- Displays loading and error states.

Registration:
- Supports Student, Tutor and Both.
- Dynamically displays role-specific registration fields.
- Collects student education level and learning goals.
- Collects tutor qualification, experience, subjects, hourly rate and bio.
- Fetches available subjects from the backend.
- Supports selecting multiple teaching subjects.
- Sends role-specific information to the registration API.
- Displays success and error messages.

Registration has been manually tested successfully for all three account types.

### Tutor discovery

`Tutors.jsx`:
- Fetches tutor data from the API.
- Displays tutor names, qualifications, experience, subjects and hourly rates.
- Provides navigation to tutor detail pages.
- Supports search by name, qualification, bio and subject.
- Supports dynamic subject filtering.
- Supports combining search and subject filters.
- Supports sorting by hourly rate (low-to-high and high-to-low).
- Supports sorting by experience (high-to-low).
- Displays matching-tutor counts and an empty state.
- Uses responsive layouts.

Search, filtering, sorting, combined filters and responsive layout were tested by the user.

### Tutor detail page

`TutorProfile.jsx` provides the tutor detail route and displays tutor information.

Review the current booking-form integration and test the complete flow before claiming it is fully verified.

### Student and tutor dashboards

`StudentDashboard.jsx` and `TutorDashboard.jsx` display booking information and summary counts.

Implemented:
- Booking lists and details.
- Booking totals and status counts.
- All, Pending, Confirmed and Cancelled filters.
- Loading and empty states.
- Tutor accept/reject actions for pending bookings.
- UI updates after successful status changes.

The user previously tested both dashboards, status actions, filters and status persistence after refresh.

### Profile management

`Profile.jsx` supports editing:
- Shared account details such as full name and phone number.
- Student education level and learning goals.
- Tutor qualification, experience, hourly rate and bio.
- Tutor teaching subjects through a multi-select checkbox interface.
- Email-change requests through verification.

Additional functionality:
- Loads available subjects from the tutor subjects API.
- Preselects subjects already assigned to the tutor.
- Allows tutors to add and remove subjects.
- Saves updated subject assignments to PostgreSQL.
- Displays profile sections according to the user's roles.

The tutor subject editing workflow was tested using a Tutor-only account, including persistence after refreshing the page. Both-role profile editing still requires verification.

### Email verification page

`VerifyEmailChange.jsx`:
- Reads the verification token from the URL.
- Requires explicit confirmation.
- Calls the verification API.
- Refreshes authentication context when appropriate.

### Frontend services

Service modules exist for:
- Authentication.
- Bookings.
- Profiles.
- Tutor data.

They centralize API requests and use credentials where cookie-based authentication is required.

## 9. UI and Responsive Design — 16 November 2026

Recent improvements:
- Improved Home page layout and presentation.
- Updated Login and Sign Up page markup.
- Applied a consistent authentication-card design.
- Styled authentication fields, labels, buttons and helper text.
- Improved success and error messages.
- Added responsive spacing and sizing for authentication pages.
- Reviewed Profile page styling.
- Checked layouts at desktop, tablet and mobile widths.
- Preserved TutorHub's navy and green design system.

### Latest production build

The frontend production build was run after the styling updates.

```text
vite v8.3.5 building client environment for production...
✓ 39 modules transformed.
dist/index.html                   0.45 kB │ gzip: 0.29 kB
dist/assets/index-ChRLu0bU.css   24.99 kB │ gzip: 4.96 kB
dist/assets/index-DhmcbJM3.js   297.80 kB │ gzip: 89.84 kB
✓ built in 99ms

```

**Result: Production build successful.**

## 10. Testing and Verification

### Verified through frontend testing

- Student registration.
- Tutor registration.
- Both-role registration.
- Student, tutor and dual-role login.
- Role-specific dashboard access.
- Dynamic navbar links.
- Session persistence after refresh.
- Logout.
- Protected-route redirection after logout.
- Student and tutor dashboards.
- Booking status filters.
- Tutor accept/reject actions.
- Booking status persistence after refresh.
- Tutor discovery search.
- Subject filtering.
- Sorting.
- Combined search and filtering.
- Responsive tutor discovery layout.
- Email-change request and verification workflow.
- Updated email displayed in profile.
- Latest responsive UI checks.
- Latest production build.
- [x] Conditional Student registration.
- [x] Conditional Tutor registration.
- [x] Conditional Both-role registration.
- [x] Tutor qualification, experience, hourly rate and bio saved during registration.
- [x] Multiple tutor subjects saved during registration.
- [x] Tutor profile editing.
- [x] Adding and removing teaching subjects.
- [x] Updated subject assignments persist after refreshing the Profile page.
- [x] Tutor subject checkbox alignment and styling.

### Verified through backend testing

- Health endpoint returns HTTP 200.
- PostgreSQL connection succeeds.
- Authentication and cookie-based session flow.
- Unauthenticated protected requests return HTTP 401.
- Student booking retrieval for the authenticated student.
- Tutor booking retrieval for the authenticated tutor.
- Cross-account booking access returns HTTP 403.
- Dual-role account can access its own student and tutor bookings.
- Booking creation returns HTTP 201.
- Duplicate overlapping booking returns HTTP 409.
- Database-level overlap prevention works.
- [x] Available subjects endpoint returns the subjects catalog.
- [x] Tutor listing returns tutors with their assigned subjects.
- [x] Registration creates the appropriate role-specific profile records.
- [x] Registration saves tutor subject assignments.
- [x] Tutor profile update endpoint validates and saves subject assignments.
- [x] Tutor profile updates and subject assignments are handled transactionally.
- [x] `node --check src/routes/authRoutes.js` passed.
- [x] `node --check src/routes/profileRoutes.js` passed.

### Implemented; further end-to-end review recommended

- Complete booking creation through the React UI.
- Tutor detail and booking-form experience.
- Full cancellation and completion workflow.
- Automated frontend and backend tests.
- Production email sending using a verified domain.
- Deployment.

Do not describe untested functionality as fully verified.

## 11. Current Project Status

### Implemented milestones

- [x] Initial project setup.
- [x] React frontend with Vite.
- [x] Express backend.
- [x] PostgreSQL connection and core schema.
- [x] Multi-role user model.
- [x] Student, tutor and dual-role registration.
- [x] bcrypt password hashing.
- [x] JWT authentication with HttpOnly cookies.
- [x] Session restoration and logout.
- [x] Protected routes and role-based navigation.
- [x] Booking API with validation.
- [x] Database-level booking overlap prevention.
- [x] Student and tutor dashboards.
- [x] Booking status filters.
- [x] Tutor accept/reject workflow.
- [x] Profile management.
- [x] Email change with verification.
- [x] Tutor listing and detail pages.
- [x] Tutor search, filtering and sorting.
- [x] Responsive UI improvements.
- [x] Latest frontend production build.
- [x] Conditional registration for Student, Tutor and Both roles.
- [x] Role-specific registration fields.
- [x] Tutor subject selection during registration.
- [x] Transactional registration of user, role profiles and subject assignments.
- [x] Tutor subject management in the Profile page.
- [x] Transactional tutor profile and subject updates.
- [x] Subject selection persistence after page refresh.


### Verification completed — November 16, 2026

- [x] CSS and responsive layout review.
- [x] Frontend production build.
- [x] Git whitespace check.
- [x] Backend dependency verification.
- [x] Backend health endpoint check.
- [x] PostgreSQL connection endpoint check.
- [x] Environment-file tracking check.
- [x] Backend configuration and email-service review.

These checks do not replace end-to-end testing of every marketplace workflow.

## 12. Next Development Roadmap

### Phase 1 — Preserve and organize current work

- [x] Recheck `git status --short`.
- [x] Inspect current uncommitted changes and diff summary.
- [x] Review and remove the development-only `server/src/testEmail.js` utility.
- [x] Confirm `.env` files are ignored and not tracked.
- [x] Create `server/.env.example` with placeholder configuration.
- [ ] Organize completed work into meaningful commits.
- [x] Keep this progress document updated.


### Phase 2 — Review the complete marketplace flow

- [ ] Test tutor discovery through tutor detail.
- [ ] Test booking creation from the frontend.
- [ ] Test the student booking view.
- [ ] Test tutor accept and reject actions.
- [ ] Review cancellation and completion behavior.
- [ ] Test invalid inputs and unavailable slots.
- [ ] Test authorization boundaries.

### Phase 3 — Quality and security

- [ ] Add automated backend tests.
- [ ] Add automated frontend tests.
- [ ] Review validation and error handling.
- [ ] Review authentication and authorization.
- [ ] Review CORS and cookie settings.
- [ ] Review environment configuration.
- [ ] Review email verification edge cases and token expiry.
- [ ] Review dependency vulnerabilities carefully.

### Phase 4 — Portfolio readiness

- [ ] Update README with setup instructions and architecture.
- [ ] Add application screenshots.
- [ ] Document API endpoints and database design.
- [ ] Verify production environment variables.
- [ ] Verify a sending domain for production email.
- [ ] Deploy frontend, backend and database.
- [ ] Test the deployed application.
- [ ] Publish truthful LinkedIn and X updates at meaningful milestones.

### Additional profile verification

- [ ] Test profile editing using a Both-role account.
- [ ] Verify student and tutor profile updates independently for a dual-role account.
- [ ] Test invalid subject IDs and duplicate subject selections.
- [ ] Test tutor profile updates with invalid numeric values.
- [ ] Verify rollback behavior when a tutor profile update fails.

### Additional quality checks

- [ ] Verify registration and profile-editing workflows after a fresh login.

## 13. Development Preferences and Handoff Instructions

When continuing TutorHub development:
- Work step by step.
- Give exact file paths and terminal commands.
- Explain code and architectural decisions.
- Inspect existing code before replacing it.
- Avoid unnecessary rewrites.
- Preserve uncommitted changes.
- Check Git status before staging or committing.
- Explain VS Code, Git and GitHub workflows.
- Do not repeat beginner material unnecessarily.
- Draft truthful LinkedIn and X posts at meaningful completed milestones.
- Never claim incomplete or untested features are complete.
- Keep secrets out of source control and documentation.


## 14. Current Project Status and Handoff

### Completed in the November 16, 2026 review

- Reviewed the frontend CSS and responsive layouts.
- Reviewed authentication, booking, profile, tutor and dashboard implementation.
- Reviewed backend routes, middleware, database connection and email service.
- Created `server/.env.example` with placeholder values.
- Confirmed actual environment files are not tracked by Git.
- Removed the development-only `server/src/testEmail.js` utility.
- `git diff --check` passed.
- Frontend production build passed: 39 modules, completed in 99ms.
- Backend dependencies verified using `npm ls --depth=0`.
- Backend health endpoint returned HTTP 200.
- PostgreSQL connection endpoint returned HTTP 200.

### Remaining work

1. Complete the final review of all changed and new files.
2. Update this document with any additional findings.
3. Organize the work into meaningful Git commits after approval.
4. Complete marketplace workflow and authorization testing.
5. Add automated tests.
6. Review security and production readiness.
7. Prepare the README and deployment.

### Important Git instructions

- Preserve all existing uncommitted work.
- Do not use destructive Git commands.
- Do not stage or commit without explicit approval.
- Keep actual environment files and credentials out of source control.

### Completed on November 17, 2026

- Implemented conditional registration for Student, Tutor and Both roles.
- Added role-specific registration fields.
- Added tutor subject selection during registration.
- Verified all three registration scenarios.
- Verified tutor details and subject assignments in PostgreSQL.
- Implemented tutor profile and subject updates.
- Added subject selection controls to the Profile page.
- Verified tutor subject changes persist after refreshing.
- Fixed checkbox and subject-name alignment.
- Passed JavaScript syntax checks for `authRoutes.js` and `profileRoutes.js`.

### Remaining verification

- Test profile editing with a Both-role account.
- Test invalid input and transaction rollback scenarios.
- Test profile editing with a Both-role account.
- Test invalid input and transaction rollback scenarios.
- Verify registration and profile editing after a fresh login.
- Review all changes before organizing Git commits.
