const favicons = require('favicons')
const glob = require('glob')
const fs = require('fs')
const replace = require('replace-in-file')

const packageJson = require('./package.json')

export function genFaviconsConfig(config = {}) {
    const defaultBackground = '#000000'
    const defaultOffset = 5

    const faviconsConfig = {
        path: config.path || '/favicons/',

        background: config.background || defaultBackground,
        theme_color: config.themeColor || defaultBackground,
        appleStatusBarStyle: config.appleStatusBarStyle || 'black-translucent',

        scope: config.scope || '/',
        start_url: config.startURL || '/',

        display: config.scope || 'standalone',
        orientation: config.scope || 'portrait',

        logging: false,

        icons: {
            android: {
                background: config.background || defaultBackground,
                offset: config.offset || defaultOffset,
            },
            appleIcon: {
                offset: config.offset || defaultOffset,
            },
            appleStartup: {
                offset: (config.offset || defaultOffset) * 2,
            },
            coast: false,
            favicons: {
                background: config.background || defaultBackground,
                offset: config.offset || defaultOffset,
            },
            firefox: {
                offset: (config.offset || defaultOffset) * 2,
                overlayGlow: false,
            },
            windows: {
                background: config.background || defaultBackground,
                offset: config.offset || defaultOffset,
            },
            yandex: false,
        },
    }

    faviconsConfig.appName = config.faviconsConfig?.appName || packageJson.name
    faviconsConfig.appShortName =
        config.faviconsConfig?.appShortName ||
        faviconsConfig.appName ||
        packageJson.name
    faviconsConfig.appDescription = packageJson.description
    faviconsConfig.developerName = packageJson.author?.name
    faviconsConfig.developerURL = packageJson.author?.url
    faviconsConfig.version = packageJson.version

    return faviconsConfig
}

export function genFavicons(faviconPath, faviconsConfig) {
    const files = glob.sync(faviconPath)

    favicons(files[0], faviconsConfig, (error, response) => {
        if (error) {
            console.log(error.message)
            return
        }

        fs.mkdirSync(`dist${faviconsConfig.path}`)

        response.images.forEach((image) => {
            fs.writeFile(
                `dist${faviconsConfig.path}${image.name}`,
                image.contents,
                (error) => {
                    if (error) {
                        console.error(error)
                    }
                }
            )
        })

        response.files.forEach((file) => {
            fs.writeFile(
                `dist${faviconsConfig.path}${file.name}`,
                file.contents,
                (error) => {
                    if (error) {
                        console.error(error)
                    }
                }
            )
        })

        replace({
            files: './dist/index.html',
            from: '</head>',
            to: response.html.join('\n') + '\n</head>',
        }).catch((error) => {
            console.error('Error occurred:', error)
        })
    })
}
