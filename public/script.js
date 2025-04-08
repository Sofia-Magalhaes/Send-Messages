const textarea = document.getElementById('mensagem');
const mensagemPreview = document.getElementById('mensagemExibida');
const form = document.getElementById('mensagemForm');

// Atualiza o preview da mensagem
function exibirMensagem() {
  mensagemPreview.innerText = textarea.value;
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
      window.location.href = './success.html';
    } else {
      const errorData = await response.json();
      alert(`Erro ao agendar envio: ${errorData.error || 'Erro desconhecido'}`);
    }
  } catch (err) {
    alert(`Erro de rede ou servidor: ${err.message}`);
  }
});
