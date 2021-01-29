const fs = require('fs')
const replace = require('replace-in-file')

const packageJson = require('./package.json')

const swrText = `
const swr = async () => {
    if (navigator.serviceWorker) {
        if (window.location.protocol === 'https:') {
            navigator.serviceWorker.register('/sw.js')
        } else {
            const registrations = await navigator.serviceWorker.getRegistrations()

            if (registrations.length > 0) {
                registrations.forEach((registration) => {
                    registration.unregister()
                })

                location.reload()
            }
        }
    }
}

swr()
`

function getFilesToCache(indexPath, buildPath) {
    const skip = []

    const flatDeep = (arr) =>
        arr.reduce(
            (acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val) : val),
            []
        )

    const tree = (root) =>
        fs
            .readdirSync(root, { withFileTypes: true })
            .filter(
                (element) =>
                    !skip.includes(element.name) &&
                    !element.name.endsWith('.map')
            )
            .map((element) =>
                element.isDirectory()
                    ? tree(`${root}/${element.name}`)
                    : `${root}/${element.name}`
            )

    const listAllFiles = flatDeep(
        fs
            .readdirSync(buildPath, { withFileTypes: true })
            .filter((dir) => dir.isDirectory() && !skip.includes(dir.name))
            .map((dir) => tree(`${buildPath}/${dir.name}`))
    ).map((path) => path.substring(buildPath.length))

    return ['/', `/${indexPath}`, ...listAllFiles]
}

function genSWFiles(indexPath, buildPath, regexes, showLogs) {
    fs.writeFile(`dist/swr.js`, swrText, (error) => {
        if (error) {
            console.error(error)
        }
    })

    fs.writeFile(
        `dist/sw.js`,
        genSWText(getFilesToCache(indexPath, buildPath), regexes, showLogs),
        (error) => {
            if (error) {
                console.error(error)
            }
        }
    )

    replace({
        files: './dist/index.html',
        from: '</head>',
        to: '<script defer src="/swr.js"></script>\n    </head>',
    }).catch((error) => {
        console.error('Error occurred:', error)
    })
}

function genSWText(filesToPreCache, regexes = {}, showLogs = false) {
    return `
const regexesOnlineFirst = ${regexes.onlineFirst || "[ '/api/' ]"}
    
const regexesOnlineOnly = ${regexes.onlineOnly || "[ 'http://' ]"}

const regexesCacheFirst = ${
        regexes.cacheFirst ||
        "[ self.location.origin, 'cdn', 'https://rsms.me/inter/' ]"
    }

const regexesCacheOnly = ${regexes.cacheOnly || '[]'}

// If the url doesn't match any of those regexes, it will do online first

const cacheName = 'cache-${packageJson.name}-${Date.now()}'

const filesToPreCache = [
${filesToPreCache.map((x) => "    '" + x + "'").join('\n')}
]

// console.log('sw: origin:', self.location.origin)

self.addEventListener('install', (event) => {
    // console.log('sw: install')
    event.waitUntil(
        caches
            .open(cacheName)
            .then((cache) => {
                // console.log('sw: creating cache:', cacheName)
                return cache.addAll(filesToPreCache)
            })
            .then(() => {
                self.skipWaiting()
            })
    )
})

self.addEventListener('activate', (event) => {
    // console.log('sw: activate')
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((thisCacheName) => {
                    if (thisCacheName !== cacheName) {
                        // console.log('sw: deleting:', thisCacheName)
                        return caches.delete(thisCacheName)
                    }
                })
            ).then(() => self.clients.claim())
        })
    )
})

const update = (event, cache) => {
    return fetch(event.request)
        .then((response) => {
            return caches.open(cacheName).then((cache) => {
                if (event.request.method === 'GET') {
                    cache.put(event.request, response.clone())
                }
                return response
            })
        })
        .catch(() => {
            return cache
        })
}

const cacheFirst = {
    method: (event, cache) => {
        // console.log('sw: fetch: cache first:', event.request.url)
        const fun = update(event, cache)
        return cache || fun
    },
    regexes: regexesCacheFirst,
}

const cacheOnly = {
    method: (event, cache) => {
        // console.log('sw: fetch: cache only:', event.request.url)
        return cache || update(event, cache)
    },
    regexes: regexesCacheOnly,
}

const onlineFirst = {
    method: (event, cache) => {
        // console.log('sw: fetch: online first:', event.request.url)
        return update(event, cache)
    },
    regexes: regexesOnlineFirst,
}

const onlineOnly = {
    method: (event) => {
        // console.log('sw: fetch: online only:', event.request.url)
        return fetch(event.request)
    },
    regexes: regexesOnlineOnly,
}

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cache) => {
            // The order matters !
            const patterns = [cacheFirst, cacheOnly, onlineFirst, onlineOnly]

            for (let pattern of patterns) {
                for (let regex of pattern.regexes) {
                    if (RegExp(regex).test(event.request.url)) {
                        return pattern.method(event, cache)
                    }
                }
            }

            return onlineFirst.method(event, cache)
        })
    )
})
`
}

module.exports = {
    genSWFiles,
}
