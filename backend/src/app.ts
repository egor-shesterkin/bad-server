import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, Request, urlencoded } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS } from './config'
import {
    ensureCsrfCookie,
    validateCsrfToken,
} from './middlewares/csrfProtection'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'
import { stripMongoOperators } from './utils/requestSecurity'

const { PORT = 3000 } = process.env
const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)
mongoose.set('sanitizeFilter', true)

app.use(cookieParser())

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(
    rateLimit({
        windowMs: 60 * 1000,
        limit: 60,
        standardHeaders: true,
        legacyHeaders: false,
    })
)

app.use(
    cors({
        origin: process.env.ORIGIN_ALLOW || true,
        credentials: true,
    })
)
// app.use(cors({ origin: ORIGIN_ALLOW, credentials: true }));
// app.use(express.static(path.join(__dirname, 'public')));

app.use(serveStatic(path.join(__dirname, 'public')))

app.use(urlencoded({ extended: false, limit: '50kb', parameterLimit: 100 }))
app.use(json({ limit: '50kb' }))
app.use((req, _res, next) => {
    req.body = stripMongoOperators(req.body)
    next()
})
app.use((req, _res, next) => {
    req.query = stripMongoOperators(req.query) as Request['query']
    next()
})
app.use(ensureCsrfCookie)
app.use(validateCsrfToken)

app.options('*', cors())
app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
