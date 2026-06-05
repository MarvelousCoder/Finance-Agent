import { UnifiedPredictionService }
    from "../src/services/unifiedPredictionService";

async function main() {

    const result =
        await UnifiedPredictionService.generateForecast();

    console.log(
        JSON.stringify(
            result,
            null,
            2
        )
    );
}

main()
    .then(() => process.exit(0))
    .catch(console.error);