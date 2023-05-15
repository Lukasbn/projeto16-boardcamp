import dayjs from "dayjs"
import { db } from "../database/database.connection.js"

export async function rentalsPost(req, res){
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
}

export async function rentalsReturn(req, res){
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
}

export async function rentalsDelete(req, res){
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
}

export async function rentalsGet(req,res){
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
}