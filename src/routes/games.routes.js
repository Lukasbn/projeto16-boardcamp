import { gameGet, gamePost } from "../controllers/games.controllers.js"
import { Router } from "express"
import { gameSchema } from "../schemas/games.schema.js"
import { validateSchema } from "../middlewares/validateSchema.middleware.js"

const gamesRouter = Router()

gamesRouter.post('/games', validateSchema(gameSchema), gamePost)

gamesRouter.get('/games', gameGet)

export default gamesRouter