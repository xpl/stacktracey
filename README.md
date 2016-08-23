# StackTracey

Platform-agnostic callstack access helper.

## Why

- Simple
- Provides source text for call locations
- Fetches sources synchronously, via [get-source](https://github.com/xpl/get-source)
- Full sourcemap support

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
    file:        <full path to file>,		// e.g. /Users/john/my_project/src/foo.js
    fileShort:   <shortened path to file>,  // e.g. src/foo.js
    fileName:    <file name>',				// e.g. foo.js
    line:        <line number>,             // starts from 1
    column:      <column number>,           // starts from 1

    index: 			/* true if occured in HTML file at index page	*/,
    native: 		/* true if occured in native browser code  	    */,
    thirdParty:		/* true if occured in library code			    */
}
```

Accessing sources:

```
stack.withSources[0] // stack.withSources will return a copy of stack with all items supplied with sources
stack.withSource (0)
StackTracey.withSource (stack[0])
```

This will return item supplied with source code info (already mapped through sourcemaps):

```
{
	... // all previous fields

    line:       <original line number>,
    column:     <original column number>,
    sourceFile: <original source file object>,
    sourceLine: <original source line text>
}
```

To learn about `sourceFile` object, read [get-source](https://github.com/xpl/get-source) docs.

## Warning

Note that `.map`, `.filter` (and other `Array` methods) will return `Array` instances, not `StackTracey` instances. You can convert arrays to `StackTracey` instances via this:

```
cleanStack = new StackTracey (stack.filter (x => !x.isThirdParty))
```