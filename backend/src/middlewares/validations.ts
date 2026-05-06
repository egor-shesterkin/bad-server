import { Joi, celebrate } from 'celebrate'
import { Types } from 'mongoose'

// eslint-disable-next-line no-useless-escape
export const phoneRegExp = /^\+?[\d\s()-]{5,24}$/

const objectId = (value: string, helpers: Joi.CustomHelpers) => {
    if (Types.ObjectId.isValid(value) && new Types.ObjectId(value).toString() === value) {
        return value
    }
    return helpers.message({ custom: 'Невалидный id' })
}

const imageSchema = Joi.object()
    .keys({
        fileName: Joi.string().max(160).pattern(/^\/?[\w/-]+\.(png|jpe?g|gif|webp)$/i).required(),
        originalName: Joi.string().max(160).required(),
    })
    .required()

export enum PaymentType {
    Card = 'card',
    Online = 'online',
}

export enum StatusType {
    Cancelled = 'cancelled',
    Completed = 'completed',
    New = 'new',
    Delivering = 'delivering',
}

// валидация id
export const validateOrderBody = celebrate({
    body: Joi.object().keys({
        items: Joi.array()
            .items(
                Joi.string().custom(objectId)
            )
            .min(1)
            .max(50)
            .required()
            .messages({
                'array.empty': 'Не указаны товары',
            }),
        payment: Joi.string()
            .valid(...Object.values(PaymentType))
            .required()
            .messages({
                'string.valid':
                    'Указано не валидное значение для способа оплаты, возможные значения - "card", "online"',
                'string.empty': 'Не указан способ оплаты',
            }),
        email: Joi.string().email().max(254).required().messages({
            'string.empty': 'Не указан email',
        }),
        phone: Joi.string().max(24).required().pattern(phoneRegExp).messages({
            'string.empty': 'Не указан телефон',
        }),
        address: Joi.string().max(200).required().messages({
            'string.empty': 'Не указан адрес',
        }),
        total: Joi.number().min(0).required().messages({
            'string.empty': 'Не указана сумма заказа',
        }),
        comment: Joi.string().max(1000).optional().allow(''),
    }).required(),
})

// валидация товара.
// name и link - обязательные поля, name - от 2 до 30 символов, link - валидный url
export const validateProductBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().required().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
            'string.empty': 'Поле "title" должно быть заполнено',
        }),
        image: imageSchema,
        category: Joi.string().max(80).required().messages({
            'string.empty': 'Поле "category" должно быть заполнено',
        }),
        description: Joi.string().max(2000).required().messages({
            'string.empty': 'Поле "description" должно быть заполнено',
        }),
        price: Joi.number().min(0).allow(null),
    }).required(),
})

export const validateProductUpdateBody = celebrate({
    body: Joi.object().keys({
        title: Joi.string().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        image: imageSchema.optional(),
        category: Joi.string().max(80),
        description: Joi.string().max(2000),
        price: Joi.number().min(0).allow(null),
    }).min(1),
})

export const validateObjId = celebrate({
    params: Joi.object().keys({
        productId: Joi.string().required().custom(objectId),
    }),
})

export const validateUserId = celebrate({
    params: Joi.object().keys({
        id: Joi.string().required().custom(objectId),
    }),
})

export const validateOrderNumber = celebrate({
    params: Joi.object().keys({
        orderNumber: Joi.number().integer().min(1).required(),
    }),
})

export const validateOrderStatusBody = celebrate({
    body: Joi.object()
        .keys({
            status: Joi.string()
                .valid(...Object.values(StatusType))
                .required(),
        })
        .required(),
})

export const validateUserBody = celebrate({
    body: Joi.object().keys({
        name: Joi.string().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
        }),
        password: Joi.string().min(8).max(128).required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
        email: Joi.string()
            .required()
            .email()
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.empty': 'Поле "email" должно быть заполнено',
            }),
    }).required(),
})

export const validateUserUpdateBody = celebrate({
    body: Joi.object()
        .keys({
            name: Joi.string().min(2).max(30),
            phone: Joi.string().max(24).pattern(phoneRegExp).allow(''),
        })
        .min(1)
        .required(),
})

export const validateAuthentication = celebrate({
    body: Joi.object().keys({
        email: Joi.string()
            .required()
            .email()
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.required': 'Поле "email" должно быть заполнено',
            }),
        password: Joi.string().max(128).required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
    }).required(),
})
