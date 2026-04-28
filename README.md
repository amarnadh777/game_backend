# Kanoo Daily Rental

A full-stack application for managing daily rentals, featuring a Node.js backend and a React admin panel.

## Project Structure

- **Backend/**: Node.js/Express server with MongoDB
- **Frontend/**: React application built with Vite and Tailwind CSS

## Features

- User authentication and email verification
- Admin dashboard with analytics
- Banner management
- Game session management
- File uploads
- Export functionality

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- Nodemailer for emails
- Multer for file uploads

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router
- Recharts for data visualization
- Axios for API calls

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd kanoo_daily_rental
   ```

2. Install backend dependencies:
   ```bash
   cd Backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../Frontend
   npm install
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in the Backend directory
   - Configure your MongoDB connection, JWT secret, email settings, etc.

5. Start the backend server:
   ```bash
   cd Backend
   npm run dev
   ```

6. Start the frontend development server:
   ```bash
   cd Frontend
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173 (default Vite port)
- Backend: http://localhost:3000 (configure in backend)

## Scripts

### Backend
- `npm run dev`: Start development server with nodemon
- `npm start`: Start production server

### Frontend
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## API Documentation

The backend provides RESTful APIs for:
- Authentication (register, login, verify OTP)
- User management
- Banner management
- Game sessions
- File uploads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

ISC