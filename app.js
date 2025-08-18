const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorhandler');
require('express-async-errors');
const cookieParser = require('cookie-parser');
const cors = require('cors')
require('dotenv').config();
require('./db')
const path = require('path');

const { initializeMonthlyReports } = require('./controller/member');
require('./services/renderPayment');


// swagger api
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Cache imports
const { connectRedis } = require('./config/redis.config');
const { scheduleCacheWarming } = require('./utils/cacheWarming.util');
const cacheMiddleware = require('./middleware/cache.middleware');
const cacheResponse = require('./middleware/cache.middleware');
const { trackCacheStats, getCacheKeys, getCacheStats } = require('./services/cache.service');

const app = express()

// Initialize Redis
connectRedis();


// Schedule cache warming
scheduleCacheWarming();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());


// Cache stats tracking
app.use((req, res, next) => {
  trackCacheStats(req);
  next();
});
 
const PORT = 8000 || process.env.PORT

const corsOption = {
  origin: [
    'http://localhost:5173',
    'https://noaclub.konectile.app',
    'https://ims.konectile.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
};

app.use(cors(corsOption));

app.set('trust proxy', 1);


const options = {
  customCss: `
    .topbar-wrapper img {content:url('https://www.konectile.com/logo.png'); height:80px;}
    .swagger-ui .topbar { background-color: #2c3e50; }
    .topbar-wrapper .link { visibility: hidden; position: relative }
    .topbar-wrapper .link:after {
      content: 'Konectile';
      visibility: visible;
      position: absolute;
      left: 0;
      color: white;
      font-size: 1.5em;
    }
  `,
  customSiteTitle: "Konectile ims API",
};

// swagger configration
const swaggerOptions = {
  definition: require('./swagger-definition.json'),
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec,options));

// Add JSON endpoint for Swagger spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


// Rate limiting for login endpoint
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded 
      ? forwarded.split(',')[0].trim() 
      : req.ip;
    return clientIp;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
      limit: 20,
      remaining: 0,
      resetTime: new Date(Date.now() + 5 * 60 * 1000)
    });
  },
  validate: {
    trustProxy: true,
    xForwardedForHeader: true
  }
});

app.use('/api/v1/auth', limiter);

// static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/backups', express.static(path.join(__dirname, 'backups')));

// functional routes
const userAuthRouter = require('./routes/userAuth')
const memberProfileRouter = require('./routes/memberProfile');
const userRoute = require('./routes/user');
const eventRouter = require('./routes/Events');
const eventNotification = require('./routes/Notification');
const clubInventory = require('./routes/ClubInventory');
const orderByMember = require('./routes/order');
const transactions = require('./routes/Transaction');
const activityLog = require('./routes/ActivityLog');
const agendaCalender = require('./routes/AgendaCalender');
const partyInvoice = require('./routes/PartyInvoice');
const devOption = require('./routes/DevOption');
const loginHistoryRoutes = require('./routes/loginHistory');
const biometricAuthRoutes = require('./routes/biometricAuth');
const companyProfileRouter = require('./routes/CompanyProfile');
const renderPayment = require('./routes/RenderPayment');

// database security routes
const dataBaseSecurity = require('./routes/DataBaseSecurity');


const { handleNotFound } = require('./utils/helper');
const cacheConfig = require('./config/cache.config');

//prefix Api 
app.use('/api/v1/auth', userAuthRouter);
app.use('/api/v1/club-member',memberProfileRouter);
app.use('/api/v1/app-user',userRoute);
app.use('/api/v1/event-management',eventRouter);
app.use('/api/v1/notification',eventNotification)
app.use('/api/v1/club-inventory',clubInventory);
app.use('/api/v1/order',orderByMember);
app.use('/api/v1/transaction',transactions);
app.use('/api/v1/activity-log',activityLog);
app.use('/api/v1/agenda-calender',agendaCalender);
app.use('/api/v1/party-invoice',partyInvoice);
app.use('/api/v1/dev-option',devOption);
app.use('/api/v1/login-history', loginHistoryRoutes);
app.use('/api/v1/biometric', biometricAuthRoutes);
app.use('/api/v1/company-profile',companyProfileRouter );
app.use('/api/v1/database',dataBaseSecurity);
app.use('/api/v1/render',renderPayment);


// Apply caching to routes
app.use('/api/v1/club-member/', 
  cacheMiddleware({ ttl: cacheConfig.TTL.LONG }),
  cacheResponse(),
  memberProfileRouter
);

app.use('/api/v1/event-management',
  cacheMiddleware({ ttl: cacheConfig.TTL.MEDIUM }),
  cacheResponse(),
  eventRouter
);

