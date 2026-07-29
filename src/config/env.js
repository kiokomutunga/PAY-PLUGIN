import "dotenv/config";

const requiredVariables = [
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_BASE_URL",
    "MPESA_SHORTCODE",
    "MPESA_PASSKEY",
    "MPESA_CALLBACK_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
];

for (const variable of requiredVariables) {
    if (!process.env[variable]) {
        throw new Error(
            `Required environment variable ${variable} is missing`
        );
    }
}

export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 5000,

    mpesa: {
        consumerKey: process.env.MPESA_CONSUMER_KEY,
        consumerSecret: process.env.MPESA_CONSUMER_SECRET,
        baseUrl: process.env.MPESA_BASE_URL,
        shortcode: process.env.MPESA_SHORTCODE,
        passkey: process.env.MPESA_PASSKEY,
        callbackUrl: process.env.MPESA_CALLBACK_URL,
    },

    supabase: {
        url: process.env.SUPABASE_URL,
        serviceRoleKey:
            process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
};