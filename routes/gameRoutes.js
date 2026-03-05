    const router = require('express').Router();
    const gameController = require("../controller/gameController")
    const authMiddleware = require("../middleware/authMiddleware")
    // app.use(authMiddleware)
    router.post("/start",  gameController.startGame)
    router.post("/finish",gameController.finishGame)
    router.post("/reset",gameController.restGame)
    router.get("/leaderboard",gameController.getGameLeaderBord)

    module.exports = router;