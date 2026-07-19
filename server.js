import express from "express";

const port = 5000;

const app = express();

app.get("/", (request, response)=> {

    response.send(" Payroll app")
});

app.listen(port, ()=>{
    console.log( `app running on port http://localhost:&{port`);

});