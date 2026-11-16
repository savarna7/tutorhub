# TutorHub — Full-Stack Tutoring Marketplace

TutorHub is a full-stack tutoring marketplace that connects students with tutors. Users can register as students, tutors, or both, discover tutors, manage their profiles, and manage tutoring session bookings.

The project is built with **React, Node.js, Express.js, and PostgreSQL**, with a focus on authentication, role-based access, REST APIs, relational database design, and responsive user interfaces.

---

## Features

### Authentication and User Management
- Student, tutor, and dual-role registration.
- Secure password hashing using bcrypt.
- JWT-based authentication with HttpOnly cookies.
- Session persistence and logout.
- Protected routes and role-based navigation.

### Tutor Discovery
- Browse available tutors.
- View individual tutor profiles.
- Search tutors by name, qualification, bio, and subject.
- Filter tutors by subject.
- Sort by hourly rate and teaching experience.

### Student and Tutor Dashboards
- Separate dashboards for students and tutors.
- View booking information and status counts.
- Filter bookings by status.
- Tutors can manage incoming pending booking requests.

### Profile Management
- Update account information.
- Manage student profile details.
- Manage tutor qualifications, experience, hourly rate, and bio.
- Request email changes with email verification.

### Booking System
- Booking creation API with input validation.
- Student and tutor booking retrieval.
- Booking status management.
- Server-side ownership and authorization checks.
- Database-level prevention of overlapping tutor bookings.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, React Router, Vite |
| Styling | CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT, bcrypt, HttpOnly Cookies |
| Database Driver | node-postgres (`pg`) |
| Email Service | Resend |
| Development Tools | VS Code, Git, GitHub |

---

## Project Structure

```text
tutorhub/
│
├── client/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── ProtectedRoute.jsx
│       │
│       ├── context/
│       │   └── AuthContext.jsx
│       │
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Tutors.jsx
│       │   ├── TutorProfile.jsx
│       │   ├── StudentDashboard.jsx
│       │   ├── TutorDashboard.jsx
│       │   ├── Profile.jsx
│       │   └── VerifyEmailChange.jsx
│       │
│       ├── services/
│       │   ├── authService.js
│       │   ├── bookingService.js
│       │   ├── profileService.js
│       │   └── tutorService.js
│       │
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   └── pool.js
│   │   │
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── profileRoutes.js
│   │   │   └── tutorRoutes.js
│   │   │
│   │   ├── services/
│   │   │   └── emailService.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env.example
│   └── package.json
│
├── PROJECT_PROGRESS.md
├── README.md
└── .gitignore
```

---

## Database Design

TutorHub uses PostgreSQL with a relational database structure.

The main tables include:

| Table | Purpose |
|---|---|
| `users` | Stores common account information |
| `students` | Stores student-specific information |
| `tutors` | Stores tutor-specific information |
| `subjects` | Stores available subjects |
| `tutor_subjects` | Maps tutors to their subjects |
| `bookings` | Stores tutoring session bookings |
| `email_change_requests` | Manages email-change verification |

### Multiple-Role Architecture

A single account can have:
- Student role
- Tutor role
- Both student and tutor roles

Shared account information is stored in the `users` table, while role-specific information is maintained in the corresponding profile tables.

### Booking Conflict Prevention

The database uses PostgreSQL constraints, including an exclusion constraint, to prevent overlapping pending or confirmed bookings for the same tutor.

---

## Getting Started

Follow these instructions to run TutorHub locally.

### Prerequisites

Install the following:

- Node.js (the project was developed with Node.js 24)
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/savarna7/tutorhub.git

cd tutorhub
```

### 2. Set Up the Backend

```bash
cd server

npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your local configuration:

```env
PORT=5001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tutorhub
DB_USER=your_postgres_username

JWT_SECRET=your_long_random_secret

RESEND_API_KEY=your_resend_api_key

CLIENT_URL=http://localhost:5173
```

### 3. Set Up PostgreSQL

Create a PostgreSQL database named:

```sql
CREATE DATABASE tutorhub;
```

Initialize the required tables, relationships, constraints, and PostgreSQL extensions before starting the backend.

**Note:** A database schema or migration script is not currently included in the repository. A reproducible database setup script is a planned improvement.

### 4. Start the Backend

From the `server` directory:

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:5001
```

API base URL:

```text
http://localhost:5001/api
```

### 5. Set Up the Frontend

Open another terminal:

```bash
cd client

npm install
```

Start the React development server:

```bash
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

---

## API Overview

The backend exposes REST API endpoints for the following operations.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve the current session |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/tutors` | Retrieve tutors |
| GET | `/api/tutors/:tutorId` | Retrieve tutor details |
| GET | `/api/bookings/student/:studentId` | Retrieve student bookings |
| GET | `/api/bookings/tutor/:tutorId` | Retrieve tutor bookings |
| POST | `/api/bookings` | Create a booking |
| PATCH | `/api/bookings/:bookingId/status` | Update booking status |
| GET | `/api/profiles/me` | Retrieve the current profile |
| PUT | `/api/profiles/account` | Update account information |
| PUT | `/api/profiles/student` | Update student information |
| PUT | `/api/profiles/tutor` | Update tutor information |
| POST | `/api/profiles/request-email-change` | Request an email change |
| POST | `/api/profiles/verify-email-change` | Verify and complete an email change |

Most profile and booking operations require authentication.

---

## Environment Variables

Never commit your actual `.env` file, database credentials, JWT secrets, or API keys.

The repository includes `server/.env.example` as a configuration template.

Email verification uses Resend. Production email sending requires a verified sending domain and appropriate sender configuration.

---

## Testing and Project Status

The following have been implemented and manually verified in the development environment:

- Multi-role registration and login.
- Authentication session persistence and logout.
- Role-based dashboard access.
- Tutor discovery, search, filtering, and sorting.
- Profile management.
- Email-change verification.
- Dashboard booking views and tutor booking actions.
- Backend health and PostgreSQL connection checks.
- Backend booking API validation and overlap prevention.
- Frontend production build.

### Work in Progress

- Complete end-to-end booking creation through the React interface.
- Review the complete cancellation and completion workflow.
- Automated frontend and backend tests.
- Production email configuration.
- Deployment.

The project is actively being developed. Implemented features are not necessarily fully verified across every end-to-end workflow.

---

## Future Improvements

- Add automated testing.
- Add database migrations and schema initialization scripts.
- Complete and refine booking workflows.
- Improve validation and error handling.
- Configure production email delivery.
- Deploy the application.
- Add application screenshots and a live demo.

---

## Author

**Savarna Mallick**

B.Tech Computer Science and Engineering Student

GitHub: [@savarna7](https://github.com/savarna7)

---

## Repository

[https://github.com/savarna7/tutorhub](https://github.com/savarna7/tutorhub)