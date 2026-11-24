# TutorHub — Project Progress & Handoff

**Last updated: 24 November 2026**

## 1. Project Overview

TutorHub is an independent full-stack tutoring marketplace portfolio project. It connects students with tutors and allows users to register as students, tutors, or both.

Users can discover tutors, manage their profiles, request tutoring sessions, and manage bookings.

The project demonstrates practical full-stack development skills, including authentication, authorization, REST API development, relational database design, frontend development, automated testing, and database-level business rules.

### Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 18.6 |
| Authentication | bcrypt, JWT, HttpOnly cookies |
| Database driver | node-postgres (`pg`) |
| Email service | Resend |
| Backend testing | Vitest, Supertest |
| Frontend testing | Vitest, React Testing Library, jest-dom, user-event |
| Version control | Git and GitHub |

## 2. Development Environment

- Project directory: `~/Desktop/tutorhub`
- Machine: MacBook Air, Apple Silicon
- Node.js: v24.20.0
- npm: 11.19.0
- Git: 2.54.0
- PostgreSQL: 18.6 (Homebrew)
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001/api`

### Local PostgreSQL Configuration

Two PostgreSQL installations exist on the development machine:

| Installation | Version | Port |
|---|---:|---:|
| Homebrew PostgreSQL | 18.6 | 5433 |
| Enterprise PostgreSQL | 15 | 5432 |

TutorHub currently uses the Homebrew PostgreSQL 18.6 installation on port **5433**.

The separate PostgreSQL 15 installation on port 5432 should not be changed or stopped as part of ordinary TutorHub development.

Port 5000 previously returned an AirTunes-related HTTP 403, so the TutorHub backend uses port **5001**.

**Security reminder:** Never put `.env` secrets, database passwords, JWT secrets, or API keys in this document or commit them to Git.

## 3. Git History and Current Status

Current branch: `main`

GitHub repository:

`https://github.com/savarna7/tutorhub`

### Recent commits

| Commit | Description |
|---|---|
| `8a89731` | Build initial TutorHub React landing page |
| `d2fc0d3` | Implement role-specific registration |
| `bcd68e8` | Add tutor profile and subject management |
| `7be9786` | Update TutorHub project documentation |
| `72e44a4` | Add automated backend tests |
| `9608507` | Improve booking workflows, profile validation, and tests |

### Latest development commit

```text
9608507 Improve booking workflows, profile validation, and tests
```

This commit includes:
- Backend booking and profile validation improvements.
- Database validation migrations.
- Student dashboard automated tests.
- Tutor dashboard automated tests.
- Additional backend test coverage.

The commit is currently local and has not yet been pushed to GitHub.

### Current documentation changes

The README has been updated locally to reflect the latest project implementation, setup instructions, database design, screenshots, and automated test results.

The updated `PROJECT_PROGRESS.md` is also being prepared.

Do not assume documentation changes have been committed or pushed until Git confirms that they have.

Before staging or committing:

```bash
git status --short
git diff --check
git diff --stat
```

Inspect modified and untracked files before staging.

**Important Git instructions:**
- Preserve all existing work.
- Do not stage the entire project blindly.
- Confirm `.env` files are ignored and not tracked.
- Do not use destructive commands such as `git reset --hard` or `git restore` without explicit approval.
- Do not stage, commit, or push without explicit approval.

## 4. Project Structure

Known high-level structure:

```text
tutorhub/
├── .gitignore
├── README.md
├── PROJECT_PROGRESS.md
├── screenshots/
│   ├── homepage.png
│   ├── student-dashboard.png
│   ├── tutor-dashboard.png
│   ├── tutor-discovery.png
│   └── profile.png
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ProtectedRoute.test.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   ├── AuthProvider.jsx
│   │   │   └── useAuth.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Login.test.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Register.test.jsx
│   │   │   ├── Tutors.jsx
│   │   │   ├── TutorProfile.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── StudentDashboard.test.jsx
│   │   │   ├── TutorDashboard.jsx
│   │   │   ├── TutorDashboard.test.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── VerifyEmailChange.jsx
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── bookingService.js
│   │   │   ├── profileService.js
│   │   │   └── tutorService.js
│   │   ├── test/
│   │   │   └── setup.js
│   │   ├── App.jsx
│   │   ├── App.test.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
└── server/
    ├── db/
    │   ├── schema.sql
    │   └── migrations/
    │       ├── 001_add_database_validation_constraints.sql
    │       └── 002_add_profile_text_constraints.sql
    ├── tests/
    │   ├── app.test.js
    │   └── setup.js
    ├── .env.example
    ├── vitest.config.js
    ├── package.json
    └── src/
        ├── middleware/
        │   └── authMiddleware.js
        ├── db/
        │   └── pool.js
        ├── routes/
        │   ├── authRoutes.js
        │   ├── bookingRoutes.js
        │   ├── tutorRoutes.js
        │   └── profileRoutes.js
        ├── services/
        │   └── emailService.js
        ├── app.js
        └── server.js
```

