import { rentalsDelete, rentalsGet, rentalsPost, rentalsReturn } from "../controllers/rentals.controllers.js"
import { Router } from "express"

const rentalsRouter = Router()

rentalsRouter.post('/rentals', rentalsPost)

rentalsRouter.post('/rentals/:id/return', rentalsReturn)

rentalsRouter.delete('/rentals/:id', rentalsDelete)

rentalsRouter.get('/rentals', rentalsGet)

export default rentalsRouter