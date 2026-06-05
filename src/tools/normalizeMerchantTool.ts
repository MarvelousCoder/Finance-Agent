import { z } from "zod";
import { normalizeMerchantName } from "../services/merchantService";

//INFO: Input schema
export const normalizeMerchantSchema = z.object({
    merchant: z.string(),
});

//INFO: Tool function
export async function normalizeMerchantTool(
    input: z.infer<typeof normalizeMerchantSchema>
) {
    const { merchant } = input;

    const normalized = normalizeMerchantName(merchant);

    return {
        original: merchant,
        normalized,
    };
}