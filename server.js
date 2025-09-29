// Enhanced Express server with Supabase and Authentication
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Helper function for ISO timestamp
function nowISO() {
  return new Date().toISOString();
}

// Email configuration
let emailTransporter = null;

// Initialize email transporter if credentials are available
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Email service configured');
} else {
  console.log('Email service not configured - using console logging for development');
}

// Email templates
function generateSuccessEmailHTML(order, payment) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Confirmation - GenBooks</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #e74b0e, #f97316); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
        .button { background: #e74b0e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Payment Successful!</h1>
          <p>Thank you for your purchase from GenBooks</p>
        </div>
        <div class="content">
          <h2>Hi ${order.firstName} ${order.lastName},</h2>
          <p>Your payment has been successfully processed! Here are your order details:</p>
          
          <div class="order-details">
            <h3>Order Information</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Payment ID:</strong> ${payment.id}</p>
            <p><strong>Product:</strong> ${order.productName || 'GenBooks Premium Collection'}</p>
            <p><strong>Amount:</strong> ₹${order.totalAmount}</p>
            <p><strong>Date:</strong> ${new Date(payment.received_at).toLocaleDateString()}</p>
            <p><strong>Status:</strong> Completed</p>
          </div>
          
          <p>Your digital products will be available for download shortly. If you have any questions, please don't hesitate to contact our support team.</p>
          
          <a href="${process.env.WEBSITE_URL || 'http://localhost:3000'}" class="button">Visit GenBooks</a>
        </div>
        <div class="footer">
          <p>© 2025 GenBooks Store. All rights reserved.</p>
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send payment confirmation email
async function sendPaymentConfirmationEmail(order, payment) {
  if (!emailTransporter) {
    console.log('📧 Email would be sent to:', order.email);
    console.log('📧 Subject: Payment Confirmation - Order', order.id);
    console.log('📧 Content: Payment successful for ₹' + order.totalAmount);
    return { success: true, message: 'Email logged to console (development mode)' };
  }

  try {
    const mailOptions = {
      from: `"GenBooks Store" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: order.email,
      subject: `Payment Confirmation - Order ${order.id}`,
      html: generateSuccessEmailHTML(order, payment)
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('📧 Payment confirmation email sent to:', order.email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('📧 Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for proper IP handling and session management
app.set('trust proxy', 1);

// Check if Supabase credentials are available
const hasSupabaseCredentials = process.env.SUPABASE_URL && 
  process.env.SUPABASE_URL !== 'https://your-project-id.supabase.co' &&
  process.env.SUPABASE_SERVICE_ROLE_KEY && 
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key_here';

let supabase = null;
let dataStore = {
  orders: [],
  payments: []
};

const DATA_FILE = path.join(__dirname, 'data.json');

if (hasSupabaseCredentials) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log('Using Supabase database');
} else {
  // Fallback to JSON file storage for development
  console.log('Using JSON file storage (development mode)');
  
  // Load existing data if file exists
  if (fs.existsSync(DATA_FILE)) {
    try {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      dataStore = JSON.parse(fileData);
    } catch (error) {
      console.log('Could not load existing data, starting fresh');
    }
  }
}

// Helper function to save data to JSON file
function saveDataToFile() {
  if (!supabase) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(dataStore, null, 2));
    } catch (error) {
      console.error('Error saving data to file:', error);
    }
  }
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced session configuration
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret-key-for-development',
  name: 'sessionId',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on activity
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // CSRF protection
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Initialize database tables
async function initializeDatabase() {
  try {
    if (supabase) {
      // Supabase initialization - tables should be created manually in Supabase dashboard
      console.log('Using Supabase - ensure tables are created in your dashboard');
    } else {
      // JSON file storage - ensure data structure exists
      if (!dataStore.orders) dataStore.orders = [];
      if (!dataStore.payments) dataStore.payments = [];
      saveDataToFile();
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

// Helper functions
function nowISO() { return new Date().toISOString(); }

// Rate limiting for admin login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
  
  // Reset attempts if lockout period has passed
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    attempts.count = 0;
  }
  
  return attempts.count < MAX_LOGIN_ATTEMPTS;
}

function recordLoginAttempt(ip, success) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
  
  if (success) {
    // Clear attempts on successful login
    loginAttempts.delete(ip);
  } else {
    // Increment failed attempts
    attempts.count += 1;
    attempts.lastAttempt = now;
    loginAttempts.set(ip, attempts);
  }
}

// Input validation and sanitization
function validateLoginInput(username, password) {
  const errors = [];
  
  if (!username || typeof username !== 'string') {
    errors.push('Username is required and must be a string');
  } else if (username.length < 3 || username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required and must be a string');
  } else if (password.length < 6 || password.length > 100) {
    errors.push('Password must be between 6 and 100 characters');
  }
  
  return errors;
}

// Admin Authentication Routes
app.post('/api/admin/login', async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    // Check rate limiting
    if (!checkRateLimit(clientIP)) {
      console.warn(`[${nowISO()}] Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({ 
        error: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: 15 * 60 // seconds
      });
    }

    const { username, password } = req.body;
    
    // Validate input
    const validationErrors = validateLoginInput(username, password);
    if (validationErrors.length > 0) {
      recordLoginAttempt(clientIP, false);
      return res.status(400).json({ 
        error: 'Invalid input',
        details: validationErrors
      });
    }

    // Sanitize input
    const sanitizedUsername = username.trim();
    const sanitizedPassword = password.trim();

    // Get admin credentials from environment
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Debug logging (remove in production)
    console.log(`[${nowISO()}] Login attempt - Username: "${sanitizedUsername}", Expected: "${adminUsername}"`);
    console.log(`[${nowISO()}] Password match: ${sanitizedPassword === adminPassword}`);

    // Check if admin credentials are configured
    if (!adminUsername || !adminPassword) {
      console.error(`[${nowISO()}] Admin credentials not configured in environment variables`);
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Authenticate user
    if (sanitizedUsername === adminUsername && sanitizedPassword === adminPassword) {
      // Successful login
      req.session.isAdmin = true;
      req.session.username = sanitizedUsername;
      req.session.loginTime = nowISO();
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error(`[${nowISO()}] Session save error:`, err);
          return res.status(500).json({ error: 'Session error' });
        }
        
        recordLoginAttempt(clientIP, true);
        
        console.log(`[${nowISO()}] Successful admin login for user: ${sanitizedUsername} from IP: ${clientIP}`);
        console.log(`[${nowISO()}] Session ID: ${req.sessionID}, isAdmin: ${req.session.isAdmin}`);
        
        res.json({ 
          success: true, 
          message: 'Login successful',
          user: {
            username: sanitizedUsername,
            loginTime: req.session.loginTime
          }
        });
      });
    } else {
      // Failed login
      recordLoginAttempt(clientIP, false);
      
      console.warn(`[${nowISO()}] Failed admin login attempt for user: ${sanitizedUsername} from IP: ${clientIP}`);
      
      res.status(401).json({ 
        error: 'Invalid username or password',
        message: 'Please check your credentials and try again'
      });
    }
  } catch (error) {
    console.error(`[${nowISO()}] Login error:`, error);
    recordLoginAttempt(clientIP, false);
    res.status(500).json({ 
      error: 'An unexpected error occurred during login',
      message: 'Please try again later'
    });
  }
});

