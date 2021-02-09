import { Plugin } from 'vite'

export interface Options {
    /**
     * Path to favicon
     * default: './public/favicon.*'
     */
    faviconPath?: string

    /**
     * Path to index
     * default: 'index.html'
     */
    indexPath?: string

    /**
     * Path to index
     * default: 'dist'
     */
    buildPath?: string

    /**
     * Path to index
     * default: 'dist'
     */
    faviconsConfig?: object

    /**
     * Path to index
     * default: 'dist'
     */
    swRegexes: object

    /**
     * Show logs of the service worker
     * default: false
     */
    swShowLogs: boolean
}

declare function createPlugin(options?: Options): Plugin

export default createPlugin