This is a high-level reference, not an exhaustive freshly generated directory listing.

## 5. Database Design

Development database: `tutorhub`

Automated testing database: `tutorhub_test`

TutorHub uses seven main tables.

### users

Stores shared account information.

- `id`: bigint identity primary key.
- `full_name`: varchar(100), NOT NULL.
- `email`: varchar(255), UNIQUE, NOT NULL.
- `password_hash`: text, NOT NULL.
- `phone`: varchar(20).
- `created_at`: timestamp with time zone.
- `updated_at`: timestamp with time zone.

### students

Stores student-specific information.

- `user_id`: primary key and foreign key to `users`.
- `education_level`: varchar(100).
- `learning_goals`: text.
- `created_at`.
- `updated_at`.

### tutors

Stores tutor-specific information.

- `user_id`: primary key and foreign key to `users`.
- `qualification`: varchar(150).
- `experience_years`: numeric(4,1).
- `hourly_rate`: numeric(10,2), NOT NULL.
- `bio`: text.
- `created_at`.
- `updated_at`.

Validation includes:
- Experience must be between 0 and 60 years.
- Hourly rate must be non-negative.
- Biography length must not exceed 1,000 characters after trimming.

### subjects

Stores the available teaching subjects.

- `id`: bigint identity primary key.
- `name`: varchar(100), UNIQUE.
- `description`: text.
- `created_at`.

### tutor_subjects

Maps tutors to the subjects they teach.

- `tutor_id`: foreign key to `tutors`.
- `subject_id`: foreign key to `subjects`.
- `assigned_at`: timestamp.

Composite primary key:

`(tutor_id, subject_id)`

### bookings

Stores tutoring session bookings.

- `id`: bigint identity primary key.
- `student_id`: foreign key to `students`.
- `tutor_id`: foreign key to `tutors`.
- `subject_id`: foreign key to `subjects`.
- `session_start`: timestamptz.
- `session_end`: timestamptz.
- `duration_minutes`: integer.
- `hourly_rate_at_booking`: numeric(10,2).
- `status`: varchar(20).
- `created_at`.
- `updated_at`.

Important constraints:
- Booking duration must be one of 30, 60, 90, or 120 minutes.
- Session end must be later than session start.
- Session end must match the selected duration.
- Booking price must be non-negative.
- Allowed statuses are `pending`, `confirmed`, `completed`, `cancelled`, and `rejected`.
- The `(tutor_id, subject_id)` relationship references `tutor_subjects`.

### email_change_requests

Supports secure email-change verification.

Known columns:
- `id`.
- `user_id`, referencing `users` with `ON DELETE CASCADE`.
- `new_email`.
- `token_hash`.
- `expires_at`.
- `created_at`.
- `used_at`.

Verification tokens are generated using cryptographically secure random bytes. Only their SHA-256 hashes are stored.

Verification requests expire after 30 minutes.

### Booking conflict prevention

The database uses the PostgreSQL `btree_gist` extension and an exclusion constraint named:

`bookings_no_tutor_overlap`

It prevents overlapping bookings for the same tutor while the booking status is `pending` or `confirmed`.

The time range uses `[)`, so one session can start exactly when another session ends.

This database-level protection also handles concurrent booking attempts.

**Preserve this constraint. Do not replace it with frontend-only availability checks.**

### Schema and migrations

Canonical schema:

`server/db/schema.sql`

Incremental migrations:

