const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const xlsx = require('xlsx');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const venom = require('venom-bot');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
const port = 3000;

// ✅ Servir arquivos estáticos (como index.html)
app.use(express.static('public'));

// ✅ Rota para servir a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔧 Configurar Multer para manter a extensão do arquivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = uuidv4() + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

venom
  .create({ session: 'apizap' })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  app.post(
    '/send-excel',
    upload.fields([{ name: 'file' }, { name: 'image' }, { name: 'audio' }]),
    async (req, res) => {
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
        const uploadedAudioPath = req.files['audio']?.[0]?.path; // não é obrigatório
        let imagePath = uploadedImagePath;
        let audioOutputPath = null;

        // Baixar imagem de URL se houver
        if (imageUrl) {
          try {
            const imageResponse = await axios({
              method: 'GET',
              url: imageUrl,
              responseType: 'arraybuffer',
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

        // Validação da imagem
        if (imagePath && !fs.existsSync(imagePath)) {
          return res.status(400).json({ error: 'Arquivo de imagem não encontrado.' });
        }

        const imageExt = path.extname(imagePath).toLowerCase();
        const allowedImageExtensions = ['.jpg', '.jpeg', '.png'];
        if (imagePath && !allowedImageExtensions.includes(imageExt)) {
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

              // === ÁUDIO DESATIVADO POR ENQUANTO ===
              /*
              if (uploadedAudioPath) {
                const audioExt = path.extname(uploadedAudioPath || '').toLowerCase();
                const allowedAudioExtensions = ['.mp3', '.m4a'];

                console.log('📦 Caminho do áudio:', uploadedAudioPath);
                console.log('🔍 Extensão detectada:', audioExt);

                if (!allowedAudioExtensions.includes(audioExt)) {
                  console.warn(`❌ Formato de áudio inválido: ${audioExt}`);
                } else {
                  audioOutputPath = uploadedAudioPath.replace(audioExt, '.ogg');

                  await new Promise((resolve, reject) => {
                    ffmpeg(uploadedAudioPath)
                      .audioCodec('libopus')
                      .audioBitrate('64k')
                      .format('ogg')
                      .on('end', () => {
                        console.log('✅ Áudio convertido com sucesso:', audioOutputPath);
                        resolve();
                      })
                      .on('error', (err) => {
                        console.error('❌ Erro na conversão de áudio:', err.message);
                        reject(err);
                      })
                      .save(audioOutputPath);
                  });

                  await client.sendPtt(to + '@c.us', audioOutputPath);
                }
              }
              */

              console.log(`✅ Mensagem enviada para ${name} às ${sendTime.format('HH:mm:ss')}`);
            } catch (err) {
              console.error(`❌ Erro ao enviar para ${name}:`, err);
            }
          }, delay);

          console.log(`⏳ Agendado envio para ${name} às ${sendTime.format('HH:mm:ss')}`);
        }

        // Limpeza
        setTimeout(() => {
          if (uploadedImagePath && fs.existsSync(uploadedImagePath)) fs.unlinkSync(uploadedImagePath);
          if (uploadedAudioPath && fs.existsSync(uploadedAudioPath)) fs.unlinkSync(uploadedAudioPath);
          if (audioOutputPath && fs.existsSync(audioOutputPath)) fs.unlinkSync(audioOutputPath);
          if (imageUrl && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          if (fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
          console.log('🧹 Arquivos temporários removidos.');
        }, delay + 60_000);

        res.status(200).json({ success: true, message: 'Mensagens agendadas com sucesso!' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro no processamento', detalhes: error.message });
      }
    }
  );

  // Endpoint manual
  app.post('/send-message', async (req, res) => {
    const { to, amount, name } = req.body;
    const message = `Olá ${name}, você recebeu R$ ${amount} de cashback! Obrigado por comprar com a gente! 🎉`;

    try {
      await client.sendText(to + '@c.us', message);
      res.status(200).json({ success: true, message: 'Mensagens agendadas com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao enviar a mensagem', detalhes: error.message });
    }
  });
}

app.listen(port, () => {
  console.log(`🚀 API rodando em http://localhost:${port}`);
});
