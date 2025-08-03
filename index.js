import express from "express";
import cors from "cors";

const app = express().use(express.json()).use(cors());

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

app.get("/", (req, res) => {
  res.send(reverseString(str));
});

let str = "Interview";

function reverseString(str) {
  return str.split("").reverse().join("");
}

console.log(reverseString(str));

const arr = [1, 2, 3, 4, 5];

function reverseArray(arr) {
  return arr.reverse();
}

console.log(reverseArray(arr));

const stringArr = ["apple", "banana", "cherry", "date", "elderberry", "Aloo"];

function reverseStringArray(stringArr) {
  return stringArr.reverse();
}

console.log(reverseStringArray(stringArr));

console.log(stringArr.sort((a, b) => a.localeCompare(b)));

// promise
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("Promise resolved");
  }, 1000);
});

promise.then((value) => {
  console.log(value);
});

// async await
async function fetchData() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  // console.log(data);
}

// fetchData();

// deep copy

const copyArr = Object.assign({}, stringArr);
console.log(Object.values(copyArr).sort((a, b) => a.localeCompare(b)));

// palidrom

const palidrome = "madam";
const palidromeReverse = palidrome.split("").reverse().join("");
console.log(palidromeReverse === palidrome);

// capitalize first letter of word

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

for (let i = 0; i < stringArr.length; i++) {
  console.log(capitalize(stringArr[i]));
}

// create a calendar

const calendar = (year, month) => {
  const date = new Date(year, month, 1);
  const startDay = date.getDay(); // 0 = Sunday, 6 = Saturday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  weeks.push(dayLabels);

  let week = new Array(startDay).fill(" "); // Fill empty days before 1st
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  // Add remaining days if the last week is incomplete
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(" ");
    }
    weeks.push(week);
  }

  return weeks;
};

// Print calendar for July 2025 (month 6 since January is 0)
const cal = calendar(2025, 6);
cal.forEach((week) => console.log(week.join("\t")));

const wordsArr = ["Test", "Rest", "Animal"];

const vowel = ["a", "e", "i", "o", "u"];

function countVowels(word) {
  let count = 0;
  for (let i = 0; i < word.length; i++) {
    if (vowel.includes(word[i])) {
      count++;
    }
  }
  return count;
}

console.log(countVowels("Test"));

function countVowelsInArray(wordsArr) {
  const result = {};
  for (let word of wordsArr) {
    const count = countVowels(word);
    result[word] = count;
  }
  return result;
}

console.log(countVowelsInArray(wordsArr));

const arRandomCount = [1, 2, 6, 5, 6, 7, 8, 5, 10, 22, 554, 6554, 66];

console.log(new Set(arRandomCount));

const uniqueArr = new Set(arRandomCount);

console.log([...new Set(arRandomCount)].sort((a, b) => a - b));

// remove duplicates from objects
const userArrObject = [
  {
    name: "John",
    age: 30,
    city: "New York",
  },
  {
    name: "John",
    age: 30,
    city: "New York",
  },
  {
    name: "sumit",
    age: 35,
    city: "surat",
  },
];

console.log(
  userArrObject.filter((item, index) => userArrObject.indexOf(item) === index)
);

// unique user arr
console.log(
  userArrObject.reduce((acc, curr) => {
    acc[curr.name] = curr;
    return acc;
  }, {})
);

const ne = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("Hello World");
    console.log("Resolved");
  }, 300);
});

ne.then((value) => {
  console.log(value);
});

async function calls() {
  return await ne;
}

await calls();

const arrUsers = userArrObject.find((item) => item.name === "sumit");

// console.log("count", arrUsers);

// delete
console.log(userArrObject.filter((item) => item.name != "John"));

// create debounce
const createDebounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

console.log(
  createDebounce(() => {
    return console.log("i am delayed");
  }, 1000)
);

let arr1 = ["b", "c", "d", "a"];

console.log(arr1.sort((a, b) => a.localeCompare(b)));

console.log(arr1.toSorted());
