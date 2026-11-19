# TutorHub — Project Progress & Handoff

**Last updated: 19 November 2026**

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
- **Testing:** Vitest, Supertest, React Testing Library, jest-dom, user-event
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

### Recent known commits

| Commit | Description |
|---|---|
| `8a89731` | Build initial TutorHub React landing page |
| `d2fc0d3` | Implement role-specific registration |
| `bcd68e8` | Add tutor profile and subject management |
| `7be9786` | Update TutorHub project documentation |
| `72e44a4` | Add automated backend tests |

Other earlier commits covered the Express backend, PostgreSQL connection, booking APIs, authentication, frontend integration, and project documentation.

GitHub repository: `https://github.com/savarna7/tutorhub`

### Current working-tree status

The latest confirmed published commit is `72e44a4`, which added the automated backend test suite.

The following frontend changes are currently uncommitted:

- Modified `client/package.json`.
- Modified `client/package-lock.json`.
- Modified `client/vite.config.js`.
- Modified frontend component and page imports following the AuthContext refactor.
- Deleted the old `client/src/context/AuthContext.jsx`.
- Added `client/src/context/AuthContext.js`.
- Added `client/src/context/AuthProvider.jsx`.
- Added `client/src/context/useAuth.js`.
- Added `client/src/App.test.jsx`.
- Added `client/src/components/ProtectedRoute.test.jsx`.
- Added `client/src/pages/Login.test.jsx`.
- Added `client/src/pages/Register.test.jsx`.
- Added `client/src/test/setup.js`.
- Updated `PROJECT_PROGRESS.md` to document frontend testing and the dependency security fix.

The frontend testing infrastructure and tests have been implemented and verified locally.

**No staging, committing, or pushing has been performed for these frontend changes.**

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
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.test.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── main.jsx
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
│   │   │   ├── TutorDashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── VerifyEmailChange.jsx
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── bookingService.js
│   │   │   ├── profileService.js
│   │   │   └── tutorService.js
│   │   └── test/
│   │       └── setup.js
│   ├── vite.config.js
│   └── package.json
└── server/
    ├── db/
    │   └── schema.sql
    ├── tests/
    │   ├── app.test.js
    │   └── setup.js
    ├── vitest.config.js
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

Development database name: `tutorhub`

Automated tests use a separate database named `tutorhub_test`.

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

### Schema export

A schema-only PostgreSQL export is stored at:

`server/db/schema.sql`

It contains database structure and constraints, not development database records.

The schema is used to initialize the separate automated-test database.

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

The frontend consumes tutor data through its tutor service.

Available subjects are retrieved through:

`GET /api/tutors/subjects`

### Profile routes

`server/src/routes/profileRoutes.js` supports:

- Retrieving the authenticated user's profile.
- Updating shared account details.
- Updating student profile details.
- Updating tutor profile details.
- Requesting an email change.
- Verifying an email change.

Additional tutor profile functionality:

- Retrieves the authenticated user's existing subject assignments through `GET /api/profiles/me`.
- Updates tutor details and subject assignments through `PUT /api/profiles/tutor`.
- Validates selected subject IDs.
- Rejects invalid and duplicate subject IDs.
- Replaces previous subject assignments with newly selected subjects.
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

Authentication has been separated into three modules:

- `client/src/context/AuthContext.js` — creates and exports the shared React context.
- `client/src/context/AuthProvider.jsx` — manages user state, loading state, session restoration, login, logout and refresh operations.
- `client/src/context/useAuth.js` — provides the custom `useAuth` hook for accessing the context.

This separation keeps the context provider and custom hook in separate modules and resolves the React Fast Refresh export warning.

The provider:

- Restores sessions through the current-user API.
- Maintains the current user and loading state.
- Exposes `isAuthenticated`, `user`, `loading`, `login`, `logout` and `refreshUser`.
- Clears frontend authentication state after logout.

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

The current booking-form integration and complete booking flow still require end-to-end verification.

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

Profile editing was tested using Tutor-only and Both-role accounts. For the dual-role account, student and tutor details were updated independently and verified to persist after refreshing the page.

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

