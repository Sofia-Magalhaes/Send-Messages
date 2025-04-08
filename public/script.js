const textarea = document.getElementById('mensagem');
const mensagemPreview = document.getElementById('mensagemExibida');
const form = document.getElementById('mensagemForm');
const fileInput = document.getElementById('file');

let primeiraLinha = null; // aqui vamos guardar a 1ª linha da planilha

// Ler o Excel e pegar a primeira linha
fileInput.addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    //Função para mostrar que a pre-visualização só é mostrada via quando carregar o arquivo
    document.getElementById('avisoPreview').style.display = 'block';
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);

    if (json.length > 0) {
      primeiraLinha = json[0];
      console.log('✅ Primeira linha:', primeiraLinha);
      exibirMensagem(); // já atualiza o preview
    }
  };

  reader.readAsArrayBuffer(file);
});

// Atualiza o preview da mensagem com variáveis reais
function exibirMensagem() {
  let mensagem = textarea.value;

  if (primeiraLinha) {
    mensagem = mensagem
      .replace(/\[NOME\]|\[name\]|\{name\}/gi, primeiraLinha.name || '')
      .replace(/\[VALOR\]|\[amount\]|\{amount\}/gi, primeiraLinha.amount || '');
  }

  mensagemPreview.innerText = mensagem;
}

// Insere variável onde o cursor estiver
function inserirVariavel(variavel) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  const before = text.substring(0, start);
  const after = text.substring(end);

  textarea.value = before + variavel + after;
  textarea.selectionStart = textarea.selectionEnd = start + variavel.length;
  textarea.focus();

  exibirMensagem();
}

// Atualiza visualização em tempo real
textarea.addEventListener('input', exibirMensagem);

// Intercepta o envio do formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  try {
    const response = await fetch('http://localhost:3000/send-excel', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resposta do servidor:', data);
      window.location.href = './';
    } else {
      const errorData = await response.json();
      alert(`Erro ao agendar envio: ${errorData.error || 'Erro desconhecido'}`);
    }
  } catch (err) {
    alert(`Erro de rede ou servidor: ${err.message}`);
  }
});


