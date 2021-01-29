const favicons = require('./favicons.js')
const sw = require('./sw.js')

function fullPWAPlugin(config = {}) {
    const faviconPath = config.faviconPath || './public/favicon.*'

    const indexPath = config.indexPath || 'index.html'

    const buildPath = config.buildPath || 'dist'

    const faviconsConfig = favicons.genFaviconsConfig(config.faviconsConfig)

    return {
        name: 'full-pwa',

        closeBundle() {
            sw.genSWFiles(
                indexPath,
                buildPath,
                config.swRegexes,
                config.swShowLogs
            )
            favicons.genFavicons(faviconPath, faviconsConfig)
        },
    }
}

module.exports = fullPWAPlugin
fullPWAPlugin.default = fullPWAPlugin
