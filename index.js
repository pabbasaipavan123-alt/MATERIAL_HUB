const express=require("express");
const app =express();
const port = 8080;

app.listen(port, ()=>{console.log("listening on port",port);});



app.use((req,res)=>{
    res.send("hi this is my project");
});