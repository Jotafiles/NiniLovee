// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    createFloatingHearts();
    initNavigation();
    initClock();
    initCalendar();
    initLetters();
    initMemories();
    initMessages();
    initProfile();
    loadAllData();
}

// ========== CORAZONES FLOTANTES ==========
function createFloatingHearts() {
    const container = document.getElementById('floatingHearts');
    const heartEmojis = ['💕', '💖', '💗', '💓', '💝', '💞'];
    
    setInterval(() => {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDuration = (Math.random() * 5 + 8) + 's';
        heart.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(heart);
        
        setTimeout(() => heart.remove(), 13000);
    }, 2000);
}

// ========== NAVEGACIÓN ==========
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.dataset.section;
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');
            
            if (targetSection === 'letters') loadLetters();
            if (targetSection === 'memories') loadMemories();
            if (targetSection === 'messages') loadMessages();
            if (targetSection === 'profile') loadProfile();
        });
    });
}

// ========== RELOJ ==========
function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES');
    const dateString = now.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.getElementById('clockTime').textContent = timeString;
    document.getElementById('clockDate').textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
}

// ========== CALENDARIO ==========
let currentDate = new Date();
let selectedDate = null;

function initCalendar() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('closeNoteModal').addEventListener('click', () => {
        document.getElementById('noteModal').classList.remove('active');
    });
    
    document.getElementById('saveNote').addEventListener('click', saveNote);
    document.getElementById('deleteNote').addEventListener('click', deleteNote);
    
    renderCalendar();
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    const notes = JSON.parse(localStorage.getItem('calendarNotes') || '{}');
    const today = new Date();
    
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = daysInPrevMonth - i;
        grid.appendChild(day);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const dateKey = `${year}-${month}-${day}`;
        if (notes[dateKey]) {
            dayElement.classList.add('has-note');
        }
        
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        dayElement.addEventListener('click', () => openNoteModal(year, month, day));
        grid.appendChild(dayElement);
    }
    
    const remainingDays = 42 - (firstDay + daysInMonth);
    for (let i = 1; i <= remainingDays; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i;
        grid.appendChild(day);
    }
}

function openNoteModal(year, month, day) {
    selectedDate = `${year}-${month}-${day}`;
    const notes = JSON.parse(localStorage.getItem('calendarNotes') || '{}');
    
    document.getElementById('noteModalTitle').textContent = `Nota del ${day}/${month + 1}/${year}`;
    document.getElementById('noteTextarea').value = notes[selectedDate] || '';
    document.getElementById('noteModal').classList.add('active');
}

function saveNote() {
    const notes = JSON.parse(localStorage.getItem('calendarNotes') || '{}');
    const noteText = document.getElementById('noteTextarea').value.trim();
    
    if (noteText) {
        notes[selectedDate] = noteText;
    } else {
        delete notes[selectedDate];
    }
    
    localStorage.setItem('calendarNotes', JSON.stringify(notes));
    document.getElementById('noteModal').classList.remove('active');
    renderCalendar();
}

function deleteNote() {
    const notes = JSON.parse(localStorage.getItem('calendarNotes') || '{}');
    delete notes[selectedDate];
    localStorage.setItem('calendarNotes', JSON.stringify(notes));
    document.getElementById('noteModal').classList.remove('active');
    renderCalendar();
}

// ========== CARTAS ==========
let currentLetterId = null;

function initLetters() {
    document.getElementById('newLetterBtn').addEventListener('click', () => {
        document.getElementById('letterModal').classList.add('active');
        document.getElementById('letterFrom').value = '';
        document.getElementById('letterTo').value = '';
        document.getElementById('letterMessage').value = '';
    });
    
    document.getElementById('closeLetterModal').addEventListener('click', () => {
        document.getElementById('letterModal').classList.remove('active');
    });
    
    document.getElementById('saveLetter').addEventListener('click', saveLetter);
    
    document.querySelectorAll('#letterModal .emoji-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const emoji = e.target.dataset.emoji;
            const textarea = document.getElementById('letterMessage');
            textarea.value += emoji;
        });
    });
    
    document.getElementById('closeViewLetterModal').addEventListener('click', () => {
        document.getElementById('viewLetterModal').classList.remove('active');
    });
    
    document.getElementById('deleteLetterBtn').addEventListener('click', deleteLetter);
}

