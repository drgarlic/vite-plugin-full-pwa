const favicons = require('./favicons.js')
const sw = require('./sw.js')

function fullPWAPlugin(config = {}) {
    const faviconPath = config.faviconPath || './public/favicon.*'

    const faviconsConfig = favicons.genFaviconsConfig(config.faviconsConfig)

    return {
        name: 'full-pwa',

        closeBundle() {
            sw.genSWFiles()
            favicons.genFavicons(faviconPath, faviconsConfig)
        },
    }
}

export default fullPWAPlugin
