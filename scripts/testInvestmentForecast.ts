import { InvestmentForecastService } from "../src/services/investmentForecastService";



async function main() {

    const result =
        await InvestmentForecastService.forecastInvestments();

    console.log(
        JSON.stringify(result, null, 2)
    );
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });