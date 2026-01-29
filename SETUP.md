# 🚀 SCKLMS Setup Guide

Quick setup instructions to get SCKLMS running on your local machine.

## Prerequisites

Before you begin, ensure you have installed:
- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** v9.0.0 or higher (comes with Node.js)
- **MongoDB** v5.0 or higher ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))

### Verify Installation
```bash
node --version    # Should be v18.0.0+
npm --version     # Should be v9.0.0+
mongod --version  # Should be v5.0.0+
```

## Step 1: Start MongoDB

### On macOS (using Homebrew)
```bash
brew services start mongodb-community
```

### On Windows
MongoDB should run as a Windows Service. To start it:
```bash
net start MongoDB
```

### On Linux
```bash
sudo systemctl start mongod
```

### Verify MongoDB is Running
```bash
mongo
# If connected, you'll see the MongoDB shell
# Type: exit
```

## Step 2: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure .env file (edit with your editor)
# Default values should work for local development:
# MONGODB_URI=mongodb://localhost:27017/scklms
# JWT_SECRET=your_super_secret_jwt_key_change_in_production
# PORT=5000
# NODE_ENV=development
# FRONTEND_URL=http://localhost:3000

# Start backend server
npm run dev
# You should see: "SCKLMS Backend Server is Running http://localhost:5000"
```

## Step 3: Setup Frontend (in new terminal)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure .env file (edit with your editor)
# Default value for local development:
# VITE_API_URL=http://localhost:5000/api

# Start frontend development server
npm run dev
# You should see: "VITE v5.0.8 ready in 123 ms"
```

## Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Default Login Credentials

```
Email:    admin@scklms.com
Password: Admin@123456
```

## 📝 Creating Your First Admin Account

If you want to create your own admin account:

1. Click "Sign up" on the login page
2. Fill in your details
3. Set role to "Developer" first (security_admin requires database modification)
4. After registration, use MongoDB to update the role:

```javascript
// In MongoDB shell
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "security_admin" } }
)
```

## 🔧 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running:
```bash
# Check status
mongosh

# If not running, start it
# macOS: brew services start mongodb-community
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change the PORT in backend/.env or kill the process:
```bash
# macOS/Linux: Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Windows: Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### CORS Error
```
Error: Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Make sure FRONTEND_URL in backend/.env matches your frontend URL:
```
FRONTEND_URL=http://localhost:3000
```

### Module Not Found Error
**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📦 Production Build

### Build Frontend for Production
```bash
cd frontend
npm run build
# Output in: frontend/dist/
```

### Production Backend Start
```bash
cd backend
npm start
```

## 🔑 Environment Variables Explained

### Backend (.env)
```
MONGODB_URI      - MongoDB connection string
JWT_SECRET       - Secret key for JWT tokens (use strong random string!)
PORT             - Server port (default: 5000)
NODE_ENV         - Environment (development/production)
FRONTEND_URL     - Frontend URL for CORS
ENCRYPTION_KEY   - Key for data encryption (auto-generated if not set)
```

### Frontend (.env)
```
VITE_API_URL     - Backend API base URL
```

## 🧪 Testing the API

### Using curl
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "Test@12345"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Test@12345"
  }'
```

### Using Postman
1. Import the API endpoints into Postman
2. Set `{{baseURL}}` variable to `http://localhost:5000/api`
3. Create auth requests with the endpoints above
4. Use the token from login response in Authorization header

## 📚 Next Steps

1. **Explore the Dashboard**: Check out the beautiful UI and animations
2. **Create Certificates**: Generate and manage X.509 certificates
3. **Generate Keys**: Create RSA and AES keys
4. **Setup MFA**: Enable two-factor authentication for added security
5. **Check Audit Logs**: Review system activity and audit trail
6. **Manage Users**: Create additional accounts and assign roles

## 🆘 Getting Help

### Check Application Logs
```bash
# Backend logs visible in terminal where you ran: npm run dev
# Frontend logs visible in browser DevTools (F12)
```

### Common Issues & Solutions

**Frontend not loading?**
- Check if backend is running: `curl http://localhost:5000/api/health`
- Check browser console for errors (F12)
- Clear browser cache: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)

**Can't login?**
- Verify MongoDB has the data: `mongosh` → `use scklms` → `db.users.find()`
- Check backend logs for error messages
- Try registering a new account instead

**Performance issues?**
- Check MongoDB indexing: `db.users.getIndexes()`
- Monitor system resources (CPU, RAM, disk)
- Consider increasing Node.js heap size: `NODE_OPTIONS="--max-old-space-size=4096"`

---

**Having trouble? Check the README.md or create an issue!**
