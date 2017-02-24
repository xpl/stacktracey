# StackTracey

Platform-agnostic callstack access helper.

## Why

- [x] Simple
- [x] Allows hiding library calls / ad-hoc exclusion (via `// @hide` marker)
- [x] Provides source text for call locations
- [x] Fetches sources synchronously, via [get-source](https://github.com/xpl/get-source)
- [x] Full sourcemap support

## What for

- Better exception reporting for Node and browsers
- Advanced logging (displaying call locations)
- Assertion printing

## How to

```bash
npm install stacktracey
```

```javascript
StackTracey = require ('stacktracey')
```

Captures current call stack:

```javascript
stack = new StackTracey ()            // captures current call stack
```

Parses stacks from `Error` object:

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

Each item exposes:

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

```
stack = stack.withSources // will return a copy of stack with all items supplied with sources
top   = stack[0]
```
```javascript
top = stack.withSource (0) // supplies source for an individiual item
```
```javascript
top = StackTracey.withSource (stack[0]) // supplies source for an individiual item
```

This will return item supplied with source code info (already mapped through sourcemaps):

```javascript
{
    ... // all previous fields

    line:       <original line number>,
    column:     <original column number>,
    sourceFile: <original source file object>,
    sourceLine: <original source line text>
}
```

To learn about `sourceFile` object, read [get-source](https://github.com/xpl/get-source#get-source) docs.

## Cleaning output

```javascript
stack = stack.withSources.clean
```

1. Excludes locations marked with `isThirdParty` (library calls)
2. Excludes locations marked with `// @hide` comment (user defined exclusion)
3. Merges repeated lines (via `.mergeRepeatedLines`)

You can augment `isThirdParty` predicate with new rules:

```javascript
StackTracey.isThirdParty.include (path => path.includes ('my-lib')) // my-lib paths will  be marked as thirdParty
```

```javascript
StackTracey.isThirdParty.except  (path => path.includes ('jquery')) // jquery paths won't be marked as thirdParty
```

You can add exceptions to the `isThirdParty` predicate:

```javascript
```

P.S. It is better to call `.clean` on stacks supplied with sources (i.e. after calling `.withSources`), to make `// @hide` magic work, and to make `isThirdParty` work by recognizing proper file names, if your source is compiled from other sources and has a sourcemap attached.

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

## See also

Check out a fullstack framework that utilizes all this magic for better error reporting: [Useless™](https://github.com/xpl/useless).
