// 1. Difference between let, const, and var

// var: function-scoped. Variables declared with var are hoisted to the top of their function scope.
function varExample() {
  if (true) {
    var x = 10;
  }
  console.log(x); // Outputs 10, as x is function-scoped
}

// let: block-scoped. Variables declared with let are only accessible within the block they are declared.
function letExample() {
  if (true) {
    let y = 20;
  }
  // console.log(y); // Throws a ReferenceError because y is not defined in this scope.
}

// const: block-scoped and cannot be reassigned.
function constExample() {
  const z = 30;
  // z = 40; // Throws a TypeError because a const variable cannot be reassigned.
}


// 2. Difference between == and ===

// == (loose equality): compares values after type coercion.
console.log(5 == "5"); // true, because the string "5" is coerced to the number 5.

// === (strict equality): compares values without type coercion.
console.log(5 === "5"); // false, because the types (number and string) are different.


// 3. Data Types in JavaScript

// Primitive Types
let num = 10; // Number
let str = "Hello"; // String
let bool = true; // Boolean
let n = null; // null
let u = undefined; // undefined
let sym = Symbol("id"); // Symbol

// Non-primitive Type
let obj = { name: "John", age: 30 }; // Object


// 4. Hoisting

// Variable hoisting
console.log(hoistedVar); // Outputs undefined, as the declaration is hoisted but not the initialization.
var hoistedVar = 5;

// Function hoisting
hoistedFunction(); // Outputs "Hello from hoisted function!", as the entire function is hoisted.

function hoistedFunction() {
  console.log("Hello from hoisted function!");
}


// 5. 'this' keyword

// In the global scope, 'this' refers to the global object (window in browsers, global in Node.js).
console.log(this);

// In a regular function, 'this' refers to the object that called the function.
const person = {
  name: "Jane",
  greet: function() {
    console.log("Hello, my name is " + this.name);
  }
};
person.greet(); // 'this' refers to the person object.

// In an arrow function, 'this' is lexically scoped, meaning it inherits the 'this' value from the surrounding code.


// 6. null vs undefined

let undefinedVar;
console.log(undefinedVar); // undefined: variable declared but not assigned a value.

let nullVar = null;
console.log(nullVar); // null: intentional absence of any object value.


// 7. Asynchronous JavaScript

// Callback
function fetchData(callback) {
  setTimeout(() => {
    callback("Data fetched!");
  }, 1000);
}
fetchData((data) => {
  console.log(data);
});

// Promise
function fetchDataWithPromise() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("Data fetched with Promise!");
    }, 1000);
  });
}
fetchDataWithPromise().then((data) => {
  console.log(data);
});

// async/await
async function fetchAsyncData() {
  const data = await fetchDataWithPromise();
  console.log(data);
}
fetchAsyncData();


// 8. Closures

function outerFunction() {
  let outerVar = "I am from the outer function";

  function innerFunction() {
    console.log(outerVar); // innerFunction has access to outerVar, creating a closure.
  }

  return innerFunction;
}
const closure = outerFunction();
closure();


// 9. Higher-Order Functions

