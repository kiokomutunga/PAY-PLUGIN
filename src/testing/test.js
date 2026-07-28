import "dotenv/config";
import { initiateStkPush } from "../services/mpesaService";


async function testStkPush() {
    try {
        const result = await initiateStkPush({
            phoneNumber: "254796304943",
            amount: 1,
            accountReference: "TEST-001",
            transactionDescription: "Test payment",
        });

        console.log("STK Push successful:");
        console.log(result);
    } catch (error) {
        console.error("STK Push failed:");
        console.error(error.message);
    }
}

testStkPush();