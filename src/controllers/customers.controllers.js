import { db } from "../database/database.connection.js";
import dayjs from "dayjs";

export async function customersPost(req, res){
    const { name, phone, cpf, birthday } = req.body

    try {
        const verification = await db.query(`SELECT * FROM customers WHERE cpf = $1;`, [cpf])

        if (verification.rows[0]) {
            return res.sendStatus(409)
        }

        await db.query(`INSERT INTO customers (name,phone,cpf,birthday) VALUES ($1,$2,$3,$4);`, [name, phone, cpf, birthday])

        res.sendStatus(201)
    } catch (err) {
        res.status(500).send(err.message)
    }
}

export async function customersPut(req, res){
    const { name, phone, cpf, birthday } = req.body
    const { id } = req.params

    try {
        const verification = await db.query(`SELECT * FROM customers WHERE cpf = $1 AND id <> $2;`, [cpf, id])

        if (verification.rows[0]) {
            return res.sendStatus(409)
        }

        await db.query(`UPDATE customers SET name=$1 , phone=$2 , cpf=$3 , birthday=$4 WHERE id = $5;`, [name, phone, cpf, birthday, id])


        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err.message)
    }
}

export async function customersGetById(req, res){
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
}

export async function customersGet(req, res){
    try {
        const user = await db.query(`SELECT * FROM customers;`)
        res.send(user.rows.map(user => ({ ...user, birthday: dayjs(user.birthday).format('YYYY-MM-DD') })))
    } catch (err) {
        res.status(500).send(err.message)
    }
}