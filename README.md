# AI Resume Reviewer & Mock Interview Platform

AI Resume Reviewer & Mock Interview Platform is a full-stack AI-powered career preparation platform that analyzes resumes, provides ATS-style feedback, generates role-targeted improvements, and conducts AI-powered mock interviews with detailed answer evaluation and performance analytics.

The platform supports resume parsing, job description matching, interview simulation, AI-generated feedback, interview scoring, and persistent interview sessions using modern full-stack web technologies.

The application allows users to upload PDF or DOCX resumes and receive structured AI-generated feedback including:

* Overall resume scoring
* Category-based evaluation
* Position-specific analysis
* ATS-style job matching
* Resume bullet improvements
* Missing skills and keyword analysis
* Role-targeted recommendations

The project was designed to simulate features commonly found in modern resume optimization and applicant tracking system (ATS) platforms while showcasing full-stack AI integration using modern web technologies.

---

# Live Demo

[Live Application](https://ai-resume-reviewer-dusky.vercel.app/)

---

# Features

## Resume Upload

* Upload resumes in PDF or DOCX format
* Drag-and-drop upload interface
* Animated upload and parsing states
* Automatic text extraction

## AI Resume Analysis

* Overall resume scoring (0–100)
* Category-based scoring system
* Position-specific feedback
* Improved bullet point generation
* Resume clarity and formatting evaluation

## ATS-Style Job Matching

* Match score against job descriptions
* Missing keyword detection
* Strong skill alignment analysis
* Target role evaluation

## Role Targeting

Supports multiple career targets including:

* Software Engineer
* Data Analyst
* Data Scientist
* Machine Learning Engineer
* Cybersecurity Analyst
* Product Manager
* IT Support Specialist
* Custom user-defined roles

## AI Mock Interview System

- AI-generated interview questions
- Behavioral, technical, and project-based interviews
- Role-specific interview generation
- AI answer evaluation and scoring
- Communication and technical depth analysis
- Improved answer suggestions
- Interview performance dashboard
- Persistent interview sessions
- Question-by-question feedback review

## Modern UI/UX

* Responsive design
* Drag-and-drop uploads
* Dynamic score bars
* Copy-to-clipboard functionality
* Clean dashboard layout
* Real-time feedback display

---

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| AI | OpenAI API |
| File Parsing | pdfreader, mammoth |
| Deployment | Vercel |
| Tooling | Git, GitHub, VS Code |

---

# How It Works

## 1. Resume Upload

The user uploads a PDF or DOCX resume using the drag-and-drop interface.

## 2. Resume Parsing

The backend extracts text from the uploaded file:

* PDF files are parsed using `pdfreader`
* DOCX files are parsed using `mammoth`

## 3. AI Processing

The extracted resume text is sent to the OpenAI API along with:

* Optional job description
* Selected target role

The AI model analyzes:

* Resume quality
* Impact
* Metrics
* Relevance
* Formatting
* ATS compatibility
* Position-specific content

## 4. Structured JSON Response

The OpenAI API returns structured JSON containing:

* Overall score
* Category evaluations
* Match analysis
* Position suggestions
* Improved bullets

## 5. Frontend Rendering

The application dynamically renders:

* Score bars
* Feedback cards
* Improved bullets
* Copy buttons
* Match analysis

---

# Scoring System

The application evaluates resumes across multiple categories:

| Category   | Description                                             |
| ---------- | ------------------------------------------------------- |
| Impact     | Measures demonstrated contributions and achievements    |
| Clarity    | Evaluates readability and communication quality         |
| Metrics    | Detects quantified achievements and measurable results  |
| Relevance  | Measures alignment with target role and job description |
| Formatting | Evaluates consistency and presentation                  |

The overall score is calculated as the sum of all category scores.

---

# Project Structure

```bash
src/
│
├── app/
│   ├── api/
│   │   ├── parse/
│   │   └── review/
│   ├── layout.tsx
│   ├── page.tsx
│   └── icon.png
│
├── lib/
│   └── prompts.ts
```

---

# Running Locally

## 1. Clone the Repository

```bash
git clone https://github.com/Ahmed2003Essam/ai-resume-reviewer
cd ai-resume-reviewer
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Create Environment Variables

Create a `.env.local` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key
```

## 4. Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Deployment

The application is deployed using Vercel.

## Deploy Steps

1. Push project to GitHub
2. Import repository into Vercel
3. Add environment variables:

   * `OPENAI_API_KEY`
4. Deploy

---

# Example Use Cases

* Resume optimization for internships and jobs
* ATS preparation
* Role-specific resume targeting
* Resume improvement suggestions
* Skill gap analysis
* Technical portfolio project

---

# Future Improvements

Planned enhancements include:

* User authentication
* Saved review history
* Resume export functionality
* PDF report generation
* Resume template generation
* Inline resume editing
* AI-generated cover letters
* Multi-language support
* Advanced ATS keyword analytics

---

# Purpose of the Project

This project was created to explore:

## Project Goals

This project was built to explore production-style AI application development using modern full-stack technologies and large language models. The platform demonstrates how AI can power practical career preparation workflows including resume optimization, ATS analysis, interview simulation, and structured feedback generation.

---
