StackTracey = require ('./stacktracey')
assert      = require ('assert')

describe ('StackTracey', () => {

    it ('works', () => {

        function shouldBeVisibleInStackTrace () { return new StackTracey () }

        const stack = shouldBeVisibleInStackTrace ()

        assert.deepEqual (stack[0], {
            beforeParse: 'at shouldBeVisibleInStackTrace (' + process.cwd () + '/test.js:8:58)',
            callee: 'shouldBeVisibleInStackTrace',
            index: false,
            native: false,
            file: process.cwd () + '/test.js',
            line: 8,
            column: 58,
            calleeShort: 'shouldBeVisibleInStackTrace',
            fileName: 'test.js',
            fileShort: 'test.js',
            thirdParty: false
        })
    })
})



