"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCourseMarkdown = void 0;
const valueAfterLabel = (line, label) => line.slice(label.length).replace(/^\s*/, "").replace(/^:\s*/, "").trim();
const sectionText = (lines, start, headingLevel) => {
    const values = [];
    for (let index = start; index < lines.length; index += 1) {
        if (new RegExp(`^#{1,${headingLevel}}\\s`).test(lines[index]))
            break;
        values.push(lines[index]);
    }
    return values.join("\n").trim();
};
const parseNumber = (value, fallback) => {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
};
const parseCourseMarkdown = (markdown) => {
    const lines = markdown.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
    const courseHeading = lines.find((line) => /^#\s+Course\s*:/i.test(line));
    if (!courseHeading)
        throw new Error("Markdown must start with a '# Course: Your title' heading.");
    const title = courseHeading.replace(/^#\s+Course\s*:/i, "").trim();
    let description = "";
    let category = "";
    let duration = "";
    let price = 0;
    let isFree = false;
    let thumbnail = "";
    const modules = [];
    let finalAssessment = null;
    const assessmentStart = lines.findIndex((line) => /^##\s+Final Assessment$/i.test(line.trim()));
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index].trim();
        if (/^##\s+Description$/i.test(line))
            description = sectionText(lines, index + 1, 2);
        if (/^##\s+Category$/i.test(line))
            category = sectionText(lines, index + 1, 2);
        if (/^##\s+Duration$/i.test(line))
            duration = sectionText(lines, index + 1, 2);
        if (/^##\s+Thumbnail$/i.test(line))
            thumbnail = sectionText(lines, index + 1, 2);
        if (/^##\s+Pricing$/i.test(line)) {
            const pricing = sectionText(lines, index + 1, 2).split("\n");
            const freeLine = pricing.find((entry) => /^-?\s*Free\s*:/i.test(entry));
            const priceLine = pricing.find((entry) => /^-?\s*Price\s*:/i.test(entry));
            isFree = /^(true|yes)$/i.test(freeLine ? valueAfterLabel(freeLine.replace(/^[-*]\s*/, ""), "Free") : "false");
            price = parseNumber(priceLine ? valueAfterLabel(priceLine.replace(/^[-*]\s*/, ""), "Price") : "0", 0);
        }
    }
    const moduleMatches = [...lines.entries()].filter(([, line]) => /^##\s+Module\s+\d+\s*:/i.test(line.trim()));
    moduleMatches.forEach(([moduleIndex, moduleHeading], position) => {
        var _a, _b;
        const nextModuleIndex = (_b = (_a = moduleMatches[position + 1]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : lines.length;
        const moduleEnd = assessmentStart === -1 ? nextModuleIndex : Math.min(nextModuleIndex, assessmentStart);
        const moduleTitle = moduleHeading.trim().replace(/^##\s+Module\s+\d+\s*:/i, "").trim();
        const moduleLines = lines.slice(moduleIndex + 1, moduleEnd);
        const firstLesson = moduleLines.findIndex((entry) => /^###\s+Lesson\s+\d+\s*:/i.test(entry.trim()));
        const moduleDescriptionLines = (firstLesson === -1 ? moduleLines : moduleLines.slice(0, firstLesson))
            .filter((entry) => !/^Description\s*:/i.test(entry.trim()));
        const descriptionLine = moduleLines.find((entry) => /^Description\s*:/i.test(entry.trim()));
        const lessons = [...moduleLines.entries()]
            .filter(([, entry]) => /^###\s+Lesson\s+\d+\s*:/i.test(entry.trim()))
            .map(([lessonIndex, lessonHeading], lessonPosition, lessonMatches) => {
            var _a, _b;
            const nextLessonIndex = (_b = (_a = lessonMatches[lessonPosition + 1]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : moduleLines.length;
            const lessonLines = moduleLines.slice(lessonIndex + 1, nextLessonIndex);
            const typeLine = lessonLines.find((entry) => /^Type\s*:/i.test(entry.trim()));
            const lessonDescriptionLine = lessonLines.find((entry) => /^Description\s*:/i.test(entry.trim()));
            const contentIndex = lessonLines.findIndex((entry) => /^Content\s*:/i.test(entry.trim()));
            const content = contentIndex === -1
                ? ""
                : lessonLines.slice(contentIndex + 1).join("\n").trim();
            const rawType = typeLine ? valueAfterLabel(typeLine.trim(), "Type").toLowerCase() : "text";
            const lessonType = rawType === "video" ? "video" : rawType === "code" ? "code" : "text-only";
            return {
                title: lessonHeading.trim().replace(/^###\s+Lesson\s+\d+\s*:/i, "").trim(),
                description: lessonDescriptionLine ? valueAfterLabel(lessonDescriptionLine.trim(), "Description") : "",
                lessonType,
                content,
                videoUrl: lessonType === "video" ? content : "",
                order: lessonPosition,
            };
        });
        modules.push({
            title: moduleTitle,
            description: descriptionLine
                ? valueAfterLabel(descriptionLine.trim(), "Description")
                : moduleDescriptionLines.join("\n").trim(),
            order: position,
            lessons,
        });
    });
    if (assessmentStart !== -1) {
        const assessmentLines = lines.slice(assessmentStart + 1);
        const field = (name) => {
            const entry = assessmentLines.find((line) => new RegExp(`^${name}\\s*:`, "i").test(line.trim()));
            return entry ? valueAfterLabel(entry.trim(), name) : "";
        };
        const questions = [...assessmentLines.entries()]
            .filter(([, line]) => /^###\s+Question\s+\d+/i.test(line.trim()))
            .map(([questionIndex, questionHeading], position, questionMatches) => {
            var _a, _b;
            const nextQuestionIndex = (_b = (_a = questionMatches[position + 1]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : assessmentLines.length;
            const questionLines = assessmentLines.slice(questionIndex + 1, nextQuestionIndex);
            const questionLine = questionLines.find((line) => /^Question\s*:/i.test(line.trim()));
            const correctLine = questionLines.find((line) => /^Correct Answer\s*:/i.test(line.trim()));
            const options = questionLines
                .filter((line) => /^[-*]\s+/.test(line.trim()))
                .map((line) => line.trim().replace(/^[-*]\s+/, "").trim())
                .filter(Boolean);
            return {
                question: questionLine ? valueAfterLabel(questionLine.trim(), "Question") : "",
                options,
                correctAnswer: correctLine ? valueAfterLabel(correctLine.trim(), "Correct Answer") : "",
            };
        });
        finalAssessment = {
            title: field("Title"),
            description: field("Description"),
            timeLimit: parseNumber(field("Time Limit"), 30),
            passingScore: parseNumber(field("Passing Score"), 80),
            questions,
        };
        if (!finalAssessment.title || !finalAssessment.description || finalAssessment.timeLimit <= 0 || finalAssessment.passingScore < 0 || finalAssessment.passingScore > 100 || finalAssessment.questions.some((question) => !question.question || question.options.length < 2 || !question.correctAnswer || !question.options.includes(question.correctAnswer))) {
            throw new Error("Final Assessment must include a title, description, valid time limit and passing score, and complete questions.");
        }
    }
    if (!title || !description || !category || !thumbnail) {
        throw new Error("Markdown requires Course title, Description, Category, and Thumbnail sections.");
    }
    if (!modules.length || modules.some((module) => !module.title || !module.description || !module.lessons.length || module.lessons.some((lesson) => !lesson.title || !lesson.description || !lesson.content))) {
        throw new Error("Each module and lesson must include a title, description, and content.");
    }
    return { title, description, category, duration, price, isFree, thumbnail, modules, finalAssessment };
};
exports.parseCourseMarkdown = parseCourseMarkdown;
