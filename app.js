const express = require('express');
const venom = require('venom-bot');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
const port = 3000

//upload da planilha 
const upload = multer({ dest: 'uploads/' });

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
        const {to, amount, name} = req.body
        
        const message = `Olá ${name}, você recebeu R$ ${amount} de cashback! Obrigado por comprar com a gente! 🎉`; 

        try {
            await client.sendText(to + '@c.us', message);
            res.json("mensagem enviada");
        } catch (error) {
            res.status(500).json({ error: 'Erro ao enviar a mensagem', detalhes: error.message });
        }
    })
}

app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});