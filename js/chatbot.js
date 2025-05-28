document.addEventListener('DOMContentLoaded', () => {
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotWindow = document.getElementById('chatbotWindow');
  const chatbotClose = document.getElementById('chatbotClose');
  const chatbotForm = document.getElementById('chatbotForm');
  const chatbotMessages = document.getElementById('chatbotMessages');
  const chatbotInput = document.getElementById('chatbotInput');

  chatbotToggle.addEventListener('click', () => {
    chatbotWindow.classList.toggle('hidden');
  });

  chatbotClose.addEventListener('click', () => {
    chatbotWindow.classList.add('hidden');
  });

  chatbotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = chatbotInput.value.trim();
    if (!userMessage) return;

    appendMessage('You', userMessage);
    chatbotInput.value = '';
    chatbotInput.disabled = true;

    appendMessage('AI', 'Typing...');

    // Simulate AI response after delay for demo
    setTimeout(() => {
      // Remove the 'Typing...' message
      const typingMessage = [...chatbotMessages.children].find(msg => msg.textContent === 'Typing...');
      if (typingMessage) chatbotMessages.removeChild(typingMessage);

      // Example response (replace this with real API call)
      appendMessage('AI', `You said: "${userMessage}"`);
      chatbotInput.disabled = false;
      chatbotInput.focus();
    }, 1500);
  });

  function appendMessage(sender, text) {
    const message = document.createElement('div');
    message.classList.add('chat-message');
    message.innerHTML = `<strong class="text-orange-400">${sender}:</strong> <span>${text}</span>`;
    chatbotMessages.appendChild(message);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }
});
