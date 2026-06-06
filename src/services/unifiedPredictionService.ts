
import { PredictionService } from "./predictionService";
import { InvestmentForecastService } from "./investmentForecastService";
import { BehaviorForecastService } from "./behaviorForecastService";
import { AnomalyService } from "./anomalyService";

type UnifiedPredictionResult = {
    overallScore: number;
    financialOutlook: "Positive" | "Neutral" | "Negative";
    spendingRisk: "low" | "medium" | "high";
    investmentRisk: "low" | "medium" | "high";
    topBehavioralSignals: string[];
    predictions: string[];
};

export class UnifiedPredictionService {

    static async generateForecast(): Promise<UnifiedPredictionResult> {

        const spendingForecast =
            await PredictionService.predictNextMonthSpending(
                "default"
        );

        const anomalyForecast =
            await AnomalyService.detectAnomalies();

        const investmentForecast =
            await InvestmentForecastService.forecastInvestments();

        const behaviorForecast =
            await BehaviorForecastService.forecastBehavior();

        const overallScore =
            this.calculateScore(
                spendingForecast,
                anomalyForecast,
                investmentForecast
            );

        const financialOutlook =
            this.calculateOutlook(
                overallScore
            );

        const spendingRisk =
            anomalyForecast.riskLevel;

        const investmentRisk =
            investmentForecast.riskLevel;

        const topBehavioralSignals =
            behaviorForecast.insights
                .slice(0, 5)
                .map(i => i.message);

        const predictions: string[] = [];

        predictions.push(
            `Predicted spending: ₹${spendingForecast.totalForecast}`
        );

        predictions.push(
            `Investment risk level: ${investmentRisk}`
        );

        predictions.push(
            `Spending risk level: ${spendingRisk}`
        );

        return {
            overallScore,
            financialOutlook,
            spendingRisk,
            investmentRisk,
            topBehavioralSignals,
            predictions
        };
    }

    /**
     * Overall financial health score
     */
    private static calculateScore(
        spendingForecast: any,
        anomalyForecast: any,
        investmentForecast: any
    ): number {

        let score = 100;

        if (
            anomalyForecast.riskLevel === "high"
        ) {
            score -= 30;
        }

        else if (
            anomalyForecast.riskLevel === "medium"
        ) {
            score -= 15;
        }

        if (
            investmentForecast.riskLevel === "high"
        ) {
            score -= 30;
        }

        else if (
            investmentForecast.riskLevel === "medium"
        ) {
            score -= 15;
        }

        if (
            spendingForecast.growthRate > 20
        ) {
            score -= 10;
        }

        return Math.max(0, score);
    }

    /**
     * Human-readable outlook
     */
    private static calculateOutlook(
        score: number
    ): "Positive" | "Neutral" | "Negative" {

        if (score >= 80) {
            return "Positive";
        }

        if (score >= 60) {
            return "Neutral";
        }

        return "Negative";
    }
}