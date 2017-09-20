# StackTracey

[![Build Status](https://travis-ci.org/xpl/stacktracey.svg?branch=master)](https://travis-ci.org/xpl/stacktracey) [![Coverage Status](https://coveralls.io/repos/github/xpl/stacktracey/badge.svg)](https://coveralls.io/github/xpl/stacktracey) [![NPM](https://img.shields.io/npm/v/stacktracey.svg)](http://npmjs.com/package/stacktracey) [![Scrutinizer Code Quality](https://img.shields.io/scrutinizer/g/xpl/stacktracey.svg)](https://scrutinizer-ci.com/g/xpl/stacktracey/?branch=master) [![dependencies Status](https://david-dm.org/xpl/stacktracey/status.svg)](https://david-dm.org/xpl/stacktracey) [![devDependencies Status](https://david-dm.org/xpl/stacktracey/dev-status.svg)](https://david-dm.org/xpl/stacktracey?type=dev)

Parses call stacks. Reads sources. Clean & filtered output. Sourcemaps. Node & browsers.

## Why

- [x] Simple
- [x] Allows hiding library calls / ad-hoc exclusion (via `// @hide` marker)
- [x] Provides source text for call locations
- [x] Fetches sources synchronously (even in browsers) via [get-source](https://github.com/xpl/get-source)
- [x] Full sourcemap support
- [x] Pretty printing

## What for

- [Better exception reporting](https://github.com/xpl/ololog#pretty-printing-error-instances) for Node and browsers
- [Advanced logging](https://github.com/xpl/ololog#displaying-call-location) (displaying call locations)
- Assertion printing

## How to

```bash
npm install stacktracey
```

```javascript
StackTracey = require ('stacktracey')
```

Captures the current call stack:

```javascript
stack = new StackTracey ()            // captures current call stack
```

Parses stacks from an `Error` object:

```javascript
stack = new StackTracey (error)       // parses error.stack
stack = new StackTracey (error.stack) // raw string
```

It is an array instance:

```javascript
stack instanceof Array // returns true
stack.length           // num entries
stack[0]               // top
```

...where each item exposes:

```javascript
{
    beforeParse: <original text>,
    callee:      <function name>,
    calleeShort: <shortened function name>,
    file:        <full path to file>,       // e.g. /Users/john/my_project/src/foo.js
    fileShort:   <shortened path to file>,  // e.g. src/foo.js
    fileName:    <file name>',              // e.g. foo.js
    line:        <line number>,             // starts from 1
    column:      <column number>,           // starts from 1

    index:          /* true if occured in HTML file at index page   */,
    native:         /* true if occured in native browser code       */,
    thirdParty:     /* true if occured in library code              */,
    hide:           /* true if marked as hidden by "// @hide" tag   */
}
```

Accessing sources:

```javascript
stack = stack.withSources // will return a copy of stack with all items supplied with sources
top   = stack[0]          // top item
```

...or:

```javascript
top = stack.withSource (0) // supplies source for an individiual item
```

...or:

```javascript
top = StackTracey.withSource (stack[0]) // supplies source for an individiual item
```

It will return an item supplied with the source code info (already mapped through sourcemaps):

```javascript
{
    ... // all the previously described fields

    line:       <original line number>,
    column:     <original column number>,
    sourceFile: <original source file object>,
    sourceLine: <original source line text>
}
```

To learn about the `sourceFile` object, read the [get-source](https://github.com/xpl/get-source#get-source) docs.

## Cleaning output

```javascript
stack = stack.withSources.clean
```

1. Excludes locations marked with the `isThirdParty` flag (library calls)
2. Excludes locations marked with a `// @hide` comment (user defined exclusion)
3. Merges repeated lines (via the `.mergeRepeatedLines`)

You can augment the global `isThirdParty` predicate with new rules:

```javascript
StackTracey.isThirdParty.include (path => path.includes ('my-lib')) // paths including 'my-lib' will be marked as thirdParty
```
```javascript
StackTracey.isThirdParty.except (path => path.includes ('jquery')) // jquery paths won't be marked as thirdParty
```

P.S. It is better to call `.clean` on stacks supplied with sources (i.e. after the `.withSources`), to make the `// @hide` magic work, and to make third-party recognition work by reading proper file names in case if your source is compiled from other sources (and has a sourcemap attached).

## Pretty printing

```javascript
const prettyPrintedString = new StackTracey ().pretty
```

It produces a nice compact table layout, supplied with source lines (if available). You can even replace the default NodeJS exception printer with this!

```
at shouldBeVisibleInStackTrace     test.js:25                              const shouldBeVisibleInStackTrace = () => new StackTracey ()
at it                              test.js:100                             const stack = shouldBeVisibleInStackTrace ()                
at callFn                          node_modules/mocha/lib/runnable.js:326  var result = fn.call(ctx);                                  
at run                             node_modules/mocha/lib/runnable.js:319  callFn(this.fn);                                            
at runTest                         node_modules/mocha/lib/runner.js:422    test.run(fn);                                               
at                                 node_modules/mocha/lib/runner.js:528    self.runTest(function(err) {                                
at next                            node_modules/mocha/lib/runner.js:342    return fn();                                                
at                                 node_modules/mocha/lib/runner.js:352    next(suites.pop());                                         
at next                            node_modules/mocha/lib/runner.js:284    return fn();                                                
at <anonymous>                     node_modules/mocha/lib/runner.js:320    next(0);                  
```

## Array methods

All StackTracey instances expose `map`, `filter`, `concat`, `reverse` and `slice` methods. These methods will return mapped, filtered, joined, reversed and sliced stacks, respectively:

```javascript
s = new StackTracey ().slice (1).filter (x => !x.isThirdParty) // current stack shifted by 1 and cleaned from library calls

s instanceof StackTracey // true
s instanceof Array       // true
```

Other methods of the `Array` are supported too, but they will return `Array` instances, not StackTracey instances. You can convert from array via this:

```javascript
stack = new StackTracey (array)
```

..and to array via this (but generally this is not needed — you can pass around StackTracey instances as if they were real Arrays):

```javascript
Array.from (stack)
```

## Extra stuff

You can compare two locations via this predicate (tests `file`, `line` and `column` for equality):

```javascript
StackTracey.locationsEqual (a, b)
```

## Applications

- [Ololog](https://github.com/xpl/ololog) — a better `console.log` for the log-driven debugging junkies!
