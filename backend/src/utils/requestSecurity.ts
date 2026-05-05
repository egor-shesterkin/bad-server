export const MAX_PAGE_SIZE = 50
export const MAX_SEARCH_LENGTH = 80

export function getString(value: unknown, maxLength = 255) {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()
    return trimmed.length <= maxLength ? trimmed : undefined
}

export function getPositiveInteger(
    value: unknown,
    defaultValue: number,
    maxValue = MAX_PAGE_SIZE
) {
    const parsed = Number(value)

    if (!Number.isInteger(parsed) || parsed < 1) {
        return defaultValue
    }

    return Math.min(parsed, maxValue)
}

export function getDate(value: unknown) {
    const stringValue = getString(value, 32)

    if (!stringValue) {
        return undefined
    }

    const date = new Date(stringValue)
    return Number.isNaN(date.getTime()) ? undefined : date
}

export function getNumber(value: unknown) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

export function stripMongoOperators(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(stripMongoOperators)
    }

    if (!value || typeof value !== 'object') {
        return value
    }

    const sanitized: Record<string, unknown> = {}

    Object.entries(value as Record<string, unknown>).forEach(
        ([key, nestedValue]) => {
            if (!key.startsWith('$') && !key.includes('.')) {
                sanitized[key] = stripMongoOperators(nestedValue)
            }
        }
    )

    return sanitized
}
