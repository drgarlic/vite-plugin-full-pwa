import { genFaviconsConfig, genFavicons } from './favicons.js'
import { genSWFiles } from './sw.js'

function fullPWAPlugin(config = {}) {
    const faviconPath = config.faviconPath || './public/favicon.*'

    const faviconsConfig = genFaviconsConfig(config.faviconsConfig)

    return {
        name: 'full-pwa',

        closeBundle() {
            genSWFiles()
            genFavicons(faviconPath, faviconsConfig)
        },
    }
}

export default fullPWAPlugin
