"use strict";

/*  ------------------------------------------------------------------------ */

const O            = Object,
      isBrowser    = (typeof window !== 'undefined') && (window.window === window) && window.navigator,
      lastOf       = x => x[x.length - 1],
      getSource    = require ('get-source'),
      partition    = require ('./impl/partition')

/*  ------------------------------------------------------------------------ */

class StackTracey extends Array {

    constructor (input, offset) {

        super ()

    /*  new StackTracey ()            */

        if (!input) {
             input = new Error ()
             offset = isBrowser ? 0 : 1 }

    /*  new StackTracey (Error)      */

        if (input instanceof Error) {
            input = input.stack || '' }

    /*  new StackTracey (string)     */

        if (typeof input === 'string') {
            input = StackTracey.rawParse (input).slice (offset).map (StackTracey.extractEntryMetadata) }

    /*  new StackTracey (array)      */

        if (Array.isArray (input)) {

            this.length = input.length
            input.forEach ((x, i) => this[i] = x) }
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

    withSource (i) {
        return StackTracey.withSource (this[i])
    }

    static withSource (loc) {

        if (loc.sourceFile || (loc.file.indexOf ('<') >= 0)) { // skip things like <anonymous> and stuff that was already fetched
            return loc }

        else {
            const resolved = getSource (loc.file).resolve (loc)

            if (resolved.sourceLine.includes ('// @hide')) {
                resolved.sourceLine = resolved.sourceLine.replace ('// @hide', '')
                resolved.hide = true }

            return O.assign ({}, loc, resolved)
        }
    }

    get withSources () {
        return new StackTracey (this.map (StackTracey.withSource))
    }

    get mergeRepeatedLines () {
        return new StackTracey (
            partition (this, e => e.file + e.line).map (
                group => {
                    return group.items.slice (1).reduce ((memo, entry) => {
                        memo.callee      = (memo.callee      || '<anonymous>') + ' → ' + (entry.callee      || '<anonymous>')
                        memo.calleeShort = (memo.calleeShort || '<anonymous>') + ' → ' + (entry.calleeShort || '<anonymous>')
                        return memo }, O.assign ({}, group.items[0])) }))
    }

    get clean () {
        return this.withSources.mergeRepeatedLines.filter ((e, i) => (i === 0) || !(e.thirdParty || e.hide))
    }

    static locationsEqual (a, b) {
        return (a.file   === b.file) &&
               (a.line   === b.line) &&
               (a.column === b.column)
    }

    map (fn) {
        return new StackTracey (Array.prototype.map.call (this, fn))
    }

    filter (fn) {
        return new StackTracey (Array.prototype.filter.call (this, fn))
    }

    slice (begin, end) {
        return new StackTracey (Array.prototype.slice.call (this, begin, end))
    }
}

/*  ------------------------------------------------------------------------ */

module.exports = StackTracey

/*  ------------------------------------------------------------------------ */

