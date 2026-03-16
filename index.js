const express  = require('express');
const app = express();
const cors = require('cors');
const port = 3000;
require("dotenv").config();
const connectDB = require("./config/db");
require("dotenv").config();
connectDB();    

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use('/api/auth', require('./routes/auth'))  
app.use("/api/game-sessions", require("./routes/gameRoutes"))
app.use("/api/upload", require("./routes/uploadRoutes"))
app.use("/api/banner", require("./routes/bannerRoutes"))
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on port ${port}`);
});