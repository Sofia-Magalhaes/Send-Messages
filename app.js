const express = require('express');
const venom = require('venom-bot');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');



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
     app.post('/send-excel', upload.fields([{ name: 'file' }, { name: 'image' }]), async (req, res) => {
        try {
          const sendAt = req.body.sendAt;
          const imageUrl = req.body.imageUrl;
          const now = dayjs();
          const [hour, minute] = sendAt.split(':');
          let sendTime = now.hour(Number(hour)).minute(Number(minute)).second(0);
      
          if (sendTime.isBefore(now)) {
            sendTime = sendTime.add(1, 'day');
          }
      
          const delay = sendTime.diff(now, 'milliseconds');
          const excelPath = req.files['file'][0].path;
          const uploadedImagePath = req.files['image']?.[0]?.path;
          let imagePath = uploadedImagePath;
      
          // 🔽 Se veio URL, baixar a imagem
          if (imageUrl) {
            try {
              const imageResponse = await axios({
                method: 'GET',
                url: imageUrl,
                responseType: 'arraybuffer'
              });
      
              const ext = path.extname(imageUrl).split('?')[0].toLowerCase();
              const allowedExtensions = ['.jpg', '.jpeg', '.png'];
      
              if (!allowedExtensions.includes(ext)) {
                return res.status(400).json({ error: 'Formato de imagem inválido na URL.' });
              }
      
              const fileName = `image-${uuidv4()}${ext}`;
              const downloadsDir = path.join(__dirname, 'downloads');
              if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);
              imagePath = path.join(downloadsDir, fileName);
              await fs.promises.writeFile(imagePath, imageResponse.data);
              console.log('✅ Imagem baixada com sucesso:', imagePath);
            } catch (err) {
              console.error('❌ Falha ao baixar imagem da URL:', err.message);
              return res.status(400).json({ error: 'Erro ao baixar imagem da URL.' });
            }
          }
      
          // 🔽 Validação da imagem
          if (imagePath && !fs.existsSync(imagePath)) {
            return res.status(400).json({ error: 'Arquivo de imagem não encontrado.' });
          }
      
          const ext = path.extname(imagePath).toLowerCase();
          const allowedExtensions = ['.jpg', '.jpeg', '.png'];
          if (imagePath && !allowedExtensions.includes(ext)) {
            return res.status(400).json({ error: 'Formato de imagem inválido. Use .jpg, .jpeg ou .png' });
          }
      
          const workbook = xlsx.readFile(excelPath);
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = xlsx.utils.sheet_to_json(sheet);
      
          for (const row of data) {
            const { name, to, amount } = row;
            if (!name || !to || !amount) continue;
      
            const message = `Olá ${name}, você recebeu R$ ${amount} de cashback! Obrigado por comprar com a gente! 🎉`;
      
            setTimeout(async () => {
              try {
                await client.sendText(to + '@c.us', message);
                if (imagePath) {
                  const imageName = path.basename(imagePath);
                  await client.sendImage(to + '@c.us', imagePath, imageName, 'Confira sua recompensa! 🎁');
                }
                console.log(`✅ Mensagem enviada para ${name} às ${sendTime.format('HH:mm:ss')}`);
              } catch (err) {
                console.error(`❌ Erro ao enviar para ${name}:`, err);
              }
            }, delay);
      
            console.log(`⏳ Agendado envio para ${name} às ${sendTime.format('HH:mm:ss')}`);
          }
      
          // 🔁 Aguardar um tempo para não apagar a imagem antes do envio
          setTimeout(() => {
            if (uploadedImagePath && fs.existsSync(uploadedImagePath)) fs.unlinkSync(uploadedImagePath);
            if (imageUrl && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            if (fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
            console.log('🧹 Arquivos temporários removidos.');
          }, delay + 60_000); // 60 segundos depois do envio
      
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