app.use('/api/v1/club-inventory',
  cacheMiddleware({ ttl: cacheConfig.TTL.LONG }),
  cacheResponse(),
  clubInventory
);

app.use('/api/v1/club-inventory',
  cacheMiddleware({ ttl: cacheConfig.TTL.LONG }),
  cacheResponse(),
  clubInventory
);

app.use('/api/v1/agenda-calender',
  cacheMiddleware({ ttl: cacheConfig.TTL.SHORT }),
  cacheResponse(),
  agendaCalender
);

// Add cache stats endpoint
app.get('/api/v1/cache/stats', (req, res) => {
  res.json(getCacheStats());
});

// Add cache management endpoints (protected in production)
app.delete('/api/v1/cache/flush', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.user?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  const success = await flushCache();
  res.status(success ? 200 : 500).json({ success });
});

app.get('/api/v1/cache/keys', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.user?.isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  const keys = await getCacheKeys(req.query.pattern || '*');
  res.json({ keys });
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});


// Home route - Developer Dashboard
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Club IMS Server</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
          background-color: #f5f7fa;
          color: #333;
          line-height: 1.6;
          padding: 2rem;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #2c3e50;
          margin-bottom: 1rem;
          border-bottom: 2px solid #eee;
          padding-bottom: 0.5rem;
        }
        .status {
          background: #4CAF50;
          color: white;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.9rem;
          display: inline-block;
          margin-bottom: 1.5rem;
        }
        .section {
          margin-bottom: 2rem;
        }
        .section h2 {
          color: #3498db;
          margin-bottom: 0.8rem;
          font-size: 1.2rem;
        }
        ul {
          list-style: none;
        }
        li {
          margin-bottom: 0.5rem;
        }
        a {
          color: #2980b9;
          text-decoration: none;
          display: inline-block;
          padding: 0.5rem 0;
          transition: all 0.3s ease;
        }
        a:hover {
          color: #1a5276;
          text-decoration: underline;
        }
        .endpoint {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          border-left: 4px solid #3498db;
        }
        .endpoint h3 {
          margin-bottom: 0.5rem;
          color: #2c3e50;
        }
        .method {
          font-weight: bold;
          color: #e74c3c;
        }
        .path {
          font-family: monospace;
          background: #eee;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
        }
        .footer {
          margin-top: 2rem;
          font-size: 0.9rem;
          color: #7f8c8d;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>ClubIms Server</h1>
        <span class="status">Operational</span>
        
        <div class="section">
          <h2>System Information</h2>
          <p>Welcome to the ClubIms API service. This dashboard provides quick access to important endpoints and system status.</p>
          <ul>
            <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
            <li><strong>Version:</strong> ${process.env.npm_package_version || '1.0.0'}</li>
            <li><strong>Uptime:</strong> ${Math.floor(process.uptime() / 60)} minutes</li>
          </ul>
        </div>
        
        <div class="section">
          <h2>Quick Links</h2>
          <ul>
            <li><a href="/health">➤ Health Check Endpoint</a> - Verify server status</li>
            <li><a href="/api/v1/cache/stats">➤ Cache Statistics</a> - View Redis cache metrics</li>
            <li><a href="/api-docs">➤ API Documentation</a> - Swagger/OpenAPI docs</li>
          </ul>
        </div>
        
        <div class="section">
          <h2>Core API Endpoints</h2>
          
          <div class="endpoint">
            <h3>Authentication</h3>
            <p><span class="method">POST</span> <span class="path">/api/v1/auth/login</span></p>
            <p><span class="method">POST</span> <span class="path">/api/v1/auth/register</span></p>
          </div>
          
          <div class="endpoint">
            <h3>Member Management</h3>
            <p><span class="method">GET</span> <span class="path">/api/v1/club-member</span> <em>(cached)</em></p>
            <p><span class="method">POST</span> <span class="path">/api/v1/club-member</span></p>
          </div>
          
          <div class="endpoint">
            <h3>Event Management</h3>
            <p><span class="method">GET</span> <span class="path">/api/v1/event-management</span> <em>(cached)</em></p>
            <p><span class="method">POST</span> <span class="path">/api/v1/event-management</span></p>
          </div>
        </div>
        
        <div class="footer">
          <p>ClubIMS Server • ${new Date().toLocaleString()}</p>
          <p>Design with ❤️ by <a href="https://konectile.com/" target="_blank">Konectile</a></p>
        </div>
      </div>
    </body>
    </html>
  `);
});


// Start the scheduler for monthyly report generation for members
initializeMonthlyReports()

// 404 handler
app.use('/*',handleNotFound)

//async error handling
app.use(errorHandler);

//listning
app.listen(PORT,()=>{
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
})