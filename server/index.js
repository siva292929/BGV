require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const hrRoutes = require('./routes/hr');
const candidateRoutes = require('./routes/candidate');
const chatRoutes = require('./routes/chat');

const app = express();
const cookieParser = require('cookie-parser');
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Static folder for viewing uploaded docs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/chat', chatRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.log(err));

app.listen(5000, () => console.log("🚀 Server on 5000"));