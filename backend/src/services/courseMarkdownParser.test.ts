import { parseCourseMarkdown } from "./courseMarkdownParser";

const validMarkdown = `# Course: Web Basics

## Description
Learn the fundamentals of the web.

## Category
Programming

## Duration
3 hours

## Thumbnail
https://example.com/web-basics.png

## Pricing
- Free: false
- Price: 25

## Module 1: Foundations
Description: Learn the basic concepts.

### Lesson 1: HTML
Type: text
Description: Understand HTML structure.
Content:
HTML content.

### Lesson 2: Video
Type: video
Description: Watch the overview.
Content:
https://example.com/lesson.mp4

## Final Assessment
Title: Foundations Check
Description: Verify the core concepts.
Time Limit: 20
Passing Score: 70

### Question 1
Question: What does HTML define?
Options:
- Page structure
- Server billing
Correct Answer: Page structure
`;

describe("parseCourseMarkdown", () => {
  it("parses course metadata, lessons, video URLs, and assessments without swallowing sections", () => {
    const course = parseCourseMarkdown(validMarkdown);

    expect(course.title).toBe("Web Basics");
    expect(course.price).toBe(25);
    expect(course.isFree).toBe(false);
    expect(course.modules).toHaveLength(1);
    expect(course.modules[0].lessons).toHaveLength(2);
    expect(course.modules[0].lessons[1]).toMatchObject({
      lessonType: "video",
      content: "https://example.com/lesson.mp4",
      videoUrl: "https://example.com/lesson.mp4",
    });
    expect(course.finalAssessment?.questions).toHaveLength(1);
    expect(course.modules[0].lessons[0].content).toBe("HTML content.");
  });

  it("rejects incomplete courses", () => {
    expect(() => parseCourseMarkdown("# Course: Incomplete")).toThrow("Description, Category, and Thumbnail");
  });

  it("rejects assessment questions without a matching answer", () => {
    expect(() => parseCourseMarkdown(validMarkdown.replace("Correct Answer: Page structure", "Correct Answer: Missing"))).toThrow("Final Assessment");
  });
});