The latest frontend production build was run after the frontend testing and authentication-context changes.

```text
vite v8.3.5 building client environment for production...
✓ 41 modules transformed.
dist/index.html                   0.45 kB │ gzip: 0.29 kB
dist/assets/index-Oxz8oxHF.css   27.88 kB │ gzip: 5.37 kB
dist/assets/index-Cv33pAEz.js   300.96 kB │ gzip: 90.55 kB
✓ built in 111ms
```

**Result: Production build successful.**

## 10. Testing and Verification

### Verified through frontend manual testing

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
- Conditional Student registration.
- Conditional Tutor registration.
- Conditional Both-role registration.
- Tutor qualification, experience, hourly rate and bio saved during registration.
- Multiple tutor subjects saved during registration.
- Tutor profile editing.
- Adding and removing teaching subjects.
- Updated subject assignments persist after refreshing the Profile page.
- Tutor subject checkbox alignment and styling.
- Student and tutor profile updates independently for a dual-role account.
- Dual-role profile changes persist after refreshing the page.

### Automated frontend testing — 19 November 2026

**Testing tools**

- Vitest 5.1.1.
- React Testing Library 16.3.3.
- jest-dom 8.0.0.
- user-event 14.6.13.
- jsdom 31.0.1.

**Test configuration**

- Configuration: `client/vite.config.js`.
- Setup file: `client/src/test/setup.js`.
- Test environment: jsdom.
- Test files use mocked authentication and tutor services where appropriate.
- Tests do not make real backend requests or modify the development database.

**Test files and coverage**

| Test file | Coverage | Passing tests |
|---|---|---:|
| `client/src/App.test.jsx` | Home page heading and navigation links | 2 |
| `client/src/components/ProtectedRoute.test.jsx` | Loading, unauthenticated redirects, student/tutor/dual-role access | 6 |
| `client/src/pages/Login.test.jsx` | Login rendering, role-based redirects, API errors and loading state | 5 |
| `client/src/pages/Register.test.jsx` | Conditional registration fields, role-specific payloads, validation and API errors | 7 |
| **Total** | | **20** |

**Latest frontend test result: 20/20 passing.**

Run the frontend tests from the project root:

```bash
npm test --prefix client
```

Run frontend tests in watch mode:

```bash
npm run test:watch --prefix client
```

### Frontend lint and production build

The following checks were completed successfully:

```bash
npm run lint --prefix client
npm run build --prefix client
```

Results:

- ESLint completed without errors or warnings.
- Vite production build completed successfully.
- All 20 frontend tests passed.

### Frontend dependency security audit

The frontend dependency audit initially reported moderate vulnerabilities involving `minimatch`.

The dependencies were updated within their compatible version ranges using:

```bash
npm audit fix --prefix client
```

Relevant resolved versions:

- ESLint: 10.15.0.
- `@eslint/config-array`: 0.23.6.
- `minimatch`: 11.0.9.

The following checks were completed successfully:

```bash
npm ls eslint @eslint/config-array minimatch --prefix client
npm audit --prefix client
```

**Latest frontend dependency audit result: 0 vulnerabilities.**

The npm install-script review also reported no packages with unreviewed install scripts.

### Frontend dependency security audit

- Updated frontend dependencies using `npm audit fix`.
- ESLint: 10.15.0.
- @eslint/config-array: 0.23.6.
- minimatch: 11.0.9.
- Reviewed package install scripts; no packages remain with unreviewed install scripts.
- Latest `npm audit --prefix client` result: **0 vulnerabilities**.

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
- Available subjects endpoint returns the subjects catalog.
- Tutor listing returns tutors with their assigned subjects.
- Registration creates the appropriate role-specific profile records.
- Registration saves tutor subject assignments.
- Tutor profile update endpoint validates and saves subject assignments.
- Invalid subject IDs and duplicate subject selections are rejected.
- Invalid tutor profile fields are rejected.
- Tutor profile updates and subject assignments are handled transactionally.
- Database transaction rollback restores the original tutor profile and subject assignments after an intentional database failure.
- `node --check src/routes/authRoutes.js` passed.
- `node --check src/routes/profileRoutes.js` passed.