- `server/db/migrations/001_add_database_validation_constraints.sql`
- `server/db/migrations/002_add_profile_text_constraints.sql`

Migration 001 adds:
- Tutor experience validation.
- Supported booking durations.
- Booking session-time consistency.

Migration 002 adds:
- Tutor biography length validation.
- Student learning-goals length validation.

Both migrations were successfully applied to the development and test databases.

The canonical schema was updated to include these constraints.

Do not rerun these non-idempotent migrations against databases where they have already been applied.

## 6. Multiple-Role Architecture

One account can have:

- Student role.
- Tutor role.
- Both student and tutor roles.

The `users` table stores shared account information. Optional records in `students` and `tutors` represent the account's roles.

Registration creates the user and appropriate role-specific profile records in a PostgreSQL transaction.

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

`server/src/app.js`:

- Configures CORS for the frontend origin.
- Enables credentialed requests.
- Enables JSON parsing and cookie-parser.
- Mounts authentication, booking, tutor, and profile routes.
- Provides health and database-test endpoints.

`server/src/server.js` loads the environment configuration and starts the Express server.

### Authentication

Implemented endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Registration:
- Supports Student, Tutor, and Both roles.
- Collects role-specific information.
- Validates subject IDs.
- Creates the user and role-specific records transactionally.
- Saves tutor subject assignments in `tutor_subjects`.
- Hashes passwords using bcrypt with cost factor 12.
- Prevents duplicate email registration.

Login:
- Retrieves the account and associated roles.
- Verifies the password using `bcrypt.compare()`.
- Generates a JWT containing the account ID in `sub`.
- Stores the JWT in an HttpOnly cookie named `token`.

Session restoration:
- Retrieves the current authenticated user's information and roles.
- Allows the frontend to restore the session after refresh.

Logout:
- Clears the authentication cookie.

### Authentication middleware

`server/src/middleware/authMiddleware.js`:

- Reads the JWT from `req.cookies.token`.
- Verifies the token using `JWT_SECRET`.
- Extracts the account ID from `sub`.
- Adds the authenticated user ID to `req.user`.
- Rejects missing, invalid, or expired tokens.

### Booking routes

`server/src/routes/bookingRoutes.js` supports:

- Retrieving student bookings.
- Retrieving tutor bookings.
- Creating bookings.
- Updating booking status.

Booking creation:
- Requires authentication.
- Uses the authenticated account ID for the student identity.
- Checks for a student profile.
- Validates request data and IDs.
- Validates timezone-qualified session dates.
- Requires a future session time.
- Supports durations of 30, 60, 90, or 120 minutes.
- Retrieves the tutor's actual hourly rate from PostgreSQL.
- Validates the tutor-subject relationship.
- Calculates the session end time.
- Handles database overlap conflicts with HTTP 409.

Authorization:
- Students can retrieve only their own bookings.
- Tutors can retrieve only their own incoming bookings.
- Ownership is checked against the authenticated account.

### Booking status transitions

The backend validates status changes according to the user's role and current booking status.

| User | Current status | Allowed next status |
|---|---|---|
| Tutor | Pending | Confirmed or rejected |
| Tutor | Confirmed | Cancelled or completed |
| Student | Pending | Cancelled |
| Student | Confirmed | Cancelled |

Invalid transitions and unauthorized updates are rejected.

The database exclusion constraint continues to protect overlapping active bookings.

The API and status-transition validation have automated test coverage. Complete end-to-end verification of booking creation and every status workflow through the React interface remains part of the next testing phase.

### Tutor routes

`server/src/routes/tutorRoutes.js` provides public tutor discovery functionality:

- Retrieve tutors.
- Retrieve an individual tutor.
- Retrieve available subjects.

The frontend consumes this data through its tutor service.

### Profile routes

`server/src/routes/profileRoutes.js` supports:

- Retrieving the authenticated user's profile.
- Updating shared account information.
- Updating student information.
- Updating tutor information.
- Requesting an email change.
- Verifying an email change.

Tutor profile updates:
- Validate qualification, experience, hourly rate, and bio.
- Validate selected subject IDs.
- Reject invalid and duplicate subject IDs.
- Replace existing subject assignments transactionally.
- Lock the tutor record during updates.
- Return the updated profile and assigned subjects.

