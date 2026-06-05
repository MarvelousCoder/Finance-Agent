// scripts/testBehaviorForecast.ts

import { BehaviorForecastService } from "../src/services/behaviorForecastService";

async function main() {

    const result =
        await BehaviorForecastService.forecastBehavior();

    console.log(
        JSON.stringify(result, null, 2)
    );
}

main()
    .then(() => process.exit(0))
    .catch(console.error);