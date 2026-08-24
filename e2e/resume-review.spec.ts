import { expect, test } from "@playwright/test";

const reviewResponse = {
    overallScore: 75,
    matchAnalysis: null,
    categories: [
        { name: "Impact", score: 15, feedback: "Good impact.", suggestions: [] },
        { name: "Clarity", score: 15, feedback: "Clear writing.", suggestions: [] },
        { name: "Metrics", score: 15, feedback: "Useful metrics.", suggestions: [] },
        { name: "Relevance", score: 15, feedback: "Role aligned.", suggestions: [] },
        { name: "Formatting", score: 15, feedback: "Consistent format.", suggestions: [] },
    ],
    positionSuggestions: [],
    improvedBullets: [
        "Built a TypeScript application that improved processing speed by 30%.",
    ],
};

const interviewResponse = {
    questions: [
        { id: 1, type: "behavioral", question: "Behavioral question one?" },
        { id: 2, type: "behavioral", question: "Behavioral question two?" },
        { id: 3, type: "behavioral", question: "Behavioral question three?" },
        { id: 4, type: "technical", question: "Technical question one?" },
        { id: 5, type: "technical", question: "Technical question two?" },
        { id: 6, type: "technical", question: "Technical question three?" },
        { id: 7, type: "project", question: "Project question one?" },
        { id: 8, type: "project", question: "Project question two?" },
    ],
};

test("reviews a resume and starts a generated mock interview", async ({ page }) => {
    await page.route("**/api/review", async (route) => {
        await route.fulfill({ status: 200, json: reviewResponse });
    });
    await page.route("**/api/interview/generate", async (route) => {
        await route.fulfill({ status: 200, json: interviewResponse });
    });

    await page.goto("/");
    await page
        .getByPlaceholder("Your resume text will appear here after upload...")
        .fill(
            "Software engineer who built a TypeScript platform and improved response time by 30%."
        );
    await page.locator("select").selectOption("Software Engineer");
    await page.getByRole("button", { name: "Review Resume" }).click();

    await expect(page.getByText("Overall Score: 75/100")).toBeVisible();
    await expect(page.getByText("Good impact.")).toBeVisible();

    await page.getByRole("button", { name: "Start Mock Interview" }).click();
    await expect(page).toHaveURL(/\/interview$/);
    await page
        .getByRole("button", { name: "Generate Interview Questions" })
        .click();

    await expect(page.getByText("Question 1 of 8")).toBeVisible();
    await expect(page.getByText("Behavioral question one?")).toBeVisible();
});
