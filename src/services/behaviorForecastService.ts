


// INFO:- Behavioral Forecasting Engine-Recurring merchant behavior,Dominant spending categories,Weekend spending tendencies,Spending frequency patterns


import { getAllTransactions } from "./transactionService";

type BehaviorInsight = {
    type:
    | "MERCHANT"
    | "CATEGORY"
    | "WEEKEND"
    | "FREQUENCY";

    message: string;

    confidence: "low" | "medium" | "high";
};

type BehaviorForecastResult = {
    insights: BehaviorInsight[];
};

export class BehaviorForecastService {

    /**
     * MAIN ENTRY POINT
     */
    static async forecastBehavior(): Promise<BehaviorForecastResult> {

        const transactions =
            await getAllTransactions();

        if (!transactions.length) {
            return {
                insights: []
            };
        }

        const insights: BehaviorInsight[] = [];

        insights.push(
            ...this.detectRecurringMerchants(
                transactions
            )
        );

        insights.push(
            ...this.detectCategoryTrends(
                transactions
            )
        );

        insights.push(
            ...this.detectWeekendBehavior(
                transactions
            )
        );

        insights.push(
            ...this.detectFrequencyTrend(
                transactions
            )
        );

        return {
            insights
        };
    }

    /**
     * Detect merchants that appear frequently
     */
    private static detectRecurringMerchants(
        transactions: any[]
    ): BehaviorInsight[] {

        const merchantMap =
            new Map<string, number>();

        for (const tx of transactions) {

            const merchant =
                tx.merchant || "Unknown";

            merchantMap.set(
                merchant,
                (merchantMap.get(merchant) || 0) + 1
            );
        }

        const insights: BehaviorInsight[] = [];

        for (const [merchant, count] of merchantMap) {

            if (count >= 5) {

                insights.push({
                    type: "MERCHANT",
                    confidence: count >= 10
                        ? "high"
                        : "medium",

                    message:
                        `${merchant} appears frequently and is likely to recur`
                });
            }
        }

        return insights;
    }

    /**
     * Detect dominant spending categories
     */
    private static detectCategoryTrends(
        transactions: any[]
    ): BehaviorInsight[] {

        const categoryMap =
            new Map<string, number>();

        for (const tx of transactions) {

            const category =
                tx.category || "uncategorized";

            categoryMap.set(
                category,
                (categoryMap.get(category) || 0) + 1
            );
        }

        const insights: BehaviorInsight[] = [];

        for (const [category, count] of categoryMap) {

            if (count >= 10) {

                insights.push({
                    type: "CATEGORY",
                    confidence: count >= 20
                        ? "high"
                        : "medium",

                    message:
                        `${category} is becoming a dominant spending category`
                });
            }
        }

        return insights;
    }

    /**
     * Detect weekend spending preference
     */
    private static detectWeekendBehavior(
        transactions: any[]
    ): BehaviorInsight[] {

        let weekendCount = 0;
        let weekdayCount = 0;

        for (const tx of transactions) {

            const day =
                new Date(tx.txn_date).getDay();

            if (
                day === 0 ||
                day === 6
            ) {
                weekendCount++;
            } else {
                weekdayCount++;
            }
        }

        const total =
            weekendCount + weekdayCount;

        if (!total) {
            return [];
        }

        const weekendRatio =
            weekendCount / total;

        if (weekendRatio >= 0.35) {

            return [
                {
                    type: "WEEKEND",
                    confidence:
                        weekendRatio >= 0.45
                            ? "high"
                            : "medium",

                    message:
                        "Higher spending activity observed on weekends"
                }
            ];
        }

        return [];
    }

    /**
     * Detect high transaction frequency
     */
    private static detectFrequencyTrend(
        transactions: any[]
    ): BehaviorInsight[] {

        const totalTransactions =
            transactions.length;

        if (totalTransactions >= 100) {

            return [
                {
                    type: "FREQUENCY",
                    confidence: "high",
                    message:
                        "Transaction frequency is elevated and likely to continue"
                }
            ];
        }

        if (totalTransactions >= 50) {

            return [
                {
                    type: "FREQUENCY",
                    confidence: "medium",
                    message:
                        "Transaction activity is increasing"
                }
            ];
        }

        return [];
    }
}