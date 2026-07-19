import express from "express";

const app = express();

app.use(express.json());

app.get ("/", (response,request)=>{
    response.json(
        {
            success: true,
            message: "Pay App"
        }
    )




})

export default app;