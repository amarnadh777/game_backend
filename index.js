const express  = require('express');
const app = express();
const port = 3000;
require("dotenv").config();
const connectDB = require("./config/db");
connectDB();


app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use('/api/auth', require('./routes/auth'))
app.use("/api/game-sessions", require("./routes/gameRoutes"))
app.use("/api/upload", require("./routes/uploadRoutes"))

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});