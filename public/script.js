const textarea = document.getElementById('mensagem');
const mensagemPreview = document.getElementById('mensagemExibida');
const form = document.getElementById('mensagemForm');
const fileInput = document.getElementById('file');
const avisoPreview = document.getElementById('avisoPreview');
const imageInput = document.getElementById('image');

let primeiraLinha = null; // aqui vamos guardar a 1ª linha da planilha

// Ler o Excel e pegar a primeira linha
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
      avisoPreview.style.display = 'block'; // mostra o aviso
      console.log('✅ Primeira linha:', primeiraLinha);
      exibirMensagem(); // já atualiza o preview
    }
  };

  reader.readAsArrayBuffer(file);
});

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD") // separa acentos das letras
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, " ") // remove espaços duplicados
    .trim();
}

// Atualiza o preview da mensagem com variáveis reais
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

  // Corrigido: imageFile agora é definida corretamente
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


// Atualiza visualização em tempo real
textarea.addEventListener('input', exibirMensagem);

imageInput.addEventListener('change', exibirMensagem);

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

// White/Dark Mode Toggle
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

document.getElementById('mensagemForm').addEventListener('submit', function (e) {
  const excelFileInput = document.getElementById('file');
  const imageFileInput = document.getElementById('image');

  const excelFile = excelFileInput.files[0];
  const imageFile = imageFileInput.files[0];

  // Verifica tipo de arquivo do Excel
  if (excelFile) {
    const validExcelTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
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

  // Verifica tipo de arquivo da imagem (se fornecida)
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
});


const excelInput = document.getElementById('file');
const excelFileName = document.getElementById('excelFileName');
const imageFileName = document.getElementById('imageFileName');
const imagePreview = document.getElementById('imagePreview');

// Mostrar nome do arquivo Excel
excelInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  excelFileName.textContent = file ? `📄 Selecionado: ${file.name}` : '';
});

// Mostrar nome e preview da imagem
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    imageFileName.textContent = `🖼️ Selecionado: ${file.name}`;
  } else {
    imageFileName.textContent = '';
  }
});

// Atualizar preview da mensagem também quando a imagem for alterada
imageInput.addEventListener('change', () => {
  exibirMensagem();
});

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

imageInput.addEventListener('change', () => {
  const campoLegenda = document.getElementById('campoLegenda');
  const legendaInput = document.getElementById('legendaImagem');
  const file = imageInput.files[0];

  if (file && file.type.startsWith('image/')) {
    campoLegenda.style.display = 'block';
  } else {
    campoLegenda.style.display = 'none';
    legendaInput.value = ''; // Limpa legenda se não for imagem
  }
});