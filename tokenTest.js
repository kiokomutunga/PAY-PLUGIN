import "dotenv/config";
import { getMpesaAccessToken } from "./src/services/mpesaService.js";

try {
    const token = await getMpesaAccessToken();

    console.log("Access token received.");
    console.log("Token length:", token.length);
} catch (error) {
    console.error("Token request failed:", error.message);
}