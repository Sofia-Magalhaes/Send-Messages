const textarea = document.getElementById('mensagem');
const mensagemPreview = document.getElementById('mensagemExibida');
const form = document.getElementById('mensagemForm');
const fileInput = document.getElementById('file');
const imageInput = document.getElementById('image');
const avisoPreview = document.getElementById('avisoPreview');

const excelFileName = document.getElementById('excelFileName');
const imageFileName = document.getElementById('imageFileName');
const imagePreview = document.getElementById('imagePreview');

let primeiraLinha = null;

// Leitura do Excel
fileInput.addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);

    if (json.length > 0) {
      primeiraLinha = json[0];
      avisoPreview.style.display = 'block';
      console.log('✅ Primeira linha:', primeiraLinha);
      exibirMensagem();
    }
  };
  reader.readAsArrayBuffer(file);
});

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Exibir mensagem formatada no preview
function exibirMensagem() {
  let mensagem = textarea.value.trim();

  if (mensagem && !primeiraLinha) {
    Swal.fire({
      icon: 'warning',
      title: 'Excel obrigatório',
      text: 'Você precisa carregar um arquivo Excel para usar variáveis na mensagem.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3e8e41',
      background: '#1f1f1f',
      color: '#f1f1f1'
    });
    return;
  }

  if (primeiraLinha) {
    mensagem = mensagem.replace(/\[([^\]]+)\]/g, (match, key) => {
      const chaveNormalizada = normalizarTexto(key);
      for (const coluna in primeiraLinha) {
        if (normalizarTexto(coluna) === chaveNormalizada) {
          return primeiraLinha[coluna];
        }
      }
      return match;
    });
  }

  const imageFile = imageInput.files[0];

  if (imageFile && imageFile.type.startsWith('image/')) {
    const legenda = document.getElementById('legendaImagem').value.trim();
    const reader = new FileReader();

    reader.onload = function (event) {
      mensagemPreview.innerHTML = `
        <p>${mensagem.replace(/\n/g, '<br>')}</p>
        <img src="${event.target.result}" alt="Imagem da mensagem" style="max-width: 100%; margin-top: 10px; border-radius: 8px;">
        ${legenda ? `<p style="margin-top: 5px; color: #555;">${legenda}</p>` : ''}
      `;
    };
    reader.readAsDataURL(imageFile);
  } else {
    mensagemPreview.innerHTML = `<p>${mensagem.replace(/\n/g, '<br>')}</p>`;
  }
}

// Inserir variável no cursor
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

// Atualização em tempo real da mensagem
textarea.addEventListener('input', exibirMensagem);

// Mostrar nome do arquivo Excel
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  excelFileName.textContent = file ? `📄 Selecionado: ${file.name}` : '';
});

// Mostrar nome e ativar preview da imagem
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];

  imageFileName.textContent = file ? `🖼️ Selecionado: ${file.name}` : '';

  // Mostrar campo da legenda se imagem for válida
  const campoLegenda = document.getElementById('campoLegenda');
  const legendaInput = document.getElementById('legendaImagem');

  if (file && file.type.startsWith('image/')) {
    campoLegenda.style.display = 'block';
  } else {
    campoLegenda.style.display = 'none';
    legendaInput.value = '';
  }

  exibirMensagem();
});

// Tema claro/escuro
const toggleButton = document.getElementById('toggleDarkMode');
const themeIcon = document.getElementById('themeIcon');

toggleButton.addEventListener('click', () => {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeIcon.textContent = isDark ? '🌙' : '🌞';
  themeIcon.classList.add('rotate-180');
  setTimeout(() => themeIcon.classList.remove('rotate-180'), 300);
});

window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  const html = document.documentElement;
  const isDark = savedTheme === 'dark';
  html.classList.toggle('dark', isDark);
  if (isDark) themeIcon.textContent = '🌙';
});

// Validação de arquivos antes do envio
form.addEventListener('submit', async (e) => {
  const excelFile = fileInput.files[0];
  const imageFile = imageInput.files[0];

  // Verifica Excel
  if (excelFile) {
    const validExcelTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (!validExcelTypes.includes(excelFile.type)) {
      e.preventDefault();
      Swal.fire({
        icon: 'error',
        title: 'Arquivo inválido',
        text: 'Por favor, envie um arquivo Excel (.xls ou .xlsx).',
      });
      return;
    }
  }

  // Verifica imagem
  if (imageFile) {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(imageFile.type)) {
      e.preventDefault();
      Swal.fire({
        icon: 'error',
        title: 'Imagem inválida',
        text: 'Por favor, envie uma imagem válida (.jpg, .png, .gif, .webp).',
      });
      return;
    }
  }

  // Envio do formulário
  const formData = new FormData(form);
  try {
    // Para alternar entre local e produção
    const BASE_URL = window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://seu-projeto.onrender.com";

    const response = await fetch(`${BASE_URL}/send-excel`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resposta do servidor:', data);
      Swal.fire({
        icon: 'success',
        title: 'Agendamento realizado!',
        text: 'Sua mensagem foi agendada com sucesso.',
        confirmButtonText: 'Beleza!',
        confirmButtonColor: '#28a745',
        background: '#f0fff4',
        color: '#333'
      }).then(() => {
        window.location.href = './';
      });
    } else {
      const errorData = await response.json();
      Swal.fire({
        icon: 'error',
        title: 'Erro ao agendar envio',
        text: errorData.error || 'Erro desconhecido',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33'
      });
    }
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Erro de rede ou servidor',
      text: err.message,
      confirmButtonText: 'OK',
      confirmButtonColor: '#d33'
    });
  }
});
