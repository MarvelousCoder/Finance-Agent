import fs from "fs";
import path from "path";

// Adjust import according to your project
import { financeAgent } from "../src/agent/financeAgent";

interface EvalQuestion {
    id: number;
    category: string;
    question: string;
}

interface ExpectedAnswer {
    id: number;
    type: "contains";
    expected: string;
}

function evaluateAnswer(
    actual: string,
    expected: string
): boolean {
    return actual
        .toLowerCase()
        .includes(expected.toLowerCase());
}

async function runEvals() {
    const questionsPath = path.join(
        __dirname,
        "questions.json"
    );

    const expectedPath = path.join(
        __dirname,
        "expectedAnswers.json"
    );

    const questions: EvalQuestion[] =
        JSON.parse(fs.readFileSync(questionsPath, "utf8"));

    const expectedAnswers: ExpectedAnswer[] =
        JSON.parse(fs.readFileSync(expectedPath, "utf8"));

    let total = 0;
    let passed = 0;

    const categoryStats: Record<
        string,
        {
            total: number;
            passed: number;
        }
    > = {};

    console.log("\n========== EVALUATION ==========\n");

    for (const q of questions) {
        total++;

        const expected = expectedAnswers.find(
            (e) => e.id === q.id
        );

        if (!expected) {
            console.log(
                `Q${q.id}: Missing expected answer`
            );
            continue;
        }

        try {
            const response = await financeAgent(
                q.question
            );

            const answer =
                typeof response === "string"
                    ? response
                    : JSON.stringify(response);

            const isPass = evaluateAnswer(
                answer,
                expected.expected
            );

            if (!categoryStats[q.category]) {
                categoryStats[q.category] = {
                    total: 0,
                    passed: 0,
                };
            }

            categoryStats[q.category].total++;

            if (isPass) {
                passed++;
                categoryStats[q.category].passed++;

                console.log(
                    `✅ Q${q.id} PASS`
                );
            } else {
                console.log(
                    `❌ Q${q.id} FAIL`
                );

                console.log(
                    `Expected: ${expected.expected}`
                );

                console.log(
                    `Actual: ${answer}\n`
                );
            }
        } catch (error) {
            console.log(
                `❌ Q${q.id} ERROR`
            );

            console.error(error);
        }
    }

    const accuracy =
        ((passed / total) * 100).toFixed(2);

    console.log(
        "\n========== SUMMARY =========="
    );

    console.log(
        `Passed: ${passed}/${total}`
    );

    console.log(
        `Accuracy: ${accuracy}%`
    );

    console.log(
        "\n===== CATEGORY BREAKDOWN ====="
    );

    for (const [category, stats] of Object.entries(
        categoryStats
    )) {
        const categoryAccuracy =
            (
                (stats.passed / stats.total) *
                100
            ).toFixed(2);

        console.log(
            `${category}: ${stats.passed}/${stats.total} (${categoryAccuracy}%)`
        );
    }

    console.log("\n==============================\n");
}

runEvals().catch(console.error);