Student profile updates:
- Validate education level and learning goals.
- Enforce the learning-goals length limit.

Shared account updates:
- Update the authenticated user's own account details.

### Email-change workflow

The email-change workflow:
- Generates cryptographically secure verification tokens.
- Stores token hashes instead of raw tokens.
- Sets a 30-minute expiry.
- Rejects malformed, expired, reused, or superseded tokens.
- Uses database transactions and row locking during verification.
- Prevents conflicting email reservations.
- Handles email delivery failures.

### Email service

`server/src/services/emailService.js` uses Resend to send verification emails.

Development/testing sender:

`TutorHub <onboarding@resend.dev>`

Resend's test sender has recipient restrictions until a sending domain is verified.

Production requirements:
- Verify a sending domain.
- Configure an appropriate sender.
- Set the production client URL.
- Keep `RESEND_API_KEY` in the environment.
- Never commit API keys.

## 8. Frontend Implementation

### Routing

`client/src/App.jsx` uses React Router.

Main routes include:

- `/` — Home.
- `/tutors` — Tutor discovery.
- `/tutors/:tutorId` — Tutor detail.
- `/login` — Login.
- `/register` — Registration.
- `/verify-email-change` — Email verification.
- `/profile` — Profile management.
- `/student/dashboard` — Student dashboard.
- `/tutor/dashboard` — Tutor dashboard.

Protected routes use `ProtectedRoute.jsx` and role checks.

### Authentication context

Authentication is separated into:

- `client/src/context/AuthContext.js` — creates and exports the shared React context.
- `client/src/context/AuthProvider.jsx` — manages user state, loading state, session restoration, login, logout, and refresh operations.
- `client/src/context/useAuth.js` — custom hook for accessing the authentication context.

The provider:
- Restores sessions through the current-user API.
- Maintains the current user and loading state.
- Exposes `isAuthenticated`, `user`, `loading`, `login`, `logout`, and `refreshUser`.
- Clears frontend authentication state after logout.

This structure also resolves the React Fast Refresh export warning encountered with the earlier context implementation.

### Navbar

`Navbar.jsx`:
- Displays TutorHub navigation.
- Shows Login and Sign Up when logged out.
- Displays the logged-in user's name.
- Shows dashboard links according to the user's roles.
- Provides logout functionality.

### Login and registration

Login:
- Calls the login API.
- Updates authentication context after successful login.
- Redirects student and dual-role accounts to the student dashboard by default.
- Redirects tutor-only accounts to the tutor dashboard.
- Displays loading and error states.

Registration:
- Supports Student, Tutor, and Both.
- Dynamically displays role-specific fields.
- Collects student education level and learning goals.
- Collects tutor qualification, experience, subjects, hourly rate, and bio.
- Fetches subjects from the backend.
- Supports selecting multiple teaching subjects.
- Sends role-specific information to the registration API.
- Displays success and error messages.

All three registration types have been manually tested.

### Tutor discovery

`Tutors.jsx`:
- Fetches tutor data from the API.
- Displays tutor names, qualifications, experience, subjects, and hourly rates.
- Provides navigation to tutor detail pages.
- Supports search by name, qualification, bio, and subject.
- Supports dynamic subject filtering.
- Supports combined search and filtering.
- Supports sorting by hourly rate and experience.
- Displays matching tutor counts and an empty state.
- Uses responsive layouts.

Search, filtering, sorting, combined filters, and responsive layouts have been manually tested.

### Tutor detail page

`TutorProfile.jsx` provides the individual tutor detail route and displays tutor information.

The complete booking-form and booking-creation experience still requires end-to-end verification through the frontend.

### Student and tutor dashboards

`StudentDashboard.jsx` and `TutorDashboard.jsx` display booking information and summary counts.

Implemented functionality includes:
- Booking lists and details.
- Booking totals and status counts.
- Booking status filters.
- Loading, error, and empty states.
- Tutor accept/reject actions for pending requests.
- UI updates after successful status changes.
- Additional booking status handling in the backend.

Both dashboard components now have automated frontend test files.

### Profile management

`Profile.jsx` supports editing:

- Shared account details, including full name and phone number.
- Student education level and learning goals.
- Tutor qualification, experience, hourly rate, and bio.
- Tutor teaching subjects.
- Email-change requests and verification.

