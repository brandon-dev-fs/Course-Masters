import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'default@course-masters.app' },
    update: {},
    create: {
      email: 'default@course-masters.app',
      name: 'Default User',
    },
  });

  console.log(`Seeded user: ${user.email}`);

  // Clean up existing seed data
  await prisma.course.deleteMany({ where: { title: 'Introduction to Web Development' } });

  const course = await prisma.course.create({
    data: {
      title: 'Introduction to Web Development',
      description: 'Learn the fundamentals of modern web development from scratch.',
      authorId: user.id,
      units: {
        create: [
          {
            title: 'HTML & CSS Basics',
            order: 1,
            lessons: {
              create: [
                { title: 'HTML Structure', order: 1 },
                { title: 'CSS Selectors', order: 2 },
              ],
            },
          },
          {
            title: 'JavaScript Fundamentals',
            order: 2,
            lessons: {
              create: [
                { title: 'Variables and Types', order: 1 },
                { title: 'Functions and Scope', order: 2 },
              ],
            },
          },
        ],
      },
    },
    include: {
      units: {
        include: { lessons: true },
      },
    },
  });

  console.log(`Seeded course: ${course.title}`);

  const [unit1, unit2] = course.units;
  const [lesson1, lesson2] = unit1.lessons;
  const [lesson3, lesson4] = unit2.lessons;

  // --- Lesson 1: HTML Structure — Notes, FlashCards, PracticeProblems, Quiz ---

  await prisma.note.createMany({
    data: [
      { lessonId: lesson1.id, content: 'HTML stands for HyperText Markup Language. It defines the structure of web pages using elements represented by tags like `<html>`, `<head>`, and `<body>`.', order: 1 },
      { lessonId: lesson1.id, content: 'Every HTML document should start with `<!DOCTYPE html>` to tell the browser which version of HTML is being used.', order: 2 },
      { lessonId: lesson1.id, content: 'Block-level elements (like `<div>`, `<p>`, `<h1>`) start on a new line. Inline elements (like `<span>`, `<a>`, `<strong>`) flow within text.', order: 3 },
    ],
  });

  await prisma.flashCard.createMany({
    data: [
      { lessonId: lesson1.id, front: 'What does HTML stand for?', back: 'HyperText Markup Language', order: 1 },
      { lessonId: lesson1.id, front: 'What tag wraps the visible content of a web page?', back: '<body>', order: 2 },
      { lessonId: lesson1.id, front: 'What is a semantic HTML element?', back: 'An element that clearly describes its meaning to both the browser and developer, e.g. <article>, <nav>, <header>.', order: 3 },
    ],
  });

  await prisma.practiceProblem.createMany({
    data: [
      { lessonId: lesson1.id, question: 'Write the minimal HTML boilerplate for a valid HTML5 page.', answer: '<!DOCTYPE html>\n<html lang="en">\n  <head><meta charset="UTF-8"><title>Page</title></head>\n  <body></body>\n</html>', order: 1 },
      { lessonId: lesson1.id, question: 'What is the difference between <div> and <section>?', answer: '<div> is a generic container with no semantic meaning. <section> is a semantic element representing a thematic grouping of content.', order: 2 },
    ],
  });

  const quiz1 = await prisma.quiz.create({
    data: {
      lessonId: lesson1.id,
      questions: {
        create: [
          {
            question: 'Which tag defines the main visible area of an HTML page?',
            options: ['<head>', '<body>', '<html>', '<main>'],
            correctIndex: 1,
            order: 1,
          },
          {
            question:'What does DOCTYPE tell the browser?',
            options: ['The page language', 'The HTML version being used', 'The page encoding', 'The server type'],
            correctIndex: 1,
            order: 2,
          },
          {
            question:'Which element is a block-level element?',
            options: ['<span>', '<a>', '<strong>', '<p>'],
            correctIndex: 3,
            order: 3,
          },
        ],
      },
    },
  });

  // Add a passing attempt for lesson1 quiz
  await prisma.quizAttempt.create({
    data: {
      quizId: quiz1.id,
      userId: user.id,
      score: 100,
      passed: true,
    },
  });

  // --- Lesson 2: CSS Selectors — Notes, FlashCards, Quiz ---

  await prisma.note.createMany({
    data: [
      { lessonId: lesson2.id, content: 'CSS selectors target HTML elements to apply styles. The most common are element (`p`), class (`.btn`), and ID (`#header`) selectors.', order: 1 },
      { lessonId: lesson2.id, content: 'Specificity determines which CSS rule wins when multiple rules target the same element. ID > class > element.', order: 2 },
    ],
  });

  await prisma.flashCard.createMany({
    data: [
      { lessonId: lesson2.id, front: 'How do you select an element with class "btn"?', back: '.btn { }', order: 1 },
      { lessonId: lesson2.id, front: 'Which CSS selector has the highest specificity?', back: 'ID selector (#id)', order: 2 },
    ],
  });

  const quiz2 = await prisma.quiz.create({
    data: {
      lessonId: lesson2.id,
      questions: {
        create: [
          {
            question:'How do you select all <p> elements in CSS?',
            options: ['#p', '.p', 'p', '*p'],
            correctIndex: 2,
            order: 1,
          },
          {
            question:'Which selector targets an element with id="header"?',
            options: ['.header', '#header', 'header', '@header'],
            correctIndex: 1,
            order: 2,
          },
        ],
      },
    },
  });

  // Add a passing attempt for lesson2 quiz
  await prisma.quizAttempt.create({
    data: {
      quizId: quiz2.id,
      userId: user.id,
      score: 100,
      passed: true,
    },
  });

  // --- Unit 1 Test ---

  const test1 = await prisma.test.create({
    data: {
      unitId: unit1.id,
      questions: {
        create: [
          {
            question:'What is the correct HTML element for the largest heading?',
            options: ['<h6>', '<heading>', '<h1>', '<head>'],
            correctIndex: 2,
            order: 1,
          },
          {
            question:'Which CSS property changes the text color?',
            options: ['text-color', 'font-color', 'color', 'foreground'],
            correctIndex: 2,
            order: 2,
          },
          {
            question:'How do you apply multiple classes to an HTML element?',
            options: ['class="cls1" class="cls2"', 'class="cls1, cls2"', 'class="cls1 cls2"', 'classes="cls1 cls2"'],
            correctIndex: 2,
            order: 3,
          },
          {
            question:'What does CSS stand for?',
            options: ['Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets'],
            correctIndex: 1,
            order: 4,
          },
          {
            question:'Which HTML attribute specifies an alternate text for an image?',
            options: ['title', 'src', 'alt', 'longdesc'],
            correctIndex: 2,
            order: 5,
          },
        ],
      },
    },
  });

  // Add a passing attempt for unit1 test
  await prisma.testAttempt.create({
    data: {
      testId: test1.id,
      userId: user.id,
      score: 100,
      passed: true,
    },
  });

  // --- Lesson 3: Variables and Types — Notes, FlashCards, Quiz ---

  await prisma.note.createMany({
    data: [
      { lessonId: lesson3.id, content: 'JavaScript has three variable keywords: `var` (function-scoped, hoisted), `let` (block-scoped, reassignable), and `const` (block-scoped, not reassignable).', order: 1 },
      { lessonId: lesson3.id, content: 'JavaScript is dynamically typed. The main primitive types are: string, number, boolean, null, undefined, symbol, and bigint.', order: 2 },
    ],
  });

  await prisma.flashCard.createMany({
    data: [
      { lessonId: lesson3.id, front: 'What is the difference between null and undefined?', back: 'null is an intentional absence of value assigned by the developer. undefined means a variable has been declared but not assigned.', order: 1 },
      { lessonId: lesson3.id, front: 'Which keyword should you prefer for variables that won\'t be reassigned?', back: 'const', order: 2 },
    ],
  });

  const quiz3 = await prisma.quiz.create({
    data: {
      lessonId: lesson3.id,
      questions: {
        create: [
          {
            question:'Which keyword declares a block-scoped variable that can be reassigned?',
            options: ['var', 'let', 'const', 'def'],
            correctIndex: 1,
            order: 1,
          },
          {
            question:'What does typeof null return in JavaScript?',
            options: ['"null"', '"undefined"', '"object"', '"boolean"'],
            correctIndex: 2,
            order: 2,
          },
        ],
      },
    },
  });

  await prisma.quizAttempt.create({
    data: {
      quizId: quiz3.id,
      userId: user.id,
      score: 100,
      passed: true,
    },
  });

  // --- Lesson 4: Functions and Scope --- Quiz only ---

  const quiz4 = await prisma.quiz.create({
    data: {
      lessonId: lesson4.id,
      questions: {
        create: [
          {
            question:'What is a closure in JavaScript?',
            options: [
              'A function that closes the browser',
              'A function that retains access to its outer scope even after the outer function has returned',
              'A method that seals an object',
              'A loop that terminates early',
            ],
            correctIndex: 1,
            order: 1,
          },
          {
            question:'What is the output of: console.log(typeof function(){})?',
            options: ['"object"', '"function"', '"undefined"', '"method"'],
            correctIndex: 1,
            order: 2,
          },
        ],
      },
    },
  });

  // No attempt for quiz4 — lesson not yet passed

  // --- Unit 2 Test (no attempt — unit not yet completed) ---

  await prisma.test.create({
    data: {
      unitId: unit2.id,
      questions: {
        create: [
          {
            question:'What does the "=== " operator check?',
            options: ['Value only', 'Type only', 'Value and type', 'Reference equality'],
            correctIndex: 2,
            order: 1,
          },
          {
            question:'Which method converts a string to an integer?',
            options: ['Number()', 'parseInt()', 'toInt()', 'String()'],
            correctIndex: 1,
            order: 2,
          },
          {
            question:'What is hoisting in JavaScript?',
            options: [
              'Moving elements up in the DOM',
              'JavaScript\'s behavior of moving declarations to the top of their scope',
              'Increasing a variable\'s value',
              'Loading scripts asynchronously',
            ],
            correctIndex: 1,
            order: 3,
          },
        ],
      },
    },
  });

  // --- Final Exam ---

  const exam = await prisma.finalExam.create({
    data: {
      courseId: course.id,
      questions: {
        create: [
          {
            question:'Which HTML tag is used to create a hyperlink?',
            options: ['<link>', '<href>', '<a>', '<url>'],
            correctIndex: 2,
            order: 1,
          },
          {
            question:'How do you write a comment in CSS?',
            options: ['// comment', '# comment', '/* comment */', '<!-- comment -->'],
            correctIndex: 2,
            order: 2,
          },
          {
            question:'Which of the following is NOT a JavaScript primitive type?',
            options: ['string', 'boolean', 'array', 'number'],
            correctIndex: 2,
            order: 3,
          },
          {
            question:'What will "2" + 2 evaluate to in JavaScript?',
            options: ['4', '"22"', 'NaN', 'Error'],
            correctIndex: 1,
            order: 4,
          },
          {
            question:'What CSS property makes an element invisible but still occupies space?',
            options: ['display: none', 'visibility: hidden', 'opacity: 0', 'Both B and C'],
            correctIndex: 3,
            order: 5,
          },
        ],
      },
    },
  });

  // No exam attempt — course not yet completed

  console.log(`Seeded assessments: ${quiz1.id}, ${quiz2.id}, ${quiz3.id}, ${quiz4.id}`);
  console.log(`Seeded tests: ${test1.id}`);
  console.log(`Seeded exam: ${exam.id}`);
  console.log('Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
