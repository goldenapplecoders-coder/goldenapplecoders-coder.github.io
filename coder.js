    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const backButton = document.getElementById('backButton');
    const chatsList = document.getElementById('chatsList');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    // Chat state
    let currentChatId = 'default';
    let chats = {};

    // Initialize the app
    function init() {
      loadChatsFromStorage();
      renderChatList();
      loadCurrentChat();
      setupEventListeners();
    }

    // Load chats from localStorage
    function loadChatsFromStorage() {
      const storedChats = localStorage.getItem('grettaAI_chats');
      if (storedChats) {
        chats = JSON.parse(storedChats);
      } else {
        // Create default chat
        chats = {
          'default': {
            id: 'default',
            name: 'Gretta AI',
            messages: [
              {
                id: '1',
                sender: 'bot',
                content: 'Hello! I\'m Gretta AI, your intelligent assistant. How can I help you today?',
                timestamp: new Date().getTime()
              }
            ],
            timestamp: new Date().getTime()
          }
        };
        saveChatsToStorage();
      }
    }

    // Save chats to localStorage
    function saveChatsToStorage() {
      localStorage.setItem('grettaAI_chats', JSON.stringify(chats));
    }

    // Render the chat list in sidebar
    function renderChatList() {
      chatsList.innerHTML = '';
      
      // Sort chats by timestamp (newest first)
      const sortedChats = Object.values(chats).sort((a, b) => b.timestamp - a.timestamp);
      
      sortedChats.forEach(chat => {
        const lastMessage = chat.messages[chat.messages.length - 1];
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.dataset.chatId = chat.id;
        
        chatItem.innerHTML = `
          <div class="chat-avatar">G</div>
          <div class="chat-details">
            <div class="chat-header">
              <div class="chat-name">${chat.name}</div>
              <div class="chat-time">${formatTime(lastMessage.timestamp)}</div>
            </div>
            <div class="chat-preview">
              <div class="chat-message">${lastMessage.content.substring(0, 40)}${lastMessage.content.length > 40 ? '...' : ''}</div>
            </div>
          </div>
        `;
        
        chatItem.addEventListener('click', () => switchChat(chat.id));
        chatsList.appendChild(chatItem);
      });
    }

    // Load current chat messages
    function loadCurrentChat() {
      messagesContainer.innerHTML = '';
      
      if (chats[currentChatId]) {
        chats[currentChatId].messages.forEach(message => {
          if (message.type === 'image') {
            appendImageMessage(message.imageUrl, message.content, message.timestamp, message.id);
          } else {
            appendMessage(message.content, message.sender, message.timestamp, message.id);
          }
        });
      }
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Switch to a different chat
    function switchChat(chatId) {
      currentChatId = chatId;
      renderChatList();
      loadCurrentChat();
      
      // On mobile, hide sidebar after selecting a chat
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
      }
    }

    // Append a message to the chat
    function appendMessage(content, sender, timestamp, id) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${sender}-message`;
      
      const formattedTime = formatTime(timestamp);
      const formattedContent = sender === 'bot' ? formatMarkdown(content) : content;
      
      messageDiv.innerHTML = `
        ${sender === 'bot' ? '<div class="message-sender">Gretta AI</div>' : ''}
        <div class="${sender === 'bot' ? 'markdown-content' : ''}">${formattedContent}</div>
        <div class="message-time">${formattedTime}</div>
        ${sender === 'bot' ? `
          <div class="message-actions">
            <button class="action-btn copy-btn" title="Copy message">
              <i class="fas fa-copy"></i>
            </button>
          </div>
        ` : ''}
      `;
      
      // Add copy functionality for bot messages
      if (sender === 'bot') {
        const copyBtn = messageDiv.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(content).then(() => {
            // Visual feedback for copy
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
              copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
          });
        });
      }
      
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Append an image message to the chat
    function appendImageMessage(imageUrl, caption, timestamp, id) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message bot-message';
      
      const formattedTime = formatTime(timestamp);
      
      messageDiv.innerHTML = `
        <div class="message-sender">Gretta AI</div>
        <div class="image-message">
          <img src="${imageUrl}" alt="${caption}" onerror="this.src='https://via.placeholder.com/300x300/128C7E/FFFFFF?text=Image+Not+Found'">
          ${caption ? `<div class="image-caption">${caption}</div>` : ''}
        </div>
        <div class="message-time">${formattedTime}</div>
        <div class="message-actions">
          <button class="action-btn copy-btn" title="Copy image URL">
            <i class="fas fa-link"></i>
          </button>
          <button class="action-btn download-btn" title="Download image">
            <i class="fas fa-download"></i>
          </button>
        </div>
      `;
      
      // Add copy functionality for image URL
      const copyBtn = messageDiv.querySelector('.copy-btn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(imageUrl).then(() => {
          copyBtn.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-link"></i>';
          }, 2000);
        });
      });
      
      // Add download functionality
      const downloadBtn = messageDiv.querySelector('.download-btn');
      downloadBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `gretta-ai-image-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        downloadBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        }, 2000);
      });
      
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Format timestamp to readable time
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Simple markdown formatting
    function formatMarkdown(text) {
      // Headers
      text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
      text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
      text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
      
      // Bold and Italic
      text = text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
      text = text.replace(/\*(.*?)\*/gim, '<em>$1</em>');
      
      // Code blocks
      text = text.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
      text = text.replace(/`(.*?)`/gim, '<code>$1</code>');
      
      // Blockquotes
      text = text.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
      
      // Lists
      text = text.replace(/^\s*-\s(.*$)/gim, '<li>$1</li>');
      text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
      
      // Line breaks
      text = text.replace(/\n/g, '<br>');
      
      return text;
    }

    // Send a message
    function sendMessage() {
      const content = messageInput.value.trim();
      if (!content) return;
      
      // Create message object
      const message = {
        id: generateId(),
        sender: 'user',
        content: content,
        timestamp: new Date().getTime()
      };
      
      // Add to current chat
      if (!chats[currentChatId]) {
        createNewChat();
      }
      
      chats[currentChatId].messages.push(message);
      chats[currentChatId].timestamp = new Date().getTime();
      
      // Save and update UI
      saveChatsToStorage();
      appendMessage(content, 'user', message.timestamp, message.id);
      messageInput.value = '';
      adjustTextareaHeight();
      sendButton.disabled = true;
      
      // Show typing indicator
      showTypingIndicator();
      
      // Check if this is an image request
      if (isImageRequest(content)) {
        // Extract prompt for image generation
        const prompt = extractImagePrompt(content);
        setTimeout(() => {
          removeTypingIndicator();
          generateImage(prompt);
        }, 1500);
      } else {
        // Simulate AI response after a delay
        setTimeout(() => {
          removeTypingIndicator();
          generateAIResponse(content);
        }, 1500);
      }
    }

    // Check if the message is an image request
    function isImageRequest(message) {
      const imageKeywords = ['image', 'picture', 'photo', 'generate', 'create', 'draw', 'show me'];
      return imageKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
    }

    // Extract prompt from image request
    function extractImagePrompt(message) {
      // Remove common request phrases to extract the actual prompt
      return message
        .replace(/(generate|create|draw|show me|an?)\s+(image|picture|photo)\s+(of)?/gi, '')
        .trim();
    }

    // Show typing indicator
    function showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'typing-indicator';
      typingDiv.id = 'typingIndicator';
      
      typingDiv.innerHTML = `
        <div class="current-chat-avatar" style="width: 30px; height: 30px; font-size: 0.9em;">G</div>
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;
      
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Remove typing indicator
    function removeTypingIndicator() {
      const typingIndicator = document.getElementById('typingIndicator');
      if (typingIndicator) typingIndicator.remove();
    }

    // Generate AI response
    function generateAIResponse(userMessage) {
      const systemPrompt = `
