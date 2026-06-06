// src/services/merchantService.ts

//NOTE: Simple rule-based normalization map
// const MERCHANT_MAP: Record<string, string> = {
//     "AMAZON PAY": "AMAZON",
//     "AMAZON INDIA": "AMAZON",
//     "AMZN MKTP": "AMAZON",
//     AMAZON: "AMAZON",

//     SWIGGY: "SWIGGY",
//     "SWIGGY LIMITED": "SWIGGY",

//     FLIPKART: "FLIPKART",
//     "FLIPKART INTERNET": "FLIPKART",

//     UBER: "UBER",
//     "UBER INDIA": "UBER",
// };

// // Normalize merchant name
// export function normalizeMerchantName(rawMerchant: string): string {
//     if (!rawMerchant) return "UNKNOWN";

//     const cleaned = rawMerchant
//         .toUpperCase()
//         .replace(/[^A-Z0-9 ]/g, "")
//         .trim();

//     // Direct match
//     if (MERCHANT_MAP[cleaned]) {
//         return MERCHANT_MAP[cleaned];
//     }

//     // Partial match fallback
//     for (const key of Object.keys(MERCHANT_MAP)) {
//         if (cleaned.includes(key)) {
//             return MERCHANT_MAP[key];
//         }
//     }

//     return cleaned; // fallback = cleaned version
// }

// src/services/merchantService.ts

export function normalizeMerchantName(rawMerchant: string): string {
    if (!rawMerchant) return "UNKNOWN";

    let cleaned = rawMerchant
        .toUpperCase()
        .trim();

    // Remove UPI/NEFT prefixes and transaction IDs
    // e.g. "UPI/571548185986/SWIGGY/swiggy@ybl" → "SWIGGY"
    const upiMatch = cleaned.match(/UPI\/\d+\/([^/]+)/);
    if (upiMatch) cleaned = upiMatch[1];

    const neftMatch = cleaned.match(/NEFT\/\d+\/(.+)/);
    if (neftMatch) cleaned = neftMatch[1];

    // Remove special characters except spaces
    cleaned = cleaned.replace(/[^A-Z0-9 ]/g, " ").trim();

    // Collapse multiple spaces
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    const words = cleaned.split(" ").filter(w => w.length > 1);

    // Remove trailing numeric tokens
    while (words.length > 1 && /^\d+$/.test(words[words.length - 1])) {
        words.pop();
    }

    // Take first 2 words as canonical name
    return words.slice(0, 2).join(" ") || cleaned;
}