import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { db } from "./database/database.connection.js"
import dayjs from "dayjs"
import joi from "joi"

dotenv.config()

const app = express()

app.use(express.json())
app.use(cors())


app.post('/games', async (req, res) => {
    const { name, image, stockTotal, pricePerDay } = req.body

    const gameSchema = joi.object({
        name: joi.string().required(),
        image: joi.string().required(),
        stockTotal: joi.number().integer().greater(0).required(),
        pricePerDay: joi.number().integer().greater(0).required()
    })

    const validation = gameSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    }

    try {
        const verification = await db.query(`SELECT * FROM games WHERE name = $1;`, [name])

        if (verification.rows[0]) {
            return res.sendStatus(409)
        }

        const posting = await db.query(`INSERT INTO games (name,image,"stockTotal","pricePerDay") VALUES ($1,$2,$3,$4);`, [name, image, stockTotal, pricePerDay])

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get('/games', async (req, res) => {
    try {
        const games = await db.query(`SELECT * FROM games;`)

        res.send(games.rows)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post('/customers', async (req, res) => {
    const { name, phone, cpf, birthday } = req.body

    const customerSchema = joi.object({
        name: joi.string().required(),
        phone: joi.string().min(10).max(11).required(),
        cpf: joi.string().length(11).regex(/^\d+$/).required(),
        birthday: joi.date().required()
    })

    const validation = customerSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    }

    try {
        const verification = await db.query(`SELECT * FROM customers WHERE cpf = $1;`, [cpf])

        if (verification.rows[0]) {
            return res.sendStatus(409)
        }

        const posting = db.query(`INSERT INTO customers (name,phone,cpf,birthday) VALUES ($1,$2,$3,$4);`, [name, phone, cpf, birthday])

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.put('/customers/:id', async (req, res) => {
    const { name, phone, cpf, birthday } = req.body
    const { id } = req.params

    const customerSchema = joi.object({
        name: joi.string().required(),
        phone: joi.string().min(10).max(11).required(),
        cpf: joi.string().length(11).regex(/^\d+$/).required(),
        birthday: joi.date().required()
    })

    const validation = customerSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    }

    try {
        const verification = await db.query(`SELECT * FROM customers WHERE cpf = $1 AND id <> $2;`, [cpf, id])

        if (verification.rows[0]) {
            return res.sendStatus(409)
        }

        const posting = db.query(`UPDATE customers SET name=$1 , phone=$2 , cpf=$3 , birthday=$4 WHERE id = $5;`, [name, phone, cpf, birthday, id])


        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get('/customers/:id', async (req, res) => {
    const { id } = req.params

    try {
        const users = await db.query(`SELECT * FROM customers WHERE id=$1;`, [id])

        if (!users.rows[0]) {
            return res.sendStatus(404)
        }

        const user = users.rows[0]
        res.send({ ...user, birthday: dayjs(user.birthday).format('YYYY-MM-DD') })
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get('/customers', async (req, res) => {
    try {
        const user = await db.query(`SELECT * FROM customers;`)
        res.send(user.rows.map(user => ({ ...user, birthday: dayjs(user.birthday).format('YYYY-MM-DD') })))
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post('/rentals', async (req, res) => {
    const { customerId, gameId, daysRented } = req.body

    const date = dayjs(Date.now()).format('YYYY-MM-DD')

    if (daysRented <= 0) {
        return res.status(400).send('dayRented must be a number greater than 0')
    }
    try {
        const user = await db.query(`SELECT * FROM customers WHERE id=$1;`, [customerId])
        if (!user.rows[0]) {
            return res.sendStatus(400)
        }

        const game = await db.query(`SELECT * FROM games WHERE id=$1`, [gameId])
        if (!game.rows[0]) {
            return res.sendStatus(400)
        }

        const currentRents = await db.query(`SELECT * FROM rentals WHERE "gameId"=$1`, [gameId])
        if (currentRents.rowCount >= game.rows[0].stockTotal) {
            return res.sendStatus(400)
        }
        await db.query(`INSERT INTO rentals 
        ("customerId","gameId","rentDate","daysRented","returnDate","originalPrice","delayFee") 
        VALUES ($1,$2,$4,$3,null,${daysRented * (game.rows[0].pricePerDay)},null)`, [customerId, gameId, daysRented, date])

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post('/rentals/:id/return', async (req, res) => {
    const { id } = req.params
    const date = dayjs(Date.now()).format('YYYY-MM-DD')
    try {
        const rent = await db.query(`SELECT * FROM rentals WHERE id=$1`, [id])
        if (!rent.rows[0]) {
            return res.sendStatus(404)
        }
        if (rent.rows[0].returnDate) {
            return res.sendStatus(400)
        }
        const game = await db.query(`SELECT * FROM games WHERE id=$1`, [rent.rows[0].gameId])

        if (dayjs(date).diff(rent.rows[0].rentDate, 'day') >= rent.rows[0].daysRented) {
            const delay = (dayjs(date).diff(rent.rows[0].rentDate, 'day') - rent.rows[0].daysRented)
            const value = delay * game.rows[0].pricePerDay
            await db.query(`UPDATE rentals SET "returnDate"=$1, "delayFee"=$2 WHERE id=$3`, [date, value, id])
            return res.sendStatus(200)
        }

        await db.query(`UPDATE rentals SET "returnDate"=$1, "delayFee"=0 WHERE id=$2`, [date, id])

        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.delete('/rentals/:id', async (req, res) => {
    const { id } = req.params

    try {
        const rent = await db.query(`SELECT * FROM rentals WHERE id=$1`, [id])
        if (!rent.rows[0]) {
            return res.sendStatus(404)
        }
        if (!rent.rows[0].returnDate) {
            return res.sendStatus(400)
        }

        await db.query(`DELETE FROM rentals WHERE id=$1`, [id])

        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get('/rentals', async (req,res)=>{
    try {
        const rentals = await db.query(`SELECT rentals.*, customers.name AS customer_name, games.name AS game_name FROM
            rentals JOIN customers ON customers.id = "customerId"
            JOIN games ON games.id = "gameId";`
        )

        const list = rentals.rows.map((data)=>(
            {
                id: data.id,
                customerId: data.customerId,
                gameId: data.gameId,
                rentDate: dayjs(data.rentDate).format('YYYY-MM-DD'),
                daysRented: data.daysRented,
                returnDate: data.returnDate,
                originalPrice: data.originalPrice,
                delayFee: data.delayFee,
                customer:{
                    id: data.customerId,
                    name: data.customer_name
                },
                game:{
                    id: data.gameId,
                    name: data.game_name
                }
            }
        ))
        res.send(list)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`app running on port ${port}`))