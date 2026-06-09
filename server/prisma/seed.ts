import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

const prisma = new PrismaClient();

function makeNoteBody(heading: string, ...paragraphs: string[]) {
	return {
		body: {
			type: 'doc',
			content: [
				{
					type: 'heading',
					attrs: { level: 2 },
					content: [{ type: 'text', text: heading }],
				},
				...paragraphs.map((p) => ({
					type: 'paragraph',
					content: [{ type: 'text', text: p }],
				})),
			],
		},
	};
}

function makePlanContent(heading: string, bullets: string[]) {
	return {
		type: 'doc',
		content: [
			{
				type: 'heading',
				attrs: { level: 2 },
				content: [{ type: 'text', text: heading }],
			},
			{
				type: 'bulletList',
				content: bullets.map((b) => ({
					type: 'listItem',
					content: [
						{
							type: 'paragraph',
							content: [{ type: 'text', text: b }],
						},
					],
				})),
			},
		],
	};
}

function makeSyllabus(description: string, units: string[]) {
	return {
		type: 'doc',
		content: [
			{
				type: 'heading',
				attrs: { level: 1 },
				content: [{ type: 'text', text: 'Course Syllabus' }],
			},
			{
				type: 'paragraph',
				content: [{ type: 'text', text: description }],
			},
			{
				type: 'heading',
				attrs: { level: 2 },
				content: [{ type: 'text', text: 'Units' }],
			},
			{
				type: 'orderedList',
				content: units.map((u) => ({
					type: 'listItem',
					content: [
						{
							type: 'paragraph',
							content: [{ type: 'text', text: u }],
						},
					],
				})),
			},
		],
	};
}

