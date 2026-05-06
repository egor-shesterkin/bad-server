import { NextFunction, Request, Response } from 'express'
import mongoose, { FilterQuery } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'
import escapeRegExp from '../utils/escapeRegExp'
import {
    getDate,
    getNumber,
    getPositiveInteger,
    getString,
    MAX_SEARCH_LENGTH,
} from '../utils/requestSecurity'

const CUSTOMER_SORT_FIELDS = new Set([
    'createdAt',
    'lastOrderDate',
    'totalAmount',
    'orderCount',
    'name',
])

// TODO: Добавить guard admin
// eslint-disable-next-line max-len
// Get GET /customers?page=2&limit=5&sort=totalAmount&order=desc&registrationDateFrom=2023-01-01&registrationDateTo=2023-12-31&lastOrderDateFrom=2023-01-01&lastOrderDateTo=2023-12-31&totalAmountFrom=100&totalAmountTo=1000&orderCountFrom=1&orderCountTo=10
export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            sortField = 'createdAt',
            sortOrder = 'desc',
            registrationDateFrom,
            registrationDateTo,
            lastOrderDateFrom,
            lastOrderDateTo,
            totalAmountFrom,
            totalAmountTo,
            orderCountFrom,
            orderCountTo,
            search,
        } = req.query
        const page = getPositiveInteger(req.query.page, 1)
        const limit = getPositiveInteger(req.query.limit, 10)

        const filters: FilterQuery<Partial<IUser>> = {}

        const registrationDateFromValue = getDate(registrationDateFrom)

        if (registrationDateFromValue) {
            filters.createdAt = {
                ...filters.createdAt,
                $gte: registrationDateFromValue,
            }
        }

        const registrationDateToValue = getDate(registrationDateTo)

        if (registrationDateToValue) {
            const endOfDay = registrationDateToValue
            endOfDay.setHours(23, 59, 59, 999)
            filters.createdAt = {
                ...filters.createdAt,
                $lte: endOfDay,
            }
        }

        const lastOrderDateFromValue = getDate(lastOrderDateFrom)

        if (lastOrderDateFromValue) {
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $gte: lastOrderDateFromValue,
            }
        }

        const lastOrderDateToValue = getDate(lastOrderDateTo)

        if (lastOrderDateToValue) {
            const endOfDay = lastOrderDateToValue
            endOfDay.setHours(23, 59, 59, 999)
            filters.lastOrderDate = {
                ...filters.lastOrderDate,
                $lte: endOfDay,
            }
        }

        const totalAmountFromValue = getNumber(totalAmountFrom)

        if (totalAmountFromValue !== undefined) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $gte: totalAmountFromValue,
            }
        }

        const totalAmountToValue = getNumber(totalAmountTo)

        if (totalAmountToValue !== undefined) {
            filters.totalAmount = {
                ...filters.totalAmount,
                $lte: totalAmountToValue,
            }
        }

        const orderCountFromValue = getNumber(orderCountFrom)

        if (orderCountFromValue !== undefined) {
            filters.orderCount = {
                ...filters.orderCount,
                $gte: orderCountFromValue,
            }
        }

        const orderCountToValue = getNumber(orderCountTo)

        if (orderCountToValue !== undefined) {
            filters.orderCount = {
                ...filters.orderCount,
                $lte: orderCountToValue,
            }
        }

        const searchValue = getString(search, MAX_SEARCH_LENGTH)

        if (searchValue) {
            const searchRegex = new RegExp(escapeRegExp(searchValue), 'i')
            const orders = await Order.find(
                {
                    $or: [{ deliveryAddress: searchRegex }],
                },
                '_id'
            )

            const orderIds = orders.map((order) => order._id)

            filters.$or = [
                { name: searchRegex },
                { lastOrder: mongoose.trusted({ $in: orderIds }) },
            ]
        }

        const sort: { [key: string]: any } = {}

        const sortFieldValue = getString(sortField, 32)
        const sortOrderValue = sortOrder === 'asc' ? 'asc' : 'desc'

        if (sortFieldValue && CUSTOMER_SORT_FIELDS.has(sortFieldValue)) {
            sort[sortFieldValue] = sortOrderValue === 'desc' ? -1 : 1
        } else {
            sort.createdAt = -1
        }

        const options = {
            sort,
            skip: (page - 1) * limit,
            limit,
        }

        const users = await User.find(filters, null, options).populate([
            'orders',
            {
                path: 'lastOrder',
                populate: {
                    path: 'products',
                },
            },
            {
                path: 'lastOrder',
                populate: {
                    path: 'customer',
                },
            },
        ])

        const totalUsers = await User.countDocuments(filters)
        const totalPages = Math.ceil(totalUsers / limit)

        res.status(200).json({
            customers: users,
            pagination: {
                totalUsers,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        })
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Get /customers/:id
export const getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await User.findById(req.params.id).populate([
            'orders',
            'lastOrder',
        ])
        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Patch /customers/:id
export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const update = {
            name: req.body.name,
            phone: req.body.phone,
        }
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: update },
            {
                new: true,
            }
        )
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )
            .populate(['orders', 'lastOrder'])
        res.status(200).json(updatedUser)
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Delete /customers/:id
export const deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.status(200).json(deletedUser)
    } catch (error) {
        next(error)
    }
}
