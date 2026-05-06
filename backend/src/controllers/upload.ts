import { NextFunction, Request, Response } from 'express'
import { unlink } from 'fs/promises'
import { constants } from 'http2'
import sharp from 'sharp'
import BadRequestError from '../errors/bad-request-error'
import { MIN_FILE_SIZE } from '../middlewares/file'

const ALLOWED_IMAGE_FORMATS = new Set(['png', 'jpeg', 'gif'])

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }
    try {
        if (req.file.size <= MIN_FILE_SIZE) {
            await unlink(req.file.path)
            return next(new BadRequestError('Файл должен быть больше 2 КБ'))
        }

        let metadata

        try {
            metadata = await sharp(req.file.path).metadata()
        } catch (error) {
            await unlink(req.file.path)
            return next(new BadRequestError('Файл должен быть изображением'))
        }

        if (
            !metadata.format ||
            !ALLOWED_IMAGE_FORMATS.has(metadata.format)
        ) {
            await unlink(req.file.path)
            return next(new BadRequestError('Файл должен быть изображением'))
        }

        const fileName = process.env.UPLOAD_PATH
            ? `/${process.env.UPLOAD_PATH}/${req.file.filename}`
            : `/${req.file?.filename}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file?.originalname,
        })
    } catch (error) {
        return next(error)
    }
}

export default {}
