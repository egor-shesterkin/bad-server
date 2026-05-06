import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        const normalizedBaseDir = path.resolve(baseDir)
        const filePath = path.resolve(normalizedBaseDir, `.${req.path}`)

        if (
            filePath !== normalizedBaseDir &&
            !filePath.startsWith(`${normalizedBaseDir}${path.sep}`)
        ) {
            return next()
        }

        // Проверяем, существует ли файл
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // Файл не существует отдаем дальше мидлварам
                return next()
            }
            // Файл существует, отправляем его клиенту
            return res.sendFile(filePath, (sendFileError) => {
                if (sendFileError) {
                    next(sendFileError)
                }
            })
        })
    }
}
