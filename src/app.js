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

        const posting = await db.query(`INSERT INTO games (name,image,"stockTotal","pricePerDay") VALUES ($1,$2,$3,$4);`,[name,image,stockTotal,pricePerDay])

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get('/games', async (req,res)=>{
    try {
        const games = await db.query(`SELECT * FROM games;`)
        
        res.send(games.rows)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.post('/customers', async (req,res)=>{
    const { name, phone, cpf, birthday} = req.body
    
    const customerSchema = joi.object({
        name: joi.string().required(),
        phone: joi.string().min(10).max(11).required(),
        cpf: joi.string().length(11).required(),
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

        const posting = db.query(`INSERT INTO customers (name,phone,cpf,birthday) VALUES ($1,$2,$3,$4);`,[name,phone,cpf,birthday])
        
        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.put('/customers/:id', async (req,res)=>{
    const { name, phone, cpf, birthday} = req.body
    const {id} = req.params
    
    const customerSchema = joi.object({
        name: joi.string().required(),
        phone: joi.string().min(10).max(11).required(),
        cpf: joi.string().length(11).required(),
        birthday: joi.date().required()
    })

    const validation = customerSchema.validate(req.body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(400).send(errors);
    }

    try {  
        const verification = await db.query(`SELECT * FROM customers WHERE cpf = $1 AND id <> $2;`, [cpf,id])

        if (verification.rows[0]) {
            return res.sendStatus(409)
        }

        const posting = db.query(`UPDATE customers SET name=$1 , phone=$2 , cpf=$3 , birthday=$4 WHERE id = $5;`,[name,phone,cpf,birthday,id])
        

        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get('/customers/:id', async (req,res)=>{
    const { id } = req.params

    try {  
        const user = await db.query(`SELECT * FROM customers WHERE id=$1;`,[id])

        if(!user.rows[0]){
            return res.sendStatus(404)
        }

        res.send(user.rows[0])
    } catch (err) {
        res.status(500).send(err.message)
    }
})

app.get('/customers', async (req,res)=>{
    const user = await db.query(`SELECT * FROM customers;`)

    res.send(user.rows)
})
const port = process.env.PORT || 5000
app.listen(port, () => console.log(`app running on port ${port}`))