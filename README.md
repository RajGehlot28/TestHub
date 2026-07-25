# TestHub - AI-Powered Assessment SaaS Platform

TestHub is a modern, full-stack **MERN** (MongoDB, Express, React, Node.js) web application designed for academic institutions, educators, and students. It enables teachers to instantly generate high-quality multiple-choice question (MCQ) assessments from course PDFs using AI, schedule exam windows, enforce institute-level access control, and track student performance with real-time analytics.

---

## Features & Highlights

### Teacher Workspace
- **PDF-to-MCQ AI Generation**: Upload course syllabus or lecture notes in PDF format. OpenAI ChatGPT automatically parses the content to construct balanced MCQs with customizable options and answer keys.
- **Flexible Test Scheduling**: Configure test title, number of questions, duration (10–60 mins), marks per question, and start/end time windows.
- **Shareable Exam Links & QR Codes**: Instantly generate unique test access codes, shareable URLs, and scannable QR codes for classroom deployment.
- **Comprehensive Analytics & CSV Export**: Monitor student completion rates, view average percentage scores via trend charts, inspect question-by-question answer breakdowns, and export full score rosters to CSV.

### Student Portal
- **Timed Exam Runner**: Interactive test interface featuring a real-time countdown timer, question navigation palette (color-coded for answered/unanswered states), and confirmation modals.
- **Instant Auto-Grading & Review**: Immediate result calculation upon test submission with detailed answer breakdown (correct answer vs. student choice).
- **Personal Score Trajectory**: Visualized personal growth trend line tracking percentage performance over time.

### Platform Master Admin
- **Multi-Tenant Institute Control**: Manage academic institutions, track total registered teachers and students per institute.
- **Credential Issuance**: Provision teacher accounts and assign them to specific institutes or independent roles.

### Institute-Aware Security & Access Control
- **Role-Based Protection**: JWT-authenticated routing ensuring secure separation between Student, Teacher, and Admin portals.
- **Institute Access Lock**: Assessments created by institute-affiliated teachers are strictly restricted to students belonging to that specific institution.

---

## Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React (JSX), Vite, Tailwind CSS, Lucide Icons, Recharts, QRCode.react, React Router DOM |
| **Backend** | Node.js, Express.js, Mongoose, JWT (JSON Web Tokens), bcryptjs, Multer, `pdf-parse` |
| **Database** | MongoDB Atlas (Cloud) / Local MongoDB with automatic in-memory fallback |
| **AI Integration** | OpenAI API (ChatGPT) for intelligent PDF parsing & question generation |

---

## Repository Directory Structure

```text
TestHub/
├── backend/
│   ├── config/             # Database connection setup (MongoDB)
│   ├── middleware/         # Auth verification & institute access control
│   ├── models/             # Mongoose schemas (Institute, Teacher, Student, Test, TestResult)
│   ├── routes/             # Express API endpoints (auth, admin, teacher, student, test, ai)
│   ├── services/           # OpenAI ChatGPT prompt & PDF parsing logic
│   ├── .env                # Backend environment configuration
│   ├── server.js           # Main Express server entry point
│   └── package.json        # Backend dependencies & scripts
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components (Navbar, Timer, AccessDeniedModal, etc.)
│   │   ├── context/        # React AuthContext state management
│   │   ├── pages/          # Dashboards, Login/Register pages, Exam Wizard, Runner
│   │   ├── services/       # Axios API client setup
│   │   ├── App.jsx         # App router & layout container
│   │   ├── index.css       # Tailwind CSS styles
│   │   └── main.jsx        # React entry point
│   ├── index.html          # Main HTML document
│   ├── vite.config.js      # Vite build configuration
│   └── package.json        # Frontend dependencies & build scripts
│
├── createTeacher.js        # Interactive CLI tool for teacher account creation
├── resetDb.js              # Database reset helper script
├── package.json            # Root configuration & unified execution scripts
└── README.md               # Project documentation
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) (Local installation or a free MongoDB Atlas cluster)

### 1. Installation

Clone the repository and install dependencies for both backend and frontend:

```bash
# Clone the repository
git clone <repository-url>
cd TestHub

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
```

---

## Running the Application

You can start the backend and frontend dev servers concurrently:

### Option A: Running from Root Directory

```bash
# Start Backend Server (Port 5000)
npm run backend

# Start Frontend Dev Server (Port 3000) in a separate terminal
npm run frontend
```

### Option B: Running Directories Individually

**Backend**:
```bash
cd backend
npm start
```

**Frontend**:
```bash
cd frontend
npm run dev
```

Open your browser and navigate to: **`http://localhost:3000`**

---

## CLI Utilities

### Interactive Teacher Account Creation
Run the interactive CLI tool from the project root to provision a teacher account directly:

```bash
node createTeacher.js
```

Follow the on-screen prompts to input Full Name, Email, Password, and optional Institute assignment.

---

## Default Demonstration Credentials

For evaluation and testing:

| Role | Email | Password | Portal URL |
| :--- | :--- | :--- | :--- |
| **Master Admin** | `admin@testhub.com` | `admin123` | `/login-admin` |
| **Sample Teacher** | `raj@mail.com` | `raj@123` | `/login-teacher` |

---

## License

This project is open source and available under the [MIT License](LICENSE).