// A function that takes another function as an argument.
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map((num) => num * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// A function that returns another function.
function multiplier(factor) {
  return function(number) {
    return number * factor;
  };
}
const double = multiplier(2);
console.log(double(5)); // 10


// 10. Regular vs Arrow Functions

// Regular function
function regularSum(a, b) {
  return a + b;
}

// Arrow function
const arrowSum = (a, b) => a + b;


// 11. Reverse a String
const reverseString = (str) => str.split("").reverse().join("");
console.log(reverseString("hello")); // "olleh"


// 12. Check for Palindrome
const isPalindrome = (str) => {
  const reversed = str.split("").reverse().join("");
  return str === reversed;
};
console.log(isPalindrome("racecar")); // true
console.log(isPalindrome("hello")); // false


// 13. Remove Duplicate Elements from an Array
const removeDuplicates = (arr) => [...new Set(arr)];
const arrayWithDuplicates = [1, 2, 2, 3, 4, 4, 5];
console.log(removeDuplicates(arrayWithDuplicates)); // [1, 2, 3, 4, 5]

// 14. Prototypal Inheritance
// How it works: In JavaScript, objects have a special hidden property [[Prototype]] (exposed as __proto__),
// which is either null or references another object. When you try to access a property of an object,
// and it's not found on the object itself, the JavaScript engine looks for the property in the object's prototype.

// Creating an object that inherits from another object
const animal = {
  eat: function() {
    console.log("Eating...");
  }
};

const dog = Object.create(animal);
dog.bark = function() {
  console.log("Woof!");
};

dog.eat();  // "Eating..." (inherited from animal)
dog.bark(); // "Woof!"


// 15. Event Loop
// The event loop is a mechanism that allows Node.js to perform non-blocking I/O operations,
// despite the fact that JavaScript is single-threaded. It continuously checks the message queue
// for new messages and executes them.

console.log("Start");

setTimeout(() => {
  console.log("Inside setTimeout"); // This is a macrotask
}, 0);

Promise.resolve().then(() => {
  console.log("Inside Promise"); // This is a microtask
});

console.log("End");

// Output order:
// Start
// End
// Inside Promise (microtasks run before macrotasks)
// Inside setTimeout


// 16. Strict Mode
// "use strict";
// Strict mode makes several changes to normal JavaScript semantics.
// 1. It eliminates some JavaScript silent errors by changing them to throw errors.
// 2. It fixes mistakes that make it difficult for JavaScript engines to perform optimizations.
// 3. It prohibits some syntax likely to be defined in future versions of ECMAScript.

function strictExample() {
  "use strict";
  // undeclaredVar = 10; // Throws a ReferenceError in strict mode
}


// 17. call, apply, and bind

const person1 = { name: "Alice" };
const person2 = { name: "Bob" };

function sayHello(greeting) {
  console.log(greeting + ", " + this.name);
}

// call: invokes the function with a given 'this' value and arguments provided individually.
sayHello.call(person1, "Hello"); // "Hello, Alice"

// apply: invokes the function with a given 'this' value and arguments provided as an array.
sayHello.apply(person2, ["Hi"]); // "Hi, Bob"

// bind: returns a new function with a given 'this' value and initial arguments.
const sayHelloToAlice = sayHello.bind(person1);
sayHelloToAlice("Good morning"); // "Good morning, Alice"


// 18. Debounce
// Debouncing is a technique to limit the rate at which a function gets called.
// It's useful for performance-heavy tasks like API calls on user input.

function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Example usage:
// const debouncedSearch = debounce(() => console.log("Searching..."), 500);
// window.addEventListener("input", debouncedSearch);


// 19. Throttling
// Throttling is a technique to ensure that a function is called at most once in a specified time interval.
// It's useful for events that fire rapidly, like scrolling or resizing the window.

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Example usage:
// const throttledScroll = throttle(() => console.log("Scrolling..."), 200);
// window.addEventListener("scroll", throttledScroll);


// 20. Memoization
// Memoization is an optimization technique used to speed up function calls by caching the results
// of expensive function calls and returning the cached result when the same inputs occur again.

function memoize(func) {
  const cache = {};
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache[key]) {
      return cache[key];
    }
    const result = func(...args);
    cache[key] = result;
    return result;
  };
}

const fibonacci = memoize((n) => {
  if (n < 2) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(10)); // 55


// 21. Event Delegation
// Event delegation is a technique where you add a single event listener to a parent element
// to handle events for all of its children. This is more efficient than adding an event listener
// to each child element, especially for dynamically added elements.

// <ul id="myList">
//   <li>Item 1</li>
//   <li>Item 2</li>
//   <li>Item 3</li>
// </ul>

// document.getElementById("myList").addEventListener("click", function(e) {
//   if (e.target && e.target.nodeName === "LI") {
//     console.log("Clicked on item: ", e.target.textContent);
//   }
// });


// 22. Currying
// Currying is the process of transforming a function that takes multiple arguments into a
// sequence of functions that each take a single argument.

function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function(...args2) {
        return curried.apply(this, args.concat(args2));
      };
    }
  };
}

function sum(a, b, c) {
  return a + b + c;
}

const curriedSum = curry(sum);
console.log(curriedSum(1)(2)(3)); // 6
console.log(curriedSum(1, 2)(3)); // 6


// 23. Composition
// Function composition is the process of combining two or more functions to produce a new function.
// The output of one function becomes the input of the next function.

const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

const add5 = (x) => x + 5;
const multiplyBy2 = (x) => x * 2;

const composedFunction = compose(add5, multiplyBy2);
console.log(composedFunction(10)); // 25 (multiplyBy2(10) = 20, add5(20) = 25)