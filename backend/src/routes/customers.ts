import { Router } from 'express'
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import auth, { roleGuardMiddleware } from '../middlewares/auth'
import { validateUserId, validateUserUpdateBody } from '../middlewares/validations'
import { Role } from '../models/user'

const customerRouter = Router()

customerRouter.use(auth, roleGuardMiddleware(Role.Admin))
customerRouter.get('/', getCustomers)
customerRouter.get('/:id', validateUserId, getCustomerById)
customerRouter.patch('/:id', validateUserId, validateUserUpdateBody, updateCustomer)
customerRouter.delete('/:id', validateUserId, deleteCustomer)

export default customerRouter
