"use strict";

/*  ------------------------------------------------------------------------ */

const O              = Object,
      isBrowser      = (typeof window !== 'undefined') && (window.window === window) && window.navigator,
      nodeRequire    = isBrowser ? null : module.require, // to prevent bundlers from expanding the require call
      lastOf         = x => x[x.length - 1],
      getSource      = require ('get-source'),
      partition      = require ('./impl/partition'),
      asTable        = require ('as-table'),
      nixSlashes     = x => x.replace (/\\/g, '/'),
      pathRoot       = isBrowser ? window.location.href : (nixSlashes (process.cwd ()) + '/')

/*  ------------------------------------------------------------------------ */

class StackTracey {

    constructor (input, offset) {

        const originalInput          = input
            , isParseableSyntaxError = input && (input instanceof SyntaxError && !isBrowser)

    /*  new StackTracey ()            */

        if (!input) {
             input = new Error ()
             offset = (offset === undefined) ? 1 : offset
        }

    /*  new StackTracey (Error)      */

        if (input instanceof Error) {
            input = input.stack || ''
        }

    /*  new StackTracey (string)     */

        if (typeof input === 'string') {
            input = this.rawParse (input).slice (offset).map (x => this.extractEntryMetadata (x))
        }

    /*  new StackTracey (array)      */

        if (Array.isArray (input)) {

            if (isParseableSyntaxError) {

                const rawLines = nodeRequire ('util').inspect (originalInput).split ('\n')
                    , fileLine = rawLines[0].split (':')
                    , line = fileLine.pop ()
                    , file = fileLine.join (':')

                if (file) {
                    input.unshift ({
                        file: nixSlashes (file),
                        line: line,
                        column: (rawLines[2] || '').indexOf ('^') + 1,
                        sourceLine: rawLines[1],
                        callee: '(syntax error)',
                        syntaxError: true
                    })
                }
            }

            this.items = input

        } else {
            this.items = []
        }
    }

    extractEntryMetadata (e) {

        const decomposedPath = this.decomposePath (e.file || '')
        const fileRelative = decomposedPath[0]
        const externalDomain = decomposedPath[1]

        return O.assign (e, {

            calleeShort:    e.calleeShort || lastOf ((e.callee || '').split ('.')),
            fileRelative:   fileRelative,
            fileShort:      this.shortenPath (fileRelative),
            fileName:       lastOf ((e.file || '').split ('/')),
            thirdParty:     this.isThirdParty (fileRelative, externalDomain) && !e.index,
            externalDomain: externalDomain
        })
    }

