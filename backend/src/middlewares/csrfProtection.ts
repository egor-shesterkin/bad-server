import crypto from 'crypto'
import { NextFunction, Request, Response } from 'express'
import ForbiddenError from '../errors/forbidden-error'

const CSRF_COOKIE_NAME = '_csrf'
const LEGACY_CSRF_COOKIE_NAME = 'csrfToken'
const CSRF_HEADER_NAMES = ['x-csrf-token', 'csrf-token', 'x-xsrf-token']
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const CSRF_PROTECTED_GET_ROUTES = new Set(['/auth/token', '/auth/logout'])

function timingSafeEqual(a: string, b: string) {
    const aBuffer = Buffer.from(a)
    const bBuffer = Buffer.from(b)

    return (
        aBuffer.length === bBuffer.length &&
        crypto.timingSafeEqual(new Uint8Array(aBuffer), new Uint8Array(bBuffer))
    )
}

function createToken() {
    return crypto.randomBytes(32).toString('hex')
}

export function ensureCsrfCookie(req: Request, res: Response, next: NextFunction) {
    const primaryToken = req.cookies?.[CSRF_COOKIE_NAME]
    const legacyToken = req.cookies?.[LEGACY_CSRF_COOKIE_NAME]
    const token = primaryToken || legacyToken || createToken()

    if (!primaryToken) {
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        })
    }

    if (!legacyToken) {
        res.cookie(LEGACY_CSRF_COOKIE_NAME, token, {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        })
    }

    req.cookies[CSRF_COOKIE_NAME] = token
    req.cookies[LEGACY_CSRF_COOKIE_NAME] = token

    next()
}

export function sendCsrfToken(req: Request, res: Response) {
    const token =
        req.cookies?.[CSRF_COOKIE_NAME] ||
        req.cookies?.[LEGACY_CSRF_COOKIE_NAME] ||
        createToken()

    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    })
    res.cookie(LEGACY_CSRF_COOKIE_NAME, token, {
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

    const cookieToken =
        req.cookies?.[CSRF_COOKIE_NAME] || req.cookies?.[LEGACY_CSRF_COOKIE_NAME]
    const headerToken = CSRF_HEADER_NAMES.map((name) => req.header(name)).find(
        Boolean
    )

    if (!cookieToken || !headerToken || !timingSafeEqual(cookieToken, headerToken)) {
        return next(new ForbiddenError('Невалидный CSRF-токен'))
    }

    return next()
}
