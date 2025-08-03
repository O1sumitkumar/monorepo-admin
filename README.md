# APP-ADMIN System - Enterprise Grade

A full-stack application management system for handling user permissions across multiple applications (APP-X, APP-Y, APP-Z, etc.) with enterprise-grade architecture.

## 🏗️ Architecture

### Backend Structure (Enterprise Grade)

```
server/
├── config/
│   └── database.js          # Database configuration and initialization
├── controllers/
│   ├── applicationController.js
│   ├── authController.js
│   ├── userController.js
│   ├── accountController.js
│   ├── rightsController.js
│   └── appXController.js
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   ├── validation.js       # Input validation middleware
│   └── errorHandler.js     # Error handling middleware
├── models/
│   ├── Application.js      # Application model with methods
│   ├── User.js            # User model with password hashing
│   ├── Account.js         # Account model with sharing methods
│   ├── Rights.js          # Rights model with permission methods
│   ├── AccountSharing.js  # Account sharing model
│   └── index.js           # Model exports
├── routes/
│   └── v1/
│       ├── applications.js # Application routes
│       ├── auth.js        # Authentication routes
│       ├── users.js       # User management routes
│       ├── accounts.js    # Account management routes
│       ├── rights.js      # Rights management routes
│       ├── app-x.js       # Multi-app integration routes
│       └── index.js       # Route organization
├── services/
│   ├── applicationService.js
│   ├── authService.js
│   ├── userService.js
│   ├── accountService.js
│   ├── rightsService.js
│   └── appXService.js
├── utils/
│   └── helpers.js         # Utility functions
└── index.js               # Main server file
```

### Frontend Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Applications.tsx
│   │   ├── Rights.tsx
│   │   ├── Users.tsx
│   │   ├── Accounts.tsx
│   │   ├── DataTable.tsx
│   │   └── ProtectedRoute.tsx
│   ├── services/
│   │   └── api.ts         # API service layer
│   ├── store/
│   │   ├── index.ts       # Redux store configuration
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── applicationsSlice.ts
│   │       ├── rightsSlice.ts
│   │       ├── accountsSlice.ts
│   │       └── usersSlice.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
```

## 🚀 Features

### Core Features

- **User Management**: Create, update, delete users with role-based access
- **Application Management**: Manage multiple applications (APP-X, APP-Y, APP-Z)
- **Rights Management**: Assign and manage user permissions across applications
- **Account Management**: Handle user accounts with sharing capabilities
- **Multi-Application Integration**: External applications can validate user rights

### Enterprise Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin and user roles with different permissions
- **Input Validation**: Comprehensive validation using express-validator
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Rate Limiting**: API rate limiting to prevent abuse
- **Security**: Helmet.js for security headers
- **Logging**: Request logging and error tracking
- **Database**: MongoDB with Mongoose ODM
- **API Versioning**: Versioned API endpoints (/api/v1/)

## 🛠️ Technology Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **helmet** for security headers
- **express-rate-limit** for rate limiting

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling
- **Redux Toolkit** for state management
- **React Router** for routing
- **Axios** for API communication
- **Lucide React** for icons
- **React Hot Toast** for notifications

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd app-admin-system
   ```

2. **Install dependencies**

   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/app-admin
   JWT_SECRET=your-secret-key-here
   ```

4. **Start MongoDB**

   ```bash
   # Local MongoDB
   mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

## 🔧 API Endpoints

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/verify` - Verify JWT token
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/change-password` - Change password

### Applications

- `GET /api/v1/applications` - Get all applications
- `POST /api/v1/applications` - Create application
- `PUT /api/v1/applications/:id` - Update application
- `DELETE /api/v1/applications/:id` - Delete application
- `PATCH /api/v1/applications/:id/toggle-status` - Toggle status

### Rights

- `GET /api/v1/rights` - Get all rights
- `POST /api/v1/rights` - Create rights
- `PUT /api/v1/rights/:id` - Update rights
- `DELETE /api/v1/rights/:id` - Delete rights
- `POST /api/v1/rights/verify` - Verify user rights

### Users

- `GET /api/v1/users` - Get all users
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Accounts

- `GET /api/v1/accounts` - Get all accounts
- `POST /api/v1/accounts` - Create account
- `PUT /api/v1/accounts/:id` - Update account
- `DELETE /api/v1/accounts/:id` - Delete account
- `POST /api/v1/accounts/:id/share` - Share account

### Multi-Application Integration (APP-X)

- `POST /api/v1/app-x/check-user` - Check if user exists
- `POST /api/v1/app-x/validate-rights` - Validate user rights
- `GET /api/v1/app-x/user/:userId/application/:applicationId/permissions` - Get user permissions
- `POST /api/v1/app-x/bulk-validate` - Bulk rights validation
- `POST /api/v1/app-x/register-application` - Register external application

## 🔐 Authentication

The system uses JWT (JSON Web Tokens) for authentication:

1. **Login**: User provides username/password
2. **Token Generation**: Server generates JWT with user information
3. **Token Storage**: Client stores token in localStorage
4. **API Requests**: Client includes token in Authorization header
5. **Token Verification**: Server verifies token on protected routes

### Default Admin Account

- **Username**: admin
- **Password**: admin123

## 🏢 Multi-Application Integration

External applications (APP-X, APP-Y, APP-Z) can integrate with the system:

1. **Register Application**: External apps register themselves
2. **Check User**: Verify if user exists in the system
3. **Validate Rights**: Check user permissions for specific operations
4. **Bulk Validation**: Validate multiple rights in one request

### Example Integration

```javascript
// External application checking user rights
const response = await fetch("/api/v1/app-x/validate-rights", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "user-123",
    applicationId: "app-x",
    requiredPermissions: ["read", "write"],
  }),
});
```

## 🎨 UI Features

- **Microsoft Fluent Design**: Modern, clean interface
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Dynamic data loading
- **Toast Notifications**: User feedback for actions
- **Loading States**: Visual feedback during operations
- **Search & Filter**: Advanced data filtering
- **Pagination**: Large dataset handling

## 🔧 Development

### Backend Development

```bash
# Start server only
npm run server

# Start with nodemon (auto-restart)
nodemon server/index.js
```

### Frontend Development

```bash
# Start client only
cd client && npm run dev
```

### Database

```bash
# Connect to MongoDB
mongosh

# Use database
use app-admin

# View collections
show collections
```

## 🧪 Testing

### API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📊 Database Schema

### Collections

- **users**: User accounts and authentication
- **applications**: Application definitions
- **accounts**: User account information
- **rights**: User permissions and access rights
- **accountsharing**: Account sharing relationships

## 🚀 Deployment

### Production Setup

1. Set `NODE_ENV=production`
2. Configure MongoDB Atlas or production MongoDB
3. Set secure JWT_SECRET
4. Build frontend: `npm run build`
5. Use PM2 or similar for process management

### Environment Variables

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/app-admin
JWT_SECRET=your-super-secure-secret-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**APP-ADMIN System** - Enterprise-grade application management with multi-application integration capabilities.
