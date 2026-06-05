
// INFO: Fund & Holding Forecast Engine-fund return trend,holding performance direction,investment risk 

import {
    getFunds,
    getFundNavs,
    getLatestNav
} from "./fundService";

import { getHoldings } from "./holdingService";

type FundForecast = {
    fundId: string;
    fundName: string;
    currentNav: number;
    projectedNav: number;
    expectedGrowthPercent: number;
    trend: "up" | "down" | "stable";
};

type InvestmentForecastResult = {
    fundForecasts: FundForecast[];
    riskLevel: "low" | "medium" | "high";
};

export class InvestmentForecastService {

    static async forecastInvestments(): Promise<InvestmentForecastResult> {

        const funds = await getFunds();
        const holdings = await getHoldings();

        const fundForecasts: FundForecast[] = [];

        for (const fund of funds) {

            const forecast = await this.analyzeFund(fund);

            if (forecast) {
                fundForecasts.push(forecast);
            }
        }

        const holdingImpact =
            this.calculateHoldingImpact(
                holdings,
                fundForecasts
            );

        const riskLevel =
            this.calculateRisk(
                fundForecasts,
                holdingImpact
            );

        return {
            fundForecasts,
            riskLevel
        };
    }

 
    private static async analyzeFund(
        fund: any
    ): Promise<FundForecast | null> {

        const latestNavRow =
            await getLatestNav(fund.id);

        if (!latestNavRow) {
            return null;
        }

        const currentNav =
            Number(latestNavRow.nav_value);

        const navHistory =
            await getFundNavs(
                fund.id,
                "2000-01-01",
                "2100-01-01"
            );

        const navs = navHistory.map(
            row => Number(row.nav_value)
        );

        if (navs.length < 2) {

            return {
                fundId: fund.id,
                fundName: fund.name,
                currentNav,
                projectedNav: currentNav,
                expectedGrowthPercent: 0,
                trend: "stable"
            };
        }

        const growthRate =
            this.calculateGrowthRate(navs);

        const projectedNav =
            currentNav * (1 + growthRate);

        let trend: "up" | "down" | "stable" =
            "stable";

        if (growthRate > 0.01) {
            trend = "up";
        } else if (growthRate < -0.01) {
            trend = "down";
        }

        return {
            fundId: fund.id,
            fundName: fund.name,
            currentNav,
            projectedNav: Number(projectedNav.toFixed(2)),
            expectedGrowthPercent: Number(
                (growthRate * 100).toFixed(2)
            ),
            trend
        };
    }

    private static calculateGrowthRate(
        navs: number[]
    ): number {

        let totalGrowth = 0;

        for (let i = 1; i < navs.length; i++) {

            const previous = navs[i - 1];

            if (previous === 0) {
                continue;
            }

            totalGrowth +=
                (navs[i] - previous) / previous;
        }

        return totalGrowth / (navs.length - 1);
    }

    private static calculateHoldingImpact(
        holdings: any[],
        forecasts: FundForecast[]
    ): number {

        const forecastMap =
            new Map(
                forecasts.map(f => [
                    f.fundId,
                    f.projectedNav
                ])
            );

        let totalImpact = 0;

        for (const holding of holdings) {

            const projectedNav =
                forecastMap.get(
                    holding.fund_id
                );

            if (!projectedNav) {
                continue;
            }

            const projectedValue =
                projectedNav *
                Number(holding.units);

            const currentValue =
                Number(holding.purchase_nav) *
                Number(holding.units);

            totalImpact +=
                projectedValue -
                currentValue;
        }

        return totalImpact;
    }

    private static calculateRisk(
        forecasts: FundForecast[],
        holdingImpact: number
    ): "low" | "medium" | "high" {

        const downCount =
            forecasts.filter(
                f => f.trend === "down"
            ).length;

        if (
            downCount >= 3 ||
            holdingImpact < 0
        ) {
            return "high";
        }

        if (
            downCount > 0
        ) {
            return "medium";
        }

        return "low";
    }
    
}