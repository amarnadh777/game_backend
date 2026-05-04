const express = require('express');
const app = express();
const cors = require('cors');
require("dotenv").config();
const port = process.env.PORT || 8000;
const connectDB = require("./config/db");
connectDB();
app.use(cors());

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use('/api/auth', require('./routes/auth'))
app.use("/api/game-sessions", require("./routes/gameRoutes"))
app.use("/api/upload", require("./routes/uploadRoutes"))
app.use("/api/banner", require("./routes/bannerRoutes"))
app.use("/api/user", require("./routes/userRoutes"))
app.use("/api/admin", require("./routes/adminRoutes"))
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
app.get(['/api', '/api/'], (req, res) => {
  res.status(200).json({ status: 'ok', service: 'kdr-backend' });
});
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
