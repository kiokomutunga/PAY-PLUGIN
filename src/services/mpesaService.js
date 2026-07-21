
const consumerKey = process.env.MPESA_CONSUMER_KEY
const consumerSecret = process.env.MPESA_CONSUMER_SECRET
const mpesaBaseUrl = process.env.MPESA_BASE_URL
const mpesaShortcode = process.env.MPESA_SHORTCODE
const mpesaPasskey = process.env.MPESA_PASSKEY

if (!consumerKey) {
    throw new Error ("wrong consumer key")
}

if (!consumerSecret){
    throw new Error ("confirm the consumer secret key ")
}

if (!mpesaBaseUrl){
    throw new Error ("confirm mpesa base url")
}

export async function getMpesaAccessToken (){
    const credentials = `${consumerKey}:${consumerSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString("base64"); //Buffer.from() converts the text into data Node can encode.


    const response = await fetch(
        `${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {

            method: "GET",
            headers: {
            Authorization: `Basic ${encodedCredentials}`,
            },
         }
  
  
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error(
        data.errorMessage ||
        data.error_description ||
        "Failed to retrieve M-Pesa access token"
        );
    }

    if (!data.access_token) {
        throw new Error("Safaricom response did not contain an access token");
    }
    return data.access_token;
}
//generate timestamp
function generateTimestamp(){
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1 ).padStart (2, "0");
    const day = String (now.getDate()).padStart (2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hour}${minute}${second}`;
}

function generateMpesaPassword (timestamp){
    const passwordString = `${mpesaShortcode}${mpesaPasskey}${timestamp}`;//required password format by daraja
    const encodedPassword = Buffer.from(passwordString).toString("base64");

    return encodedPassword;
}

function formatPhoneNumber(phoneNumber) {
    const cleanedPhone = String(phoneNumber)
        .replace(/\D/g, "");

    if (
        cleanedPhone.startsWith("254") &&
        cleanedPhone.length === 12
    ) {
        return cleanedPhone;
    }
    if (
        cleanedPhone.startsWith("0") &&
        cleanedPhone.length === 10
    ) {
        return `254${cleanedPhone.slice(1)}`;
    }
    if (
        cleanedPhone.startsWith("7") &&
        cleanedPhone.length === 9
    ) {
        return `254${cleanedPhone}`;
    }
    if (
        cleanedPhone.startsWith("1") &&
        cleanedPhone.length === 9
    ) {
        return `254${cleanedPhone}`;
    }
    throw new Error("Invalid Kenyan phone number.");
}

console.log(formatPhoneNumber("0712345678"));
console.log(formatPhoneNumber("712345678"));
console.log(formatPhoneNumber("+254712345678"));
console.log(formatPhoneNumber("0112345678"));