function saveLetter() {
    const from = document.getElementById('letterFrom').value.trim();
    const to = document.getElementById('letterTo').value.trim();
    const message = document.getElementById('letterMessage').value.trim();
    
    if (!from || !to || !message) {
        alert('Por favor completa todos los campos 💕');
        return;
    }
    
    const letters = JSON.parse(localStorage.getItem('letters') || '[]');
    const letter = {
        id: Date.now(),
        from,
        to,
        message,
        date: new Date().toLocaleDateString('es-ES')
    };
    
    letters.unshift(letter);
    localStorage.setItem('letters', JSON.stringify(letters));
    
    document.getElementById('letterModal').classList.remove('active');
    loadLetters();
}

function loadLetters() {
    const letters = JSON.parse(localStorage.getItem('letters') || '[]');
    const container = document.getElementById('lettersContainer');
    
    if (letters.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💌</div>
                <div class="empty-state-text">No hay cartas aún. ¡Escribe la primera!</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = letters.map(letter => `
        <div class="letter-card" onclick="viewLetter(${letter.id})">
            <div class="letter-header">
                <div class="letter-from">De: ${letter.from}</div>
                <div class="letter-date">${letter.date}</div>
            </div>
            <div class="letter-preview">${letter.message}</div>
        </div>
    `).join('');
}

function viewLetter(id) {
    const letters = JSON.parse(localStorage.getItem('letters') || '[]');
    const letter = letters.find(l => l.id === id);
    
    if (!letter) return;
    
    currentLetterId = id;
    document.getElementById('viewLetterContent').innerHTML = `
        <h4>De: ${letter.from}</h4>
        <h4>Para: ${letter.to}</h4>
        <p style="margin-top: 15px; white-space: pre-wrap;">${letter.message}</p>
        <p style="margin-top: 15px; text-align: right; color: #999;">${letter.date}</p>
    `;
    
    document.getElementById('viewLetterModal').classList.add('active');
}

function deleteLetter() {
    if (!confirm('¿Estás seguro de eliminar esta carta? 💔')) return;
    
    const letters = JSON.parse(localStorage.getItem('letters') || '[]');
    const filtered = letters.filter(l => l.id !== currentLetterId);
    localStorage.setItem('letters', JSON.stringify(filtered));
    
    document.getElementById('viewLetterModal').classList.remove('active');
    loadLetters();
}

// ========== RECUERDOS ==========
let currentMemoryId = null;
let selectedMemoryEmoji = '💕';

function initMemories() {
    document.getElementById('newMemoryBtn').addEventListener('click', () => {
        document.getElementById('memoryModal').classList.add('active');
        document.getElementById('memoryTitle').value = '';
        document.getElementById('memoryDescription').value = '';
        selectedMemoryEmoji = '💕';
    });
    
    document.getElementById('closeMemoryModal').addEventListener('click', () => {
        document.getElementById('memoryModal').classList.remove('active');
    });
    
    document.getElementById('saveMemory').addEventListener('click', saveMemory);
    
    document.querySelectorAll('#memoryModal .emoji-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedMemoryEmoji = e.target.dataset.emoji;
            document.querySelectorAll('#memoryModal .emoji-btn').forEach(b => {
                b.style.background = '';
            });
            e.target.style.background = 'var(--pink-primary)';
        });
    });
    
    document.getElementById('closeViewMemoryModal').addEventListener('click', () => {
        document.getElementById('viewMemoryModal').classList.remove('active');
    });
    
    document.getElementById('deleteMemoryBtn').addEventListener('click', deleteMemory);
}

function saveMemory() {
    const title = document.getElementById('memoryTitle').value.trim();
    const description = document.getElementById('memoryDescription').value.trim();
    
    if (!title || !description) {
        alert('Por favor completa todos los campos 💕');
        return;
    }
    
    const memories = JSON.parse(localStorage.getItem('memories') || '[]');
    const memory = {
        id: Date.now(),
        title,
        description,
        emoji: selectedMemoryEmoji,
        date: new Date().toLocaleDateString('es-ES')
    };
    
    memories.unshift(memory);
    localStorage.setItem('memories', JSON.stringify(memories));
    
    document.getElementById('memoryModal').classList.remove('active');
    loadMemories();
}

