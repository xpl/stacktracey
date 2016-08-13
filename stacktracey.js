"use strict";

const O          = require ('es7-object-polyfill'),
      isBrowser  = (typeof window !== 'undefined') && (window.window === window) && window.navigator,
      lastOf     = x => x[x.length - 1]

class StackTracey extends Array {

    constructor (input, offset) {

        super ()

    /*  new StackTrace ()            */

        if (!input) {
             input = new Error ()
             offset = isBrowser ? 0 : 1 }

    /*  new StackTrace (Error)      */

        if (input instanceof Error) {
            input = input.stack || '' }

    /*  new StackTrace (string)     */

        if (typeof input === 'string') {
            input = StackTracey.rawParse (input).map (StackTracey.extractEntryMetadata) }

    /*  new StackTrace (array)      */

        if (Array.isArray (input)) {

            this.length = input.length
            input.slice (offset).forEach ((x, i) => this[i] = x) }
    }

    static extractEntryMetadata (e) { const short = StackTracey.shortenPath (e.file)

        return O.assign (e, {

            calleeShort:    lastOf (e.callee.split ('.')),
            fileName:       lastOf (e.file  .split ('/')),
            fileShort:      short,
            thirdParty:     StackTracey.isThirdParty (short) && !e.index })
    }

    static shortenPath (path) {
        return path.replace (isBrowser ? window.location.href : (process.cwd () + '/'), '')
    }

    static isThirdParty (shortPath) {
        return shortPath.indexOf ('node_modules') === 0
    }

    static rawParse (str) {

        const lines = (str || '').split ('\n')

        const entries = lines.map (line => { line = line.trim ()

            var callee, fileLineColumn = [], native, planA, planB

            if ((planA = line.match (/at (.+) \((.+)\)/)) ||
                (planA = line.match (/(.*)@(.*)/))) {

                callee         =  planA[1]
                native         = (planA[2] === 'native')
                fileLineColumn = (planA[2].match (/(.*):(.+):(.+)/) || []).slice (1) }

            else if ((planB = line.match (/^(at\s+)*(.+):([0-9]+):([0-9]+)/) )) {
                fileLineColumn = (planB).slice (2) }

            else {
                return undefined }

            return {
                beforeParse: line,
                callee:      callee || '',
                index:       isBrowser && (fileLineColumn[0] === window.location.href),
                native:      native || false,
                file:        fileLineColumn[0] || '',
                line:        parseInt (fileLineColumn[1] || '', 10) || undefined,
                column:      parseInt (fileLineColumn[2] || '', 10) || undefined } })

        return entries.filter (x => (x !== undefined))
    }

    static get withSources () {


    }
}

module.exports = StackTracey