async function seedUser(
	email: string,
	name: string,
	role: 'student' | 'teacher' | 'admin',
) {
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
	// ── Users ─────────────────────────────────────────────────────────────
	const admin = await seedUser(
		'admin@course-masters.app',
		'Admin User',
		'admin',
	);
	const teacher = await seedUser(
		'teacher@course-masters.app',
		'Teacher User',
		'teacher',
	);
	const student = await seedUser(
		'student@course-masters.app',
		'Student User',
		'student',
	);
	console.log(
		`Seeded users: ${admin.email}, ${teacher.email}, ${student.email}`,
	);

	// ── Cleanup ───────────────────────────────────────────────────────────
	await prisma.course.deleteMany({
		where: {
			title: {
				in: [
					'Introduction to Web Development',
					'English Grammar Fundamentals',
					'Algebra Essentials',
				],
			},
		},
	});

	// ════════════════════════════════════════════════════════════════════
	// COURSE 1: English Grammar Fundamentals
	// ════════════════════════════════════════════════════════════════════
	const grammar = await prisma.course.create({
		data: {
			title: 'English Grammar Fundamentals',
			description:
				'Master the building blocks of English — parts of speech, sentence structure, clauses, and phrases — through reading, practice, and self-assessment.',
			authorId: teacher.id,
			syllabus: makeSyllabus(
				'This course covers the essential elements of English grammar: the eight parts of speech, sentence structure, clauses, and phrases. By the end you will write clearer, more varied sentences.',
				['Unit 1: Parts of Speech', 'Unit 2: Sentence Structure'],
			),
		},
	});

	// ── Unit 1: Parts of Speech ───────────────────────────────────────────
	const grammarU1 = await prisma.unit.create({
		data: {
			title: 'Parts of Speech',
			description:
				'Identify and use the eight parts of speech — nouns, pronouns, verbs, and adjectives — correctly in written and spoken English.',
			order: 1,
			courseId: grammar.id,
		},
	});

	// ── Lesson 1: Nouns and Pronouns ──────────────────────────────────────
	const grammarL1 = await prisma.lesson.create({
		data: {
			title: 'Nouns and Pronouns',
			description:
				'Learn how nouns name people, places, things, and ideas, and how pronouns replace nouns to avoid repetition.',
			order: 1,
			unitId: grammarU1.id,
			objective:
				'Identify common and proper nouns, distinguish between personal and reflexive pronouns, and use them correctly in sentences.',
			planContent: makePlanContent('Lesson Overview', [
				'Types of nouns: common, proper, abstract, collective',
				'Personal pronouns: I, you, he, she, it, we, they',
				'Reflexive pronouns: myself, yourself, himself',
				'Noun-pronoun agreement',
			]),
		},
	});

	const grammarL1R1 = await prisma.lessonResource.create({
		data: {
			type: 'video',
			title: 'Introduction to Nouns',
			content: { url: 'https://www.youtube.com/watch?v=mn_HkWMnW0A' },
			order: 1,
			lessonId: grammarL1.id,
		},
	});
	const grammarL1R2 = await prisma.lessonResource.create({
		data: {
			type: 'note',
			title: 'What Is a Noun?',
			content: makeNoteBody(
				'What Is a Noun?',
				'A noun names a person (teacher, Maria), a place (school, Paris), a thing (desk, pencil), or an idea (freedom, happiness). Nouns can be common (generic) or proper (specific, always capitalized).',
				'Collective nouns name groups: team, class, flock. Abstract nouns name intangible concepts: courage, justice, knowledge.',
			),
			order: 2,
			lessonId: grammarL1.id,
		},
	});
	const grammarL1R3 = await prisma.lessonResource.create({
		data: {
			type: 'lecture',
			title: 'Pronoun Reference and Agreement',
			content: makeNoteBody(
				'Pronoun Reference and Agreement',
				'A pronoun takes the place of a noun to avoid repetition. The noun it replaces is called its antecedent. Personal pronouns: I/me, you, he/him, she/her, it, we/us, they/them.',
				'A pronoun must agree with its antecedent in number (singular/plural) and gender. Example: "Maria left early; she had a meeting." (she → Maria)',
			),
			order: 3,
			lessonId: grammarL1.id,
		},
	});

	const grammarL1Tools = await prisma.lessonTool.createManyAndReturn({
		data: [
			{
				type: 'flash_card',
				title: 'Common vs. Proper Noun',
				content: {
					front: 'What is the difference between a common noun and a proper noun?',
					back: 'A common noun names a general person, place, or thing (city, teacher). A proper noun names a specific one and is always capitalized (Paris, Mr. Rivera).',
				},
				order: 1,
				lessonId: grammarL1.id,
			},
			{
				type: 'flash_card',
				title: 'What is a pronoun?',
				content: {
					front: 'What is a pronoun, and what is its antecedent?',
					back: 'A pronoun replaces a noun. Its antecedent is the noun it refers to. Example: "Maria left early; she had a meeting." (she → Maria)',
				},
				order: 2,
				lessonId: grammarL1.id,
			},
			{
				type: 'vocab',
				title: 'Noun',
				content: {
					term: 'Noun',
					definition:
						'A word that names a person, place, thing, or idea. Nouns can be common (book) or proper (London).',
				},
				order: 3,
				lessonId: grammarL1.id,
			},
			{
				type: 'vocab',
				title: 'Pronoun',
				content: {
					term: 'Pronoun',
					definition:
						'A word that takes the place of a noun to avoid repetition, e.g. he, she, it, they, who.',
				},
				order: 4,
				lessonId: grammarL1.id,
			},
			{
				type: 'practice_problem',
				title: 'Which is a proper noun?',
				content: {
					question: 'Which of the following is a proper noun?',
					options: ['city', 'Paris', 'river', 'mountain'],
					correctIndex: 1,
				},
				order: 5,
				lessonId: grammarL1.id,
			},
		],
	});

	await prisma.assignment.create({
		data: {
			lessonId: grammarL1.id,
			order: 1,
			title: 'Parts of Speech Vocabulary',
			objective: 'Review the key terms introduced in this lesson.',
			type: 'vocab',
			vocabAssignment: {
				create: {
					entries: [
						{
							term: 'Noun',
							definition:
								'A word naming a person, place, thing, or idea.',
						},
						{
							term: 'Pronoun',
							definition:
								'A word that replaces a noun to avoid repetition.',
						},
						{
							term: 'Antecedent',
							definition:
								'The noun that a pronoun refers to or replaces.',
						},
						{
							term: 'Proper Noun',
							definition:
								'A specific noun that is always capitalized, such as London or Mr. Rivera.',
						},
					],
				},
			},
		},
	});
	await prisma.assignment.create({
		data: {
			lessonId: grammarL1.id,
			order: 2,
			title: 'Reading: Nouns and Pronouns in Context',
			objective: 'Read an overview of English nouns and pronouns.',
			type: 'reading',
			readingAssignment: {
				create: {
					url: 'https://www.grammarly.com/blog/nouns/',
					description:
						'An accessible overview of noun types, including concrete, abstract, common, proper, and collective nouns.',
					estimatedMinutes: 10,
				},
			},
		},
	});

	const grammarL1Quiz = await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: grammarL1.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question: 'Which sentence contains a proper noun?',
						content: {
							options: [
								'The dog barked loudly.',
								'She visited London last summer.',
								'They bought a new car.',
								'He is a talented musician.',
							],
							correctIndex: 1,
						},
					},
					{
						order: 2,
						type: 'true_false',
						question:
							'A pronoun must agree with its antecedent in number.',
						content: { correctAnswer: true },
					},
					{
						order: 3,
						type: 'fill_in_blank',
						question:
							'A noun that names an intangible concept such as "freedom" is called a(n) ___ noun.',
						content: { acceptedAnswers: ['abstract'] },
					},
				],
			},
		},
	});

	// ── Lesson 2: Verbs and Adjectives ────────────────────────────────────
	const grammarL2 = await prisma.lesson.create({
		data: {
			title: 'Verbs and Adjectives',
			description:
				'Explore action, linking, and helping verbs, and learn how adjectives modify nouns to add detail and precision.',
			order: 2,
			unitId: grammarU1.id,
			objective:
				'Distinguish action, linking, and helping verbs; identify adjectives and the nouns they modify; and apply correct verb tense.',
			planContent: makePlanContent('Lesson Overview', [
				'Action, linking, and helping verbs',
				'Regular and irregular verb forms',
				'Adjectives and the nouns they modify',
				'Comparative and superlative forms (tall, taller, tallest)',
			]),
		},
	});

	const grammarL2R1 = await prisma.lessonResource.create({
		data: {
			type: 'note',
			title: 'Verb Types and Tense',
			content: makeNoteBody(
				'Verb Types and Tense',
				'Action verbs express physical or mental action: run, think, write. Linking verbs connect the subject to a description: is, seems, appears, becomes. Helping verbs (auxiliaries) combine with a main verb: has written, will run, is thinking.',
				'Tense shows when an action occurs. Simple present: She writes. Simple past: She wrote. Simple future: She will write. Perfect forms use "have/has/had" + past participle.',
			),
			order: 1,
			lessonId: grammarL2.id,
		},
	});
	const grammarL2R2 = await prisma.lessonResource.create({
		data: {
			type: 'video',
			title: 'Adjectives Explained',
			content: { url: 'https://www.youtube.com/watch?v=N0r3oBhA_Sk' },
			order: 2,
			lessonId: grammarL2.id,
		},
	});

	const grammarL2Tools = await prisma.lessonTool.createManyAndReturn({
		data: [
			{
				type: 'flash_card',
				title: 'Linking verb example',
				content: {
					front: 'Is "seems" an action verb or a linking verb?',
					back: 'Linking verb. It connects the subject to a description without expressing physical or mental action. Example: "The soup seems hot."',
				},
				order: 1,
				lessonId: grammarL2.id,
			},
			{
				type: 'flash_card',
				title: 'Comparative vs. superlative',
				content: {
					front: 'What is the difference between comparative and superlative adjectives?',
					back: 'Comparative (-er or "more") compares two things: taller, more careful. Superlative (-est or "most") ranks one among three or more: tallest, most careful.',
				},
				order: 2,
				lessonId: grammarL2.id,
			},
			{
				type: 'vocab',
				title: 'Verb',
				content: {
					term: 'Verb',
					definition:
						'A word that expresses action (run, write) or a state of being (is, seems). Every complete sentence requires a verb.',
				},
				order: 3,
				lessonId: grammarL2.id,
			},
			{
				type: 'vocab',
				title: 'Adjective',
				content: {
					term: 'Adjective',
					definition:
						'A word that modifies a noun or pronoun by describing, identifying, or quantifying it. Example: the tall building, three apples.',
				},
				order: 4,
				lessonId: grammarL2.id,
			},
		],
	});

	await prisma.assignment.create({
		data: {
			lessonId: grammarL2.id,
			order: 1,
			title: 'Verb and Adjective Notes',
			objective:
				'Summarize the key distinctions between verb types and adjective forms in your own words.',
			type: 'note',
			noteAssignment: {
				create: {
					content: {
						type: 'doc',
						content: [
							{
								type: 'heading',
								attrs: { level: 2 },
								content: [
									{
										type: 'text',
										text: 'Verb and Adjective Notes',
									},
								],
							},
							{
								type: 'paragraph',
								content: [
									{
										type: 'text',
										text: 'Write your notes about verb types (action, linking, helping) and adjective comparisons here.',
									},
								],
							},
						],
					},
				},
			},
		},
	});
	await prisma.assignment.create({
		data: {
			lessonId: grammarL2.id,
			order: 2,
			title: 'Verb and Adjective Practice',
			objective:
				'Test your understanding of verb types and adjective forms.',
			type: 'practice_problem',
			practiceProblemAssignment: {
				create: {
					passingPercentage: 75,
					questions: {
						create: [
							{
								order: 1,
								type: 'multiple_choice',
								content: {
									question: 'Which verb is a linking verb?',
									options: ['run', 'jump', 'appear', 'write'],
									correctIndex: 2,
								},
							},
							{
								order: 2,
								type: 'true_false',
								content: {
									question:
										'Adjectives can only appear before the noun they modify.',
									correctAnswer: false,
								},
							},
							{
								order: 3,
								type: 'fill_in_blank',
								content: {
									question:
										'The superlative form of "good" is ___.',
									acceptedAnswers: ['best'],
								},
							},
						],
					},
				},
			},
		},
	});

	const grammarL2Quiz = await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: grammarL2.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question: 'Which sentence uses a helping verb?',
						content: {
							options: [
								'She runs every morning.',
								'He has finished his homework.',
								'The cat slept all day.',
								'We enjoyed the concert.',
							],
							correctIndex: 1,
						},
					},
					{
						order: 2,
						type: 'matching',
						question: 'Match each verb type to its example.',
						content: {
							pairs: [
								{
									prompt: 'Action verb',
									answer: 'She writes a letter.',
								},
								{
									prompt: 'Linking verb',
									answer: 'He seems tired.',
								},
								{
									prompt: 'Helping verb',
									answer: 'They are leaving soon.',
								},
							],
						},
					},
					{
						order: 3,
						type: 'true_false',
						question:
							'The superlative form of an adjective is used to compare exactly two things.',
						content: { correctAnswer: false },
					},
				],
			},
		},
	});

	// ── Unit 1 Quiz ───────────────────────────────────────────────────────
	const grammarU1Quiz = await prisma.assessment.create({
		data: {
			type: 'unit_quiz',
			unitId: grammarU1.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question: 'Which of the following is an abstract noun?',
						content: {
							options: ['table', 'London', 'justice', 'teacher'],
							correctIndex: 2,
						},
					},
					{
						order: 2,
						type: 'true_false',
						question:
							'A helping verb can stand alone as the main verb of a sentence without a main verb.',
						content: { correctAnswer: false },
					},
					{
						order: 3,
						type: 'fill_in_blank',
						question:
							'A word that modifies a noun is called a(n) ___.',
						content: { acceptedAnswers: ['adjective'] },
					},
					{
						order: 4,
						type: 'matching',
						question:
							'Match each part of speech to its definition.',
						content: {
							pairs: [
								{
									prompt: 'Noun',
									answer: 'Names a person, place, thing, or idea',
								},
								{
									prompt: 'Verb',
									answer: 'Expresses action or a state of being',
								},
								{
									prompt: 'Adjective',
									answer: 'Modifies a noun or pronoun',
								},
								{
									prompt: 'Pronoun',
									answer: 'Replaces a noun to avoid repetition',
								},
							],
						},
					},
				],
			},
		},
	});

	// ── Unit 2: Sentence Structure ────────────────────────────────────────
	const grammarU2 = await prisma.unit.create({
		data: {
			title: 'Sentence Structure',
			description:
				'Analyze how subjects and predicates combine to form sentences, and how clauses and phrases extend meaning and complexity.',
			order: 2,
			courseId: grammar.id,
		},
	});

	// ── Lesson 3: Subject and Predicate ───────────────────────────────────
	const grammarL3 = await prisma.lesson.create({
		data: {
			title: 'Subject and Predicate',
			description:
				'Understand how every sentence divides into a subject (who or what) and a predicate (what is said about the subject).',
			order: 1,
			unitId: grammarU2.id,
			objective:
				'Identify the simple subject and simple predicate in a sentence, and distinguish complete subjects from complete predicates.',
			planContent: makePlanContent('Lesson Overview', [
				'Simple vs. complete subject',
				'Simple vs. complete predicate',
				'Compound subjects and compound predicates',
				'Subject-verb agreement',
			]),
		},
	});

	const grammarL3R1 = await prisma.lessonResource.create({
		data: {
			type: 'video',
			title: 'Subjects and Predicates',
			content: { url: 'https://www.youtube.com/watch?v=BuCBdUuvGso' },
			order: 1,
			lessonId: grammarL3.id,
		},
	});
	const grammarL3R2 = await prisma.lessonResource.create({
		data: {
			type: 'lecture',
			title: 'Subject-Verb Agreement',
			content: makeNoteBody(
				'Subject-Verb Agreement',
				'The subject and verb of a sentence must agree in number. A singular subject takes a singular verb; a plural subject takes a plural verb. Example: "The dog runs." vs. "The dogs run."',
				'Compound subjects joined by "and" take a plural verb. Compound subjects joined by "or" or "nor" take a verb that agrees with the nearer subject.',
			),
			order: 2,
			lessonId: grammarL3.id,
		},
	});

	const grammarL3Tools = await prisma.lessonTool.createManyAndReturn({
		data: [
			{
				type: 'flash_card',
				title: 'What is the simple subject?',
				content: {
					front: 'What is the simple subject of a sentence?',
					back: 'The main noun or pronoun that the sentence is about, without any modifiers. In "The tall building collapsed," the simple subject is "building."',
				},
				order: 1,
				lessonId: grammarL3.id,
			},
			{
				type: 'vocab',
				title: 'Subject',
				content: {
					term: 'Subject',
					definition:
						'The part of a sentence that tells who or what the sentence is about. The simple subject is the main noun or pronoun.',
				},
				order: 2,
				lessonId: grammarL3.id,
			},
			{
				type: 'vocab',
				title: 'Predicate',
				content: {
					term: 'Predicate',
					definition:
						'The part of a sentence that tells what the subject does or is. The simple predicate is the main verb.',
				},
				order: 3,
				lessonId: grammarL3.id,
			},
		],
	});

	await prisma.assignment.create({
		data: {
			lessonId: grammarL3.id,
			order: 1,
			title: 'Video: Sentence Diagramming Basics',
			objective:
				'Watch a demonstration of how to visually diagram subject-predicate relationships.',
			type: 'video',
			videoAssignment: {
				create: {
					url: 'https://www.youtube.com/watch?v=Mh5VCnPStEo',
					title: 'Sentence Diagramming for Beginners',
				},
			},
		},
	});

	const grammarL3Quiz = await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: grammarL3.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question:
							'In "The happy children played in the park," what is the simple subject?',
						content: {
							options: [
								'The happy children',
								'children',
								'played',
								'in the park',
							],
							correctIndex: 1,
						},
					},
					{
						order: 2,
						type: 'fill_in_blank',
						question:
							'The part of a sentence that contains the verb and says something about the subject is called the ___.',
						content: {
							acceptedAnswers: [
								'predicate',
								'complete predicate',
							],
						},
					},
					{
						order: 3,
						type: 'true_false',
						question:
							'A sentence can have a compound subject made up of two or more nouns.',
						content: { correctAnswer: true },
					},
				],
			},
		},
	});

	// ── Lesson 4: Clauses and Phrases ─────────────────────────────────────
	const grammarL4 = await prisma.lesson.create({
		data: {
			title: 'Clauses and Phrases',
			description:
				'Distinguish independent and dependent clauses from phrases, and use them to write varied and complex sentences.',
			order: 2,
			unitId: grammarU2.id,
			objective:
				'Identify independent and dependent clauses, recognize common phrase types, and combine clauses correctly to avoid run-ons and fragments.',
			planContent: makePlanContent('Lesson Overview', [
				'Independent vs. dependent clauses',
				'Noun, verb, adjective, and adverbial phrases',
				'Subordinating conjunctions',
				'Avoiding run-on sentences and fragments',
			]),
		},
	});

	await prisma.lessonResource.create({
		data: {
			type: 'note',
			title: 'Clauses: Independent and Dependent',
			content: makeNoteBody(
				'Clauses: Independent and Dependent',
				'An independent clause can stand alone as a complete sentence: "She studied hard." A dependent clause cannot stand alone; it begins with a subordinating conjunction: "Because she studied hard..."',
				'Common subordinating conjunctions: because, although, when, if, since, unless, while, after, before. Always attach a dependent clause to an independent clause.',
			),
			order: 1,
			lessonId: grammarL4.id,
		},
	});
	await prisma.lessonResource.create({
		data: {
			type: 'lecture',
			title: 'Phrases vs. Clauses',
			content: makeNoteBody(
				'Phrases vs. Clauses',
				'A phrase is a group of words without both a subject and a verb. Types: noun phrase (the tall building), verb phrase (has been running), prepositional phrase (in the morning), infinitive phrase (to win the race).',
				'Unlike a clause, a phrase cannot make a complete thought on its own. A dependent clause has a subject and a verb but still needs an independent clause to complete its meaning.',
			),
			order: 2,
			lessonId: grammarL4.id,
		},
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				type: 'vocab',
				title: 'Independent Clause',
				content: {
					term: 'Independent Clause',
					definition:
						'A clause that contains a subject and a verb and expresses a complete thought. It can stand alone as a sentence.',
				},
				order: 1,
				lessonId: grammarL4.id,
			},
			{
				type: 'vocab',
				title: 'Dependent Clause',
				content: {
					term: 'Dependent Clause',
					definition:
						'A clause that has a subject and a verb but cannot stand alone because it begins with a subordinating conjunction, e.g. "although she was tired."',
				},
				order: 2,
				lessonId: grammarL4.id,
			},
			{
				type: 'practice_problem',
				title: 'Identify the clause type',
				content: {
					question:
						'Which of the following is an independent clause?',
					options: [
						'Because it was raining.',
						'When the bell rings.',
						'The students left the classroom.',
						'Although he tried hard.',
					],
					correctIndex: 2,
				},
				order: 3,
				lessonId: grammarL4.id,
			},
		],
	});

	await prisma.assignment.create({
		data: {
			lessonId: grammarL4.id,
			order: 1,
			title: 'Clause and Phrase Analysis Notes',
			objective:
				'Record examples of clauses and phrases from your reading and label each type.',
			type: 'note',
			noteAssignment: {
				create: {
					content: {
						type: 'doc',
						content: [
							{
								type: 'heading',
								attrs: { level: 2 },
								content: [
									{
										type: 'text',
										text: 'Clause and Phrase Analysis',
									},
								],
							},
							{
								type: 'paragraph',
								content: [
									{
										type: 'text',
										text: 'List examples of independent clauses, dependent clauses, and phrases you find in your reading. Label each one.',
									},
								],
							},
						],
					},
				},
			},
		},
	});
	await prisma.assignment.create({
		data: {
			lessonId: grammarL4.id,
			order: 2,
			title: 'Reading: Clauses and Phrases Explained',
			objective: 'Read a reference guide to clause and phrase types.',
			type: 'reading',
			readingAssignment: {
				create: {
					url: 'https://www.grammarly.com/blog/clauses/',
					description:
						'A clear guide to independent and dependent clauses with examples of subordinating conjunctions and proper punctuation.',
					estimatedMinutes: 12,
				},
			},
		},
	});

	await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: grammarL4.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'matching',
						question: 'Match each term to its definition.',
						content: {
							pairs: [
								{
									prompt: 'Independent clause',
									answer: 'Can stand alone as a sentence',
								},
								{
									prompt: 'Dependent clause',
									answer: 'Cannot stand alone; needs a main clause',
								},
								{
									prompt: 'Phrase',
									answer: 'Group of words without both subject and verb',
								},
							],
						},
					},
					{
						order: 2,
						type: 'multiple_choice',
						question: 'Which word is a subordinating conjunction?',
						content: {
							options: ['and', 'but', 'although', 'or'],
							correctIndex: 2,
						},
					},
					{
						order: 3,
						type: 'true_false',
						question:
							'A phrase contains both a subject and a verb.',
						content: { correctAnswer: false },
					},
				],
			},
		},
	});

	// ── Unit 2 Quiz ───────────────────────────────────────────────────────
	await prisma.assessment.create({
		data: {
			type: 'unit_quiz',
			unitId: grammarU2.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question:
							'In "The quick brown fox jumped over the fence," what is the simple predicate?',
						content: {
							options: [
								'The quick brown fox',
								'jumped',
								'over the fence',
								'brown fox',
							],
							correctIndex: 1,
						},
					},
					{
						order: 2,
						type: 'true_false',
						question:
							'A dependent clause expresses a complete thought and can stand alone.',
						content: { correctAnswer: false },
					},
					{
						order: 3,
						type: 'fill_in_blank',
						question:
							'Two or more independent clauses joined incorrectly without punctuation form a ___.',
						content: {
							acceptedAnswers: ['run-on', 'run-on sentence'],
						},
					},
					{
						order: 4,
						type: 'matching',
						question: 'Match each sentence part to its role.',
						content: {
							pairs: [
								{
									prompt: 'Simple subject',
									answer: 'Main noun the sentence is about',
								},
								{
									prompt: 'Simple predicate',
									answer: 'Main verb in the predicate',
								},
								{
									prompt: 'Independent clause',
									answer: 'Complete thought that can stand alone',
								},
								{
									prompt: 'Dependent clause',
									answer: 'Incomplete thought beginning with a subordinating conjunction',
								},
							],
						},
					},
				],
			},
		},
	});

	// ── Course 1 Exam ─────────────────────────────────────────────────────
	await prisma.assessment.create({
		data: {
			type: 'course_exam',
			courseId: grammar.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question:
							'Which of the following is both a common noun and an abstract noun?',
						content: {
							options: ['Paris', 'dog', 'freedom', 'desk'],
							correctIndex: 2,
						},
					},
					{
						order: 2,
						type: 'true_false',
						question:
							'A helping verb always stands alone as the only verb in a sentence.',
						content: { correctAnswer: false },
					},
					{
						order: 3,
						type: 'fill_in_blank',
						question:
							'A group of words that has a subject and a verb and can stand alone is called an ___ clause.',
						content: { acceptedAnswers: ['independent'] },
					},
					{
						order: 4,
						type: 'matching',
						question:
							'Match each term to its grammatical category.',
						content: {
							pairs: [
								{
									prompt: 'runs, jumped, will think',
									answer: 'Verbs',
								},
								{
									prompt: 'beautiful, tall, three',
									answer: 'Adjectives',
								},
								{
									prompt: 'he, she, they, whom',
									answer: 'Pronouns',
								},
								{
									prompt: 'because, although, when',
									answer: 'Subordinating conjunctions',
								},
							],
						},
					},
					{
						order: 5,
						type: 'multiple_choice',
						question:
							'Which sentence demonstrates correct subject-verb agreement?',
						content: {
							options: [
								'The team are winning.',
								'Neither the coach nor the players was ready.',
								'The dog and the cat are outside.',
								'Every student have a textbook.',
							],
							correctIndex: 2,
						},
					},
				],
			},
		},
	});

	console.log('Course 1 (English Grammar Fundamentals) seeded.');

	// ════════════════════════════════════════════════════════════════════
	// STUDENT PROGRESS: Lessons 1, 2 (Unit 1 complete) + Lesson 3 (Unit 2)
	// ════════════════════════════════════════════════════════════════════
	await prisma.lessonResourceCompletion.createMany({
		data: [
			{ userId: student.id, resourceId: grammarL1R1.id },
			{ userId: student.id, resourceId: grammarL1R2.id },
			{ userId: student.id, resourceId: grammarL1R3.id },
			{ userId: student.id, resourceId: grammarL2R1.id },
			{ userId: student.id, resourceId: grammarL2R2.id },
			{ userId: student.id, resourceId: grammarL3R1.id },
			{ userId: student.id, resourceId: grammarL3R2.id },
		],
	});

	await prisma.lessonToolCompletion.createMany({
		data: [
			...grammarL1Tools.map((t) => ({
				userId: student.id,
				toolId: t.id,
			})),
			...grammarL2Tools.map((t) => ({
				userId: student.id,
				toolId: t.id,
			})),
			...grammarL3Tools.map((t) => ({
				userId: student.id,
				toolId: t.id,
			})),
		],
	});

	await prisma.assessmentAttempt.createMany({
		data: [
			{
				userId: student.id,
				assessmentId: grammarL1Quiz.id,
				score: 1.0,
				passed: true,
			},
			{
				userId: student.id,
				assessmentId: grammarL2Quiz.id,
				score: 1.0,
				passed: true,
			},
			{
				userId: student.id,
				assessmentId: grammarL3Quiz.id,
				score: 1.0,
				passed: true,
			},
		],
	});

	await prisma.lessonCompletion.createMany({
		data: [
			{ userId: student.id, lessonId: grammarL1.id },
			{ userId: student.id, lessonId: grammarL2.id },
			{ userId: student.id, lessonId: grammarL3.id },
		],
	});

	await prisma.assessmentAttempt.create({
		data: {
			userId: student.id,
			assessmentId: grammarU1Quiz.id,
			score: 0.85,
			passed: true,
		},
	});

	await prisma.unitCompletion.create({
		data: { userId: student.id, unitId: grammarU1.id },
	});

	console.log('Student progress seeded.');

	// ════════════════════════════════════════════════════════════════════
	// COURSE 2: Algebra Essentials
	// ════════════════════════════════════════════════════════════════════
	const algebra = await prisma.course.create({
		data: {
			title: 'Algebra Essentials',
			description:
				'Build a solid foundation in algebra by mastering variables, expressions, equations, and inequalities — the core tools of mathematical reasoning.',
			authorId: teacher.id,
			syllabus: makeSyllabus(
				'This course introduces the core concepts of algebra: variables, expressions, equations, and inequalities. You will develop the skills to model and solve real-world problems algebraically.',
				[
					'Unit 1: Variables and Expressions',
					'Unit 2: Equations and Inequalities',
				],
			),
		},
	});

	// ── Unit 1: Variables and Expressions ────────────────────────────────
	const algebraU1 = await prisma.unit.create({
		data: {
			title: 'Variables and Expressions',
			description:
				'Understand what variables and constants are, write and evaluate algebraic expressions, and simplify expressions by combining like terms.',
			order: 1,
			courseId: algebra.id,
		},
	});

	// ── Algebra Lesson 1: Variables and Constants ─────────────────────────
	const algebraL1 = await prisma.lesson.create({
		data: {
			title: 'Variables and Constants',
			description:
				'Discover the difference between variables and constants, and learn to write and evaluate algebraic expressions.',
			order: 1,
			unitId: algebraU1.id,
			objective:
				'Define variable and constant, translate verbal phrases into algebraic expressions, and evaluate expressions by substituting values.',
			planContent: makePlanContent('Lesson Overview', [
				'Variables vs. constants',
				'Writing algebraic expressions from word problems',
				'Evaluating expressions by substitution',
				'The order of operations (PEMDAS)',
			]),
		},
	});

	await prisma.lessonResource.create({
		data: {
			type: 'video',
			title: 'What Are Variables?',
			content: { url: 'https://www.youtube.com/watch?v=tHYis-DP0oU' },
			order: 1,
			lessonId: algebraL1.id,
		},
	});
	await prisma.lessonResource.create({
		data: {
			type: 'note',
			title: 'Variables, Constants, and Expressions',
			content: makeNoteBody(
				'Variables, Constants, and Expressions',
				'A variable is a symbol (usually a letter) that represents an unknown or changing value. A constant is a fixed value that does not change. In 3x + 7, x is the variable and 7 is the constant.',
				'An algebraic expression is a combination of variables, constants, and operations. To evaluate an expression, substitute a number for each variable and simplify using the order of operations (PEMDAS).',
			),
			order: 2,
			lessonId: algebraL1.id,
		},
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				type: 'flash_card',
				title: 'Variable vs. constant',
				content: {
					front: 'In the expression 5n − 3, which part is the variable and which is the constant?',
					back: 'n is the variable (it can change). −3 is the constant (it is fixed).',
				},
				order: 1,
				lessonId: algebraL1.id,
			},
			{
				type: 'flash_card',
				title: 'Evaluate an expression',
				content: {
					front: 'Evaluate 2x + 4 when x = 3.',
					back: '2(3) + 4 = 6 + 4 = 10',
				},
				order: 2,
				lessonId: algebraL1.id,
			},
			{
				type: 'vocab',
				title: 'Variable',
				content: {
					term: 'Variable',
					definition:
						'A letter or symbol that represents an unknown or changing quantity in an algebraic expression or equation.',
				},
				order: 3,
				lessonId: algebraL1.id,
			},
			{
				type: 'vocab',
				title: 'Constant',
				content: {
					term: 'Constant',
					definition:
						'A fixed numerical value in an expression that does not change, such as the 7 in 3x + 7.',
				},
				order: 4,
				lessonId: algebraL1.id,
			},
		],
	});

	await prisma.assignment.create({
		data: {
			lessonId: algebraL1.id,
			order: 1,
			title: 'Algebra Vocabulary Review',
			objective:
				'Reinforce your understanding of foundational algebra terms.',
			type: 'vocab',
			vocabAssignment: {
				create: {
					entries: [
						{
							term: 'Variable',
							definition:
								'A symbol representing an unknown quantity.',
						},
						{
							term: 'Constant',
							definition: 'A fixed value that does not change.',
						},
						{
							term: 'Expression',
							definition:
								'A combination of variables, constants, and operations — no equals sign.',
						},
						{
							term: 'Evaluate',
							definition:
								'To substitute values for variables and simplify to a single number.',
						},
					],
				},
			},
		},
	});
	await prisma.assignment.create({
		data: {
			lessonId: algebraL1.id,
			order: 2,
			title: 'Reading: Introduction to Algebraic Expressions',
			objective:
				'Read a primer on translating word problems into algebraic expressions.',
			type: 'reading',
			readingAssignment: {
				create: {
					url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:foundation-algebra/x2f8bb11595b61c86:intro-variables/a/what-is-a-variable',
					description:
						'Khan Academy introduction to variables and algebraic expressions with interactive examples.',
					estimatedMinutes: 15,
				},
			},
		},
	});

	await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: algebraL1.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question:
							'In the expression 4y − 9, which term is the constant?',
						content: {
							options: ['4', 'y', '4y', '−9'],
							correctIndex: 3,
						},
						calculatorEnabled: false,
					},
					{
						order: 2,
						type: 'true_false',
						question: 'A variable must always be the letter x.',
						content: { correctAnswer: false },
						calculatorEnabled: false,
					},
					{
						order: 3,
						type: 'fill_in_blank',
						question:
							'Evaluate 3a + 5 when a = 4. The answer is ___.',
						content: { acceptedAnswers: ['17'] },
						calculatorEnabled: true,
					},
				],
			},
		},
	});

	// ── Algebra Lesson 2: Simplifying Expressions ─────────────────────────
	const algebraL2 = await prisma.lesson.create({
		data: {
			title: 'Simplifying Expressions',
			description:
				'Learn to simplify algebraic expressions by combining like terms and applying the distributive property.',
			order: 2,
			unitId: algebraU1.id,
			objective:
				'Identify like terms, combine them correctly, and apply the distributive property to simplify expressions.',
			planContent: makePlanContent('Lesson Overview', [
				'Identifying like terms (same variable, same exponent)',
				'Combining like terms by adding/subtracting coefficients',
				'The distributive property: a(b + c) = ab + ac',
				'Simplifying multi-step expressions',
			]),
		},
	});

	await prisma.lessonResource.create({
		data: {
			type: 'lecture',
			title: 'Like Terms and the Distributive Property',
			content: makeNoteBody(
				'Like Terms and the Distributive Property',
				'Like terms have the same variable raised to the same exponent. You can add or subtract their coefficients. Example: 3x + 5x = 8x. Unlike terms (3x and 5y) cannot be combined.',
				'The distributive property states a(b + c) = ab + ac. Use it to remove parentheses before combining like terms. Example: 2(x + 4) = 2x + 8.',
			),
			order: 1,
			lessonId: algebraL2.id,
		},
	});
	await prisma.lessonResource.create({
		data: {
			type: 'note',
			title: 'Simplification Steps',
			content: makeNoteBody(
				'Simplification Steps',
				'Step 1: Apply the distributive property to remove parentheses. Step 2: Identify all like terms. Step 3: Add or subtract coefficients. Step 4: Write the simplified expression.',
				'Example: Simplify 3(2x + 1) + 4x. Step 1: 6x + 3 + 4x. Steps 2–4: 10x + 3.',
			),
			order: 2,
			lessonId: algebraL2.id,
		},
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				type: 'practice_problem',
				title: 'Combine like terms',
				content: {
					question: 'Simplify: 7x + 3 − 2x + 5',
					options: ['5x + 8', '5x − 2', '9x + 8', '5x + 2'],
					correctIndex: 0,
				},
				order: 1,
				lessonId: algebraL2.id,
			},
			{
				type: 'practice_problem',
				title: 'Distributive property',
				content: {
					question: 'Simplify: 3(x + 4) + 2x',
					options: ['5x + 4', '5x + 12', '3x + 14', '6x + 4'],
					correctIndex: 1,
				},
				order: 2,
				lessonId: algebraL2.id,
			},
			{
				type: 'flash_card',
				title: 'Like terms definition',
				content: {
					front: 'Can 4x² and 4x be combined as like terms?',
					back: 'No. Like terms must have the same variable AND the same exponent. 4x² and 4x have different exponents.',
				},
				order: 3,
				lessonId: algebraL2.id,
			},
		],
	});

	await prisma.assignment.create({
		data: {
			lessonId: algebraL2.id,
			order: 1,
			title: 'Simplification Practice Set',
			objective:
				'Demonstrate mastery of combining like terms and the distributive property.',
			type: 'practice_problem',
			practiceProblemAssignment: {
				create: {
					passingPercentage: 80,
					questions: {
						create: [
							{
								order: 1,
								type: 'multiple_choice',
								content: {
									question: 'Simplify: 2(3x − 1) + 5x',
									options: [
										'11x − 2',
										'11x − 1',
										'6x − 2',
										'11x + 2',
									],
									correctIndex: 0,
								},
							},
							{
								order: 2,
								type: 'true_false',
								content: {
									question:
										'3x and 3y are like terms because they share the same coefficient.',
									correctAnswer: false,
								},
							},
						],
					},
				},
			},
		},
	});
	await prisma.assignment.create({
		data: {
			lessonId: algebraL2.id,
			order: 2,
			title: 'Distributive Property Examples',
			objective:
				'Write out three examples of the distributive property in your own notes.',
			type: 'note',
			noteAssignment: {
				create: {
					content: {
						type: 'doc',
						content: [
							{
								type: 'heading',
								attrs: { level: 2 },
								content: [
									{
										type: 'text',
										text: 'Distributive Property Examples',
									},
								],
							},
							{
								type: 'paragraph',
								content: [
									{
										type: 'text',
										text: 'Write three original expressions and show each step of applying the distributive property to simplify them.',
									},
								],
							},
						],
					},
				},
			},
		},
	});

	await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: algebraL2.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question: 'Simplify: 5x + 3x − 2',
						content: {
							options: ['8x − 2', '6x', '8x + 2', '6x − 2'],
							correctIndex: 0,
						},
						calculatorEnabled: false,
					},
					{
						order: 2,
						type: 'matching',
						question:
							'Match each expression to its simplified form.',
						content: {
							pairs: [
								{ prompt: '4x + 2x', answer: '6x' },
								{ prompt: '3(x + 2)', answer: '3x + 6' },
								{ prompt: '5x − 5x', answer: '0' },
							],
						},
						calculatorEnabled: false,
					},
					{
						order: 3,
						type: 'true_false',
						question: '2(x + 3) simplifies to 2x + 3.',
						content: { correctAnswer: false },
						calculatorEnabled: true,
					},
				],
			},
		},
	});

	// ── Algebra Unit 1 Quiz ───────────────────────────────────────────────
	await prisma.assessment.create({
		data: {
			type: 'unit_quiz',
			unitId: algebraU1.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question:
							'Which of the following is an algebraic expression?',
						content: {
							options: ['x = 5', '3 + 4 = 7', '2x + 5', '10'],
							correctIndex: 2,
						},
						calculatorEnabled: false,
					},
					{
						order: 2,
						type: 'true_false',
						question:
							'When simplifying 4(2x − 3), the result is 8x − 3.',
						content: { correctAnswer: false },
						calculatorEnabled: true,
					},
					{
						order: 3,
						type: 'fill_in_blank',
						question:
							'Evaluate 5x − 2 when x = 3. The answer is ___.',
						content: { acceptedAnswers: ['13'] },
						calculatorEnabled: true,
					},
					{
						order: 4,
						type: 'matching',
						question: 'Match each term to its meaning.',
						content: {
							pairs: [
								{
									prompt: 'Coefficient',
									answer: 'The numerical factor in a term, e.g. 5 in 5x',
								},
								{
									prompt: 'Like terms',
									answer: 'Terms with the same variable and exponent',
								},
								{
									prompt: 'Distributive property',
									answer: 'a(b + c) = ab + ac',
								},
								{
									prompt: 'Constant',
									answer: 'A fixed number with no variable',
								},
							],
						},
						calculatorEnabled: false,
					},
				],
			},
		},
	});

	// ── Unit 2: Equations and Inequalities ───────────────────────────────
	const algebraU2 = await prisma.unit.create({
		data: {
			title: 'Equations and Inequalities',
			description:
				'Solve linear equations and inequalities in one variable using inverse operations, and interpret solutions in real-world contexts.',
			order: 2,
			courseId: algebra.id,
		},
	});

	// ── Algebra Lesson 3: Solving Linear Equations ────────────────────────
	const algebraL3 = await prisma.lesson.create({
		data: {
			title: 'Solving Linear Equations',
			description:
				'Use inverse operations to isolate a variable and solve one- and two-step linear equations.',
			order: 1,
			unitId: algebraU2.id,
			objective:
				'Apply inverse operations to solve one-step and two-step linear equations, and verify solutions by substitution.',
			planContent: makePlanContent('Lesson Overview', [
				'One-step equations (addition, subtraction, multiplication, division)',
				'Two-step equations',
				'Checking solutions by substitution',
				'Writing equations from word problems',
			]),
		},
	});

	await prisma.lessonResource.create({
		data: {
			type: 'video',
			title: 'Solving One-Step Equations',
			content: { url: 'https://www.youtube.com/watch?v=l3XzepN03KQ' },
			order: 1,
			lessonId: algebraL3.id,
		},
	});
	await prisma.lessonResource.create({
		data: {
			type: 'note',
			title: 'Inverse Operations',
			content: makeNoteBody(
				'Inverse Operations',
				'To solve an equation, apply inverse operations to isolate the variable. The inverse of addition is subtraction; the inverse of multiplication is division. Perform the same operation on both sides.',
				'Two-step equations: first undo addition/subtraction, then undo multiplication/division. Example: Solve 2x + 3 = 11. Subtract 3: 2x = 8. Divide by 2: x = 4. Check: 2(4) + 3 = 11. ✓',
			),
			order: 2,
			lessonId: algebraL3.id,
		},
	});
	await prisma.lessonResource.create({
		data: {
			type: 'lecture',
			title: 'Writing Equations from Word Problems',
			content: makeNoteBody(
				'Writing Equations from Word Problems',
				'"More than" = addition, "less than" = subtraction, "times" = multiplication, "split equally" = division. Define a variable for the unknown, write the equation, then solve.',
				'Example: "Three more than twice a number is 11." Let n = the number. Equation: 2n + 3 = 11. Solve: n = 4.',
			),
			order: 3,
			lessonId: algebraL3.id,
		},
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				type: 'practice_problem',
				title: 'Solve a one-step equation',
				content: {
					question: 'Solve for x: x + 7 = 15',
					options: ['x = 8', 'x = 22', 'x = 7', 'x = 6'],
					correctIndex: 0,
				},
				order: 1,
				lessonId: algebraL3.id,
			},
			{
				type: 'practice_problem',
				title: 'Solve a two-step equation',
				content: {
					question: 'Solve for x: 3x − 4 = 11',
					options: ['x = 5', 'x = 7', 'x = 3', 'x = 4'],
					correctIndex: 0,
				},
				order: 2,
				lessonId: algebraL3.id,
			},
			{
				type: 'vocab',
				title: 'Equation',
				content: {
					term: 'Equation',
					definition:
						'A mathematical statement that two expressions are equal, indicated by an equals sign. Example: 2x + 1 = 9.',
				},
				order: 3,
				lessonId: algebraL3.id,
			},
		],
	});

	await prisma.assignment.create({
		data: {
			lessonId: algebraL3.id,
			order: 1,
			title: 'Video: Two-Step Equation Practice',
			objective:
				'Watch worked examples of two-step equations solved step by step.',
			type: 'video',
			videoAssignment: {
				create: {
					url: 'https://www.youtube.com/watch?v=tuVd355R-OQ',
					title: 'Two-Step Equations — Khan Academy',
				},
			},
		},
	});
	await prisma.assignment.create({
		data: {
			lessonId: algebraL3.id,
			order: 2,
			title: 'Equation Solving Practice Set',
			objective:
				'Solve a set of linear equations independently and verify your answers.',
			type: 'practice_problem',
			practiceProblemAssignment: {
				create: {
					passingPercentage: 80,
					questions: {
						create: [
							{
								order: 1,
								type: 'multiple_choice',
								content: {
									question: 'Solve for x: 4x = 24',
									options: [
										'x = 6',
										'x = 20',
										'x = 96',
										'x = 4',
									],
									correctIndex: 0,
								},
							},
							{
								order: 2,
								type: 'fill_in_blank',
								content: {
									question:
										'Solve for n: n − 9 = 13. n = ___.',
									acceptedAnswers: ['22'],
								},
							},
						],
					},
				},
			},
		},
	});

	await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: algebraL3.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question: 'Solve for x: 2x + 5 = 13',
						content: {
							options: ['x = 4', 'x = 9', 'x = 3', 'x = 6'],
							correctIndex: 0,
						},
						calculatorEnabled: true,
					},
					{
						order: 2,
						type: 'fill_in_blank',
						question: 'Solve for y: y/3 = 7. y = ___.',
						content: { acceptedAnswers: ['21'] },
						calculatorEnabled: true,
					},
					{
						order: 3,
						type: 'true_false',
						question:
							'To solve x − 8 = 5, you should subtract 8 from both sides.',
						content: { correctAnswer: false },
						calculatorEnabled: false,
					},
				],
			},
		},
	});

	// ── Algebra Lesson 4: Inequalities ────────────────────────────────────
	const algebraL4 = await prisma.lesson.create({
		data: {
			title: 'Inequalities',
			description:
				'Extend equation-solving skills to inequalities, graph solutions on a number line, and interpret inequality notation.',
			order: 2,
			unitId: algebraU2.id,
			objective:
				'Solve one-step and two-step linear inequalities, graph solution sets on a number line, and flip the inequality sign when multiplying or dividing by a negative.',
			planContent: makePlanContent('Lesson Overview', [
				'Inequality symbols: <, >, ≤, ≥',
				'Solving inequalities with inverse operations',
				'Flipping the sign when multiplying/dividing by negatives',
				'Graphing solution sets on a number line',
			]),
		},
	});

	await prisma.lessonResource.create({
		data: {
			type: 'note',
			title: 'Inequality Symbols and Rules',
			content: makeNoteBody(
				'Inequality Symbols and Rules',
				'Inequalities compare two expressions: < (less than), > (greater than), ≤ (less than or equal to), ≥ (greater than or equal to). Solve inequalities the same way as equations — but flip the inequality sign when you multiply or divide both sides by a negative number.',
				'Example: Solve −2x > 8. Divide both sides by −2 and flip: x < −4. Graph with an open circle at −4 and an arrow pointing left.',
			),
			order: 1,
			lessonId: algebraL4.id,
		},
	});
	await prisma.lessonResource.create({
		data: {
			type: 'lecture',
			title: 'Graphing Inequalities',
			content: makeNoteBody(
				'Graphing Inequalities',
				'On a number line: use an open circle (○) for strict inequalities (< or >) and a closed circle (●) for inclusive ones (≤ or ≥). Shade or draw an arrow toward the values that satisfy the inequality.',
				'For compound inequalities: "and" (intersection) shades between two values. "Or" (union) shades outward from two points. Always test a value in the shaded region to verify.',
			),
			order: 2,
			lessonId: algebraL4.id,
		},
	});

	await prisma.lessonTool.createMany({
		data: [
			{
				type: 'flash_card',
				title: 'Sign flip rule',
				content: {
					front: 'When do you flip the inequality sign when solving an inequality?',
					back: 'When you multiply or divide BOTH sides by a negative number. Example: −2x > 6 → x < −3.',
				},
				order: 1,
				lessonId: algebraL4.id,
			},
			{
				type: 'practice_problem',
				title: 'Solve an inequality',
				content: {
					question: 'Solve for x: 3x − 6 < 9',
					options: ['x < 5', 'x < 1', 'x > 5', 'x < 3'],
					correctIndex: 0,
				},
				order: 2,
				lessonId: algebraL4.id,
			},
			{
				type: 'practice_problem',
				title: 'Identify the graph',
				content: {
					question:
						'Which inequality is represented by an open circle at 4 with an arrow pointing right?',
					options: ['x ≤ 4', 'x ≥ 4', 'x < 4', 'x > 4'],
					correctIndex: 3,
				},
				order: 3,
				lessonId: algebraL4.id,
			},
		],
	});

	await prisma.assignment.create({
		data: {
			lessonId: algebraL4.id,
			order: 1,
			title: 'Reading: Inequalities in the Real World',
			objective:
				'Read about how inequalities model real-world constraints such as budgets and speed limits.',
			type: 'reading',
			readingAssignment: {
				create: {
					url: 'https://www.khanacademy.org/math/algebra/x2f8bb11595b61c86:solve-equations-inequalities/x2f8bb11595b61c86:linear-inequalities/a/inequalities-word-problems',
					description:
						'Khan Academy article on writing and solving inequalities from word problems, with practice exercises.',
					estimatedMinutes: 15,
				},
			},
		},
	});
	await prisma.assignment.create({
		data: {
			lessonId: algebraL4.id,
			order: 2,
			title: 'Inequality Solving Notes',
			objective:
				'Document the steps for solving inequalities and give two original examples.',
			type: 'note',
			noteAssignment: {
				create: {
					content: {
						type: 'doc',
						content: [
							{
								type: 'heading',
								attrs: { level: 2 },
								content: [
									{
										type: 'text',
										text: 'Inequality Solving Notes',
									},
								],
							},
							{
								type: 'paragraph',
								content: [
									{
										type: 'text',
										text: 'Summarize the rules for solving inequalities, including when to flip the sign. Provide two original inequality problems and solve them step by step.',
									},
								],
							},
						],
					},
				},
			},
		},
	});

	await prisma.assessment.create({
		data: {
			type: 'lesson_quiz',
			lessonId: algebraL4.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question: 'Solve for x: −4x ≤ 20',
						content: {
							options: ['x ≤ −5', 'x ≥ −5', 'x ≤ 5', 'x ≥ 5'],
							correctIndex: 1,
						},
						calculatorEnabled: true,
					},
					{
						order: 2,
						type: 'matching',
						question:
							'Match each inequality to its graph description.',
						content: {
							pairs: [
								{
									prompt: 'x > 3',
									answer: 'Open circle at 3, arrow right',
								},
								{
									prompt: 'x ≤ −1',
									answer: 'Closed circle at −1, arrow left',
								},
								{
									prompt: 'x ≥ 0',
									answer: 'Closed circle at 0, arrow right',
								},
							],
						},
						calculatorEnabled: false,
					},
					{
						order: 3,
						type: 'fill_in_blank',
						question:
							'When solving −3x > 12, the solution is x ___ −4.',
						content: { acceptedAnswers: ['<'] },
						calculatorEnabled: false,
					},
					{
						order: 4,
						type: 'true_false',
						question:
							'Dividing both sides of an inequality by a positive number flips the inequality sign.',
						content: { correctAnswer: false },
						calculatorEnabled: false,
					},
				],
			},
		},
	});

	// ── Algebra Unit 2 Quiz ───────────────────────────────────────────────
	await prisma.assessment.create({
		data: {
			type: 'unit_quiz',
			unitId: algebraU2.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question: 'Solve for x: 5x + 10 = 35',
						content: {
							options: ['x = 5', 'x = 9', 'x = 7', 'x = 6'],
							correctIndex: 0,
						},
						calculatorEnabled: true,
					},
					{
						order: 2,
						type: 'true_false',
						question: 'The solution to −x > 6 is x > −6.',
						content: { correctAnswer: false },
						calculatorEnabled: true,
					},
					{
						order: 3,
						type: 'fill_in_blank',
						question: 'Solve for x: x/4 − 3 = 2. x = ___.',
						content: { acceptedAnswers: ['20'] },
						calculatorEnabled: true,
					},
					{
						order: 4,
						type: 'matching',
						question:
							'Match each equation or inequality to its solution.',
						content: {
							pairs: [
								{ prompt: '2x = 14', answer: 'x = 7' },
								{ prompt: 'x + 5 = 3', answer: 'x = −2' },
								{ prompt: '3x < 9', answer: 'x < 3' },
								{ prompt: 'x − 4 ≥ 1', answer: 'x ≥ 5' },
							],
						},
						calculatorEnabled: true,
					},
				],
			},
		},
	});

	// ── Course 2 Exam ─────────────────────────────────────────────────────
	await prisma.assessment.create({
		data: {
			type: 'course_exam',
			courseId: algebra.id,
			questions: {
				create: [
					{
						order: 1,
						type: 'multiple_choice',
						question: 'Evaluate 3x² − 2x + 1 when x = 2.',
						content: {
							options: ['9', '11', '5', '13'],
							correctIndex: 0,
						},
						calculatorEnabled: true,
					},
					{
						order: 2,
						type: 'true_false',
						question:
							'The expression 4x + 4y can be simplified to 8xy by combining like terms.',
						content: { correctAnswer: false },
						calculatorEnabled: true,
					},
					{
						order: 3,
						type: 'fill_in_blank',
						question: 'Solve for x: 2(x − 3) = 10. x = ___.',
						content: { acceptedAnswers: ['8'] },
						calculatorEnabled: true,
					},
					{
						order: 4,
						type: 'matching',
						question: 'Match each operation to its inverse.',
						content: {
							pairs: [
								{ prompt: 'Addition', answer: 'Subtraction' },
								{
									prompt: 'Multiplication',
									answer: 'Division',
								},
								{ prompt: 'Squaring', answer: 'Square root' },
							],
						},
						calculatorEnabled: true,
					},
					{
						order: 5,
						type: 'multiple_choice',
						question:
							'Which inequality is equivalent to −2x + 4 > 10?',
						content: {
							options: ['x > −3', 'x < −3', 'x > 3', 'x < 3'],
							correctIndex: 1,
						},
						calculatorEnabled: true,
					},
				],
			},
		},
	});

	console.log('Course 2 (Algebra Essentials) seeded.');

	// ── Raw SQL constraints ───────────────────────────────────────────────
	const sqlStatements = [
		`DELETE FROM assessment WHERE (("lessonId" IS NOT NULL)::int + ("unitId" IS NOT NULL)::int + ("courseId" IS NOT NULL)::int) <> 1`,
		`ALTER TABLE assessment DROP CONSTRAINT IF EXISTS chk_assessment_single_owner`,
		`ALTER TABLE assessment ADD CONSTRAINT chk_assessment_single_owner CHECK ((("lessonId" IS NOT NULL)::int + ("unitId" IS NOT NULL)::int + ("courseId" IS NOT NULL)::int) = 1)`,
		`CREATE OR REPLACE FUNCTION enforce_assignment_subtype()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type = 'note' THEN
    IF NOT EXISTS (SELECT 1 FROM note_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=note but no note_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'video' THEN
    IF NOT EXISTS (SELECT 1 FROM video_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=video but no video_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'reading' THEN
    IF NOT EXISTS (SELECT 1 FROM reading_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=reading but no reading_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'vocab' THEN
    IF NOT EXISTS (SELECT 1 FROM vocab_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=vocab but no vocab_assignment row exists', NEW.id;
    END IF;
  ELSIF NEW.type = 'practice_problem' THEN
    IF NOT EXISTS (SELECT 1 FROM practice_problem_assignment WHERE "assignmentId" = NEW.id) THEN
      RAISE EXCEPTION 'assignment % declared type=practice_problem but no practice_problem_assignment row exists', NEW.id;
    END IF;
  ELSE
    RAISE EXCEPTION 'assignment % has unknown type: %', NEW.id, NEW.type;
  END IF;
  RETURN NEW;
END;
$$`,
		`DROP TRIGGER IF EXISTS trg_assignment_subtype ON assignment`,
		`CREATE CONSTRAINT TRIGGER trg_assignment_subtype AFTER INSERT OR UPDATE ON assignment DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_assignment_subtype()`,
	];

	for (const sql of sqlStatements) {
		await prisma.$executeRawUnsafe(sql);
	}

	console.log('SQL constraints applied.');
	console.log('Seed complete.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