Additional functionality:
- Loads available subjects from the backend.
- Preselects existing tutor subjects.
- Allows tutors to add and remove subjects.
- Saves updated assignments to PostgreSQL.
- Displays profile sections according to the account's roles.

Tutor-only and dual-role profile editing have been manually tested. Student and tutor profile changes for a dual-role account were verified independently and persisted after refreshing.

### Email verification page

`VerifyEmailChange.jsx`:
- Reads the verification token from the URL.
- Requires explicit confirmation.
- Calls the verification API.
- Refreshes authentication context when appropriate.

### Frontend services

Service modules centralize API requests for:
- Authentication.
- Bookings.
- Profiles.
- Tutor data.

Cookie-based authentication requests use credentials where required.

## 9. UI and Responsive Design

The application uses a navy and green design system.

Recent UI work includes:
- Improved homepage layout.
- Updated login and registration page presentation.
- Consistent authentication-card design.
- Improved form fields, labels, buttons, and helper text.
- Improved success and error messages.
- Responsive spacing and sizing.
- Profile page styling review.
- Desktop, tablet, and mobile layout checks.

Screenshots are maintained in the root `screenshots/` directory.

## 10. Testing and Verification

### Automated backend testing

Tools:
- Vitest 5.1.1.
- Supertest 7.3.2.

Configuration:
- `server/vitest.config.js`.
- `server/tests/setup.js`.
- Test file: `server/tests/app.test.js`.

The backend test setup:
- Loads `server/.env.test`.
- Requires `NODE_ENV=test`.
- Enforces the `tutorhub_test` database name.
- Prevents automated tests from accidentally running against the development database.

The test database is separate from `tutorhub`.

**Latest backend test result: 65/65 passing.**

Coverage includes:
- Health and database connection checks.
- Registration.
- Authentication and sessions.
- Profile management.
- Account management.
- Booking creation and retrieval.
- Booking status transitions.
- Booking conflict handling.
- Email-change requests and verification.
- Invalid input and authorization cases.
- Database constraint behavior.

Run from the `server` directory:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

The email service is mocked during automated tests, so tests do not send real emails.

### Automated frontend testing

Tools:
- Vitest 5.1.1.
- React Testing Library 16.3.3.
- jest-dom 8.0.0.
- user-event 14.6.13.
- jsdom 31.0.1.

Configuration:
- `client/vite.config.js`.
- `client/src/test/setup.js`.

The frontend tests use mocked authentication and tutor services where appropriate. They do not make real backend requests or modify the development database.

**Latest frontend test result: 57/57 passing.**

Test files include:

| Test file | Main coverage |
|---|---|
| `client/src/App.test.jsx` | Home page rendering and navigation |
| `client/src/components/ProtectedRoute.test.jsx` | Loading, unauthenticated redirects, and role access |
| `client/src/pages/Login.test.jsx` | Login, redirects, errors, and loading |
| `client/src/pages/Register.test.jsx` | Conditional fields, payloads, validation, and errors |
| `client/src/pages/StudentDashboard.test.jsx` | Student dashboard behavior |
| `client/src/pages/TutorDashboard.test.jsx` | Tutor dashboard behavior |

Run from the project root:

```bash
npm test --prefix client
```

Watch mode:

```bash
npm run test:watch --prefix client
```

### Combined automated test results

| Test suite | Passing tests |
|---|---:|
| Backend | 65 |
| Frontend | 57 |
| **Combined total** | **122** |

<badge color="success">122 automated tests passing</badge>

These are the latest recorded successful test runs, not a claim that every possible application workflow has been tested.

### Frontend lint

Command:

```bash
npm run lint --prefix client
```

Latest recorded result: completed without errors or warnings.

### Frontend production build

Command:

```bash
npm run build --prefix client
```

Latest recorded production build:

```text
vite v8.3.5 building client environment for production...
✓ 41 modules transformed.

dist/index.html                  0.45 kB
dist/assets/index-*.css         27.88 kB
dist/assets/index-*.js         302.55 kB

✓ built in 83ms
```

Result: production build successful.

The output filenames and exact build sizes may change as the project evolves.

