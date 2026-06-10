// src/utils/cache.js
const CACHE_PREFIX = 'elitecode_cache_'
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export const cacheGet = (key) => {
    try {
        const item = localStorage.getItem(CACHE_PREFIX + key)
        if (!item) return null
        const { value, expiry } = JSON.parse(item)
        if (expiry && Date.now() > expiry) {
            localStorage.removeItem(CACHE_PREFIX + key)
            return null
        }
        return value
    } catch {
        return null
    }
}

export const cacheSet = (key, value, ttl = DEFAULT_TTL) => {
    try {
        const expiry = Date.now() + ttl
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ value, expiry }))
    } catch (e) {
        console.warn('Cache write failed', e)
    }
}

export const cacheClear = (key) => {
    if (key) localStorage.removeItem(CACHE_PREFIX + key)
    else {
        Object.keys(localStorage)
            .filter(k => k.startsWith(CACHE_PREFIX))
            .forEach(k => localStorage.removeItem(k))
    }
}