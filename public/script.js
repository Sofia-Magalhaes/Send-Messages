const textarea = document.getElementById('mensagem');
const mensagemPreview = document.getElementById('mensagemExibida');
const form = document.getElementById('mensagemForm');
const fileInput = document.getElementById('file');
const avisoPreview = document.getElementById('avisoPreview');

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

// Atualiza o preview da mensagem com variáveis reais
function exibirMensagem() {
  let mensagem = textarea.value;

  if (!primeiraLinha) {
    Swal.fire({
      icon: 'warning',
      title: 'Nenhum dado disponível',
      text: 'Faça o upload de um arquivo Excel válido antes de pré-visualizar a mensagem.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#3e8e41',
      background: '#1f1f1f',
      color: '#f1f1f1'
    });
    return;
  }

  // Ajuste aqui com os nomes corretos
  const nome = primeiraLinha.Nome || primeiraLinha.name || '';
  const valor = primeiraLinha.Valor || primeiraLinha.amount || '';

  mensagem = mensagem
    .replace(/\[NOME\]|\[name\]|\{name\}/gi, nome)
    .replace(/\[VALOR\]|\[amount\]|\{amount\}/gi, valor);

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
