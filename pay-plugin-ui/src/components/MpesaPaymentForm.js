import {useState } from "react";
import { initiateMpesaPayment } from "../services/mpesaApi";

export default function MpesaPaymentForm (){
    const [phoneNumber, setPhoneNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState ("IDLE");
    const [message, setMessage] = useState("");
    const [transaction, setTransaction] = useState(null);

    async function handleSubmit (event) {

        event.preventDefault ();

        setStatus("LOADING");
        setMessage("");
        setTransaction(null);

        const idempotencyKey = crypto.randomUUID();

        try{
            const result = await initiateMpesaPayment({
                phoneNumber,
                amount: Number(amount),
                accountReference: `TEST-${Date.now()}`,
                transactionDescription: "Frontend test payment",
                idempotencyKey,

            })


            const returnedTransaction = result.transaction || result.data?.transaction;

            setTransaction(returnedTransaction);

            setStatus( result.transactionStatus || returnedTransaction?.transaction_status || "PENDING");

            setMessage(result.message);
 

        }catch(error){

            setStatus("ERROR");
            setMessage(error.message)

}
}

    return (
        <form onSubmit={handleSubmit}>
            <h2> Mpesa Stk Push API</h2>

            <label htmlFor="phoneNumber"> Mpesa Phone Number</label>
            <input id="phonenumber" type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} 
            placeholder = "0712345678" required
            />

            <label htmlFor="amount">
                Amount
            </label>
            <input
                id="amount"
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)} required
            />

            <button
                type="submit" disabled = { status === "LOADING"} >
                    { status === "LOADING" ? "sending request..." : "pay with Mpesa"}

                </button>

                {message && <p>{message}</p>}

            {transaction && (
                <p>
                    Status:{" "}
                    {transaction.transaction_status}
                </p>
            )}
            
            

        </form>
    )
}