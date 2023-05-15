import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import router from "./routes/index.routes.js"

dotenv.config()

const app = express()

app.use(express.json())
app.use(cors())

app.use(router)

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`app running on port ${port}`))