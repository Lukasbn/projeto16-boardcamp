import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { db } from "./database/database.connection.js"
import joi from "joi"

dotenv.config()

const app = express()

app.use(express.json())
app.use(cors())


app.post('/games', async (req, res) => {
    const { name, image, stockTotal, pricePerDay } = req.body

    if (stockTotal <= 0 || pricePerDay <= 0) {
        return res.sendStatus(400)
    }

    const gameSchema = joi.object({
        name: joi.string().required(),
        image: joi.string().required(),
        stockTotal: joi.number().integer().greater(0).required(),
        pricePerDay: joi.number().integer().greater(0).required()
    })

    const validation = gameSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }

    try {
        const verification = await db.query(`SELECT * FROM games WHERE name = $1;`, [name])

        if (verification.rows[0]) {
            return res.sendStatus(409)
        }

        const posting = await db.query(`INSERT INTO games (name,image,"stockTotal","pricePerDay") VALUES ($1,$2,$3,$4);`,[name,image,stockTotal,pricePerDay])

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`app running on port ${port}`))