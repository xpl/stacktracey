"use strict";

/*  ------------------------------------------------------------------------ */
                    
require ('chai').should ()

/*  ------------------------------------------------------------------------ */

describe ('StackTracey', () => {

    const StackTracey = require ('./stacktracey')

    const shouldBeVisibleInStackTrace = () => new StackTracey ()

    it ('works', () => {

        const stack = shouldBeVisibleInStackTrace ()

        stack.should.be.an.instanceof (Array)

        stack[0].should.deep.equal ({
            beforeParse: 'at shouldBeVisibleInStackTrace (' + process.cwd () + '/test.js:13:47)',
            callee: 'shouldBeVisibleInStackTrace',
            index: false,
            native: false,
            file: process.cwd () + '/test.js',
            line: 13,
            column: 47,
            calleeShort: 'shouldBeVisibleInStackTrace',
            fileName: 'test.js',
            fileShort: 'test.js',
            thirdParty: false
        })
    })

    it ('allows to read sources', () => {

        const stack = shouldBeVisibleInStackTrace ().withSources
              stack.should.be.an.instanceof (StackTracey)
              stack[0].sourceLine.should.equal ('    const shouldBeVisibleInStackTrace = () => new StackTracey ()')
    })

    it ('handles inaccessible files', () => {

        const stack = shouldBeVisibleInStackTrace ()
              stack[0].file = '^___^'
              stack.withSources[0].sourceLine.should.equal ('')
              stack.withSources[0].error.should.be.an.instanceof (Error)
    })
})



