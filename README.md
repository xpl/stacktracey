# String.ify

A small, simple cross-platform JavaScript object stringifier / pretty-printer.

## Why

- Humanized output
- Highly configurable
- Pluggable rendering (via [Symbols](https://github.com/xpl/string.ify/blob/master/README.md#with-symbols))
- Works in Node and browsers

## Installing

```javascript
npm install string.ify
```

In your code:

```javascript
String.ify = require ('string.ify') // assign to anything you want... String.ify is here just for fun purposes
```

## How it works

```javascript
String.ify ({ obj: [{ someLongPropertyName: 1, propertyName: 2, anotherProp: 4, moreProps: 5 },
                    { propertyName: { foobarbaz: true, qux: 6, zap: "lol" } }] })
```

Will output:

```
{ obj: [ { someLongPropertyName: 1,
                   propertyName: 2,
                    anotherProp: 4,
                      moreProps: 5  },
         { propertyName: { foobarbaz:  true,
                                 qux:  6,
                                 zap: "lol"  } } ] }
```

As you can see, it does some fancy alignment to make complex nested objects look more readable:

![GIF animation](http://wtf.jpg.wtf/13/34/1470446586-13341a275886bd6be2af39e3c24f2f31.gif)

It automatically detects whether the pretty printing is nessesary: if total output is less than 80 symbols wide, it renders it as single line:

```javascript
String.ify ({ foo: 1, bar: 2 }) // { foo: 1, bar: 2 }
```

It handles `global` and `window` references, so it wont mess up your output:

```javascript
String.ify ({ root: global }) // { root: global }
```

Cyclic references:

```javascript
var obj = {}
    obj.foo = { bar: [obj] }

String.ify (obj) // { foo: { bar: [<cyclic>] } }
```

Collapsing multiple references to the same object:

```javascript
var obj = {}

String.ify ([obj, obj, obj]) // [{  }, <ref:1>, <ref:1>]
```

It even understands jQuery objects and DOM nodes:

```javascript
$('<button id="send" class="red" /><button class="red" />']).appendTo (document.body)

String.ify ($('button'))                           // "[ <button#send.red>, <button.blue> ]"
String.ify (document.createTextNode ('some text')) // "@some text"
```

## Configuring output

Configuring goes like this:

```javascript
String.ify = require ('string.ify').configure ({ /* params */ })
```

Returned function will have that `configure` method too (will join new params with previous ones):

```javascript
newStringify = String.ify.configure ({ /* override params */ })
```

You can force single-line rendering by setting `{ pretty: false }`:

```javascript
String.ify.configure ({ pretty: false })
    ({ nil: null, nope: undefined, fn: function ololo () {}, bar: [{ baz: "garply", qux: [1, 2, 3] }] })
//   { nil: null, nope: undefined, fn: <function:ololo>,     bar: [{ baz: "garply", qux: [1, 2, 3] }] }
```

Setting `maxStringLength` (default is `60`):

```javascript
String.ify.configure ({ maxStringLength: 4 }) ({ yo: 'blablablabla' }) // { yo: "bla…" }
```

JSON-compatible output:

```javascript
String.ify.configure ({ json: true }) ({ foo: { bar: 'baz' } }) // { "foo": { "bar": "baz" } }
```

JavaScript output:

```javascript
String.ify.configure ({ pure: true }) ({ yo: function () { return 123 } }) // { yo: function () { return 123 } }
```

Setting `maxDepth` (defaults to `5`) and `maxArrayLength` (defaults to `60`):

```javascript
String.ify.configure ({ maxDepth: 2,
                        maxArrayLength: 5 }) ({ a: { b: { c: 0 } }, qux: [1,2,3,4,5,6] }),
                                           // { a: { b: <object> }, qux: <array[6]> }
```

Setting floating-point output precision:

```javascript
String.ify                              ({ a: 123, b: 123.000001 }))   // { a: 123, b: 123.000001 }
String.ify.configure ({ precision: 2 }) ({ a: 123, b: 123.000001 }, )) // { a: 123, b: 123.00 }
```

## Custom rendering

### With ad-hoc formatter

```javascript
booleansAsYesNo = String.ify.configure ({ formatter: (x => (typeof x === 'boolean' ? (x ? 'yes' : 'no') : undefined)) })
booleansAsYesNo  ({ a: { b: true }, c: false }),
//                { a: { b: yes }, c: no }
```

### With Symbols

If you don't know what they are, [read this article](http://blog.keithcirkel.co.uk/metaprogramming-in-es6-symbols/). Symbols are awesome! They allow to add hidden properties (i.e. metadata) to arbitrary objects. **String.ify** uses this mechanism to implement custom formatters on rendered objects:

```javascript
Boolean.prototype[Symbol.for ('String.ify')] = function (stringify) {
                                                   return this ? 'yes' : 'no' }

String.ify ({ a: { b: true }, c: false })
//         '{ a: { b: yes }, c: no }'
```

Note how a `stringify` is passed as an argument to a renderer function. Call it to render nested contents. Current config options are available as properties of that function. You can override them by calling the `configure` method. Here's an example of adding purple ANSI color to rendered arrays:

```javascript
Array.prototype[Symbol.for ('String.ify')] = function (stringify) {

    return '\u001B[35m[' + this.map (stringify).join (', ') + ']\u001b[0m'
}

String.ify ({ a:           [{ foo: 42, bar: 43 }, 44, 45, 46] })
//         '{ a: \u001B[35m[{ foo: 42, bar: 43 }, 44, 45, 46]\u001b[0m }')
```

## See also

Here's a fullstack web framework that utilizes `String.ify` powers for its internal needs: [Useless™](https://github.com/xpl/useless).
