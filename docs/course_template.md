# Course Creation Template

Use this template with **Course Maker** in the instructor area. The wizard has five steps. Fields marked `*` are required to move forward.

## Step 1: Course Basics

- **Course title***: [Clear, specific title, up to 100 characters]
- **Course description***: [What students will learn and the outcome, up to 1,000 characters]
- **Category***: [Select one category shown by the site]
- **Duration**: [For example: `6 hours`, `4 weeks`, or `12 lessons`]
- **Pricing**:
  - **Free course**: [Yes/No]
  - **Price**: [Enter a non-negative price when the course is not free]

Before continuing, confirm that the title, description, and category are complete.

## Step 2: Course Content

Create at least one module. Every module needs at least one lesson.

### Module [number]: [Module title]*

- **Module title***: [Name of the topic]
- **Module description***: [Short explanation of what this module covers]

#### Lesson [number]: [Lesson title]*

- **Lesson type**: [Text lesson / Video lesson / Code exercise]
- **Lesson title***: [Name of the lesson]
- **Lesson description***: [Short explanation of the lesson]
- **Content***:

  [Write the lesson content here. For a video lesson, enter the video URL. For a code exercise, describe the task and provide the code content.]

For video lessons, use a valid URL such as `https://youtube.com/watch?v=...`. Repeat the lesson block as needed, then repeat the module block for each module.

The site will not allow the next step until there is at least one complete module and every lesson has a title and content. The final submission also requires every lesson description.

## Step 3: Media & Assets

- **Course thumbnail***: [Upload an image file]
- Recommended image format: **16:9**, approximately **1280 x 720 px**.

Check the thumbnail preview before continuing. The thumbnail is required for submission.

## Step 4: Assessment

The final assessment is optional. Select **Add Final Assessment** if the course needs one.

- **Assessment title**: [Final assessment title]
- **Description**: [What the assessment measures]
- **Time limit**: [Minutes]
- **Passing score**: [Percentage from 0 to 100]

### Question [number]

- **Question***: [Question text]
- **Options**: [Add at least two options]
  1. [Option 1]
  2. [Option 2]
  3. [Option 3]
  4. [Option 4, if needed]
- **Correct answer***: [Must exactly match one option]

Repeat the question block as needed. Remove unused options before submitting.

## Step 5: Review and Publish

Review the summary shown by the site:

- Title
- Category
- Price or Free status
- Number of modules
- Total lessons
- Number of final assessment questions

Select **Publish Course** to submit the course. The course is created by the instructor account. Course status and publication approval can then be managed through course management.

## Upload-Ready Markdown Template

For **Upload Markdown**, copy the structure below into a `.md` file and replace every bracketed value. Keep the heading names and labels unchanged so the site can parse the course.

````markdown
# Course: [Course title]

## Description
[Course description]

## Category
[Category name]

## Duration
[For example: 6 hours]

## Thumbnail
[Uploaded image URL]

## Pricing
- Free: true
- Price: 0

## Module 1: [Module title]
Description: [Module description]

### Lesson 1: [Lesson title]
Type: text
Description: [Lesson description]
Content:
[Lesson content]

## Final Assessment
Title: [Assessment title]
Description: [Assessment description]
Time Limit: 30
Passing Score: 80

### Question 1
Question: [Question text]
Options:
- [Option 1]
- [Option 2]
Correct Answer: [Correct option text]
````

Add more modules with `## Module 2: ...` and more lessons with `### Lesson 2: ...`. Use `Type: video` for a video lesson and put its URL in the `Content` section. Use `Type: code` for a code exercise. The final assessment section may be omitted.

The upload requires a course title, description, category, thumbnail, and at least one complete module and lesson. The file size limit is 1 MB.

## JSON Import Template

The **Import from JSON** option accepts the same course data. Use this shape when creating a course outside the wizard:

```json
{
  "title": "[Course title]",
  "description": "[Course description]",
  "category": "[Category name or category ID]",
  "price": 0,
  "isFree": true,
  "thumbnail": "[Uploaded thumbnail URL]",
  "duration": "[For example: 6 hours]",
  "modules": [
    {
      "title": "[Module title]",
      "description": "[Module description]",
      "order": 0,
      "lessons": [
        {
          "title": "[Lesson title]",
          "description": "[Lesson description]",
          "lessonType": "text-only",
          "content": "[Lesson content]",
          "videoUrl": "",
          "order": 0,
          "quizQuestion": "",
          "quizOptions": [],
          "correctAnswer": ""
        }
      ]
    }
  ],
  "finalAssessment": null
}
```

For a video lesson, use `"lessonType": "video"` and put the URL in both `content` and `videoUrl`. For a code lesson, use `"lessonType": "code"`.