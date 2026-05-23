const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const activityRoutes = require('../routes/activityRoutes');
const targetRoutes = require('../routes/targetRoutes');
const summaryRoutes = require('../routes/summaryRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'BurnTrack API is running on Vercel',
    version: '1.0.0',
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
    },
  });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/activities', activityRoutes);
app.use('/targets', targetRoutes);
app.use('/summary', summaryRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint tidak ditemukan',
    path: req.path,
  });
});

module.exports = app;