    const router = require('express').Router();
    const gameController = require("../controller/gameController")
    router.post("/start",gameController.startGame)
    router.post("/finish",gameController.finishGame)
    router.post("/reset",gameController.restGame)
    router.get("/leaderboard",gameController.getGameLeaderBord)

    module.exports = router;