document.getElementById('mensagemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const form = e.target;
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
  