    shortenPath (relativePath) {
        return relativePath.replace (/^node_modules\//, '')
                           .replace (/^webpack\/bootstrap\//, '')
                           .replace (/^__parcel_source_root\//, '')
    }

    decomposePath (fullPath) {
        let result = fullPath

        if (isBrowser) result = result.replace (pathRoot, '')

        const externalDomainMatch = result.match (/^(http|https)\:\/\/?([^\/]+)\/(.*)/)
        const externalDomain = externalDomainMatch ? externalDomainMatch[2] : undefined
        result = externalDomainMatch ? externalDomainMatch[3] : result

        if (!isBrowser) result = nodeRequire ('path').relative (pathRoot, result)

        return [
            nixSlashes(result).replace (/^.*\:\/\/?\/?/, ''), // cut webpack:/// and webpack:/ things
            externalDomain
        ]
    }

    isThirdParty (relativePath, externalDomain) {
        return externalDomain ||
               (relativePath[0] === '~')                          || // webpack-specific heuristic
               (relativePath[0] === '/')                          || // external source
               (relativePath.indexOf ('node_modules')      === 0) ||
               (relativePath.indexOf ('webpack/bootstrap') === 0)
    }

    rawParse (str) {

        const lines = (str || '').split ('\n')

        const entries = lines.map (line => {

            line = line.trim ()

            let callee, fileLineColumn = [], native, planA, planB

            if ((planA = line.match (/at (.+) \(eval at .+ \((.+)\), .+\)/)) || // eval calls
                (planA = line.match (/at (.+) \((.+)\)/)) ||
                ((line.slice (0, 3) !== 'at ') && (planA = line.match (/(.*)@(.*)/)))) {

                callee         =  planA[1]
                native         = (planA[2] === 'native')
                fileLineColumn = (planA[2].match (/(.*):(\d+):(\d+)/) ||
                                  planA[2].match (/(.*):(\d+)/) || []).slice (1)

            } else if ((planB = line.match (/^(at\s+)*(.+):(\d+):(\d+)/) )) {
                fileLineColumn = (planB).slice (2)

            } else {
                return undefined
            }

        /*  Detect things like Array.reduce
            TODO: detect more built-in types            */

            if (callee && !fileLineColumn[0]) {
                const type = callee.split ('.')[0]
                if (type === 'Array') {
                    native = true
                }
            }

            return {
                beforeParse: line,
                callee:      callee || '',
                index:       isBrowser && (fileLineColumn[0] === window.location.href),
                native:      native || false,
                file:        nixSlashes (fileLineColumn[0] || ''),
                line:        parseInt (fileLineColumn[1] || '', 10) || undefined,
                column:      parseInt (fileLineColumn[2] || '', 10) || undefined
            }
        })

        return entries.filter (x => (x !== undefined))
    }

    withSourceAt (i) {
        return this.items[i] && this.withSource (this.items[i])
    }

    withSourceAsyncAt (i) {
        return this.items[i] && this.withSourceAsync (this.items[i])
    }

    withSource (loc) {

        if (this.shouldSkipResolving (loc)) {
            return loc

        } else {

            let resolved = getSource (loc.file || '').resolve (loc)

            if (!resolved.sourceFile) {
                return loc
            }

            return this.withSourceResolved (loc, resolved)
        }
    }

    withSourceAsync (loc) {

        if (this.shouldSkipResolving (loc)) {
            return Promise.resolve (loc)

        } else {
            return getSource.async (loc.file || '')
                        .then (x => x.resolve (loc))
                        .then (resolved => this.withSourceResolved (loc, resolved))
                        .catch (e => this.withSourceResolved (loc, { error: e, sourceLine: '' }))
        }
    }

    shouldSkipResolving (loc) {
        return loc.sourceFile || loc.error || (loc.file && loc.file.indexOf ('<') >= 0) // skip things like <anonymous> and stuff that was already fetched
    }

    withSourceResolved (loc, resolved) {

        if (resolved.sourceFile && !resolved.sourceFile.error) {
            resolved.file = nixSlashes (resolved.sourceFile.path)
            resolved = this.extractEntryMetadata (resolved)
        }

        if (resolved.sourceLine.includes ('// @hide')) {
            resolved.sourceLine = resolved.sourceLine.replace  ('// @hide', '')
            resolved.hide       = true
        }

        if (resolved.sourceLine.includes ('__webpack_require__') || // webpack-specific heuristics
            resolved.sourceLine.includes ('/******/ ({')) {
            resolved.thirdParty = true
        }

        return O.assign ({ sourceLine: '' }, loc, resolved)
    }

    withSources () {
        return this.map (x => this.withSource (x))
    }

    withSourcesAsync () {
        return Promise.all (this.items.map (x => this.withSourceAsync (x)))
                      .then (items => new this.constructor (items))
    }

    mergeRepeatedLines () {
        return new this.constructor (
            partition (this.items, e => e.file + e.line).map (
                group => {
                    return group.items.slice (1).reduce ((memo, entry) => {
                        memo.callee      = (memo.callee      || '<anonymous>') + ' → ' + (entry.callee      || '<anonymous>')
                        memo.calleeShort = (memo.calleeShort || '<anonymous>') + ' → ' + (entry.calleeShort || '<anonymous>')
                        return memo
                    }, O.assign ({}, group.items[0]))
                }
            )
        )
    }

    clean () {
        const s = this.withSources ().mergeRepeatedLines ()
        return s.filter (s.isClean.bind (s))
    }

    cleanAsync () {
        return this.withSourcesAsync ().then (s => {
            s = s.mergeRepeatedLines ()
            return s.filter (s.isClean.bind (s))
        })
    }

    isClean (entry, index) {
        return (index === 0) || !(entry.thirdParty || entry.hide || entry.native)
    }

    at (i) {
        return O.assign ({

            beforeParse: '',
            callee:      '<???>',
            index:       false,
            native:      false,
            file:        '<???>',
            line:        0,
            column:      0

        }, this.items[i])
    }

    asTable (opts) {

        const maxColumnWidths = (opts && opts.maxColumnWidths) || this.maxColumnWidths ()

        const trimEnd   = (s, n) => s && ((s.length > n) ? (s.slice (0, n-1) + '…') : s)
        const trimStart = (s, n) => s && ((s.length > n) ? ('…' + s.slice (-(n-1))) : s)

        const trimmed = this.map (
            e => [
                ('at ' + trimEnd (e.calleeShort,                                maxColumnWidths.callee)),
                trimStart ((e.fileShort && (e.fileShort + ':' + e.line)) || '', maxColumnWidths.file),
                trimEnd (((e.sourceLine || '').trim () || ''),                  maxColumnWidths.sourceLine)
            ]
        )

        return asTable (trimmed.items)
    }

    maxColumnWidths () {
        return {
            callee:     30,
            file:       60,
            sourceLine: 80
        }
    }

    static resetCache () {

        getSource.resetCache ()
        getSource.async.resetCache ()
    }

    static locationsEqual (a, b) {

        return (a.file   === b.file) &&
               (a.line   === b.line) &&
               (a.column === b.column)
    }
}

/*  Array methods
    ------------------------------------------------------------------------ */

;['map', 'filter', 'slice', 'concat'].forEach (method => {

    StackTracey.prototype[method] = function (/*...args */) { // no support for ...args in Node v4 :(
        return new this.constructor (this.items[method].apply (this.items, arguments))
    }
})

/*  ------------------------------------------------------------------------ */

module.exports = StackTracey