### Automated backend testing — 19 November 2026

**Test tools**

- Test framework: Vitest 5.1.1.
- HTTP integration testing: Supertest 7.3.2.
- Test file: `server/tests/app.test.js`.
- Test configuration: `server/vitest.config.js`.
- Test setup: `server/tests/setup.js`.
- Test database: `tutorhub_test`, separate from the development database.
- Test environment: `server/.env.test` (ignored by Git).
- Database schema export: `server/db/schema.sql`.

**Latest test result: 53/53 passing.**

Coverage:

| Test area | Passing tests |
|---|---:|
| API health and database connection | 2 |
| Registration | 6 |
| Authentication | 7 |
| Profile management | 7 |
| Account management | 4 |
| Booking API | 16 |
| Email-change API | 11 |
| **Total** | **53** |

Email-change edge cases include:

- Malformed verification tokens.
- Expired tokens.
- Duplicate pending email reservations.
- Failed email delivery.
- Superseded verification links.
- Token reuse.

The email service is mocked during automated tests, so tests do not send real emails.

Run the backend suite from the server directory:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The test setup loads `.env.test` and enforces the `tutorhub_test` database name before tests execute. Automated tests must not run against the development database.

### Combined automated test results

| Test suite | Passing tests |
|---|---:|
| Backend | 53 |
| Frontend | 20 |
| **Combined total** | **73** |

Both suites have passed their latest recorded runs. The frontend lint, production build and dependency audit have also passed.

### Implemented; further end-to-end review recommended

- Complete booking creation through the React UI.
- Tutor detail and booking-form experience.
- Full cancellation and completion workflow.
- Broader frontend component and integration test coverage.
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
- [x] Dual-role profile editing and persistence verification.
- [x] Invalid subject ID and duplicate subject selection validation.
- [x] Invalid tutor profile field validation.
- [x] Database transaction rollback verification.
- [x] Automated backend test suite (53/53 passing).
- [x] Automated frontend test suite (20/20 passing).
- [x] Frontend lint check.
- [x] Frontend production build after testing changes.
- [x] Authentication context refactor.
- [x] Frontend dependency audit (0 vulnerabilities).

### Verification completed — November 2026

- [x] CSS and responsive layout review.
- [x] Frontend production build.
- [x] Git whitespace check.
- [x] Backend dependency verification.
- [x] Backend health endpoint check.
- [x] PostgreSQL connection endpoint check.
- [x] Environment-file tracking check.
- [x] Backend configuration and email-service review.
- [x] Automated backend testing using a separate test database.
- [x] Automated frontend tests.
- [x] Frontend lint.
- [x] Frontend production build after authentication-context refactor.
- [x] Frontend dependency security audit.
- [x] Review of npm install-script status.

These checks do not replace end-to-end testing of every marketplace workflow.

## 12. Next Development Roadmap

### Phase 1 — Preserve and organize current work

- [x] Recheck `git status --short`.
- [x] Inspect current uncommitted changes and diff summary.
- [x] Review and remove the development-only `server/src/testEmail.js` utility.
- [x] Confirm `.env` files are ignored and not tracked.
- [x] Create `server/.env.example` with placeholder configuration.
- [x] Keep this progress document updated.
- [x] Implement automated backend testing.
- [x] Implement automated frontend testing.
- [ ] Review all frontend test and authentication-context changes.
- [ ] Review the final Git diff, including untracked files.
- [ ] Organize completed frontend testing work into meaningful Git commits after explicit approval.

### Phase 2 — Review the complete marketplace flow

- [ ] Test tutor discovery through tutor detail.
- [ ] Test booking creation from the frontend.
- [ ] Test the student booking view.
- [ ] Test tutor accept and reject actions through the complete UI flow.
- [ ] Review cancellation and completion behavior.
- [ ] Test invalid inputs and unavailable slots through the frontend.
- [ ] Test authorization boundaries across marketplace workflows.

### Phase 3 — Quality and security