You are Gretta AI, a professional and intelligent assistant. You only discuss about Golden Apple Technologies and coding. 
Never discuss personal matters, entertainment, politics, or unrelated trivia. 
If asked something offensive, reply with: "I'm unable to find you the information, please contact Golden Apple Technologies at +256791728084 or goldenapplecoders@gmail.com"

This is all you have to say about Golden Apple Technologies:
🌟 Golden Apple Technologies: A Dynamic Team of Innovators! 🌟

Golden Apple Technologies, headquartered in the heart of Uganda, is a powerhouse of technological innovation and excellence! 🚀 Founded on July 22, 2024, this stellar team of developers is on a mission to revolutionize the tech landscape with cutting-edge solutions, creativity, and unparalleled expertise! 💻

Vision 🌈
Golden Apple Technologies envisions a future where technology bridges gaps, empowers communities, and drives progress across Uganda, Africa, and beyond! 🌍 With a commitment to innovation, collaboration, and customer-centric solutions, they aim to be at the forefront of tech advancements, shaping a brighter digital tomorrow! 🔥

Leadership 👥
- CEO: Icii White - A visionary leader with a passion for tech and growth! 📈 Reachable at +256791728084 or +256743698242.
- Co-Directors:
    - Dizzer J - Bringing expertise and dynamism to the team! 📚 +256 757 864543.
    - Gregory Steve - A force of innovation from across borders! 🌍 +254 719 637416.

