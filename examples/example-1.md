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
```

TS example with error:
```ts

let count: Number;

console.log(JSON.parse("abc").count)

```

Another example:

```js
const deb = require("debug")
const engine = require("./src/engine.js")
console.log("hu!";
const log = deb("abc")
```
