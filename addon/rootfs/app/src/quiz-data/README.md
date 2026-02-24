# Quiz Data Directory

This directory contains 102 quiz JSON files extracted from various Life in the UK test sources.

## Files
- `quiz-1.json` through `quiz-45.json` - Original quiz data files
- `quiz-46.json` through `quiz-85.json` - Life in the UK Tests (1-40)
- `quiz-86.json` through `quiz-100.json` - British Citizenship Tests (1-15)
- `quiz-95.json` through `quiz-97.json` - Missing British Citizenship Tests (10-12) with special URLs
- `quiz-101.json` through `quiz-102.json` - Additional Life in the UK Tests
- Each file contains complete quiz information including questions, options, explanations, and metadata

## Sources
- **Original Quizzes (1-45)**: Britizen API
- **Life in the UK Tests (46-85)**: https://lifeintheuktestweb.co.uk/test-{id}/
- **British Citizenship Tests (86-100)**: https://lifeintheuktestweb.co.uk/british-citizenship-test-{id}/
- **Missing British Tests (95-97)**: Special URLs for tests 10-12
- **Additional Tests (101-102)**: https://lifeintheuktestweb.co.uk/life-in-the-uk-exam-16/ and https://lifeintheuktestweb.co.uk/exam-17/

## Usage
The `api-service.js` loads quiz data from these local files and supports all 102 available quizzes.

## File Structure
Each quiz JSON file contains:
- `id`: Quiz identifier
- `name`: Quiz title
- `question_count`: Number of questions
- `passmark`: Required score to pass
- `questions[]`: Array of question objects with:
  - `text`: Question text
  - `options[]`: Multiple choice options
  - `explanation`: Answer explanation
  - `topic`: Question category

## Testing
Use `test-local-api.html` to verify that the local data loading works correctly.

## Last Updated
December 19, 2024 - Added 57 additional quizzes from Life in the UK test sources, completing all 102 available quizzes