### Frontend dependency security audit

The frontend dependency audit initially reported moderate vulnerabilities involving `minimatch`.

Dependencies were updated within compatible version ranges using:

```bash
npm audit fix --prefix client
```

Relevant resolved versions:
- ESLint: 10.15.0.
- `@eslint/config-array`: 0.23.6.
- `minimatch`: 11.0.9.

The following checks passed:

```bash
npm ls eslint @eslint/config-array minimatch --prefix client
npm audit --prefix client
```

Latest recorded frontend dependency audit result: **0 vulnerabilities**.

The npm install-script review also reported no packages with unreviewed install scripts.

This audit result applies to the frontend dependency tree at the time it was checked; it is not a guarantee of zero vulnerabilities in every future dependency version or in the entire deployed system.

### Manual verification

The following have been manually tested in the development environment:

**Authentication and registration**
- Student registration.
- Tutor registration.
- Both-role registration.
- Student, tutor, and dual-role login.
- Session persistence after refresh.
- Logout.
- Protected-route redirection.
- Role-specific navigation.

**Tutor discovery**
- Tutor listing.
- Search.
- Subject filtering.
- Sorting.
- Combined search and filters.
- Responsive layout.

**Dashboards and bookings**
- Student and tutor dashboard views.
- Booking status filters.
- Tutor accept/reject actions.
- Status persistence after refresh.

**Profiles**
- Shared account profile editing.
- Student profile editing.
- Tutor profile editing.
- Tutor subject selection.
- Adding and removing subjects.
- Dual-role profile editing.
- Persistence after refresh.

**Email verification**
- Email-change request.
- Verification flow.
- Updated email displayed in profile.

**Backend and database**
- Health endpoint returns HTTP 200.
- PostgreSQL connection succeeds.
- Registration and role-specific profile creation.
- Booking API validation.
- Overlapping booking rejection.
- Profile update validation.
- Tutor subject assignment updates.
- Transaction rollback after an intentional database failure.

### Further end-to-end verification required

- Complete booking creation through the React interface.
- Full student-to-tutor booking lifecycle.
- Cancellation and completion through all relevant UI paths.
- Additional authorization boundary testing.
- Broader frontend integration testing.

## 11. Current Project Status

### Implemented milestones

- [x] Initial project setup.
- [x] React frontend with Vite.
- [x] Express backend.
- [x] PostgreSQL connection and core schema.
- [x] Multi-role user model.
- [x] Student, tutor, and dual-role registration.
- [x] bcrypt password hashing.
- [x] JWT authentication with HttpOnly cookies.
- [x] Session restoration and logout.
- [x] Protected routes and role-based navigation.
- [x] Tutor discovery and individual tutor profiles.
- [x] Tutor search, filtering, and sorting.
- [x] Booking API with validation.
- [x] Database-level booking overlap prevention.
- [x] Student and tutor dashboards.
- [x] Booking status filters.
- [x] Tutor accept/reject workflow.
- [x] Booking status transition validation.
- [x] Student cancellation and tutor cancellation/completion API transitions.
- [x] Profile management.
- [x] Tutor subject management.
- [x] Email-change verification.
- [x] Transactional registration and tutor profile updates.
- [x] Profile input validation.
- [x] Database validation migrations.
- [x] Automated backend tests (65 passing).
- [x] Automated frontend tests (57 passing).
- [x] Frontend lint.
- [x] Frontend production build.
- [x] Frontend dependency audit (0 vulnerabilities in latest recorded audit).
- [x] Authentication context refactor.
- [x] Dashboard automated tests.
- [x] README documentation update prepared.

### Remaining work

- [ ] Complete frontend booking creation end-to-end testing.
- [ ] Test the complete booking lifecycle through the UI.
- [ ] Expand frontend component and integration test coverage.
- [ ] Review remaining validation and error handling.
- [ ] Review authentication, authorization, CORS, and cookie security.
- [ ] Review production environment configuration.
- [ ] Configure production email delivery using a verified domain.
- [ ] Deploy frontend, backend, and database.
- [ ] Test the deployed application.
- [ ] Keep GitHub documentation and screenshots current.
- [ ] Publish truthful LinkedIn and X updates at meaningful milestones.

## 12. Next Development Roadmap

