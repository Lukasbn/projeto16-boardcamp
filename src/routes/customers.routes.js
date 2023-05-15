import { customersGet, customersGetById, customersPost, customersPut } from "../controllers/customers.controllers.js"
import { Router } from "express"
import { customerSchema } from "../schemas/customers.schemas.js"
import { validateSchema } from "../middlewares/validateSchema.middleware.js"



const customersRouter = Router()

customersRouter.post('/customers', validateSchema(customerSchema), customersPost)

customersRouter.put('/customers/:id', validateSchema(customerSchema), customersPut)

customersRouter.get('/customers/:id', customersGetById)

customersRouter.get('/customers', customersGet)

export default customersRouter