function loadMemories() {
    const memories = JSON.parse(localStorage.getItem('memories') || '[]');
    const container = document.getElementById('memoriesContainer');
    
    if (memories.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">📷</div>
                <div class="empty-state-text">No hay recuerdos aún. ¡Crea el primero!</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = memories.map(memory => `
        <div class="memory-card" onclick="viewMemory(${memory.id})">
            <div class="memory-image">${memory.emoji}</div>
            <div class="memory-info">
                <div class="memory-title">${memory.title}</div>
                <div class="memory-description">${memory.description}</div>
            </div>
        </div>
    `).join('');
}

function viewMemory(id) {
    const memories = JSON.parse(localStorage.getItem('memories') || '[]');
    const memory = memories.find(m => m.id === id);
    
    if (!memory) return;
    
    currentMemoryId = id;
    document.getElementById('viewMemoryContent').innerHTML = `
        <div class="memory-view-image">${memory.emoji}</div>
        <h4>${memory.title}</h4>
        <p style="white-space: pre-wrap;">${memory.description}</p>
        <p style="margin-top: 15px; text-align: right; color: #999;">${memory.date}</p>
    `;
    
    document.getElementById('viewMemoryModal').classList.add('active');
}

function deleteMemory() {
    if (!confirm('¿Estás seguro de eliminar este recuerdo? 💔')) return;
    
    const memories = JSON.parse(localStorage.getItem('memories') || '[]');
    const filtered = memories.filter(m => m.id !== currentMemoryId);
    localStorage.setItem('memories', JSON.stringify(filtered));
    
    document.getElementById('viewMemoryModal').classList.remove('active');
    loadMemories();
}

// ========== MENSAJES ==========
let currentUser = 'user1';

function initMessages() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const newMessage = {
        id: Date.now(),
        text: message,
        sender: currentUser,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
    
    messages.push(newMessage);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    input.value = '';
    loadMessages();
    
    setTimeout(() => {
        const container = document.getElementById('chatMessages');
        container.scrollTop = container.scrollHeight;
    }, 100);
}

function loadMessages() {
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    const container = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-text">No hay mensajes aún. ¡Envía el primero!</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.sender === currentUser ? 'sent' : ''}">
            <div class="message-bubble">
                <div>${msg.text}</div>
                <div class="message-time">${msg.time}</div>
            </div>
        </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
}

// ========== PERFIL ==========
let selectedProfileEmoji = '👩‍❤️‍👨';

function initProfile() {
    document.getElementById('editProfileBtn').addEventListener('click', () => {
        const profile = JSON.parse(localStorage.getItem('profile') || '{}');
        document.getElementById('editProfileName').value = profile.name || '';
        document.getElementById('editProfileCountry').value = profile.country || '';
        selectedProfileEmoji = profile.emoji || '👩‍❤️‍👨';
        document.getElementById('profileModal').classList.add('active');
    });
    
    document.getElementById('closeProfileModal').addEventListener('click', () => {
        document.getElementById('profileModal').classList.remove('active');
    });
    
    document.getElementById('saveProfile').addEventListener('click', saveProfile);
    
    document.querySelectorAll('#profileModal .emoji-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            selectedProfileEmoji = e.target.dataset.emoji;
            document.querySelectorAll('#profileModal .emoji-btn').forEach(b => {
                b.style.background = '';
            });
            e.target.style.background = 'var(--pink-primary)';
        });
    });
}

function saveProfile() {
    const name = document.getElementById('editProfileName').value.trim();
    const country = document.getElementById('editProfileCountry').value.trim();
    
    if (!name || !country) {
        alert('Por favor completa todos los campos 💕');
        return;
    }
    
    const profile = {
        name,
        country,
        emoji: selectedProfileEmoji
    };
    
    localStorage.setItem('profile', JSON.stringify(profile));
    document.getElementById('profileModal').classList.remove('active');
    loadProfile();
}

function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('profile') || '{}');
    const memories = JSON.parse(localStorage.getItem('memories') || '[]');
    
    document.getElementById('profileName').textContent = profile.name || 'Mi Amor';
    document.getElementById('profileCountry').textContent = profile.country ? `🌍 ${profile.country}` : '🌍 País';
    document.getElementById('profilePhoto').textContent = profile.emoji || '👩‍❤️‍👨';
    
    const recentMemories = memories.slice(0, 6);
    const memoriesContainer = document.getElementById('profileMemories');
    
    if (recentMemories.length === 0) {
        memoriesContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: #999; padding: 20px;">
                No hay recuerdos aún
            </div>
        `;
        return;
    }
    
    memoriesContainer.innerHTML = recentMemories.map(memory => `
        <div class="profile-memory-thumb" onclick="viewMemory(${memory.id})">
            ${memory.emoji}
        </div>
    `).join('');
}

// ========== CARGAR DATOS ==========
function loadAllData() {
    loadLetters();
    loadMemories();
    loadMessages();
    loadProfile();
}

// ========== FUNCIONES GLOBALES ==========
window.viewLetter = viewLetter;
window.viewMemory = viewMemory;
