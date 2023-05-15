import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { gameGet, gamePost } from "./controllers/games.controllers.js"
import { customersGet, customersGetById, customersPost, customersPut } from "./controllers/customers.controllers.js"
import { rentalsDelete, rentalsGet, rentalsPost, rentalsReturn } from "./controllers/rentals.controllers.js"

dotenv.config()

const app = express()

app.use(express.json())
app.use(cors())


app.post('/games', gamePost)

app.get('/games', gameGet)

app.post('/customers', customersPost)

app.put('/customers/:id', customersPut)

app.get('/customers/:id', customersGetById)

app.get('/customers', customersGet)

app.post('/rentals', rentalsPost)

app.post('/rentals/:id/return', rentalsReturn)

app.delete('/rentals/:id', rentalsDelete)

app.get('/rentals', rentalsGet)

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`app running on port ${port}`))