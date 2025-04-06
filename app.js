const express = require('express');
const venom = require('venom-bot');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');


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
            const sendAt = req.body.sendAt; // ex: "19:27"
            if (!sendAt) {
              return res.status(400).json({ error: 'Campo "sendAt" obrigatório no formato HH:mm' });
            }
        
            const now = dayjs();
            const [hour, minute] = sendAt.split(':');
            let sendTime = now.hour(Number(hour)).minute(Number(minute)).second(0);
        
            // Se a hora já passou hoje, agenda pra amanhã
            if (sendTime.isBefore(now)) {
              sendTime = sendTime.add(1, 'day');
            }
        
            const delay = sendTime.diff(now, 'milliseconds');
        
            const filePath = req.file.path;
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = xlsx.utils.sheet_to_json(sheet);
        
            for (const row of data) {
              const { name, to, amount } = row;
        
              if (!name || !to || !amount) continue;
        
              const message = `Olá ${name}, você recebeu R$ ${amount} de cashback! Obrigado por comprar com a gente! 🎉`;
        
              setTimeout(async () => {
                try {
                  await client.sendText(to + '@c.us', message);
                  console.log(`Mensagem enviada para ${name} às ${sendTime.format('HH:mm:ss')}`);
                } catch (err) {
                  console.error(`Erro ao enviar para ${name}: ${err.message}`);
                }
              }, delay);
        
              console.log(`Agendado envio para ${name} às ${sendTime.format('HH:mm:ss')}`);
            }
        
            fs.unlinkSync(filePath);
            res.json({ status: 'Mensagens agendadas com sucesso!' });
        
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro no processamento', detalhes: error.message });
          }
    })

    // mandar mensagem manual
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