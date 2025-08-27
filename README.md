# BarangayLink

A barangay-level donation and lending platform built with React, Node.js, and PostgreSQL.

## Features

- **Resident Registration**: Upload ID for verification
- **Admin Verification**: Approve/reject resident IDs
- **Item Management**: Post donations and lending items
- **Request System**: Request items with admin approval
- **Transaction Tracking**: Monitor handovers and returns
- **Role-based Access**: Resident and Admin roles

## Tech Stack

- **Frontend**: React (web)
- **Backend**: Node.js with Express
- **Database**: PostgreSQL (SQLite for MVP)
- **Authentication**: JWT with role-based access
- **File Storage**: Local folder (upgradeable)

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (or SQLite for MVP)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd BarangayLink
   npm run install-all
   ```

2. **Setup database:**
   - Create PostgreSQL database named `barangaylink`
   - Or use SQLite (will be created automatically)

3. **Environment setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run the application:**
   ```bash
   npm run dev
   ```

   This will start both backend (port 5000) and frontend (port 3000)

## Project Structure

```
BarangayLink/
├── backend/          # Node.js + Express server
├── frontend/         # React application
├── database/         # Database schemas and migrations
└── docs/            # Documentation
```

## Development Phases

- **Week 1**: Setup backend + frontend boilerplate, connect database ✅
- **Week 2**: Authentication (Resident + Admin login/register) ✅
- **Week 3**: Admin verification of residents ✅
- **Week 4**: Item posting with admin approval ✅
- **Week 5**: Item request + admin approval/denial ⏳ (Currently implementing)
- **Week 6**: Handover + returns (transactions)
- **Week 7**: History + reports
- **Week 8**: Strikes, disputes, policies, final polish

## Recent Updates (Week 5 Preparation)

### Database Schema Reset & Updates
- **Fresh Database**: Complete database reset with new optimized schema
- **New User Fields**: 
  - `username` (unique, required)
  - `full_name` (required)
  - `contact_number`
  - `barangay`, `municipality`, `province` (required)
  - `valid_id`, `selfie_with_id` (file paths)
  - `is_verified` (boolean, default false)
- **Automatic Admin Seeding**: Default admin user created automatically
  - Username: `Admin`
  - Password: `Admin8265`
  - Email: `admin@barangaylink.com`

### Unified Login System
- **Single Login Form**: One form accepts either username or email
- **Smart Authentication**: Backend automatically detects user type (admin/resident)
- **Role-based Routing**: Automatic redirection to appropriate dashboard
- **Improved Error Messages**: Clear, specific validation feedback

### Environment Configuration
- Added missing environment variables for admin seeding
- Fixed frontend URL configuration
- Added database reset functionality

### API Endpoints
- Updated all routes to work with new schema
- Fixed API endpoint inconsistencies
- Improved error handling and validation

## Database Management Commands

To reset the database to a fresh state:
```bash
cd backend
npm run db:reset
# or
node scripts/resetDatabase.js
```

To ensure admin account exists:
```bash
cd backend
npm run ensure:admin
```

To test admin login functionality:
```bash
cd backend
npm run test:admin
```

## API Endpoints

Backend will be available at `http://localhost:5000`
Frontend will be available at `http://localhost:3000`

## Contributing

This is a community project. Please follow the established coding standards and commit guidelines.