### Phase 1 — Documentation and Git organization

- [x] Implement backend automated testing.
- [x] Implement frontend automated testing.
- [x] Review the authentication-context refactor.
- [x] Add dashboard automated tests.
- [x] Implement database validation migrations.
- [x] Update the canonical database schema.
- [x] Commit booking, profile validation, migrations, and test improvements in `9608507`.
- [x] Review README content and prepare its update.
- [ ] Review final README diff.
- [ ] Save and verify the updated progress document.
- [ ] Run Git whitespace and status checks.
- [ ] Stage only the intended documentation files after explicit approval.
- [ ] Commit documentation changes after explicit approval.
- [ ] Push local commits to GitHub after explicit approval.

### Phase 2 — Complete marketplace workflow

- [ ] Test tutor discovery through tutor detail.
- [ ] Test booking creation through the frontend.
- [ ] Test student booking views.
- [ ] Test tutor confirmation and rejection through the complete UI.
- [ ] Test student cancellation.
- [ ] Test tutor cancellation and completion.
- [ ] Test invalid inputs and unavailable slots through the frontend.
- [ ] Test authorization boundaries across marketplace workflows.
- [ ] Verify behavior after refresh and re-login.

### Phase 3 — Quality and security

- [x] Add automated backend tests.
- [x] Add automated frontend tests.
- [x] Run frontend lint successfully.
- [x] Run frontend production build successfully.
- [x] Resolve reported frontend dependency vulnerabilities.
- [x] Confirm latest frontend dependency audit reports zero vulnerabilities.
- [x] Test email verification edge cases.
- [x] Add database validation constraints.
- [ ] Expand automated frontend integration tests.
- [ ] Review validation and error handling.
- [ ] Review authentication and authorization.
- [ ] Review CORS, cookies, and CSRF protections.
- [ ] Review environment configuration.
- [ ] Review rate limiting and abuse prevention.
- [ ] Review remaining production-readiness considerations.

### Phase 4 — Portfolio readiness

- [ ] Finalize README and project documentation.
- [ ] Keep screenshots current.
- [ ] Document important API behavior.
- [ ] Verify production environment variables.
- [ ] Configure production email sending.
- [ ] Deploy frontend, backend, and database.
- [ ] Test the deployed application.
- [ ] Add a live demo link when deployment is complete.
- [ ] Publish truthful LinkedIn and X updates.

## 13. Development Preferences and Handoff Instructions

When continuing TutorHub development:

- Work step by step.
- Give exact file paths and terminal commands.
- Explain code and architectural decisions.
- Inspect existing code before replacing it.
- Avoid unnecessary rewrites.
- Preserve uncommitted changes.
- Check Git status before staging or committing.
- Explain VS Code, Git, and GitHub workflows.
- Avoid repeating beginner material unnecessarily.
- Draft truthful LinkedIn and X posts at meaningful completed milestones.
- Never claim incomplete or untested features are complete.
- Keep secrets out of source control and documentation.
- Use `tutorhub_test` for automated backend tests, never the development database.
- Preserve the database-level booking exclusion constraint.
- Do not stage, commit, or push without explicit approval.

## 14. Current Handoff

### Latest completed development milestone

Commit:

`9608507 Improve booking workflows, profile validation, and tests`

Latest recorded automated testing:

- Backend: 65/65 passing.
- Frontend: 57/57 passing.
- Combined: 122/122 passing.

Latest recorded frontend checks:
- Lint successful.
- Production build successful.
- Frontend dependency audit: zero vulnerabilities.

Database:
- Two validation migrations applied to development and test databases.
- Canonical schema updated.
- Test database remains separate from development database.

### Current documentation work

- README has been updated locally.
- This progress document is being updated.
- Documentation changes have not yet been committed.
- The previous development commit remains local and has not been pushed.

### Immediate next steps

1. Save this updated `PROJECT_PROGRESS.md`.
2. Run `git diff --check`.
3. Run `git status --short`.
4. Review the README and progress-document diffs.
5. Verify no environment files or secrets are included.
6. After review, request explicit approval before staging or committing documentation.
7. Push to GitHub only after explicit approval.

**Preserve the existing project state. Do not use destructive Git commands or overwrite unrelated work.**