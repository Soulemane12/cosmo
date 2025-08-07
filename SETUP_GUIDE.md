# Setup Guide - Fix Registration Issues

## 🚨 **Current Issue: Registration Failed**

The registration is failing because the database schema needs to be updated and the authentication system needs to be properly configured.

## 🔧 **Step-by-Step Fix**

### **Step 1: Update Database Schema**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the updated schema** (copy and paste the entire `database_schema.sql` file)
4. **Wait for it to complete** (this may take a few minutes)

### **Step 2: Configure Supabase Authentication**

1. **In your Supabase Dashboard, go to Authentication → Settings**
2. **Enable Email Auth** if not already enabled
3. **Set "Confirm email" to "No"** for easier testing
4. **Save the settings**

### **Step 3: Update Environment Variables**

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **Step 4: Restart Your Development Server**

```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev
```

## 🧪 **Test the Fix**

### **Test Registration:**
1. Go to your app
2. Click "Sign Up"
3. Choose "Client Account" or "Provider Account"
4. Fill in the form:
   - **Full Name**: Test User
   - **Email**: test@example.com
   - **Password**: password123 (at least 8 characters)
   - **Confirm Password**: password123
   - **Location**: Test City
5. Click "Sign Up"

### **Expected Result:**
- ✅ Registration should succeed
- ✅ You should be redirected to the dashboard
- ✅ You should see a welcome message

## 🔍 **Troubleshooting**

### **If registration still fails:**

1. **Check the browser console** (F12) for error messages
2. **Check the Network tab** to see what API calls are failing
3. **Check your Supabase logs** in the dashboard

### **Common Issues:**

#### **"User already exists"**
- Try a different email address
- Or delete the user from Supabase Auth → Users

#### **"Database connection error"**
- Check your environment variables
- Verify your Supabase project is online

#### **"RLS policy error"**
- Make sure you're using the correct API keys
- Check that RLS policies are properly set up

## 🚀 **After Registration Works**

Once registration is working, you can test the Uber-style features:

### **For Customers:**
1. Create a service request
2. Watch for real-time notifications
3. See when providers claim your request

### **For Providers:**
1. Browse available requests
2. Claim requests (first-come-first-served)
3. Accept/decline within 5 minutes

## 📋 **Database Schema Changes**

The updated schema includes:
- ✅ Removed `password_hash` column (using Supabase Auth)
- ✅ Added claiming system columns (`claimed_at`, `claimed_by`, `expires_at`)
- ✅ Added notifications table
- ✅ Updated status enum to include 'claimed'
- ✅ Added database functions for claiming system

## 🔐 **Authentication Changes**

The app now uses:
- ✅ Supabase's built-in authentication
- ✅ Proper session management
- ✅ Secure password handling
- ✅ Email verification (optional)

## 📞 **Need Help?**

If you're still having issues:

1. **Check the browser console** for specific error messages
2. **Verify your Supabase project** is properly configured
3. **Ensure all environment variables** are set correctly
4. **Try the migration script** if the main schema fails

The key changes are:
- Using Supabase Auth instead of custom password hashing
- Updated database schema with claiming system
- Proper error handling and type safety 