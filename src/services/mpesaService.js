
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

