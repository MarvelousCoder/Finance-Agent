
// INFO: Converts raw tool + memory data into financial intelligence


// export function generateInsights(toolResults: any[], memory: any[]) {
//     const insights: string[] = [];

    
//     // INFO: Spending anomaly detection
    
//     const spending = toolResults.find(
//         (t) => t.tool === "getSpendingSummary"
//     );

//     if (spending?.result?.currentMonth && spending?.result?.previousMonth) {
//         const diff =
//             spending.result.currentMonth - spending.result.previousMonth;

//         if (Math.abs(diff) > spending.result.previousMonth * 0.2) {
//             insights.push(
//                 `⚠️ Spending anomaly detected: ${diff > 0 ? "increase" : "decrease"
//                 } of ~${Math.abs(diff)} compared to last month`
//             );
//         }
//     }

    
//     // INFO: Merchant concentration risk
    
//     const merchantData = toolResults.find(
//         (t) => t.tool === "getTransactions"
//     );

//     if (merchantData?.result) {
//         const merchants = merchantData.result;

//         const frequencyMap: Record<string, number> = {};

//         merchants.forEach((tx: any) => {
//             frequencyMap[tx.merchant] =
//                 (frequencyMap[tx.merchant] || 0) + 1;
//         });

//         const topMerchant = Object.entries(frequencyMap).sort(
//             (a, b) => b[1] - a[1]
//         )[0];

//         if (topMerchant && topMerchant[1] > 5) {
//             insights.push(
//                 `🏪 High dependency on merchant: ${topMerchant[0]} (${topMerchant[1]} transactions)`
//             );
//         }
//     }

    
//     // INFO: Memory-based trend detection
    
//     const spendingMemories = memory.filter(
//         (m) => m.type === "insight"
//     );

//     if (spendingMemories.length > 3) {
//         insights.push(
//             `📊 Repeated financial patterns detected over time (trend forming)`
//         );
//     }

//     return insights;
// }
import { PredictionService } from "../services/predictionService";
import { AnomalyService } from "../services/anomalyService";
import { InvestmentForecastService } from "../services/investmentForecastService";

export async function generateInvestmentInsights() {

    const result = await InvestmentForecastService.forecastInvestments();

    return {
        type: "INVESTMENT_FORECAST",
        message: `Portfolio risk: ${result.riskLevel}`,
        data: result
    };
}

export async function generateAnomalyInsights() {

    const result = await AnomalyService.detectAnomalies();

    return {
        type: "ANOMALY",
        message: `Risk Level: ${result.riskLevel}`,
        data: result
    };
}

export async function generatePredictiveInsights(userId: string) {

    const forecast = await PredictionService.predictNextMonthSpending(userId);

    return {
        type: "PREDICTION",
        message: `Next month spending expected: ₹${forecast.totalForecast}`,
        data: forecast
    };
}
export function generateInsights(toolResults: any[], memory: any[]) {
    const insights: string[] = [];

    
    //INFO: Spending anomaly detection
   

    const spending = toolResults.find(
        (t) => t.tool === "getSpendingSummary" && t.success
    );

    const spendingData = spending?.data;

    if (
        spendingData?.currentMonth &&
        spendingData?.previousMonth
    ) {
        const diff =
            spendingData.currentMonth - spendingData.previousMonth;

        const baseline = spendingData.previousMonth || 1;

        if (Math.abs(diff) > baseline * 0.2) {
            insights.push(
                `Spending anomaly detected: ${diff > 0 ? "increase" : "decrease"
                } of ~${Math.abs(diff)} compared to last month`
            );
        }
    }


    //INFO: Merchant concentration risk

    const merchantData = toolResults.find(
        (t) => t.tool === "getTransactions" && t.success
    );

    const transactions = merchantData?.data;

    if (Array.isArray(transactions)) {
        const frequencyMap: Record<string, number> = {};

        transactions.forEach((tx: any) => {
            if (!tx?.merchant) return;

            const merchant = tx.merchant.trim();

            frequencyMap[merchant] =
                (frequencyMap[merchant] || 0) + 1;
        });

        const topMerchant = Object.entries(frequencyMap).sort(
            (a, b) => b[1] - a[1]
        )[0];

        if (topMerchant && topMerchant[1] > 5) {
            insights.push(
                `High dependency on merchant: ${topMerchant[0]} (${topMerchant[1]} transactions)`
            );
        }
    }

  
    //INFO: Memory-based trend detection
  

    const validMemories = memory.filter(
        (m) => m?.type === "insight" && m?.value
    );

    if (validMemories.length > 3) {
        insights.push(
            `Repeated financial patterns detected over time (trend forming)`
        );
    }

    return insights;
  }