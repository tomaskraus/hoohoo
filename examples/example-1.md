# this is example 1

There is a code snippet:

```js
const greetings = "hello World!";
  const len = greetings.length;
  
console.log(greetings)

```

This is an empty code block:

```js
```

This is an empty code block #2:

```js
  
```

An example in a nested block
<!--# skip -->
````

```js
  const inc = add(1);
  inc(5);
  //=> 6
```
````

Code block that needs a js header file to require a local file:
```js
  // try this:
  const sum = add(1)(2);
  console.log(sum);
  //=> 3
```

This js code block will be skipped:

<!-- skip-example -->
```js
const Debug = require("./my-debug.js")
```

Typescript example:

```ts
type TPoint = [Number, Number];
const pa: TPoint = [1, 2];

const swap = (pt: TPoint): TPoint => [pt[1], pt[0]]

console.log(swap([10, 5]));
//=> [5, 10]

console.log(square(10));
```

JS example that throws Error programmatically:
```js
throw new Error("Hoo!")
```

TS example with error:
```ts

let count: Number;

console.log(JSON.parse("abc").count)

```

Another example:

```js
const deb = require("debug")
const engine = require("../../src/engine.js")
console.log("hu!";
//=> ... missing ...
const log = deb("abc")
```
