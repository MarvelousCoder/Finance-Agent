

//   INFO: Purpose:Predict next month spending using historical transaction patterns,Provide category-level forecast,Provide trend-based growth estimation
 

import { getAllTransactions } from "./transactionService";

type SpendingForecast = {
    totalForecast: number;
    categoryForecast: Record<string, number>;
    growthRate: number;
    confidence: "low" | "medium" | "high";
};

export class PredictionService {

    static async predictNextMonthSpending(
        userId: string
    ): Promise<SpendingForecast> {

        const transactions = await getAllTransactions();

        if (!transactions.length) {
            return {
                totalForecast: 0,
                categoryForecast: {},
                growthRate: 0,
                confidence: "low"
            };
        }

        const monthlyTotals = this.groupByMonth(transactions);

        const growthRate = this.calculateGrowthRate(monthlyTotals);

        const lastMonth =
            monthlyTotals.length > 0
                ? monthlyTotals[monthlyTotals.length - 1]
                : 0;

        const forecast = lastMonth + lastMonth * growthRate;

        const categoryForecast = this.predictByCategory(transactions, growthRate);

        const confidence = this.calculateConfidence(monthlyTotals);

        return {
            totalForecast: Math.round(forecast),
            categoryForecast,
            growthRate: Number(growthRate.toFixed(2)),
            confidence
        };
    }

    /**
     * GROUP BY MONTH (STRICT CLEAN DATA)
     */
    private static groupByMonth(transactions: any[]): number[] {

        const map = new Map<string, number>();

        for (const tx of transactions) {

            // 🔥 STRICT FILTERS (6C CORE FIX)
            if (tx.isTransfer) continue;
            if (tx.isRefund) continue;

            const date = new Date(tx.txn_date);
            if (isNaN(date.getTime())) continue;

            const month = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

            const amount = Math.abs(Number(tx.amount || 0));

            map.set(month, (map.get(month) || 0) + amount);
        }

        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, value]) => value);
    }

    /**
     * GROWTH RATE (STABLE)
     */
    private static calculateGrowthRate(monthlyTotals: number[]): number {

        if (monthlyTotals.length < 2) return 0;

        let growthSum = 0;
        let count = 0;

        for (let i = 1; i < monthlyTotals.length; i++) {

            const prev = monthlyTotals[i - 1];
            const curr = monthlyTotals[i];

            if (prev > 0) {
                growthSum += (curr - prev) / prev;
                count++;
            }
        }

        return count ? growthSum / count : 0;
    }

    /**
     * CATEGORY FORECAST (CLEAN)
     */
    private static predictByCategory(
        transactions: any[],
        growthRate: number
    ) {
        const categoryMap: Record<string, number> = {};

        for (const tx of transactions) {

            if (tx.isTransfer || tx.isRefund) continue;

            const category = tx.category || "uncategorized";
            const amount = Math.abs(Number(tx.amount || 0));

            categoryMap[category] =
                (categoryMap[category] || 0) + amount;
        }

        const forecast: Record<string, number> = {};

        for (const [cat, value] of Object.entries(categoryMap)) {
            forecast[cat] = Math.round(value * (1 + growthRate));
        }

        return forecast;
    }

    /**
     * CONFIDENCE ENGINE (ROBUST)
     */
    private static calculateConfidence(
        monthlyTotals: number[]
    ): "low" | "medium" | "high" {

        if (monthlyTotals.length < 3) return "low";

        const diffs: number[] = [];

        for (let i = 1; i < monthlyTotals.length; i++) {
            diffs.push(Math.abs(monthlyTotals[i] - monthlyTotals[i - 1]));
        }

        const avgDiff =
            diffs.reduce((a, b) => a + b, 0) / diffs.length;

        if (avgDiff < 5000) return "high";
        if (avgDiff < 20000) return "medium";
        return "low";
    }
}