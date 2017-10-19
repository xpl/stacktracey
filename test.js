"use strict";

/*  ------------------------------------------------------------------------ */
                    
require ('chai').should ()

/*  ------------------------------------------------------------------------ */

describe ('impl/partition', () => {

    const partition = require ('./impl/partition')
    const spans     = partition ([ 'a', 'b', 'c', undefined, undefined, 42], x => typeof x)

    spans.should.deep.equal ([ { label: 'string',    items: ['a', 'b', 'c'] },
                               { label: 'undefined', items: [undefined, undefined] },
                               { label: 'number',    items: [42] } ])
})

/*  ------------------------------------------------------------------------ */

describe ('StackTracey', () => {

    const StackTracey = require ('./stacktracey'); StackTracey.resetCache ()

    const shouldBeVisibleInStackTrace = () => new StackTracey () // @hide

    it ('works', () => {

        const stack = shouldBeVisibleInStackTrace ()

        stack.should.be.an.instanceof (Array)

        stack[0].should.deep.equal ({
            beforeParse: 'at shouldBeVisibleInStackTrace (' + process.cwd () + '/test.js:25:47)',
            callee: 'shouldBeVisibleInStackTrace',
            index: false,
            native: false,
            file: process.cwd () + '/test.js',
            line: 25,
            column: 47,
            calleeShort: 'shouldBeVisibleInStackTrace',
            fileName: 'test.js',
            fileRelative: 'test.js',
            fileShort: 'test.js',
            thirdParty: false
        })
    })

    it ('allows to read sources', () => {

        const stack = shouldBeVisibleInStackTrace ().withSources // @hide

              stack.should.be.an.instanceof (StackTracey)
              stack[0].beforeParse.should.not.be.undefined // should preserve previous fields
              stack[0].sourceLine.should.equal ('    const shouldBeVisibleInStackTrace = () => new StackTracey () ')
              stack[0].hide.should.equal (true) // reads // @hide marker
              stack[1].hide.should.equal (true) // reads // @hide marker

        const cleanStack = stack.clean

        cleanStack.should.be.an.instanceof (StackTracey)

        StackTracey.locationsEqual (cleanStack[0], stack[0]).should.equal (true)  // should not clean top element
        StackTracey.locationsEqual (cleanStack[1], stack[1]).should.equal (false) // should clean second element (due to // @hide)
    })

    it ('allows creation from array + groups duplicate lines', () => {

        const stack = new StackTracey ([
            { file: 'yo.js',  line: 11, callee: 'a.funkktion',   calleeShort: 'a' },
            { file: 'yo.js',  line: 10, callee: 'foobar.boobar', calleeShort: 'foobar' },
            { file: 'yo.js',  line: 10, callee: 'foobar.boobar', calleeShort: 'foobar' },
            { file: 'lol.js', line: 10, callee: '',              calleeShort: '' },
        ])

        const clean = stack.clean.map (x => Object.assign ({
                                                    file: x.file,
                                                    line: x.line,
                                                    callee: x.callee,
                                                    calleeShort: x.calleeShort }))

        clean.should.be.an.instanceof (StackTracey)

        Array.from (clean).should.deep.equal ([ // .should does not recognize StackTracey as normal array...

            { file: process.cwd () + '/yo.js',  line: 11, callee: 'a.funkktion',   calleeShort: 'a' },
            { file: process.cwd () + '/yo.js',  line: 10, callee: 'foobar.boobar → foobar.boobar', calleeShort: 'foobar → foobar' },
            { file: process.cwd () + '/lol.js', line: 10, callee: '',              calleeShort: '' },
        ])
    })

    it ('handles inaccessible files', () => {

        const stack = shouldBeVisibleInStackTrace ()
              stack[0].file = '^___^'
              stack.withSources[0].sourceLine.should.equal ('')
              stack.withSources[0].error.should.be.an.instanceof (Error)
    })

    it ('exposes some Array methods', () => {

        const stack = shouldBeVisibleInStackTrace ()
        const sliced = stack.slice (1)
        const deltaLength = (stack.length - sliced.length)

        deltaLength.should.equal (1)
        sliced.should.be.an.instanceof (StackTracey)

        sliced.filter (x => true).should.be.an.instanceof (StackTracey)
    })

    it ('works with sourcemaps', () => {

        const path = require ('path'),
              mkay = require ('./test_files/mkay.uglified')

        try {
            mkay ()
        }
        catch (e) {

            e.message.should.equal ('mkay')

            const top = new StackTracey (e).withSources[0]

            top.line        .should.equal (4)
            top.column      .should.equal (22)
            top.sourceLine  .should.equal ('\t\t\t\t\tthrow new Error (\'mkay\') }')

            top.file        .should.equal (path.resolve ('./test_files/mkay.js'))
            top.fileShort   .should.equal ('test_files/mkay.js')
            top.fileName    .should.equal ('mkay.js')
        }
    })

    it ('pretty printing works', function prettyTest () {

        const pretty = new StackTracey ().clean.pretty

        pretty.split ('\n')[0].should.equal ('at prettyTest                      test.js:138    const pretty = new StackTracey ().clean.pretty')

        ;(new StackTracey ([
            { },
            { }
        ]).clean.pretty).trim ().should.equal ('at <anonymous> → <anonymous>')
    })

    it ('exposes Array methods', () => {

        const stack = new StackTracey ([
            { file: 'foo' },
            { file: 'bar' }
        ])

        const mapped = stack.map ((x, i) => Object.assign (x, { i }))

        mapped.should.deep.equal ([ { file: 'foo', i: 0 }, { file: 'bar', i: 1 } ])
        mapped.should.be.an.instanceof (Array)
        mapped.should.be.an.instanceof (StackTracey)

        stack.reduce ((memo, x) => memo + x.file, '').should.equal ('foobar')

        const filtered = stack.filter (x => x.file === 'bar')

        filtered.length.should.equal (1)
        filtered[0].should.deep.equal ({ file: 'bar', i: 1 })
    })

    it ('computes relative path correctly', () => {
        
        StackTracey.relativePath  ('webpack:///~/jquery/dist/jquery.js')
                    .should.equal (            '~/jquery/dist/jquery.js')

        StackTracey.relativePath  ('webpack:/webpack/bootstrap')
                    .should.equal (          'webpack/bootstrap')
    })

    it ('computes short path correctly', () => {

        StackTracey.shortenPath   ('webpack/bootstrap/jquery/dist/jquery.js')
                    .should.equal ('jquery/dist/jquery.js')

        StackTracey.shortenPath   ('node_modules/jquery/dist/jquery.js')
                    .should.equal ('jquery/dist/jquery.js')
    })

    const nodeVersion = Number (process.version.match(/^v(\d+\.\d+)/)[1])
    if (nodeVersion >= 5) {

        it ('recognizes SyntaxErrors', () => {

            try { require ('./test_files/syntax_error.js') }
            catch (e) {

                const stack = new StackTracey (e).clean

                stack[0].syntaxError.should.equal (true)
                stack[0].column.should.equal (5)
                stack.pretty.split ('\n')[0].should.equal ('at (syntax error)                  test_files/syntax_error.js:2  foo->bar ()                                     ')
            }
        })
    }

    it ('implements StackTracey.isThirdParty', () => {

        StackTracey.isThirdParty.include (path => path === 'test.js')

        new StackTracey ()[0].thirdParty.should.equal (true)

        StackTracey.isThirdParty.except (path => path === 'test.js')
        
        new StackTracey ()[0].thirdParty.should.equal (false)
    })

    it ('.withSource', () => {

        const line = new StackTracey ().withSource (0).sourceLine.trim ()
        line.should.equal ('const line = new StackTracey ().withSource (0).sourceLine.trim ()')
    })

    it ('.at', () => {
        
        new StackTracey ().at (0).file.includes ('stacktracey/test.js').should.equal (true)
    })
})