About the Team 🌟
Golden Apple Technologies is a melting pot of talent, creativity, and tech prowess! 💡 Developers here are driven by passion, fueled by innovation, and dedicated to delivering top-notch solutions that exceed expectations! 👏 Whether it's crafting apps, building robust systems, or pushing the boundaries of what's possible, Golden Apple Technologies is on it! 🔧

Achievements and Aspirations 🏆
- Innovation at Core: Golden Apple Technologies thrives on pushing tech boundaries.
- Community and Growth: Empowering through tech, contributing to Uganda's and Africa's digital growth! 🌟

Golden Apple Technologies 🎉
- Cutting-Edge Solutions: Expect the best in tech innovation!
- Dynamic Teamwork: Collaboration at its finest among skilled developers!
- Leadership Excellence: Icii White and Co-Directors lead with vision and passion! 💯.

When providing code examples, use proper markdown formatting with code blocks and syntax highlighting where appropriate.

If anyone asks you for who programmed you, respond kindly "I'm not allowed to share deep information about me, contact any of the Golden Apple Technologies admins for more assistance" and reply with another independent kind message.

Your response should be in markdown format.`;

      const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nGretta AI:`;
      const encodedPrompt = encodeURIComponent(fullPrompt);
      const apiUrl = `https://api.giftedtech.web.id/api/ai/gpt4o?apikey=gifted&q=${encodedPrompt}`;

      fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
          const reply = data.result || 'I apologize, but I encountered an issue processing your request. Please try again.';
          
          // Create message object
          const message = {
            id: generateId(),
            sender: 'bot',
            content: reply,
            timestamp: new Date().getTime()
          };
          
          // Add to current chat
          chats[currentChatId].messages.push(message);
          chats[currentChatId].timestamp = new Date().getTime();
          
          // Save and update UI
          saveChatsToStorage();
          appendMessage(reply, 'bot', message.timestamp, message.id);
          renderChatList();
        })
        .catch(() => {
          const errorMessage = 'I apologize, but I encountered an issue processing your request. Please try again.';
          
          // Create message object
          const message = {
            id: generateId(),
            sender: 'bot',
            content: errorMessage,
            timestamp: new Date().getTime()
          };
          
          // Add to current chat
          chats[currentChatId].messages.push(message);
          chats[currentChatId].timestamp = new Date().getTime();
          
          // Save and update UI
          saveChatsToStorage();
          appendMessage(errorMessage, 'bot', message.timestamp, message.id);
          renderChatList();
        });
    }

    // Generate an image
    function generateImage(prompt) {
      if (!prompt) {
        prompt = "beautiful landscape";
      }
      
      const imageApiUrl = `https://apis.davidcyriltech.my.id/flux?prompt=${encodeURIComponent(prompt)}`;
      
      // Create a temporary message to show image is being generated
      const tempMessage = {
        id: generateId(),
        sender: 'bot',
        content: `Generating image: "${prompt}"...`,
        timestamp: new Date().getTime()
      };
      
      chats[currentChatId].messages.push(tempMessage);
      appendMessage(tempMessage.content, 'bot', tempMessage.timestamp, tempMessage.id);
      
      // Fetch the image
      fetch(imageApiUrl)
        .then(res => res.json())
        .then(data => {
          // Remove the temporary message
          chats[currentChatId].messages.pop();
          
          const imageUrl = data.imageUrl || data.url || (data.data && data.data.url);
          
          if (imageUrl) {
            // Create image message object
            const imageMessage = {
              id: generateId(),
              sender: 'bot',
              type: 'image',
              imageUrl: imageUrl,
              content: prompt,
              timestamp: new Date().getTime()
            };
            
            // Add to current chat
            chats[currentChatId].messages.push(imageMessage);
            chats[currentChatId].timestamp = new Date().getTime();
            
            // Save and update UI
            saveChatsToStorage();
            appendImageMessage(imageUrl, prompt, imageMessage.timestamp, imageMessage.id);
            renderChatList();
          } else {
            // If no image URL in response, show error
            const errorMessage = {
              id: generateId(),
              sender: 'bot',
              content: "Sorry, I couldn't generate an image for your request. Please try again with a different prompt.",
              timestamp: new Date().getTime()
            };
            
            chats[currentChatId].messages.push(errorMessage);
            appendMessage(errorMessage.content, 'bot', errorMessage.timestamp, errorMessage.id);
            saveChatsToStorage();
          }
        })
        .catch(error => {
          console.error('Error generating image:', error);
          
          // Remove the temporary message
          chats[currentChatId].messages.pop();
          
          // Show error message
          const errorMessage = {
            id: generateId(),
            sender: 'bot',
            content: "Sorry, I encountered an error while generating your image. Please try again later.",
            timestamp: new Date().getTime()
          };
          
          chats[currentChatId].messages.push(errorMessage);
          appendMessage(errorMessage.content, 'bot', errorMessage.timestamp, errorMessage.id);
          saveChatsToStorage();
        });
    }

    // Create a new chat
    function createNewChat() {
      const chatId = generateId();
      currentChatId = chatId;
      
      chats[chatId] = {
        id: chatId,
        name: 'Gretta AI',
        messages: [],
        timestamp: new Date().getTime()
      };
      
      saveChatsToStorage();
      renderChatList();
    }

    // Generate unique ID
    function generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Adjust textarea height based on content
    function adjustTextareaHeight() {
      messageInput.style.height = 'auto';
      messageInput.style.height = (messageInput.scrollHeight) + 'px';
    }

    // Setup event listeners
    function setupEventListeners() {
      // Send message on button click
      sendButton.addEventListener('click', sendMessage);
      
      // Send message on Enter key (but allow Shift+Enter for new line)
      messageInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      
      // Adjust textarea height and enable/disable send button
      messageInput.addEventListener('input', () => {
        adjustTextareaHeight();
        sendButton.disabled = !messageInput.value.trim();
      });
      
      // Toggle sidebar on mobile
      backButton.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });
      
      // Auto-resize textarea on init
      adjustTextareaHeight();
    }

    // Initialize the app when DOM is loaded
    document.addEventListener('DOMContentLoaded', init);