# Send-Messages: Automação de Mensagens WhatsApp

Este projeto é uma aplicação backend desenvolvida em Node.js que permite o envio automatizado de mensagens para o WhatsApp, com suporte a planilhas Excel para envio em massa, inclusão de imagens e áudios, e agendamento de mensagens. Ideal para campanhas de marketing, notificações ou comunicação em larga escala.




## Tecnologias Utilizadas

*   **Node.js**: Ambiente de execução JavaScript server-side.
*   **Express.js**: Framework web para Node.js, utilizado para construir a API.
*   **Venom-bot**: Biblioteca para automação do WhatsApp.
*   **Multer**: Middleware para tratamento de upload de arquivos (imagens, áudios, planilhas).
*   **XLSX**: Biblioteca para leitura e escrita de arquivos Excel.
*   **Day.js**: Biblioteca leve para manipulação de datas e horas.
*   **Axios**: Cliente HTTP para fazer requisições.
*   **UUID**: Para geração de IDs únicos.
*   **CORS**: Para lidar com requisições de diferentes origens.
*   **Nodemon**: Ferramenta para monitorar alterações no código e reiniciar o servidor automaticamente.




## Funcionalidades

*   **Envio de Mensagens em Massa**: Utiliza planilhas Excel para enviar mensagens para múltiplos contatos.
*   **Agendamento de Mensagens**: Permite agendar o envio de mensagens para uma data e hora específicas.
*   **Personalização de Mensagens**: Suporte a variáveis na mensagem (ex: `[NOME]`, `[VALOR]`, `[DATA]`) que são substituídas pelos dados da planilha.
*   **Inclusão de Mídia**: Envio de mensagens com imagens (via upload ou URL) e áudios.
*   **Interface Web (Frontend)**: Uma página HTML simples (`public/index.html`) para interação com a API de envio.
*   **Monitoramento de Progresso**: Rota SSE (`/progresso`) para acompanhar o status de envio das mensagens em tempo real.
*   **Limpeza Automática**: Remove arquivos temporários (planilhas, imagens, áudios) após o processamento.




## Instalação e Execução

Para configurar e executar o projeto em seu ambiente local, siga os passos abaixo:

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/Sofia-Magalhaes/Send-Messages.git
    ```

2.  **Navegue até o diretório do projeto:**

    ```bash
    cd Send-Messages
    ```

3.  **Instale as dependências:**

    ```bash
    npm install
    ```

4.  **Instale o Nodemon globalmente (se ainda não tiver):**

    ```bash
    npm install -g nodemon
    ```

5.  **Instale o Puppeteer (necessário para o Venom-bot):**

    ```bash
    npx puppeteer browsers install chrome
    ```

6.  **Inicie o servidor:**

    ```bash
    npm run dev
    ```

    O servidor será iniciado na porta `3000` (http://localhost:3000).

7.  **Configuração do WhatsApp:**
    Ao iniciar o servidor pela primeira vez, o Venom-bot irá gerar um QR Code no terminal. Escaneie-o com seu celular para conectar sua conta do WhatsApp.




## Uso da API

O projeto expõe os seguintes endpoints:

*   **`POST /send-excel`**: Envia mensagens em massa baseadas em uma planilha Excel. Suporta upload de arquivos Excel, imagens e áudios, além de agendamento.
    *   **Parâmetros (Form Data):**
        *   `file`: Arquivo Excel contendo os dados dos contatos e variáveis.
        *   `image` (opcional): Arquivo de imagem para ser enviado com a mensagem.
        *   `audio` (opcional): Arquivo de áudio para ser enviado com a mensagem.
        *   `sendDateTime`: Data e hora para agendamento do envio (formato ISO 8601).
        *   `mensagem`: Template da mensagem com variáveis (ex: `Olá [NOME]!`).
        *   `imageUrl` (opcional): URL de uma imagem para ser baixada e enviada.
        *   `legenda` (opcional): Legenda para a imagem.
        *   `intervalValue`: Valor numérico para o intervalo entre mensagens.
        *   `intervalUnit`: Unidade do intervalo (`seconds`, `minutes`, `hours`).

*   **`POST /send-message`**: Envia uma única mensagem para um contato específico.
    *   **Parâmetros (JSON):**
        *   `to`: Número de telefone do destinatário.
        *   `amount`: Valor (exemplo de variável).
        *   `name`: Nome do destinatário (exemplo de variável).

*   **`GET /progresso`**: Endpoint SSE (Server-Sent Events) para monitorar o progresso do envio de mensagens em tempo real.




## Estrutura do Projeto

*   `app.js`: Arquivo principal do servidor Node.js, contendo a lógica da API e integração com o Venom-bot.
*   `public/`: Contém os arquivos estáticos do frontend (HTML, CSS, JavaScript).
*   `uploads/`: Diretório para armazenar temporariamente os arquivos enviados (planilhas, imagens, áudios).
*   `tokens/`: Armazena os tokens de sessão do Venom-bot.
*   `package.json`: Lista as dependências do projeto e scripts de execução.
