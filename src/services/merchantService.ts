// src/services/merchantService.ts

//NOTE: Simple rule-based normalization map
const MERCHANT_MAP: Record<string, string> = {
    "AMAZON PAY": "AMAZON",
    "AMAZON INDIA": "AMAZON",
    "AMZN MKTP": "AMAZON",
    AMAZON: "AMAZON",

    SWIGGY: "SWIGGY",
    "SWIGGY LIMITED": "SWIGGY",

    FLIPKART: "FLIPKART",
    "FLIPKART INTERNET": "FLIPKART",

    UBER: "UBER",
    "UBER INDIA": "UBER",
};

// Normalize merchant name
export function normalizeMerchantName(rawMerchant: string): string {
    if (!rawMerchant) return "UNKNOWN";

    const cleaned = rawMerchant
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, "")
        .trim();

    // Direct match
    if (MERCHANT_MAP[cleaned]) {
        return MERCHANT_MAP[cleaned];
    }

    // Partial match fallback
    for (const key of Object.keys(MERCHANT_MAP)) {
        if (cleaned.includes(key)) {
            return MERCHANT_MAP[key];
        }
    }

    return cleaned; // fallback = cleaned version
}