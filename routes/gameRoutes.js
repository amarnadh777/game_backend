    const router = require('express').Router();
    const gameController = require("../controller/gameController")
    const authMiddleware = require("../middleware/authMiddleware")
    
    router.post("/start",authMiddleware,  gameController.startGame)
    router.post("/finish",authMiddleware,gameController.finishGame)
    router.post("/reset",gameController.restGame)
    router.get("/leaderboard",gameController.getGameLeaderBord)

    module.exports = router;