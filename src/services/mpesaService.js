
const consumerKey = process.env.MPESA_CONSUMER_KEY
const consumerSecret = process.env.MPESA_CONSUMER_SECRET
const mpesaBaseUrl = process.env.MPESA_BASE_URL

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

