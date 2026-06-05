
// INFO: Anomaly Prediction Engine-spending volatility,category instability,merchant spikes,early warning signals BEFORE they happen

import { getAllTransactions } from "./transactionService";

type AnomalyAlert = {
    type: "CATEGORY" | "MERCHANT" | "SPENDING";
    message: string;
    severity: "low" | "medium" | "high";
};

type AnomalyResult = {
    riskLevel: "low" | "medium" | "high";
    alerts: AnomalyAlert[];
};

export class AnomalyService {

    static async detectAnomalies(): Promise<AnomalyResult> {

        const transactions = await getAllTransactions();

        if (!transactions.length) {
            return {
                riskLevel: "low",
                alerts: []
            };
        }

        const categoryRisk = this.analyzeCategoryVolatility(transactions);
        const merchantRisk = this.analyzeMerchantSpikes(transactions);
        const spendingRisk = this.analyzeOverallVolatility(transactions);

        const alerts: AnomalyAlert[] = [
            ...categoryRisk,
            ...merchantRisk,
            ...spendingRisk
        ];

        const riskLevel = this.calculateOverallRisk(alerts);

        return {
            riskLevel,
            alerts
        };
    }

    //INFO: CATEGORY VOLATILITY DETECTION

    private static analyzeCategoryVolatility(transactions: any[]): AnomalyAlert[] {

        const categoryMap: Record<string, number[]> = {};

        for (const tx of transactions) {
            const cat = tx.category || "uncategorized";
            if (!categoryMap[cat]) categoryMap[cat] = [];
            categoryMap[cat].push(Math.abs(tx.amount));
        }

        const alerts: AnomalyAlert[] = [];

        for (const [category, values] of Object.entries(categoryMap)) {

            if (values.length < 3) continue;

            const avg = values.reduce((a, b) => a + b, 0) / values.length;

            const variance =
                values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
                values.length;

            const volatility = Math.sqrt(variance);

            // threshold logic (v1 heuristic)
            if (volatility > avg * 0.8) {
                alerts.push({
                    type: "CATEGORY",
                    severity: "high",
                    message: `${category} spending is highly volatile (possible upcoming spike)`
                });
            } else if (volatility > avg * 0.5) {
                alerts.push({
                    type: "CATEGORY",
                    severity: "medium",
                    message: `${category} spending showing increasing instability`
                });
            }
        }

        return alerts;
    }

    //INFO: MERCHANT SPIKE DETECTION
    private static analyzeMerchantSpikes(transactions: any[]): AnomalyAlert[] {

        const merchantMap: Record<string, number> = {};

        for (const tx of transactions) {
            const m = tx.merchant || "unknown";
            merchantMap[m] = (merchantMap[m] || 0) + Math.abs(tx.amount);
        }

        const values = Object.values(merchantMap);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        const alerts: AnomalyAlert[] = [];

        for (const [merchant, total] of Object.entries(merchantMap)) {

            if (total > avg * 2.5) {
                alerts.push({
                    type: "MERCHANT",
                    severity: "high",
                    message: `${merchant} spending unusually high (possible spike risk)`
                });
            } else if (total > avg * 1.8) {
                alerts.push({
                    type: "MERCHANT",
                    severity: "medium",
                    message: `${merchant} showing above-normal spending pattern`
                });
            }
        }

        return alerts;
    }

    //INFO: OVERALL SPENDING VOLATILITY
    private static analyzeOverallVolatility(transactions: any[]): AnomalyAlert[] {

        const dailyMap: Record<string, number> = {};

        for (const tx of transactions) {
            const day = tx.txn_date;
            dailyMap[day] = (dailyMap[day] || 0) + Math.abs(tx.amount);
        }

        const values = Object.values(dailyMap);

        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        const variance =
            values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
            values.length;

        const volatility = Math.sqrt(variance);

        const alerts: AnomalyAlert[] = [];

        if (volatility > avg * 1.2) {
            alerts.push({
                type: "SPENDING",
                severity: "high",
                message: "Overall spending pattern is highly unstable (pre-spike detected)"
            });
        } else if (volatility > avg * 0.8) {
            alerts.push({
                type: "SPENDING",
                severity: "medium",
                message: "Spending volatility is increasing"
            });
        }

        return alerts;
    }
    
    //INFO: FINAL RISK SCORING
    private static calculateOverallRisk(alerts: AnomalyAlert[]): "low" | "medium" | "high" {

        const high = alerts.filter(a => a.severity === "high").length;
        const medium = alerts.filter(a => a.severity === "medium").length;

        if (high >= 2) return "high";
        if (high === 1 || medium >= 2) return "medium";
        return "low";
    }
}