app.post('/api/admin/logout', (req, res) => {
  try {
    const username = req.session?.username;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    req.session.destroy((err) => {
      if (err) {
        console.error(`[${nowISO()}] Logout error:`, err);
        return res.status(500).json({ 
          error: 'Logout failed',
          message: 'An error occurred while logging out'
        });
      }
      
      console.log(`[${nowISO()}] Admin logout for user: ${username} from IP: ${clientIP}`);
      res.json({ 
        success: true, 
        message: 'Logout successful' 
      });
    });
  } catch (error) {
    console.error(`[${nowISO()}] Logout error:`, error);
    res.status(500).json({ 
      error: 'An unexpected error occurred during logout',
      message: 'Please try again'
    });
  }
});

app.get('/api/admin/check', (req, res) => {
  try {
    if (req.session && req.session.isAdmin) {
      res.json({ 
        authenticated: true, 
        user: {
          username: req.session.username,
          loginTime: req.session.loginTime
        }
      });
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    console.error(`[${nowISO()}] Auth check error:`, error);
    res.status(500).json({ 
      error: 'Authentication check failed',
      authenticated: false 
    });
  }
});

// API: Create order
app.post('/api/orders', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, totalAmount = 399, currency = 'INR' } = req.body || {};
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const id = 'ORD-' + new Date().getFullYear() + '-' + uuidv4().slice(0, 8).toUpperCase();
    const customer_name = [firstName, lastName].filter(Boolean).join(' ').trim() || null;
    const now = nowISO();
    if (supabase) {
      // Supabase implementation
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          id,
          customer_name,
          customer_email: email,
          phone: phone || null,
          total_amount: Number(totalAmount),
          currency,
          status: 'pending',
          created_at: now,
          updated_at: now
        }])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to create order' });
      }
    } else {
      // JSON file storage implementation
      const order = {
        id,
        customer_name,
        customer_email: email,
        customer_phone: phone || null,
        product_name: 'Premium Course Bundle',
        quantity: 1,
        total_amount: Number(totalAmount),
        currency,
        status: 'pending',
        created_at: now,
        updated_at: now
      };
      
      dataStore.orders.push(order);
      saveDataToFile();
    }

    res.json({ id, status: 'pending' });
  } catch (e) {
    console.error('Create order error:', e);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// API: Record payment
app.post('/api/payments', async (req, res) => {
  try {
    const { orderId, amount = 399, currency = 'INR', provider = 'manual', providerPaymentId = null, status = 'succeeded' } = req.body || {};
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    let order = null;

    if (supabase) {
      // Check if order exists in Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        return res.status(404).json({ error: 'Order not found' });
      }
      order = orderData;
    } else {
       // Check if order exists in JSON storage
       order = dataStore.orders.find(o => o.id === orderId);
       
       if (!order) {
         return res.status(404).json({ error: 'Order not found' });
       }
     }

    const id = 'PAY-' + uuidv4().slice(0, 8).toUpperCase();
    const now = new Date().toISOString();

    if (supabase) {
      // Insert payment record in Supabase
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          id,
          order_id: orderId,
          provider,
          provider_payment_id: providerPaymentId,
          amount: Number(amount),
          currency,
          status,
          received_at: now
        }])
        .select();

      if (paymentError) {
        console.error('Payment insert error:', paymentError);
        return res.status(500).json({ error: 'Failed to record payment' });
      }

      // Update order status if payment succeeded
      if (status === 'succeeded') {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'paid', updated_at: now })
          .eq('id', orderId);

        if (updateError) {
          console.error('Order update error:', updateError);
        } else {
          // Send payment confirmation email
          const paymentRecord = payment[0];
          await sendPaymentConfirmationEmail(order, paymentRecord);
        }
      }
    } else {
       // Insert payment record in JSON storage
       const payment = {
         id,
         order_id: orderId,
         provider,
         provider_payment_id: providerPaymentId,
         amount: Number(amount),
         currency,
         status,
         received_at: now
       };
       
       dataStore.payments.push(payment);

       // Update order status if payment succeeded
       if (status === 'succeeded') {
         const orderIndex = dataStore.orders.findIndex(o => o.id === orderId);
         if (orderIndex !== -1) {
           dataStore.orders[orderIndex].status = 'paid';
           dataStore.orders[orderIndex].updated_at = now;
           
           // Send payment confirmation email
           await sendPaymentConfirmationEmail(order, payment);
         }
       }
       
       saveDataToFile();
     }

    res.json({ id, orderId, status });
  } catch (e) {
    console.error('Record payment error:', e);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// API: Admin stats (protected)
app.get('/api/admin/stats', requireAuth, async (req, res) => {
  try {
    let totalOrders = 0;
    let paidOrders = 0;
    let totalRevenue = 0;
    let recentPayments = [];

    if (supabase) {
      // Get total orders from Supabase
      const { count: totalOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Get paid orders from Supabase
      const { count: paidOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'paid');

      // Get total revenue from Supabase
      const { data: revenueData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'succeeded');

      totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Get recent payments from Supabase
      const { data: recentPaymentsData } = await supabase
        .from('payments')
        .select('id, order_id, amount, currency, status, received_at')
        .order('received_at', { ascending: false })
        .limit(10);

      totalOrders = totalOrdersCount || 0;
      paidOrders = paidOrdersCount || 0;
      recentPayments = recentPaymentsData || [];
    } else {
       // Get stats from JSON storage
       totalOrders = dataStore.orders.length;
       paidOrders = dataStore.orders.filter(order => order.status === 'paid').length;
       totalRevenue = dataStore.payments
         .filter(payment => payment.status === 'succeeded')
         .reduce((sum, payment) => sum + payment.amount, 0);
       
       recentPayments = dataStore.payments
         .sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
         .slice(0, 10)
         .map(payment => ({
           id: payment.id,
           order_id: payment.order_id,
           amount: payment.amount,
           currency: payment.currency,
           status: payment.status,
           received_at: payment.received_at
         }));
     }

    res.json({
      totalOrders,
      paidOrders,
      totalRevenue,
      recentPayments
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// API: Get all orders (protected)
app.get('/api/admin/orders', requireAuth, async (req, res) => {
  try {
    let orders = [];

    if (supabase) {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Orders fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch orders' });
      }

      orders = ordersData || [];
    } else {
       orders = dataStore.orders
         .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
     }

    res.json({ orders });
  } catch (e) {
    console.error('Get orders error:', e);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Main page endpoints
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/features', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Payment page endpoints
app.get('/payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

app.get('/buy', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

// Serve admin login page
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Serve admin dashboard (protected)
app.get('/admin', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.sendFile(path.join(__dirname, 'admin.html'));
  } else {
    res.redirect('/admin/login');
  }
});

app.get('/admin/dashboard', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.sendFile(path.join(__dirname, 'admin.html'));
  } else {
    res.redirect('/admin/login');
  }
});

// Health check endpoint for production monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: nowISO(),
    database: supabase ? 'supabase' : 'json-file',
    uptime: process.uptime()
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'operational',
    version: '1.0.0',
    database: supabase ? 'connected' : 'file-storage',
    endpoints: [
      '/',
      '/home',
      '/gallery', 
      '/products',
      '/features',
      '/payment',
      '/checkout',
      '/buy',
      '/admin',
      '/admin/login',
      '/admin/dashboard'
    ]
  });
});

// Catch-all route for SPA behavior (must be last)
app.get('*', (req, res) => {
  // If it's an API route that doesn't exist, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For all other routes, serve the main page (SPA behavior)
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });
});