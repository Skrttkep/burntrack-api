const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const swaggerDocument = require('./docs/swagger');

const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const activityRoutes = require('../routes/activityRoutes');
const targetRoutes = require('../routes/targetRoutes');
const summaryRoutes = require('../routes/summaryRoutes');
const adminRoutes = require('../routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

const swaggerOptions = {
  explorer: true,
  customSiteTitle: 'BurnTrack API Docs',
  customCss: `
    .swagger-ui .topbar { display: none }
  `,
};

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(swaggerDocument);
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, swaggerOptions)
);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'BurnTrack API is running on Vercel',
    version: '1.1.0',
    docs: '/api-docs',
    swaggerJson: '/api-docs.json',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
      },
      user: {
        profile: 'GET /api/users/profile',
        updateProfile: 'PUT /api/users/profile',
      },
      activities: {
        create: 'POST /api/activities',
        list: 'GET /api/activities',
        detail: 'GET /api/activities/:id',
        delete: 'DELETE /api/activities/:id',
      },
      targets: {
        createOrUpdate: 'POST /api/targets',
        current: 'GET /api/targets',
      },
      summary: {
        today: 'GET /api/summary/today',
      },
      admin: {
        summary: 'GET /api/admin/summary',
        users: 'GET /api/admin/users',
        userDetail: 'GET /api/admin/users/:id',
        userStatistics: 'GET /api/admin/users/:id/statistics',
        activities: 'GET /api/admin/activities',
      },
      swagger: {
        docs: 'GET /api-docs',
        json: 'GET /api-docs.json',
      },
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint tidak ditemukan',
    path: req.path,
  });
});

module.exports = app;