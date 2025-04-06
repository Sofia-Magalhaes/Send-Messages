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
     // Endpoint para upload do Excel e envio das mensagens
     app.post('/send-excel', upload.single('file'), async (req, res) => {
        try {
            const filePath = req.file.path;
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);

            // Exemplo: [ { name: 'Sofia', to: '5512997655538', amount: 651 }, ... ]

            for (const row of data) {
                const { name, to, amount } = row;

                const message = `Olá ${name}, você recebeu R$ ${amount} de cashback! Obrigado por comprar com a gente! 🎉`;

                try {
                    await client.sendText(to + '@c.us', message);
                    console.log(`Mensagem enviada para ${name}`);
                } catch (err) {
                    console.error(`Erro ao enviar para ${name}: ${err.message}`);
                }
            }
            fs.unlinkSync(filePath); // Deleta o arquivo após o uso
            res.json({ status: 'Mensagens enviadas com sucesso!' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro no processamento do Excel', detalhes: error.message });
        }
    })

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