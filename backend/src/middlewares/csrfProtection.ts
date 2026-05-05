import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import ForbiddenError from '../errors/forbidden-error'

const CSRF_COOKIE_NAME = 'csrfToken'
const CSRF_HEADER_NAME = 'x-csrf-token'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const CSRF_PROTECTED_GET_ROUTES = new Set(['/auth/token', '/auth/logout'])

function timingSafeEqual(a: string, b: string) {
    const aBuffer = Buffer.from(a)
    const bBuffer = Buffer.from(b)

    return (
        aBuffer.length === bBuffer.length &&
        crypto.timingSafeEqual(aBuffer, bBuffer)
    )
}

function createToken() {
    return crypto.randomBytes(32).toString('hex')
}

export function ensureCsrfCookie(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies?.[CSRF_COOKIE_NAME]) {
        res.cookie(CSRF_COOKIE_NAME, createToken(), {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        })
    }

    next()
}

export function sendCsrfToken(req: Request, res: Response) {
    const token = req.cookies?.[CSRF_COOKIE_NAME] || createToken()

    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    })

    res.json({ csrfToken: token })
}

export function validateCsrfToken(req: Request, _res: Response, next: NextFunction) {
    const shouldValidate =
        !SAFE_METHODS.has(req.method) || CSRF_PROTECTED_GET_ROUTES.has(req.path)

    if (!shouldValidate) {
        return next()
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME]
    const headerToken = req.header(CSRF_HEADER_NAME)

    if (!cookieToken || !headerToken || !timingSafeEqual(cookieToken, headerToken)) {
        return next(new ForbiddenError('Невалидный CSRF-токен'))
    }

    return next()
}
