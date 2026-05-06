export function resumeReviewPrompt(
  resumeText: string,
  jobDescription?: string,
  targetRole?: string
) {
  return `
You are an expert resume reviewer.

Analyze the resume and return ONLY valid JSON.

Mode rules:
- If Job Description is "None", do a general resume review and set matchAnalysis to null.
- If Job Description is not "None", do a targeted job-match review.
- In targeted mode, the job description must directly affect:
  1. matchAnalysis.matchScore
  2. Relevance category score
  3. missingKeywords
  4. strongMatches
  5. positionSuggestions
  6. rewrittenBullets
- Do not give the same review with and without a job description.

Use this exact structure:

{
  "overallScore": 0,
 "matchAnalysis": null,
  "categories": [
    {
      "name": "Impact",
      "score": 0,
      "feedback": "",
      "suggestions": [""]
    },
    {
      "name": "Clarity",
      "score": 0,
      "feedback": "",
      "suggestions": [""]
    },
    {
      "name": "Metrics",
      "score": 0,
      "feedback": "",
      "suggestions": [""]
    },
    {
      "name": "Relevance",
      "score": 0,
      "feedback": "",
      "suggestions": [""]
    },
    {
      "name": "Formatting",
      "score": 0,
      "feedback": "",
      "suggestions": [""]
    }
  ],
  "positionSuggestions": [
  {
    "positionTitle": "",
    "company": "",
    "positionScore": 0,
    "feedback": "",
    "suggestions": ["", ""],
    "rewrittenBullets": ["", ""]
  },
  {
    "positionTitle": "",
    "company": "",
    "positionScore": 0,
    "feedback": "",
    "suggestions": ["", ""],
    "rewrittenBullets": ["", ""]
  }
],
  ],
  "improvedBullets": [
  "Rewrote a weak resume bullet to include a clear action, technical skill, and measurable result.",
  "Improved a project description by adding tools used, project scope, and user impact.",
  "Strengthened an experience bullet by emphasizing leadership, collaboration, and outcome."
]
  Target Role:
${targetRole || "General"}
}

Instructions for positionSuggestions:
- Identify each role or position in the Experience section.
- You MUST identify every role, internship, job, leadership role, or major project listed in the resume.
- Do not skip any position from the Experience, Leadership, Projects, or Work Experience sections.
- If a role has no clear company, set "company" to "".
- If a role has no clear title, infer a short title from the section heading.
- Return one positionSuggestions object for each detected position.
- For each position, give a score from 0 to 10.
- Give specific feedback about that position's bullets.
- Provide 2 suggestions to improve that position.
- Provide 2 rewritten bullets for that position.
- If company name is missing, use an empty string.
- Analyze the resume and return ONLY valid JSON.
- You MUST include the "positionSuggestions" field.
- Do not omit it.

Use a strict scoring rubric:
- 90–100: exceptional, highly quantified, targeted, polished
- 80–89: strong, but still has clear improvement areas
- 70–79: good but missing metrics, targeting, or stronger impact
- 60–69: average, unclear, generic, or weakly quantified
- below 60: major issues with clarity, relevance, formatting, or content

Do not default to 85.
Scores must reflect the resume quality.
If two resumes differ in quality, their scores should differ.

Scoring rules:
- overallScore must be from 0 to 100.
- category scores must be from 0 to 20.
- positionScore must be from 0 to 10.
- overallScore must equal the sum of the 5 category scores.
- overallScore should typically be between 60 and 95 for a strong resume.

If a job description is provided:
- Compare the resume against the job description.
- matchScore must be from 0 to 100.
- missingKeywords should list skills/tools/responsibilities from the job description that are weak or missing in the resume.
- strongMatches should list resume strengths that match the job description.
- Adjust the Relevance score based on the job description.

If no job description is provided:
- Set matchAnalysis to null.
- Do not invent missingKeywords or strongMatches.
- Do not calculate a matchScore.

For matchAnalysis:
- If no job description is provided, return null.
- If a job description is provided, return:
  {
    "matchScore": number from 0 to 100,
    "summary": "Explain how well the resume matches this specific job.",
    "missingKeywords": ["skills, tools, or responsibilities from the job description that are missing or weak"],
    "strongMatches": ["resume experiences that match the job description"]
  }

  For improvedBullets:
- Do not return empty strings.
- Each improved bullet must be a complete rewritten resume bullet.
- Each bullet must be based on the user's actual resume.
- Start each bullet with a strong action verb.
- Include metrics when possible.

Role targeting rules:
- Evaluate the resume for the target role.
- Adjust Relevance, positionSuggestions, improvedBullets, and missingKeywords based on the target role.
- If no job description is provided, still evaluate the resume against the target role.

Resume:
${resumeText}

Job Description:
${jobDescription || "None"}
`;
}