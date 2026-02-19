import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(schema.quizQuestions);
  await db.delete(schema.quizAttempts);
  await db.delete(schema.quizzes);
  await db.delete(schema.lessonSigns);
  await db.delete(schema.userSignProgress);
  await db.delete(schema.userProgress);
  await db.delete(schema.userActivity);
  await db.delete(schema.streaks);
  await db.delete(schema.signs);
  await db.delete(schema.lessons);
  await db.delete(schema.categories);

  // Categories
  const categoriesData = [
    { name: "Alphabet", slug: "alphabet", description: "Learn ISL fingerspelling alphabet A-Z", iconName: "ALargeSmall", color: "#3b82f6", sortOrder: 1, totalLessons: 5 },
    { name: "Numbers", slug: "numbers", description: "Learn to sign numbers 0-9 in ISL", iconName: "Hash", color: "#8b5cf6", sortOrder: 2, totalLessons: 2 },
    { name: "Greetings", slug: "greetings", description: "Common greetings and social expressions", iconName: "HandMetal", color: "#10b981", sortOrder: 3, totalLessons: 2 },
    { name: "Common Phrases", slug: "common-phrases", description: "Everyday phrases for daily communication", iconName: "MessageSquare", color: "#f59e0b", sortOrder: 4, totalLessons: 2 },
    { name: "Family", slug: "family", description: "Signs for family members and relationships", iconName: "Users", color: "#ec4899", sortOrder: 5, totalLessons: 2 },
    { name: "Colors", slug: "colors", description: "Learn to sign different colors", iconName: "Palette", color: "#ef4444", sortOrder: 6, totalLessons: 1 },
    { name: "Days & Time", slug: "days-time", description: "Days of the week and time-related signs", iconName: "Calendar", color: "#06b6d4", sortOrder: 7, totalLessons: 1 },
    { name: "Emergency", slug: "emergency", description: "Important emergency and safety signs", iconName: "ShieldAlert", color: "#dc2626", sortOrder: 8, totalLessons: 1 },
  ];

  const insertedCategories = await db.insert(schema.categories).values(categoriesData).returning();
  console.log(`Inserted ${insertedCategories.length} categories`);

  const catMap = Object.fromEntries(insertedCategories.map(c => [c.slug, c.id]));

  // Signs - Alphabet
  const alphabetSigns = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter, i) => ({
    name: letter,
    slug: `isl-alphabet-${letter.toLowerCase()}`,
    description: `ISL fingerspelling sign for the letter ${letter}`,
    instructions: `Hold your dominant hand in front of your chest. Form the ISL handshape for "${letter}".`,
    imageUrl: `/signs/alphabet/${letter.toLowerCase()}.svg`,
    gifUrl: `/signs/alphabet/${letter.toLowerCase()}.svg`,
    category: "alphabet",
    hindiText: letter,
    englishText: letter,
    tags: ["alphabet", "fingerspelling", letter.toLowerCase()],
    handShape: `letter-${letter.toLowerCase()}`,
    sortOrder: i + 1,
  }));

  // Signs - Numbers
  const numberSigns = Array.from({ length: 10 }, (_, i) => ({
    name: `${i}`,
    slug: `isl-number-${i}`,
    description: `ISL sign for the number ${i}`,
    instructions: `Hold your dominant hand in front of your chest. Form the ISL handshape for "${i}".`,
    imageUrl: `/signs/numbers/${i}.svg`,
    gifUrl: `/signs/numbers/${i}.svg`,
    category: "number",
    hindiText: `${i}`,
    englishText: `${i}`,
    tags: ["number", `${i}`],
    handShape: `number-${i}`,
    sortOrder: i + 1,
  }));

  // Signs - Greetings
  const greetingSigns = [
    { name: "Hello", hindiText: "नमस्ते", instructions: "Wave your open hand from side to side at chest level." },
    { name: "Goodbye", hindiText: "अलविदा", instructions: "Open hand, fingers together, wave forward away from body." },
    { name: "Thank You", hindiText: "धन्यवाद", instructions: "Touch your chin with fingertips of flat hand, then move hand forward and down." },
    { name: "Sorry", hindiText: "माफ़ करें", instructions: "Make a fist with your dominant hand and rub it in a circular motion on your chest." },
    { name: "Please", hindiText: "कृपया", instructions: "Press your palms together in front of your chest in a praying gesture." },
    { name: "Good Morning", hindiText: "सुप्रभात", instructions: "Sign 'good' followed by 'morning' - raise flat hand from horizontal to upward." },
    { name: "Good Night", hindiText: "शुभ रात्रि", instructions: "Sign 'good' followed by 'night' - bring flat hand down to rest." },
    { name: "How Are You", hindiText: "आप कैसे हैं", instructions: "Point to the person, then touch your chest with both hands and move outward with questioning expression." },
    { name: "I Am Fine", hindiText: "मैं ठीक हूँ", instructions: "Touch your chest, then give a thumbs up." },
    { name: "Nice to Meet You", hindiText: "आपसे मिलकर अच्छा लगा", instructions: "Point to the person, then shake hands gesture." },
    { name: "Welcome", hindiText: "स्वागत", instructions: "Open both arms wide with palms up in a welcoming gesture." },
    { name: "Congratulations", hindiText: "बधाई", instructions: "Clasp hands together and shake them on both sides of your body." },
  ].map((sign, i) => ({
    ...sign,
    slug: `isl-greeting-${sign.name.toLowerCase().replace(/\s+/g, "-")}`,
    description: `ISL sign for "${sign.name}"`,
    imageUrl: `/signs/greetings/${sign.name.toLowerCase().replace(/\s+/g, "-")}.svg`,
    gifUrl: `/signs/greetings/${sign.name.toLowerCase().replace(/\s+/g, "-")}.svg`,
    category: "greeting",
    englishText: sign.name,
    tags: ["greeting", "social", sign.name.toLowerCase()],
    handShape: `greeting-${sign.name.toLowerCase().replace(/\s+/g, "-")}`,
    sortOrder: i + 1,
  }));

  // Signs - Common Phrases
  const phraseSigns = [
    { name: "Yes", hindiText: "हाँ", instructions: "Nod your fist up and down, like nodding your head." },
    { name: "No", hindiText: "नहीं", instructions: "Extend index and middle fingers and snap them closed against your thumb." },
    { name: "Help", hindiText: "मदद", instructions: "Place your fist on your open palm and raise both hands up." },
    { name: "Water", hindiText: "पानी", instructions: "Make a 'W' handshape and tap your chin with your index finger." },
    { name: "Food", hindiText: "खाना", instructions: "Bring your flattened hand to your mouth repeatedly." },
    { name: "Home", hindiText: "घर", instructions: "Touch fingertips together forming a roof shape above your head." },
    { name: "School", hindiText: "स्कूल", instructions: "Clap your hands together twice gently." },
    { name: "Friend", hindiText: "दोस्त", instructions: "Hook index fingers together and flip them." },
    { name: "Love", hindiText: "प्यार", instructions: "Cross both arms over your chest in a hugging motion." },
    { name: "Learn", hindiText: "सीखना", instructions: "Take from an open book shape and put to your forehead." },
    { name: "Understand", hindiText: "समझना", instructions: "Flick your index finger up near your forehead." },
    { name: "Don't Understand", hindiText: "समझ नहीं आया", instructions: "Shake your head while signing 'understand' with a negative expression." },
    { name: "Name", hindiText: "नाम", instructions: "Tap your index and middle fingers on your opposite index and middle fingers." },
    { name: "What", hindiText: "क्या", instructions: "Palms up, shake both hands side to side with questioning expression." },
    { name: "Where", hindiText: "कहाँ", instructions: "Point index finger and wave it side to side with questioning expression." },
    { name: "When", hindiText: "कब", instructions: "Circle your index finger, then point it forward." },
    { name: "Why", hindiText: "क्यों", instructions: "Touch your forehead and bring hand down with questioning expression." },
    { name: "How Much", hindiText: "कितना", instructions: "Open and close hands alternately with questioning expression." },
    { name: "Stop", hindiText: "रुकें", instructions: "Bring your flat hand down sharply onto your other open palm." },
    { name: "Come", hindiText: "आओ", instructions: "Curl your index finger toward you in a beckoning motion." },
  ].map((sign, i) => ({
    ...sign,
    slug: `isl-phrase-${sign.name.toLowerCase().replace(/\s+/g, "-")}`,
    description: `ISL sign for "${sign.name}"`,
    imageUrl: `/signs/phrases/${sign.name.toLowerCase().replace(/\s+/g, "-")}.svg`,
    gifUrl: `/signs/phrases/${sign.name.toLowerCase().replace(/\s+/g, "-")}.svg`,
    category: "phrase",
    englishText: sign.name,
    tags: ["phrase", "common", sign.name.toLowerCase()],
    handShape: `phrase-${sign.name.toLowerCase().replace(/\s+/g, "-")}`,
    sortOrder: i + 1,
  }));

  // Signs - Family
  const familySigns = [
    { name: "Mother", hindiText: "माँ", instructions: "Touch your chin with your thumb, fingers spread." },
    { name: "Father", hindiText: "पिता", instructions: "Touch your forehead with your thumb, fingers spread." },
    { name: "Brother", hindiText: "भाई", instructions: "Touch your forehead then bring flat hand down to chest level." },
    { name: "Sister", hindiText: "बहन", instructions: "Touch your chin then bring flat hand down to chest level." },
    { name: "Grandfather", hindiText: "दादा", instructions: "Sign 'father' then move hand forward in two hops." },
    { name: "Grandmother", hindiText: "दादी", instructions: "Sign 'mother' then move hand forward in two hops." },
    { name: "Son", hindiText: "बेटा", instructions: "Rock arms as if holding a baby, then sign 'boy'." },
    { name: "Daughter", hindiText: "बेटी", instructions: "Rock arms as if holding a baby, then sign 'girl'." },
    { name: "Husband", hindiText: "पति", instructions: "Clasp hands together, right on top." },
    { name: "Wife", hindiText: "पत्नी", instructions: "Clasp hands together, left on top." },
    { name: "Baby", hindiText: "बच्चा", instructions: "Rock your arms as if holding a baby." },
    { name: "Family", hindiText: "परिवार", instructions: "Make 'F' handshapes with both hands and circle them around to meet." },
  ].map((sign, i) => ({
    ...sign,
    slug: `isl-family-${sign.name.toLowerCase().replace(/\s+/g, "-")}`,
    description: `ISL sign for "${sign.name}"`,
    imageUrl: `/signs/phrases/${sign.name.toLowerCase().replace(/\s+/g, "-")}.svg`,
    gifUrl: `/signs/phrases/${sign.name.toLowerCase().replace(/\s+/g, "-")}.svg`,
    category: "family",
    englishText: sign.name,
    tags: ["family", "relationship", sign.name.toLowerCase()],
    handShape: `family-${sign.name.toLowerCase().replace(/\s+/g, "-")}`,
    sortOrder: i + 1,
  }));

  // Signs - Colors
  const colorSigns = [
    { name: "Red", hindiText: "लाल" },
    { name: "Blue", hindiText: "नीला" },
    { name: "Green", hindiText: "हरा" },
    { name: "Yellow", hindiText: "पीला" },
    { name: "White", hindiText: "सफ़ेद" },
    { name: "Black", hindiText: "काला" },
    { name: "Orange", hindiText: "नारंगी" },
    { name: "Pink", hindiText: "गुलाबी" },
  ].map((sign, i) => ({
    ...sign,
    slug: `isl-color-${sign.name.toLowerCase()}`,
    description: `ISL sign for the color "${sign.name}"`,
    instructions: `Point to something ${sign.name.toLowerCase()} or use the ISL handshape for "${sign.name}".`,
    imageUrl: `/signs/phrases/${sign.name.toLowerCase()}.svg`,
    gifUrl: `/signs/phrases/${sign.name.toLowerCase()}.svg`,
    category: "color",
    englishText: sign.name,
    tags: ["color", sign.name.toLowerCase()],
    handShape: `color-${sign.name.toLowerCase()}`,
    sortOrder: i + 1,
  }));

  // Signs - Days & Time
  const daysSigns = [
    { name: "Monday", hindiText: "सोमवार" },
    { name: "Tuesday", hindiText: "मंगलवार" },
    { name: "Wednesday", hindiText: "बुधवार" },
    { name: "Thursday", hindiText: "गुरुवार" },
    { name: "Friday", hindiText: "शुक्रवार" },
    { name: "Saturday", hindiText: "शनिवार" },
    { name: "Sunday", hindiText: "रविवार" },
    { name: "Today", hindiText: "आज" },
    { name: "Tomorrow", hindiText: "कल" },
    { name: "Yesterday", hindiText: "कल (बीता)" },
  ].map((sign, i) => ({
    ...sign,
    slug: `isl-day-${sign.name.toLowerCase()}`,
    description: `ISL sign for "${sign.name}"`,
    instructions: `Use the ISL handshape and motion for "${sign.name}".`,
    imageUrl: `/signs/phrases/${sign.name.toLowerCase()}.svg`,
    gifUrl: `/signs/phrases/${sign.name.toLowerCase()}.svg`,
    category: "day",
    englishText: sign.name,
    tags: ["day", "time", sign.name.toLowerCase()],
    handShape: `day-${sign.name.toLowerCase()}`,
    sortOrder: i + 1,
  }));

  // Signs - Emergency
  const emergencySigns = [
    { name: "Help Me", hindiText: "मेरी मदद करो", instructions: "Place your fist on your open palm and raise both hands up urgently." },
    { name: "Danger", hindiText: "खतरा", instructions: "Push both palms forward and up repeatedly with urgent expression." },
    { name: "Call Police", hindiText: "पुलिस बुलाओ", instructions: "Mimic talking on phone then point authoritatively." },
    { name: "Hospital", hindiText: "अस्पताल", instructions: "Draw a cross on your upper arm with your index finger." },
    { name: "Pain", hindiText: "दर्द", instructions: "Point both index fingers toward each other and twist them." },
    { name: "Fire", hindiText: "आग", instructions: "Wiggle your fingers upward from waist level imitating flames." },
    { name: "Medicine", hindiText: "दवाई", instructions: "Grind your middle finger into your opposite palm in a circular motion." },
    { name: "Emergency", hindiText: "आपातकाल", instructions: "Wave both hands above your head urgently." },
  ].map((sign, i) => ({
    ...sign,
    slug: `isl-emergency-${sign.name.toLowerCase().replace(/\s+/g, "-")}`,
    description: `ISL sign for "${sign.name}"`,
    imageUrl: `/signs/phrases/${sign.name.toLowerCase().replace(/\s+/g, "-")}.svg`,
    gifUrl: `/signs/phrases/${sign.name.toLowerCase().replace(/\s+/g, "-")}.svg`,
    category: "emergency",
    englishText: sign.name,
    tags: ["emergency", "safety", sign.name.toLowerCase()],
    handShape: `emergency-${sign.name.toLowerCase().replace(/\s+/g, "-")}`,
    sortOrder: i + 1,
  }));

  // Insert all signs
  const allSigns = [
    ...alphabetSigns,
    ...numberSigns,
    ...greetingSigns,
    ...phraseSigns,
    ...familySigns,
    ...colorSigns,
    ...daysSigns,
    ...emergencySigns,
  ];

  const insertedSigns = await db.insert(schema.signs).values(allSigns).returning();
  console.log(`Inserted ${insertedSigns.length} signs`);

  const signMap = Object.fromEntries(insertedSigns.map(s => [s.slug, s.id]));

  // Lessons
  const lessonsData = [
    // Alphabet lessons (5)
    { categoryId: catMap["alphabet"], title: "Letters A-E", slug: "letters-a-e", description: "Learn the first 5 letters of ISL alphabet", difficulty: "beginner", estimatedMinutes: 10, sortOrder: 1 },
    { categoryId: catMap["alphabet"], title: "Letters F-J", slug: "letters-f-j", description: "Learn letters F through J", difficulty: "beginner", estimatedMinutes: 10, sortOrder: 2 },
    { categoryId: catMap["alphabet"], title: "Letters K-O", slug: "letters-k-o", description: "Learn letters K through O", difficulty: "beginner", estimatedMinutes: 10, sortOrder: 3 },
    { categoryId: catMap["alphabet"], title: "Letters P-T", slug: "letters-p-t", description: "Learn letters P through T", difficulty: "intermediate", estimatedMinutes: 10, sortOrder: 4 },
    { categoryId: catMap["alphabet"], title: "Letters U-Z", slug: "letters-u-z", description: "Learn the last 6 letters of ISL alphabet", difficulty: "intermediate", estimatedMinutes: 12, sortOrder: 5 },
    // Numbers lessons (2)
    { categoryId: catMap["numbers"], title: "Numbers 0-4", slug: "numbers-0-4", description: "Learn to sign numbers 0 through 4", difficulty: "beginner", estimatedMinutes: 8, sortOrder: 1 },
    { categoryId: catMap["numbers"], title: "Numbers 5-9", slug: "numbers-5-9", description: "Learn to sign numbers 5 through 9", difficulty: "beginner", estimatedMinutes: 8, sortOrder: 2 },
    // Greetings lessons (2)
    { categoryId: catMap["greetings"], title: "Basic Greetings", slug: "basic-greetings", description: "Hello, goodbye, and thank you", difficulty: "beginner", estimatedMinutes: 12, sortOrder: 1 },
    { categoryId: catMap["greetings"], title: "Social Expressions", slug: "social-expressions", description: "More social phrases and greetings", difficulty: "intermediate", estimatedMinutes: 15, sortOrder: 2 },
    // Common Phrases lessons (2)
    { categoryId: catMap["common-phrases"], title: "Essential Words", slug: "essential-words", description: "Yes, no, help, water, food and more", difficulty: "beginner", estimatedMinutes: 15, sortOrder: 1 },
    { categoryId: catMap["common-phrases"], title: "Question Words", slug: "question-words", description: "What, where, when, why, and how", difficulty: "intermediate", estimatedMinutes: 15, sortOrder: 2 },
    // Family lessons (2)
    { categoryId: catMap["family"], title: "Immediate Family", slug: "immediate-family", description: "Mother, father, brother, sister", difficulty: "beginner", estimatedMinutes: 10, sortOrder: 1 },
    { categoryId: catMap["family"], title: "Extended Family", slug: "extended-family", description: "Grandparents, in-laws, and more", difficulty: "intermediate", estimatedMinutes: 12, sortOrder: 2 },
    // Colors (1)
    { categoryId: catMap["colors"], title: "Basic Colors", slug: "basic-colors", description: "Learn to sign common colors", difficulty: "beginner", estimatedMinutes: 10, sortOrder: 1 },
    // Days & Time (1)
    { categoryId: catMap["days-time"], title: "Days of the Week", slug: "days-of-the-week", description: "Monday through Sunday plus today/tomorrow", difficulty: "intermediate", estimatedMinutes: 15, sortOrder: 1 },
    // Emergency (1)
    { categoryId: catMap["emergency"], title: "Emergency Signs", slug: "emergency-signs", description: "Critical signs for emergency situations", difficulty: "beginner", estimatedMinutes: 10, sortOrder: 1 },
  ];

  const insertedLessons = await db.insert(schema.lessons).values(lessonsData).returning();
  console.log(`Inserted ${insertedLessons.length} lessons`);

  const lessonMap = Object.fromEntries(insertedLessons.map(l => [l.slug, l.id]));

  // Lesson-Signs mappings
  const lessonSignsData: { lessonId: number; signId: number; sortOrder: number }[] = [];

  // Alphabet lessons
  const alphaLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const alphaLessons = [
    { slug: "letters-a-e", letters: alphaLetters.slice(0, 5) },
    { slug: "letters-f-j", letters: alphaLetters.slice(5, 10) },
    { slug: "letters-k-o", letters: alphaLetters.slice(10, 15) },
    { slug: "letters-p-t", letters: alphaLetters.slice(15, 20) },
    { slug: "letters-u-z", letters: alphaLetters.slice(20, 26) },
  ];

  for (const al of alphaLessons) {
    al.letters.forEach((letter, i) => {
      const signSlug = `isl-alphabet-${letter.toLowerCase()}`;
      if (signMap[signSlug]) {
        lessonSignsData.push({ lessonId: lessonMap[al.slug], signId: signMap[signSlug], sortOrder: i + 1 });
      }
    });
  }

  // Number lessons
  for (let i = 0; i <= 4; i++) {
    lessonSignsData.push({ lessonId: lessonMap["numbers-0-4"], signId: signMap[`isl-number-${i}`], sortOrder: i + 1 });
  }
  for (let i = 5; i <= 9; i++) {
    lessonSignsData.push({ lessonId: lessonMap["numbers-5-9"], signId: signMap[`isl-number-${i}`], sortOrder: i - 4 });
  }

  // Greetings lessons
  const basicGreetings = ["hello", "goodbye", "thank-you", "sorry", "please", "welcome"];
  basicGreetings.forEach((name, i) => {
    const signSlug = `isl-greeting-${name}`;
    if (signMap[signSlug]) {
      lessonSignsData.push({ lessonId: lessonMap["basic-greetings"], signId: signMap[signSlug], sortOrder: i + 1 });
    }
  });

  const socialExpressions = ["good-morning", "good-night", "how-are-you", "i-am-fine", "nice-to-meet-you", "congratulations"];
  socialExpressions.forEach((name, i) => {
    const signSlug = `isl-greeting-${name}`;
    if (signMap[signSlug]) {
      lessonSignsData.push({ lessonId: lessonMap["social-expressions"], signId: signMap[signSlug], sortOrder: i + 1 });
    }
  });

  // Common Phrases
  const essentialWords = ["yes", "no", "help", "water", "food", "home", "school", "friend", "love", "learn"];
  essentialWords.forEach((name, i) => {
    const signSlug = `isl-phrase-${name}`;
    if (signMap[signSlug]) {
      lessonSignsData.push({ lessonId: lessonMap["essential-words"], signId: signMap[signSlug], sortOrder: i + 1 });
    }
  });

  const questionWords = ["what", "where", "when", "why", "how-much", "understand", "don't-understand", "name", "stop", "come"];
  questionWords.forEach((name, i) => {
    const signSlug = `isl-phrase-${name}`;
    if (signMap[signSlug]) {
      lessonSignsData.push({ lessonId: lessonMap["question-words"], signId: signMap[signSlug], sortOrder: i + 1 });
    }
  });

  // Family
  const immediateFamily = ["mother", "father", "brother", "sister", "son", "daughter"];
  immediateFamily.forEach((name, i) => {
    const signSlug = `isl-family-${name}`;
    if (signMap[signSlug]) {
      lessonSignsData.push({ lessonId: lessonMap["immediate-family"], signId: signMap[signSlug], sortOrder: i + 1 });
    }
  });

  const extendedFamily = ["grandfather", "grandmother", "husband", "wife", "baby", "family"];
  extendedFamily.forEach((name, i) => {
    const signSlug = `isl-family-${name}`;
    if (signMap[signSlug]) {
      lessonSignsData.push({ lessonId: lessonMap["extended-family"], signId: signMap[signSlug], sortOrder: i + 1 });
    }
  });

  // Colors
  const colors = ["red", "blue", "green", "yellow", "white", "black", "orange", "pink"];
  colors.forEach((name, i) => {
    const signSlug = `isl-color-${name}`;
    if (signMap[signSlug]) {
      lessonSignsData.push({ lessonId: lessonMap["basic-colors"], signId: signMap[signSlug], sortOrder: i + 1 });
    }
  });

  // Days
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "today", "tomorrow", "yesterday"];
  days.forEach((name, i) => {
    const signSlug = `isl-day-${name}`;
    if (signMap[signSlug]) {
      lessonSignsData.push({ lessonId: lessonMap["days-of-the-week"], signId: signMap[signSlug], sortOrder: i + 1 });
    }
  });

  // Emergency
  const emergencyNames = ["help-me", "danger", "call-police", "hospital", "pain", "fire", "medicine", "emergency"];
  emergencyNames.forEach((name, i) => {
    const signSlug = `isl-emergency-${name}`;
    if (signMap[signSlug]) {
      lessonSignsData.push({ lessonId: lessonMap["emergency-signs"], signId: signMap[signSlug], sortOrder: i + 1 });
    }
  });

  if (lessonSignsData.length > 0) {
    await db.insert(schema.lessonSigns).values(lessonSignsData);
    console.log(`Inserted ${lessonSignsData.length} lesson-sign mappings`);
  }

  // Quizzes
  const quizzesData = [
    { categoryId: catMap["alphabet"], title: "Alphabet Quiz", description: "Test your knowledge of ISL alphabet", difficulty: "beginner", questionCount: 10, timeLimitSeconds: 300, type: "multiple_choice" },
    { categoryId: catMap["numbers"], title: "Numbers Quiz", description: "Test your knowledge of ISL numbers", difficulty: "beginner", questionCount: 10, timeLimitSeconds: 200, type: "multiple_choice" },
    { categoryId: catMap["greetings"], title: "Greetings Quiz", description: "Test your knowledge of ISL greetings", difficulty: "beginner", questionCount: 8, timeLimitSeconds: 240, type: "multiple_choice" },
    { categoryId: catMap["common-phrases"], title: "Common Phrases Quiz", description: "Test your knowledge of everyday phrases", difficulty: "intermediate", questionCount: 10, timeLimitSeconds: 300, type: "multiple_choice" },
    { categoryId: catMap["family"], title: "Family Signs Quiz", description: "Test your knowledge of family signs", difficulty: "beginner", questionCount: 8, timeLimitSeconds: 240, type: "multiple_choice" },
  ];

  const insertedQuizzes = await db.insert(schema.quizzes).values(quizzesData).returning();
  console.log(`Inserted ${insertedQuizzes.length} quizzes`);

  // Quiz Questions
  const quizQuestionsData: {
    quizId: number;
    signId: number;
    questionType: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    sortOrder: number;
  }[] = [];

  // Alphabet quiz questions
  const alphabetQuiz = insertedQuizzes.find(q => q.title === "Alphabet Quiz")!;
  const selectedLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  selectedLetters.forEach((letter, i) => {
    const signSlug = `isl-alphabet-${letter.toLowerCase()}`;
    if (signMap[signSlug]) {
      const options = [letter];
      const otherLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter(l => l !== letter);
      for (let j = 0; j < 3; j++) {
        const randomIndex = Math.floor(Math.random() * otherLetters.length);
        options.push(otherLetters.splice(randomIndex, 1)[0]);
      }
      options.sort(() => Math.random() - 0.5);

      quizQuestionsData.push({
        quizId: alphabetQuiz.id,
        signId: signMap[signSlug],
        questionType: "image_to_text",
        questionText: `What letter does this sign represent?`,
        options,
        correctAnswer: letter,
        sortOrder: i + 1,
      });
    }
  });

  // Numbers quiz questions
  const numbersQuiz = insertedQuizzes.find(q => q.title === "Numbers Quiz")!;
  for (let n = 0; n <= 9; n++) {
    const signSlug = `isl-number-${n}`;
    if (signMap[signSlug]) {
      const options = [`${n}`];
      const others = Array.from({ length: 10 }, (_, i) => `${i}`).filter(x => x !== `${n}`);
      for (let j = 0; j < 3; j++) {
        const randomIndex = Math.floor(Math.random() * others.length);
        options.push(others.splice(randomIndex, 1)[0]);
      }
      options.sort(() => Math.random() - 0.5);

      quizQuestionsData.push({
        quizId: numbersQuiz.id,
        signId: signMap[signSlug],
        questionType: "image_to_text",
        questionText: `What number does this sign represent?`,
        options,
        correctAnswer: `${n}`,
        sortOrder: n + 1,
      });
    }
  }

  // Greetings quiz questions
  const greetingsQuiz = insertedQuizzes.find(q => q.title === "Greetings Quiz")!;
  const greetingNames = ["Hello", "Goodbye", "Thank You", "Sorry", "Please", "Welcome", "Good Morning", "How Are You"];
  greetingNames.forEach((name, i) => {
    const signSlug = `isl-greeting-${name.toLowerCase().replace(/\s+/g, "-")}`;
    if (signMap[signSlug]) {
      const options = [name];
      const others = greetingNames.filter(n => n !== name);
      for (let j = 0; j < 3 && others.length > 0; j++) {
        const randomIndex = Math.floor(Math.random() * others.length);
        options.push(others.splice(randomIndex, 1)[0]);
      }
      options.sort(() => Math.random() - 0.5);

      quizQuestionsData.push({
        quizId: greetingsQuiz.id,
        signId: signMap[signSlug],
        questionType: "image_to_text",
        questionText: `What greeting does this sign represent?`,
        options,
        correctAnswer: name,
        sortOrder: i + 1,
      });
    }
  });

  // Common Phrases quiz questions (intermediate)
  const phrasesQuiz = insertedQuizzes.find(q => q.title === "Common Phrases Quiz")!;
  const phraseQuizSigns = [
    { name: "Yes", slug: "isl-phrase-yes" },
    { name: "No", slug: "isl-phrase-no" },
    { name: "Help", slug: "isl-phrase-help" },
    { name: "Water", slug: "isl-phrase-water" },
    { name: "Food", slug: "isl-phrase-food" },
    { name: "Stop", slug: "isl-phrase-stop" },
    { name: "Come", slug: "isl-phrase-come" },
    { name: "What", slug: "isl-phrase-what" },
    { name: "Where", slug: "isl-phrase-where" },
    { name: "Why", slug: "isl-phrase-why" },
  ];
  const allPhraseNames = phraseQuizSigns.map(p => p.name);
  phraseQuizSigns.forEach((phrase, i) => {
    if (signMap[phrase.slug]) {
      const options = [phrase.name];
      const others = allPhraseNames.filter(n => n !== phrase.name);
      for (let j = 0; j < 3 && others.length > 0; j++) {
        const idx = Math.floor(Math.random() * others.length);
        options.push(others.splice(idx, 1)[0]);
      }
      options.sort(() => Math.random() - 0.5);
      quizQuestionsData.push({
        quizId: phrasesQuiz.id,
        signId: signMap[phrase.slug],
        questionType: "image_to_text",
        questionText: "What phrase does this sign represent?",
        options,
        correctAnswer: phrase.name,
        sortOrder: i + 1,
      });
    }
  });

  // Family Signs quiz questions
  const familyQuiz = insertedQuizzes.find(q => q.title === "Family Signs Quiz")!;
  const familyQuizSigns = [
    { name: "Mother", slug: "isl-family-mother" },
    { name: "Father", slug: "isl-family-father" },
    { name: "Brother", slug: "isl-family-brother" },
    { name: "Sister", slug: "isl-family-sister" },
    { name: "Grandfather", slug: "isl-family-grandfather" },
    { name: "Grandmother", slug: "isl-family-grandmother" },
    { name: "Baby", slug: "isl-family-baby" },
    { name: "Family", slug: "isl-family-family" },
  ];
  const allFamilyNames = familyQuizSigns.map(f => f.name);
  familyQuizSigns.forEach((fam, i) => {
    if (signMap[fam.slug]) {
      const options = [fam.name];
      const others = allFamilyNames.filter(n => n !== fam.name);
      for (let j = 0; j < 3 && others.length > 0; j++) {
        const idx = Math.floor(Math.random() * others.length);
        options.push(others.splice(idx, 1)[0]);
      }
      options.sort(() => Math.random() - 0.5);
      quizQuestionsData.push({
        quizId: familyQuiz.id,
        signId: signMap[fam.slug],
        questionType: "image_to_text",
        questionText: "What family sign does this represent?",
        options,
        correctAnswer: fam.name,
        sortOrder: i + 1,
      });
    }
  });

  if (quizQuestionsData.length > 0) {
    await db.insert(schema.quizQuestions).values(quizQuestionsData);
    console.log(`Inserted ${quizQuestionsData.length} quiz questions`);
  }

  console.log("Seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