- [x] Add automated backend tests (53 passing).
- [x] Add initial automated frontend tests (20 passing).
- [x] Run frontend lint successfully.
- [x] Run frontend production build successfully.
- [x] Resolve reported frontend dependency vulnerabilities.
- [x] Confirm frontend dependency audit reports zero vulnerabilities.
- [ ] Expand frontend component and integration test coverage.
- [ ] Review validation and error handling.
- [ ] Review authentication and authorization.
- [ ] Review CORS and cookie settings.
- [ ] Review environment configuration.
- [x] Test email verification edge cases, including token expiry and reuse.
- [ ] Review remaining security and production-readiness considerations.

### Phase 4 — Portfolio readiness

- [ ] Update README with setup instructions and architecture.
- [ ] Add application screenshots.
- [ ] Document API endpoints and database design.
- [ ] Verify production environment variables.
- [ ] Verify a sending domain for production email.
- [ ] Deploy frontend, backend and database.
- [ ] Test the deployed application.
- [ ] Publish truthful LinkedIn and X updates at meaningful milestones.

### Additional quality checks

- [x] Test profile editing using a Both-role account.
- [x] Verify student and tutor profile updates independently for a dual-role account.
- [x] Test invalid subject IDs and duplicate subject selections.
- [x] Test tutor profile updates with invalid numeric values.
- [x] Verify rollback behavior when a tutor profile update fails.
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
- Use `tutorhub_test` for automated backend tests, never the development database.
- Do not stage, commit or push without explicit approval.

## 14. Current Project Status and Handoff

### Completed in the November 2026 review

- Implemented conditional registration for Student, Tutor and Both roles.
- Added role-specific registration fields.
- Added tutor subject selection during registration.
- Verified all three registration scenarios.
- Verified tutor details and subject assignments in PostgreSQL.
- Implemented tutor profile and subject updates.
- Added subject selection controls to the Profile page.
- Verified tutor subject changes persist after refreshing.
- Verified dual-role profile editing for student and tutor sections independently.
- Tested invalid subject IDs and duplicate subject selections.
- Tested invalid tutor profile fields.
- Verified database transaction rollback after an intentional database failure.
- Set up Vitest and Supertest for automated backend testing.
- Created a separate PostgreSQL test database.
- Added a schema-only database export for test setup.
- Added a test-environment safety check to prevent tests from using the development database.
- Added automated backend tests covering health checks, registration, authentication, profiles, account management, bookings and email changes.
- Latest automated backend test result: **53/53 passing**.
- Set up Vitest and React Testing Library for frontend testing.
- Added automated tests for the Home page, protected routes, Login and Registration.
- Latest automated frontend test result: **20/20 passing**.
- Refactored authentication context into separate context, provider and custom-hook modules.
- Confirmed frontend lint passes without errors or warnings.
- Confirmed the latest frontend production build succeeds.
- Updated frontend dependencies to resolve the reported minimatch security advisory.
- Confirmed the frontend dependency audit reports **0 vulnerabilities**.
- Confirmed npm reports no packages with unreviewed install scripts.
- Confirmed `.env.test` is ignored by Git.
- Reviewed the schema export for accidental data or credentials.

### Remaining work

1. Review the frontend testing changes and authentication-context refactor.
2. Inspect all modified and untracked files.
3. Review the final Git diff and whitespace checks.
4. Organize the completed frontend testing work into meaningful Git commits after explicit approval.
5. Complete marketplace workflow and authorization testing through the frontend.
6. Expand automated frontend test coverage.
7. Review remaining security and production-readiness considerations.
8. Prepare the README and deployment.
9. Publish a truthful X/LinkedIn update about the 20 frontend tests and 53 backend tests if not already posted.

### Important Git instructions

- Preserve all existing uncommitted work.
- Do not use destructive Git commands.
- Do not stage or commit without explicit approval.
- Keep actual environment files and credentials out of source control.
- Review the working tree before every commit.

**Next immediate task:** Finish reviewing all modified and untracked frontend files, verify the final diff, and prepare the frontend testing milestone
for a commit only after explicit approval.