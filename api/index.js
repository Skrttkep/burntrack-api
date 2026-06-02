const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerDocument = require('./docs/swagger');

const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const activityRoutes = require('../routes/activityRoutes');
const targetRoutes = require('../routes/targetRoutes');
const summaryRoutes = require('../routes/summaryRoutes');
const adminRoutes = require('../routes/adminRoutes');
const reportRoutes = require('../routes/reportRoutes');
const recommendationRoutes = require('../routes/recommendationRoutes');
const achievementRoutes = require('../routes/achievementRoutes');

const app = express();

app.use(cors());
app.use(express.json());

const swaggerHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>BurnTrack API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      background: #fafafa;
    }

    .topbar {
      display: none;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: 'StandaloneLayout',
      });
    };
  </script>
</body>
</html>
`;

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(swaggerDocument);
});

app.get('/api-docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(swaggerHtml);
});

app.get('/api-docs/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(swaggerHtml);
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'BurnTrack API is running on Vercel',
    version: '1.2.0',
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
      reports: {
        weekly: 'GET /api/reports/weekly',
      },
      recommendations: {
        today: 'GET /api/recommendations/today',
      },
      achievements: {
        list: 'GET /api/achievements',
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
app.use('/api/reports', reportRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint tidak ditemukan',
    path: req.path,
  });
});

module.exports = app;