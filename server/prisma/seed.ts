import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

const prisma = new PrismaClient();

async function seedUser(email: string, name: string, role: 'student' | 'teacher' | 'admin') {
	const id = crypto.randomUUID();
	const user = await prisma.user.upsert({
		where: { email },
		update: {},
		create: { id, email, name, emailVerified: false, role },
	});
	const hashed = await hashPassword('password123');
	await prisma.account.upsert({
		where: { id: `${user.id}-credential` },
		update: {},
		create: {
			id: `${user.id}-credential`,
			accountId: user.id,
			providerId: 'credential',
			userId: user.id,
			password: hashed,
		},
	});
	return user;
}

async function main() {
	const admin = await seedUser('admin@course-masters.app', 'Admin User', 'admin');
	const teacher = await seedUser('teacher@course-masters.app', 'Teacher User', 'teacher');
	const student = await seedUser('student@course-masters.app', 'Student User', 'student');

	const user = admin;
	console.log(`Seeded users: ${admin.email}, ${teacher.email}, ${student.email}`);

	// Clean up existing seed data
	await prisma.course.deleteMany({
		where: { title: 'Introduction to Web Development' },
	});

	const course = await prisma.course.create({
		data: {
			title: 'Introduction to Web Development',
			description: 'Learn the fundamentals of modern web development from scratch.',
			syllabus: {
				type: 'doc',
				content: [
					{
						type: 'heading',
						attrs: { level: 1 },
						content: [{ type: 'text', text: 'Course Syllabus' }],
					},
					{
						type: 'paragraph',
						content: [
							{
								type: 'text',
								text: 'This course covers the core building blocks of web development: HTML for structure, CSS for styling, and JavaScript for interactivity. By the end, you will be able to build and style interactive web pages from scratch.',
							},
						],
					},
					{
						type: 'heading',
						attrs: { level: 2 },
						content: [{ type: 'text', text: 'Learning Objectives' }],
					},
					{
						type: 'bulletList',
						content: [
							{
								type: 'listItem',
								content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Understand HTML document structure and semantic elements' }] }],
							},
							{
								type: 'listItem',
								content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Write CSS selectors and understand specificity and the cascade' }] }],
							},
							{
								type: 'listItem',
								content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Declare and use JavaScript variables, functions, and closures' }] }],
							},
							{
								type: 'listItem',
								content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Apply best practices for writing clean, maintainable code' }] }],
							},
						],
					},
					{
						type: 'heading',
						attrs: { level: 2 },
						content: [{ type: 'text', text: 'Course Outline' }],
					},
					{
						type: 'orderedList',
						content: [
							{
								type: 'listItem',
								content: [
									{
										type: 'paragraph',
										content: [
											{ type: 'text', marks: [{ type: 'bold' }], text: 'Unit 1 — HTML & CSS Basics: ' },
											{ type: 'text', text: 'HTML document structure, semantic tags, CSS selectors, and specificity.' },
										],
									},
								],
							},
							{
								type: 'listItem',
								content: [
									{
										type: 'paragraph',
										content: [
											{ type: 'text', marks: [{ type: 'bold' }], text: 'Unit 2 — JavaScript Fundamentals: ' },
											{ type: 'text', text: 'Variables, data types, functions, scope, and closures.' },
										],
									},
								],
							},
						],
					},
					{
						type: 'heading',
						attrs: { level: 2 },
						content: [{ type: 'text', text: 'Grading' }],
					},
					{
						type: 'paragraph',
						content: [
							{
								type: 'text',
								text: 'Each lesson includes a quiz that must be passed with 80% or higher. Each unit has a cumulative test. A final exam covering all material must be passed to complete the course.',
							},
						],
					},
				],
			},
			authorId: user.id,
			units: {
				create: [
					{
						title: 'HTML & CSS Basics',
						description: 'Learn how to structure web pages with HTML and style them with CSS, covering the essential building blocks of every website.',
						order: 1,
						lessons: {
							create: [
								{
									title: 'HTML Structure',
									description: 'Understand how HTML documents are structured using tags and elements, and learn the difference between block-level and inline elements.',
									order: 1,
									objective: 'Understand the anatomy of an HTML document and distinguish between block-level and inline elements.',
									planContent: {
										type: 'doc',
										content: [
											{
												type: 'heading',
												attrs: { level: 2 },
												content: [{ type: 'text', text: 'Lesson Overview' }],
											},
											{
												type: 'paragraph',
												content: [
													{
														type: 'text',
														text: 'In this lesson you will learn how every HTML page is structured, starting from the DOCTYPE declaration through the <html>, <head>, and <body> elements. We will explore the difference between block-level elements (which stack vertically) and inline elements (which flow within text).',
													},
												],
											},
											{
												type: 'heading',
												attrs: { level: 3 },
												content: [{ type: 'text', text: 'Topics Covered' }],
											},
											{
												type: 'bulletList',
												content: [
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'DOCTYPE and the HTML skeleton' }] }] },
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Head vs. body sections' }] }] },
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Block-level vs. inline elements' }] }] },
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Semantic HTML tags' }] }] },
												],
											},
										],
									},
								},
								{
									title: 'CSS Selectors',
									description: 'Learn how to target HTML elements with CSS selectors and understand how specificity determines which styles take effect.',
									order: 2,
									objective: 'Master CSS selector syntax and understand the specificity hierarchy.',
									planContent: {
										type: 'doc',
										content: [
											{
												type: 'heading',
												attrs: { level: 2 },
												content: [{ type: 'text', text: 'Lesson Overview' }],
											},
											{
												type: 'paragraph',
												content: [
													{
														type: 'text',
														text: 'This lesson introduces CSS selectors — the mechanism for targeting HTML elements to apply styles. You will learn element, class, and ID selectors, then explore how specificity determines which rule wins when multiple rules match.',
													},
												],
											},
											{
												type: 'heading',
												attrs: { level: 3 },
												content: [{ type: 'text', text: 'Topics Covered' }],
											},
											{
												type: 'bulletList',
												content: [
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Element, class, and ID selectors' }] }] },
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Combinators and pseudo-classes' }] }] },
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Specificity scoring' }] }] },
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The cascade and source order' }] }] },
												],
											},
										],
									},
								},
							],
						},
					},
					{
						title: 'JavaScript Fundamentals',
						description: 'Explore the core concepts of JavaScript including variables, data types, functions, and scope to start writing dynamic web behavior.',
						order: 2,
						lessons: {
							create: [
								{
									title: 'Variables and Types',
									description: "Discover how to declare variables with var, let, and const, and explore JavaScript's primitive data types including strings, numbers, and booleans.",
									order: 1,
									objective: "Declare variables using var, let, and const, and identify JavaScript's primitive data types.",
									planContent: {
										type: 'doc',
										content: [
											{
												type: 'heading',
												attrs: { level: 2 },
												content: [{ type: 'text', text: 'Lesson Overview' }],
											},
											{
												type: 'paragraph',
												content: [
													{
														type: 'text',
														text: "This lesson covers the three variable declaration keywords in JavaScript and when to use each one. We then survey the primitive data types and discuss type coercion — one of JavaScript's most common pitfalls.",
													},
												],
											},
											{
												type: 'heading',
												attrs: { level: 3 },
												content: [{ type: 'text', text: 'Key Takeaways' }],
											},
											{
												type: 'orderedList',
												content: [
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Prefer const by default; use let only when reassignment is needed.' }] }] },
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Understand the difference between null (intentional absence) and undefined (not assigned).' }] }] },
													{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Use === instead of == to avoid type coercion surprises.' }] }] },
												],
											},
										],
									},
								},
								{
									title: 'Functions and Scope',
									description: 'Learn how to define and invoke functions, understand lexical scope, and explore closures and arrow function syntax.',
									order: 2,
									objective: 'Define functions using declarations and arrow syntax, and explain how closures capture their enclosing scope.',
									planContent: {
										type: 'doc',
										content: [
											{
												type: 'heading',
												attrs: { level: 2 },
												content: [{ type: 'text', text: 'Lesson Overview' }],
											},
											{
												type: 'paragraph',
												content: [
													{
														type: 'text',
														text: 'Functions are the building blocks of any JavaScript program. In this lesson we compare function declarations, function expressions, and arrow functions. We then explore scope chains and closures — the mechanism that lets inner functions "remember" variables from their outer scope.',
													},
												],
											},
										],
									},
								},
							],
						},
					},
				],
			},
		},
		include: {
			units: { include: { lessons: true } },
		},
	});

	console.log(`Seeded course: ${course.title}`);

	const [unit1, unit2] = course.units;
	const [lesson1, lesson2] = unit1.lessons;
	const [lesson3, lesson4] = unit2.lessons;

	// --- Lesson 1: HTML Structure ---

	const video1 = await prisma.lessonResource.create({
		data: {
			lessonId: lesson1.id,
			type: 'video',
			title: 'HTML Tags Explained',
			order: 1,
			content: { url: 'https://www.youtube.com/watch?v=vY2xUc4TVmY&t=69s' },
		},
	});

	const note1 = await prisma.lessonResource.create({
		data: {
			lessonId: lesson1.id,
			type: 'note',
			title: 'HTML Fundamentals',
			order: 2,
			content: {
				body: {
					type: 'doc',
					content: [
						{
							type: 'heading',
							attrs: { level: 2 },
							content: [{ type: 'text', text: 'HTML Fundamentals' }],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'HTML stands for HyperText Markup Language. It defines the structure of web pages using elements represented by tags like <html>, <head>, and <body>.',
								},
							],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'Every HTML document should start with <!DOCTYPE html> to tell the browser which version of HTML is being used.',
								},
							],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'Block-level elements (like <div>, <p>, <h1>) start on a new line. Inline elements (like <span>, <a>, <strong>) flow within text.',
								},
							],
						},
					],
				},
			},
		},
	});

	const note1b = await prisma.lessonResource.create({
		data: {
			lessonId: lesson1.id,
			type: 'note',
			title: 'Semantic HTML',
			order: 3,
			content: {
				body: {
					type: 'doc',
					content: [
						{
							type: 'heading',
							attrs: { level: 2 },
							content: [{ type: 'text', text: 'Semantic HTML' }],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'Semantic elements clearly describe their meaning: <header>, <nav>, <main>, <article>, <section>, <aside>, and <footer>. They improve accessibility and SEO compared to generic <div> containers.',
								},
							],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'Screen readers use semantic tags to help users navigate the page. Search engines also use them to understand the page structure and rank content more accurately.',
								},
							],
						},
					],
				},
			},
		},
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				lessonId: lesson1.id,
				type: 'flash_card',
				title: 'What does HTML stand for?',
				order: 1,
				content: { front: 'What does HTML stand for?', back: 'HyperText Markup Language' },
			},
			{
				lessonId: lesson1.id,
				type: 'flash_card',
				title: 'What tag wraps the visible content?',
				order: 2,
				content: { front: 'What tag wraps the visible content of a web page?', back: '<body>' },
			},
			{
				lessonId: lesson1.id,
				type: 'flash_card',
				title: 'What is a semantic HTML element?',
				order: 3,
				content: {
					front: 'What is a semantic HTML element?',
					back: 'An element that clearly describes its meaning to both the browser and developer, e.g. <article>, <nav>, <header>.',
				},
			},
		],
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				lessonId: lesson1.id,
				type: 'vocab',
				title: 'Tag',
				order: 1,
				content: {
					term: 'Tag',
					definition: 'An HTML keyword enclosed in angle brackets (e.g. <p>) that defines an element on a page.',
				},
			},
			{
				lessonId: lesson1.id,
				type: 'vocab',
				title: 'Element',
				order: 2,
				content: {
					term: 'Element',
					definition: 'A complete HTML component consisting of an opening tag, optional content, and a closing tag.',
				},
			},
			{
				lessonId: lesson1.id,
				type: 'vocab',
				title: 'Attribute',
				order: 3,
				content: {
					term: 'Attribute',
					definition: 'Extra information added inside an opening tag to configure an element, e.g. class, id, src.',
				},
			},
			{
				lessonId: lesson1.id,
				type: 'vocab',
				title: 'DOCTYPE',
				order: 4,
				content: {
					term: 'DOCTYPE',
					definition: 'A declaration at the top of an HTML file that tells the browser which version of HTML the page uses.',
				},
			},
		],
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				lessonId: lesson1.id,
				type: 'practice_problem',
				title: 'Main visible content tag',
				order: 1,
				content: {
					question: 'Which tag is used to define the main visible content of an HTML page?',
					options: ['<head>', '<body>', '<main>', '<section>'],
					correctIndex: 1,
				},
			},
			{
				lessonId: lesson1.id,
				type: 'practice_problem',
				title: 'Block-level element',
				order: 2,
				content: {
					question: 'Which of the following is a block-level element?',
					options: ['<span>', '<a>', '<strong>', '<div>'],
					correctIndex: 3,
				},
			},
			{
				lessonId: lesson1.id,
				type: 'practice_problem',
				title: 'DOCTYPE declaration',
				order: 3,
				content: {
					question: 'What does the <!DOCTYPE html> declaration do?',
					options: [
						'Links an external stylesheet',
						'Sets the page language to English',
						'Tells the browser the page uses HTML5',
						'Creates a hidden comment',
					],
					correctIndex: 2,
				},
			},
		],
	});

	const quiz1 = await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: lesson1.id,
			questions: {
				create: [
					{
						type: 'multiple_choice',
						question: 'Which tag defines the main visible area of an HTML page?',
						content: { options: ['<head>', '<body>', '<html>', '<main>'], correctIndex: 1 },
						order: 1,
					},
					{
						type: 'multiple_choice',
						question: 'What does DOCTYPE tell the browser?',
						content: {
							options: ['The page language', 'The HTML version being used', 'The page encoding', 'The server type'],
							correctIndex: 1,
						},
						order: 2,
					},
					{
						type: 'multiple_choice',
						question: 'Which element is a block-level element?',
						content: { options: ['<span>', '<a>', '<strong>', '<p>'], correctIndex: 3 },
						order: 3,
					},
				],
			},
		},
	});

	await prisma.assessmentAttempt.create({
		data: { assessmentId: quiz1.id, userId: user.id, score: 1, passed: true },
	});

	await prisma.lessonResourceCompletion.createMany({
		data: [
			{ userId: user.id, lessonId: lesson1.id, resourceType: 'lessonPlan', resourceId: lesson1.id },
			{ userId: user.id, lessonId: lesson1.id, resourceType: 'video', resourceId: video1.id },
			{ userId: user.id, lessonId: lesson1.id, resourceType: 'note', resourceId: note1.id },
			{ userId: user.id, lessonId: lesson1.id, resourceType: 'note', resourceId: note1b.id },
			{ userId: user.id, lessonId: lesson1.id, resourceType: 'vocab', resourceId: lesson1.id },
		],
	});

	// --- Lesson 2: CSS Selectors ---

	const video2 = await prisma.lessonResource.create({
		data: {
			lessonId: lesson2.id,
			type: 'video',
			title: 'CSS Selectors Crash Course',
			order: 1,
			content: { url: 'https://www.youtube.com/watch?v=l1mER1bV0N0' },
		},
	});

	await prisma.lessonResource.create({
		data: {
			lessonId: lesson2.id,
			type: 'note',
			title: 'Selector Types',
			order: 2,
			content: {
				body: {
					type: 'doc',
					content: [
						{
							type: 'heading',
							attrs: { level: 2 },
							content: [{ type: 'text', text: 'CSS Selectors' }],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'CSS selectors target HTML elements to apply styles. The most common are element (p), class (.btn), and ID (#header) selectors.',
								},
							],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'Specificity determines which CSS rule wins when multiple rules target the same element. ID > class > element.',
								},
							],
						},
					],
				},
			},
		},
	});

	await prisma.lessonResource.create({
		data: {
			lessonId: lesson2.id,
			type: 'note',
			title: 'Specificity Deep Dive',
			order: 3,
			content: {
				body: {
					type: 'doc',
					content: [
						{
							type: 'heading',
							attrs: { level: 2 },
							content: [{ type: 'text', text: 'Understanding Specificity' }],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'Specificity is calculated as a four-part score: inline styles (1,0,0,0), IDs (0,1,0,0), classes/pseudo-classes (0,0,1,0), and elements (0,0,0,1). The rule with the highest score wins.',
								},
							],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'When two rules have the same specificity, the one that appears later in the stylesheet takes effect — this is source order.',
								},
							],
						},
					],
				},
			},
		},
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				lessonId: lesson2.id,
				type: 'flash_card',
				title: 'Select by class "btn"',
				order: 1,
				content: { front: 'How do you select an element with class "btn"?', back: '.btn { }' },
			},
			{
				lessonId: lesson2.id,
				type: 'flash_card',
				title: 'Highest specificity selector',
				order: 2,
				content: { front: 'Which CSS selector has the highest specificity?', back: 'ID selector (#id)' },
			},
		],
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				lessonId: lesson2.id,
				type: 'vocab',
				title: 'Selector',
				order: 1,
				content: {
					term: 'Selector',
					definition: 'The part of a CSS rule that identifies which HTML elements the styles apply to.',
				},
			},
			{
				lessonId: lesson2.id,
				type: 'vocab',
				title: 'Specificity',
				order: 2,
				content: {
					term: 'Specificity',
					definition: 'A weighting system that determines which CSS rule takes precedence when multiple rules target the same element.',
				},
			},
			{
				lessonId: lesson2.id,
				type: 'vocab',
				title: 'Cascade',
				order: 3,
				content: {
					term: 'Cascade',
					definition: 'The process by which the browser resolves conflicting CSS rules based on specificity, source order, and importance.',
				},
			},
			{
				lessonId: lesson2.id,
				type: 'vocab',
				title: 'Pseudo-class',
				order: 4,
				content: {
					term: 'Pseudo-class',
					definition: 'A keyword added to a selector that specifies a special state, such as :hover or :focus.',
				},
			},
		],
	});

	const quiz2 = await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: lesson2.id,
			questions: {
				create: [
					{
						type: 'multiple_choice',
						question: 'How do you select all <p> elements in CSS?',
						content: { options: ['#p', '.p', 'p', '*p'], correctIndex: 2 },
						order: 1,
					},
					{
						type: 'multiple_choice',
						question: 'Which selector targets an element with id="header"?',
						content: { options: ['.header', '#header', 'header', '@header'], correctIndex: 1 },
						order: 2,
					},
				],
			},
		},
	});

	await prisma.assessmentAttempt.create({
		data: { assessmentId: quiz2.id, userId: user.id, score: 1, passed: true },
	});

	await prisma.lessonResourceCompletion.createMany({
		data: [
			{ userId: user.id, lessonId: lesson2.id, resourceType: 'lessonPlan', resourceId: lesson2.id },
			{ userId: user.id, lessonId: lesson2.id, resourceType: 'video', resourceId: video2.id },
		],
	});

	// --- Unit 1 Assessment (unit_quiz) ---

	const test1 = await prisma.assessment.create({
		data: {
			type: 'unit_quiz',
			unitId: unit1.id,
			questions: {
				create: [
					{
						type: 'multiple_choice',
						question: 'What is the correct HTML element for the largest heading?',
						content: { options: ['<h6>', '<heading>', '<h1>', '<head>'], correctIndex: 2 },
						order: 1,
					},
					{
						type: 'multiple_choice',
						question: 'Which CSS property changes the text color?',
						content: { options: ['text-color', 'font-color', 'color', 'foreground'], correctIndex: 2 },
						order: 2,
					},
					{
						type: 'multiple_choice',
						question: 'How do you apply multiple classes to an HTML element?',
						content: {
							options: ['class="cls1" class="cls2"', 'class="cls1, cls2"', 'class="cls1 cls2"', 'classes="cls1 cls2"'],
							correctIndex: 2,
						},
						order: 3,
					},
					{
						type: 'multiple_choice',
						question: 'What does CSS stand for?',
						content: {
							options: ['Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets'],
							correctIndex: 1,
						},
						order: 4,
					},
					{
						type: 'multiple_choice',
						question: 'Which HTML attribute specifies an alternate text for an image?',
						content: { options: ['title', 'src', 'alt', 'longdesc'], correctIndex: 2 },
						order: 5,
					},
				],
			},
		},
	});

	await prisma.assessmentAttempt.create({
		data: { assessmentId: test1.id, userId: user.id, score: 1, passed: true },
	});

	// --- Lesson 3: Variables and Types ---

	const video3 = await prisma.lessonResource.create({
		data: {
			lessonId: lesson3.id,
			type: 'video',
			title: 'JavaScript Variables',
			order: 1,
			content: { url: 'https://www.youtube.com/watch?v=9aGIAL16DL4' },
		},
	});

	await prisma.lessonResource.create({
		data: {
			lessonId: lesson3.id,
			type: 'note',
			title: 'Variables and Types',
			order: 2,
			content: {
				body: {
					type: 'doc',
					content: [
						{
							type: 'heading',
							attrs: { level: 2 },
							content: [{ type: 'text', text: 'Variables and Types' }],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'JavaScript has three variable keywords: var (function-scoped, hoisted), let (block-scoped, reassignable), and const (block-scoped, not reassignable).',
								},
							],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'JavaScript is dynamically typed. The main primitive types are: string, number, boolean, null, undefined, symbol, and bigint.',
								},
							],
						},
					],
				},
			},
		},
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				lessonId: lesson3.id,
				type: 'flash_card',
				title: 'null vs undefined',
				order: 1,
				content: {
					front: 'What is the difference between null and undefined?',
					back: 'null is an intentional absence of value assigned by the developer. undefined means a variable has been declared but not assigned.',
				},
			},
			{
				lessonId: lesson3.id,
				type: 'flash_card',
				title: 'Prefer const or let?',
				order: 2,
				content: {
					front: "Which keyword should you prefer for variables that won't be reassigned?",
					back: 'const',
				},
			},
		],
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				lessonId: lesson3.id,
				type: 'vocab',
				title: 'Variable',
				order: 1,
				content: {
					term: 'Variable',
					definition: 'A named container for storing a value that can be referenced and manipulated throughout a program.',
				},
			},
			{
				lessonId: lesson3.id,
				type: 'vocab',
				title: 'Primitive',
				order: 2,
				content: {
					term: 'Primitive',
					definition: 'A basic data type that is not an object and has no methods. JavaScript primitives include string, number, boolean, null, undefined, symbol, and bigint.',
				},
			},
			{
				lessonId: lesson3.id,
				type: 'vocab',
				title: 'Type Coercion',
				order: 3,
				content: {
					term: 'Type Coercion',
					definition: "JavaScript's automatic conversion of one data type to another, e.g. converting a number to a string during concatenation.",
				},
			},
			{
				lessonId: lesson3.id,
				type: 'vocab',
				title: 'Hoisting',
				order: 4,
				content: {
					term: 'Hoisting',
					definition: "JavaScript's behavior of moving variable and function declarations to the top of their scope before code execution.",
				},
			},
		],
	});

	const quiz3 = await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: lesson3.id,
			questions: {
				create: [
					{
						type: 'multiple_choice',
						question: 'Which keyword declares a block-scoped variable that can be reassigned?',
						content: { options: ['var', 'let', 'const', 'def'], correctIndex: 1 },
						order: 1,
					},
					{
						type: 'multiple_choice',
						question: 'What does typeof null return in JavaScript?',
						content: { options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctIndex: 2 },
						order: 2,
					},
				],
			},
		},
	});

	await prisma.assessmentAttempt.create({
		data: { assessmentId: quiz3.id, userId: user.id, score: 1, passed: true },
	});

	await prisma.lessonResourceCompletion.createMany({
		data: [
			{ userId: user.id, lessonId: lesson3.id, resourceType: 'lessonPlan', resourceId: lesson3.id },
			{ userId: user.id, lessonId: lesson3.id, resourceType: 'video', resourceId: video3.id },
		],
	});

	// --- Lesson 4: Functions and Scope ---

	await prisma.lessonResource.create({
		data: {
			lessonId: lesson4.id,
			type: 'note',
			title: 'Functions & Closures',
			order: 1,
			content: {
				body: {
					type: 'doc',
					content: [
						{
							type: 'heading',
							attrs: { level: 2 },
							content: [{ type: 'text', text: 'Functions and Closures' }],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'A function declaration is hoisted, meaning it can be called before it appears in the code. Function expressions and arrow functions are not hoisted.',
								},
							],
						},
						{
							type: 'paragraph',
							content: [
								{
									type: 'text',
									text: 'A closure is created when an inner function captures variables from its outer scope. This is the foundation of many JavaScript patterns including data privacy and factory functions.',
								},
							],
						},
					],
				},
			},
		},
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				lessonId: lesson4.id,
				type: 'vocab',
				title: 'Function',
				order: 1,
				content: {
					term: 'Function',
					definition: 'A reusable block of code designed to perform a specific task, defined with the function keyword or as an arrow function.',
				},
			},
			{
				lessonId: lesson4.id,
				type: 'vocab',
				title: 'Scope',
				order: 2,
				content: {
					term: 'Scope',
					definition: 'The context in which variables are accessible. Variables declared inside a function are local (function scope); those declared outside are global.',
				},
			},
			{
				lessonId: lesson4.id,
				type: 'vocab',
				title: 'Closure',
				order: 3,
				content: {
					term: 'Closure',
					definition: 'A function that retains access to variables from its outer (enclosing) scope even after the outer function has finished executing.',
				},
			},
			{
				lessonId: lesson4.id,
				type: 'vocab',
				title: 'Arrow Function',
				order: 4,
				content: {
					term: 'Arrow Function',
					definition: 'A concise syntax for writing functions using => that also lexically binds the this keyword.',
				},
			},
		],
	});

	const quiz4 = await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: lesson4.id,
			questions: {
				create: [
					{
						type: 'multiple_choice',
						question: 'What is a closure in JavaScript?',
						content: {
							options: [
								'A function that closes the browser',
								'A function that retains access to its outer scope even after the outer function has returned',
								'A method that seals an object',
								'A loop that terminates early',
							],
							correctIndex: 1,
						},
						order: 1,
					},
					{
						type: 'multiple_choice',
						question: 'What is the output of: console.log(typeof function(){})?',
						content: { options: ['"object"', '"function"', '"undefined"', '"method"'], correctIndex: 1 },
						order: 2,
					},
				],
			},
		},
	});

	// --- Unit 2 Assessment (unit_quiz) ---

	const test2 = await prisma.assessment.create({
		data: {
			type: 'unit_quiz',
			unitId: unit2.id,
			questions: {
				create: [
					{
						type: 'multiple_choice',
						question: 'What does the "===" operator check?',
						content: { options: ['Value only', 'Type only', 'Value and type', 'Reference equality'], correctIndex: 2 },
						order: 1,
					},
					{
						type: 'multiple_choice',
						question: 'Which method converts a string to an integer?',
						content: { options: ['Number()', 'parseInt()', 'toInt()', 'String()'], correctIndex: 1 },
						order: 2,
					},
					{
						type: 'multiple_choice',
						question: 'What is hoisting in JavaScript?',
						content: {
							options: [
								'Moving elements up in the DOM',
								"JavaScript's behavior of moving declarations to the top of their scope",
								"Increasing a variable's value",
								'Loading scripts asynchronously',
							],
							correctIndex: 1,
						},
						order: 3,
					},
				],
			},
		},
	});

	// --- Course Exam ---

	const exam = await prisma.assessment.create({
		data: {
			type: 'course_exam',
			courseId: course.id,
			questions: {
				create: [
					{
						type: 'multiple_choice',
						question: 'Which HTML tag is used to create a hyperlink?',
						content: { options: ['<link>', '<href>', '<a>', '<url>'], correctIndex: 2 },
						order: 1,
					},
					{
						type: 'multiple_choice',
						question: 'How do you write a comment in CSS?',
						content: { options: ['// comment', '# comment', '/* comment */', '<!-- comment -->'], correctIndex: 2 },
						order: 2,
					},
					{
						type: 'multiple_choice',
						question: 'Which of the following is NOT a JavaScript primitive type?',
						content: { options: ['string', 'boolean', 'array', 'number'], correctIndex: 2 },
						order: 3,
					},
					{
						type: 'multiple_choice',
						question: 'What will "2" + 2 evaluate to in JavaScript?',
						content: { options: ['4', '"22"', 'NaN', 'Error'], correctIndex: 1 },
						order: 4,
					},
					{
						type: 'multiple_choice',
						question: 'What CSS property makes an element invisible but still occupies space?',
						content: {
							options: ['display: none', 'visibility: hidden', 'opacity: 0', 'Both B and C'],
							correctIndex: 3,
						},
						order: 5,
					},
				],
			},
		},
	});

	// Complete all units for admin user
	await prisma.assessmentAttempt.create({
		data: { assessmentId: quiz4.id, userId: user.id, score: 1, passed: true },
	});
	await prisma.assessmentAttempt.create({
		data: { assessmentId: test2.id, userId: user.id, score: 1, passed: true },
	});
	await prisma.assessmentAttempt.create({
		data: { assessmentId: exam.id, userId: user.id, score: 1, passed: true },
	});

	console.log(`Seeded assessments: ${quiz1.id}, ${quiz2.id}, ${quiz3.id}, ${quiz4.id}`);
	console.log(`Seeded unit quizzes: ${test1.id}, ${test2.id}`);
	console.log(`Seeded course exam: ${exam.id}`);
	console.log('Seed complete!');
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
