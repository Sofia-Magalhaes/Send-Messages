const express = require('express');
const venom = require('venom-bot');

const app = express();
app.use(express.json());
const port = 3000

venom
    .create({
        session: 'apizap'
    })
    .then((client) => start(client)) 
    .catch((erro) =>{
        console.log(erro);
    });

function start(client){
    app.post("/send-message", async(req, res) => {
        const {to, message} = req.body
        await client.sendText(to + '@c.us', message);
        res.json("mensagem enviada")
    })
}

app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});