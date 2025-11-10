// ========== VARIABLES GLOBALES ==========
let currentUser = null;
let currentUserId = null;
let userProfile = null;
let partnerProfile = null;
let messageSubscription = null;
let lettersSubscription = null;
let memoriesSubscription = null;
let calendarSubscription = null;

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuthAndInit();
});

async function checkAuthAndInit() {
    const session = await getSession();
    
    if (!session) {
        window.location.href = 'auth-simple.html';
        return;
    }
    
    currentUser = session.user;
    currentUserId = session.user.id;
    
    console.log('🔐 Usuario autenticado:', {
        id: currentUserId,
        email: currentUser.email,
        name: currentUser.user_metadata?.name
    });
    
    initApp();
}

async function initApp() {
    createFloatingHearts();
    initNavigation();
    initClock();
    
    // Cargar perfil PRIMERO antes de todo
    await loadProfile();
    
    initCalendar();
    initLetters();
    initMemories();
    initMessages();
    initProfile();
    initLogout();
    loadAllData();
}

// ========== LOGOUT ==========
function initLogout() {
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (confirm('¿Estás seguro de cerrar sesión? 💔')) {
            const result = await signOut();
            if (result.success) {
                // Limpiar usuario guardado
                localStorage.removeItem('selectedUser');
                window.location.href = 'auth-simple.html';
            }
        }
    });
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
let calendarNotesCache = {};

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
    
    loadCalendarNotes();
    
    // Suscribirse a notas del calendario en tiempo real
    calendarSubscription = subscribeToCalendarNotes((payload) => {
        console.log('📅 Cambio en calendario en tiempo real:', payload);
        loadCalendarNotes();
    });
}

async function loadCalendarNotes() {
    const result = await getCalendarNotes(currentUserId);
    if (result.success) {
        calendarNotesCache = {};
        result.data.forEach(note => {
            calendarNotesCache[note.date_key] = note.note;
        });
        renderCalendar();
    }
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
        
        // Determinar de quién es el turno (días impares = Jota, días pares = Nini)
        const isJotaTurn = day % 2 !== 0;
        const turnName = isJotaTurn ? 'Jota' : 'Nini';
        const turnEmoji = isJotaTurn ? '👨' : '👩';
        
        // Crear contenido del día con número y turno
        dayElement.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
                <div style="font-size: 12px; font-weight: 600; line-height: 1;">${day}</div>
                <div style="font-size: 9px; opacity: 0.7; line-height: 1; margin-top: 2px;">${turnEmoji}</div>
            </div>
        `;
        
        const dateKey = `${year}-${month}-${day}`;
        if (calendarNotesCache[dateKey]) {
            dayElement.classList.add('has-note');
        }
        
        // Verificar si es el día de hoy
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        if (isToday) {
            dayElement.classList.add('today');
        }
        
        // Verificar si es un día futuro
        const currentDayDate = new Date(year, month, day);
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isFuture = currentDayDate > todayDate;
        
        if (isFuture) {
            // Día futuro - deshabilitar
            dayElement.classList.add('future-day');
            dayElement.style.cursor = 'not-allowed';
            dayElement.style.opacity = '0.4';
        } else {
            // Día pasado o actual - permitir clic
            dayElement.addEventListener('click', () => openNoteModal(year, month, day, turnName));
        }
        
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

function openNoteModal(year, month, day, turnName) {
    selectedDate = `${year}-${month}-${day}`;
    
    const turnEmoji = turnName === 'Jota' ? '👨' : '👩';
    document.getElementById('noteModalTitle').textContent = `Nota del ${day}/${month + 1}/${year} - Turno de ${turnEmoji} ${turnName}`;
    document.getElementById('noteTextarea').value = calendarNotesCache[selectedDate] || '';
    document.getElementById('noteModal').classList.add('active');
}

async function saveNote() {
    const noteText = document.getElementById('noteTextarea').value.trim();
    
    if (noteText) {
        const result = await saveCalendarNote(currentUserId, selectedDate, noteText);
        if (result.success) {
            calendarNotesCache[selectedDate] = noteText;
        }
    } else {
        await deleteCalendarNote(currentUserId, selectedDate);
        delete calendarNotesCache[selectedDate];
    }
    
    document.getElementById('noteModal').classList.remove('active');
    renderCalendar();
}

async function deleteNote() {
    await deleteCalendarNote(currentUserId, selectedDate);
    delete calendarNotesCache[selectedDate];
    document.getElementById('noteModal').classList.remove('active');
    renderCalendar();
}

// ========== CARTAS ==========
let currentLetterId = null;
let lettersCache = [];

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
    
    // Suscribirse a cartas en tiempo real
    lettersSubscription = subscribeToLetters((payload) => {
        console.log('💌 Cambio en cartas en tiempo real:', payload);
        // Solo recargar si estamos en la sección de cartas
        const lettersSection = document.getElementById('letters');
        if (lettersSection && lettersSection.classList.contains('active')) {
            loadLetters();
        }
    });
}

async function saveLetter() {
    const from = document.getElementById('letterFrom').value.trim();
    const to = document.getElementById('letterTo').value.trim();
    const message = document.getElementById('letterMessage').value.trim();
    
    if (!from || !to || !message) {
        alert('Por favor completa todos los campos 💕');
        return;
    }
    
    const result = await createLetter(currentUserId, { from, to, message });
    
    if (result.success) {
        document.getElementById('letterModal').classList.remove('active');
        loadLetters();
    } else {
        alert('Error al guardar la carta. Intenta de nuevo.');
    }
}

async function loadLetters() {
    const result = await getLetters(currentUserId);
    const container = document.getElementById('lettersContainer');
    
    if (!result.success || result.data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💌</div>
                <div class="empty-state-text">No hay cartas aún. ¡Escribe la primera!</div>
            </div>
        `;
        return;
    }
    
    lettersCache = result.data;
    
    container.innerHTML = result.data.map(letter => `
        <div class="letter-card" onclick="viewLetter('${letter.id}')">
            <div class="letter-header">
                <div class="letter-from">De: ${letter.from_name}</div>
                <div class="letter-date">${new Date(letter.created_at).toLocaleDateString('es-ES')}</div>
            </div>
            <div class="letter-preview">${letter.message}</div>
        </div>
    `).join('');
}

function viewLetter(id) {
    const letter = lettersCache.find(l => l.id === id);
    
    if (!letter) return;
    
    currentLetterId = id;
    document.getElementById('viewLetterContent').innerHTML = `
        <h4>De: ${letter.from_name}</h4>
        <h4>Para: ${letter.to_name}</h4>
        <p style="margin-top: 15px; white-space: pre-wrap;">${letter.message}</p>
        <p style="margin-top: 15px; text-align: right; color: #999;">${new Date(letter.created_at).toLocaleDateString('es-ES')}</p>
    `;
    
    document.getElementById('viewLetterModal').classList.add('active');
}

async function deleteLetter() {
    if (!confirm('¿Estás seguro de eliminar esta carta? 💔')) return;
    
    const result = await deleteLetter(currentLetterId);
    
    if (result.success) {
        document.getElementById('viewLetterModal').classList.remove('active');
        loadLetters();
    }
}

// ========== RECUERDOS ==========
let currentMemoryId = null;
let selectedMemoryEmoji = '💕';
let memoriesCache = [];

function initMemories() {
    document.getElementById('newMemoryBtn').addEventListener('click', () => {
        document.getElementById('memoryModal').classList.add('active');
        document.getElementById('memoryTitle').value = '';
        document.getElementById('memoryDescription').value = '';
        document.getElementById('memoryPhotoInput').value = '';
        document.getElementById('memoryPhotoPreview').style.display = 'none';
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
    
    // Preview de foto de recuerdo
    document.getElementById('memoryPhotoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('memoryPhotoPreviewImg').src = e.target.result;
                document.getElementById('memoryPhotoPreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Suscribirse a recuerdos en tiempo real
    memoriesSubscription = subscribeToMemories((payload) => {
        console.log('📷 Cambio en recuerdos en tiempo real:', payload);
        // Solo recargar si estamos en la sección de recuerdos
        const memoriesSection = document.getElementById('memories');
        if (memoriesSection && memoriesSection.classList.contains('active')) {
            loadMemories();
        }
    });
}

async function saveMemory() {
    const title = document.getElementById('memoryTitle').value.trim();
    const description = document.getElementById('memoryDescription').value.trim();
    
    if (!title || !description) {
        alert('Por favor completa todos los campos 💕');
        return;
    }
    
    const memoryData = { title, description, emoji: selectedMemoryEmoji };
    
    // Subir foto si se seleccionó una
    const photoInput = document.getElementById('memoryPhotoInput');
    if (photoInput.files && photoInput.files[0]) {
        const uploadResult = await uploadImage(photoInput.files[0], 'memories');
        if (uploadResult.success) {
            memoryData.image_url = uploadResult.url;
        } else {
            alert('Error al subir la foto. Intenta de nuevo.');
            return;
        }
    }
    
    const result = await createMemory(currentUserId, memoryData);
    
    if (result.success) {
        document.getElementById('memoryModal').classList.remove('active');
        loadMemories();
    } else {
        alert('Error al guardar el recuerdo. Intenta de nuevo.');
    }
}

async function loadMemories() {
    const result = await getMemories(currentUserId);
    const container = document.getElementById('memoriesContainer');
    
    if (!result.success || result.data.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">📷</div>
                <div class="empty-state-text">No hay recuerdos aún. ¡Crea el primero!</div>
            </div>
        `;
        return;
    }
    
    memoriesCache = result.data;
    
    container.innerHTML = result.data.map(memory => `
        <div class="memory-card" onclick="viewMemory('${memory.id}')">
            <div class="memory-image">${memory.image_url ? `<img src="${memory.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` : memory.emoji}</div>
            <div class="memory-info">
                <div class="memory-title">${memory.title}</div>
                <div class="memory-description">${memory.description}</div>
            </div>
        </div>
    `).join('');
}

function viewMemory(id) {
    const memory = memoriesCache.find(m => m.id === id);
    
    if (!memory) return;
    
    currentMemoryId = id;
    document.getElementById('viewMemoryContent').innerHTML = `
        <div class="memory-view-image">${memory.image_url ? `<img src="${memory.image_url}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px;">` : memory.emoji}</div>
        <h4>${memory.title}</h4>
        <p style="white-space: pre-wrap;">${memory.description}</p>
        <p style="margin-top: 15px; text-align: right; color: #999;">${new Date(memory.created_at).toLocaleDateString('es-ES')}</p>
    `;
    
    document.getElementById('viewMemoryModal').classList.add('active');
}

async function deleteMemory() {
    if (!confirm('¿Estás seguro de eliminar este recuerdo? 💔')) return;
    
    const result = await deleteMemory(currentMemoryId);
    
    if (result.success) {
        document.getElementById('viewMemoryModal').classList.remove('active');
        loadMemories();
    }
}

// ========== MENSAJES ==========
let messagesCache = [];
let selectedChatImage = null;

function initMessages() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const attachBtn = document.getElementById('attachBtn');
    const chatImageInput = document.getElementById('chatImageInput');
    const removeChatImageBtn = document.getElementById('removeChatImage');
    
    sendBtn.addEventListener('click', sendMessageHandler);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessageHandler();
    });
    
    // Botón para adjuntar imagen
    attachBtn.addEventListener('click', () => {
        chatImageInput.click();
    });
    
    // Preview de imagen del chat
    chatImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedChatImage = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('chatImagePreviewImg').src = e.target.result;
                document.getElementById('chatImagePreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Quitar imagen
    removeChatImageBtn.addEventListener('click', () => {
        selectedChatImage = null;
        chatImageInput.value = '';
        document.getElementById('chatImagePreview').style.display = 'none';
    });
    
    // Suscribirse a mensajes en tiempo real
    messageSubscription = subscribeToMessages(currentUserId, (payload) => {
        console.log('💬 Nuevo mensaje en tiempo real:', payload);
        loadMessages();
    });
}

async function sendMessageHandler() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    // Debe haber mensaje o imagen
    if (!message && !selectedChatImage) return;
    
    // Asegurarse de que el perfil esté cargado
    if (!userProfile) {
        console.log('⚠️ Perfil no cargado, cargando...');
        await loadProfile();
    }
    
    // Obtener el nombre del usuario actual
    const senderName = userProfile ? userProfile.name : 'Usuario';
    
    console.log('📤 Enviando mensaje como:', senderName, 'User ID:', currentUserId);
    
    let imageUrl = null;
    
    // Subir imagen si hay una seleccionada
    if (selectedChatImage) {
        const uploadResult = await uploadImage(selectedChatImage, 'chat');
        if (uploadResult.success) {
            imageUrl = uploadResult.url;
        } else {
            alert('Error al subir la imagen. Intenta de nuevo.');
            return;
        }
    }
    
    const result = await sendMessage(currentUserId, null, message, senderName, imageUrl);
    
    if (result.success) {
        input.value = '';
        selectedChatImage = null;
        document.getElementById('chatImageInput').value = '';
        document.getElementById('chatImagePreview').style.display = 'none';
        
        // NO recargar mensajes aquí, dejar que el tiempo real lo haga
        // loadMessages();
        
        setTimeout(() => {
            const container = document.getElementById('chatMessages');
            container.scrollTop = container.scrollHeight;
        }, 100);
    }
}

async function loadMessages() {
    // Asegurarse de que los perfiles estén cargados
    if (!userProfile) {
        console.log('⚠️ Perfil de usuario no cargado, cargando...');
        await loadProfile();
    }
    
    if (!partnerProfile) {
        console.log('⚠️ Perfil de pareja no cargado, cargando...');
        await loadPartnerProfile();
    }
    
    const result = await getMessages(currentUserId, null);
    const container = document.getElementById('chatMessages');
    
    if (!result.success || result.data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-text">No hay mensajes aún. ¡Envía el primero!</div>
            </div>
        `;
        return;
    }
    
    messagesCache = result.data;
    
    // Obtener nombre del usuario actual
    const currentUserName = userProfile ? userProfile.name : 'Usuario';
    
    console.log('💬 Renderizando mensajes...');
    console.log('   - Usuario actual:', currentUserName);
    console.log('   - Perfil pareja:', partnerProfile ? partnerProfile.name : 'No cargado');
    
    container.innerHTML = result.data.map(msg => {
        const isSent = msg.sender_name === currentUserName;
        const profile = isSent ? userProfile : partnerProfile;
        
        console.log(`   - Mensaje de "${msg.sender_name}": ${isSent ? 'Enviado' : 'Recibido'}`);
        
        // Generar HTML de la foto de perfil
        let profilePhotoHTML = '';
        if (profile) {
            if (profile.profile_photo_url) {
                profilePhotoHTML = `<img src="${profile.profile_photo_url}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                profilePhotoHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 20px;">${profile.profile_emoji || '👤'}</div>`;
            }
        } else {
            // Si no hay perfil, mostrar un emoji por defecto
            profilePhotoHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 20px;">👤</div>`;
        }
        
        return `
            <div class="message ${isSent ? 'sent' : ''}">
                ${!isSent ? `<div class="message-avatar">${profilePhotoHTML}</div>` : ''}
                <div class="message-bubble">
                    ${msg.image_url ? `<img src="${msg.image_url}" style="max-width: 200px; max-height: 200px; border-radius: 10px; margin-bottom: 5px; display: block;">` : ''}
                    ${msg.text ? `<div>${msg.text}</div>` : ''}
                    <div class="message-time">${new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                ${isSent ? `<div class="message-avatar">${profilePhotoHTML}</div>` : ''}
            </div>
        `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

// ========== PERFIL ==========
let selectedProfileEmoji = '👩‍❤️‍👨';

function initProfile() {
    document.getElementById('editProfileBtn').addEventListener('click', async () => {
        // Cargar el perfil del usuario actual (no de la pareja)
        if (userProfile) {
            document.getElementById('editProfileName').value = userProfile.name || '';
            document.getElementById('editProfileCountry').value = userProfile.country || '';
            selectedProfileEmoji = userProfile.profile_emoji || '👩‍❤️‍👨';
            
            // Mostrar foto de perfil actual si existe
            if (userProfile.profile_photo_url) {
                document.getElementById('profilePhotoPreviewImg').src = userProfile.profile_photo_url;
                document.getElementById('profilePhotoPreview').style.display = 'block';
            }
            
            document.getElementById('profileModal').classList.add('active');
        }
    });
    
    document.getElementById('closeProfileModal').addEventListener('click', () => {
        document.getElementById('profileModal').classList.remove('active');
    });
    
    document.getElementById('saveProfile').addEventListener('click', saveProfile);
    
    // Preview de foto de perfil
    document.getElementById('profilePhotoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('profilePhotoPreviewImg').src = e.target.result;
                document.getElementById('profilePhotoPreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
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

async function saveProfile() {
    const name = document.getElementById('editProfileName').value.trim();
    const country = document.getElementById('editProfileCountry').value.trim();
    
    if (!name || !country) {
        alert('Por favor completa todos los campos 💕');
        return;
    }
    
    const profileData = {
        name,
        country,
        profile_emoji: selectedProfileEmoji
    };
    
    // Subir foto de perfil si se seleccionó una
    const photoInput = document.getElementById('profilePhotoInput');
    if (photoInput.files && photoInput.files[0]) {
        const uploadResult = await uploadImage(photoInput.files[0], 'profiles');
        if (uploadResult.success) {
            profileData.profile_photo_url = uploadResult.url;
        } else {
            alert('Error al subir la foto. Intenta de nuevo.');
            return;
        }
    }
    
    const result = await updateUserProfile(currentUserId, profileData);
    
    if (result.success) {
        document.getElementById('profileModal').classList.remove('active');
        loadProfile();
    } else {
        alert('Error al guardar el perfil. Intenta de nuevo.');
    }
}

async function loadProfile() {
    console.log('🔍 Cargando perfil para usuario:', currentUserId);
    
    // Verificar que los elementos existen
    const myProfileNameEl = document.getElementById('myProfileName');
    const myProfileCountryEl = document.getElementById('myProfileCountry');
    const myProfilePhotoEl = document.getElementById('myProfilePhoto');
    
    if (!myProfileNameEl || !myProfileCountryEl || !myProfilePhotoEl) {
        console.error('❌ Elementos del perfil no encontrados en el DOM');
        return;
    }
    
    const profileResult = await getUserProfile(currentUserId);
    
    if (profileResult.success) {
        userProfile = profileResult.data;
        console.log('✅ Perfil del usuario actual cargado:', userProfile);
        
        // Mostrar MI PERFIL (usuario actual)
        myProfileNameEl.textContent = userProfile.name || 'Mi Nombre';
        myProfileCountryEl.textContent = userProfile.country ? `🌍 ${userProfile.country}` : '🌍 País';
        
        // Mostrar mi foto de perfil
        if (userProfile.profile_photo_url) {
            myProfilePhotoEl.innerHTML = `<img src="${userProfile.profile_photo_url}" alt="Mi foto" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            myProfilePhotoEl.textContent = userProfile.profile_emoji || '👤';
        }
        
        console.log('✅ Mi perfil mostrado en la UI');
        
        // Hacer clickeable mi perfil
        const myProfileCard = document.getElementById('myProfileCard');
        if (myProfileCard) {
            myProfileCard.onclick = () => viewMyProfile();
        }

        // Cargar perfil de la pareja (el otro usuario)
        console.log('🔍 Cargando perfil de la pareja...');
        await loadPartnerProfile();    
        
        // Mostrar perfil de la PAREJA en la tarjeta grande también
        if (partnerProfile) {
            console.log('✅ Perfil de pareja encontrado:', partnerProfile);
            
            const partnerTitleEl = document.getElementById('partnerProfileTitle');
            const profileNameEl = document.getElementById('profileName');
            const profileCountryEl = document.getElementById('profileCountry');
            const profilePhotoEl = document.getElementById('profilePhoto');
            
            if (!partnerTitleEl || !profileNameEl || !profileCountryEl || !profilePhotoEl) {
                console.error('❌ Elementos del perfil de pareja no encontrados en el DOM');
                return;
            }
            
            // Actualizar título con el nombre de la pareja
            partnerTitleEl.textContent = `💑 Perfil de ${partnerProfile.name || 'Mi Amor'}`;
            profileNameEl.textContent = partnerProfile.name || 'Mi Amor';
            profileCountryEl.textContent = partnerProfile.country ? `🌍 ${partnerProfile.country}` : '🌍 País';

            // Mostrar foto de perfil de la pareja
            if (partnerProfile.profile_photo_url) {
                profilePhotoEl.innerHTML = `<img src="${partnerProfile.profile_photo_url}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                profilePhotoEl.textContent = partnerProfile.profile_emoji || '👩‍❤️‍👨';
            }
            
            console.log('✅ Perfil de pareja mostrado en la UI');
            
            // Hacer clickeable el perfil de la pareja
            const partnerProfileCard = document.getElementById('partnerProfileCard');
            if (partnerProfileCard) {
                partnerProfileCard.onclick = () => viewPartnerProfile();
            }
        } else {
            console.warn('⚠️ No se encontró perfil de pareja. Asegúrate de que ambos usuarios estén registrados con couple_id="pareja1"');
        }
    } else {
        console.error('❌ Error cargando perfil:', profileResult.error);
    }
    
    // Mostrar recuerdos compartidos (todos los ven)
    const memoriesResult = await getMemories(currentUserId);
    if (memoriesResult.success) {
        const recentMemories = memoriesResult.data.slice(0, 6);
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
            <div class="profile-memory-thumb" onclick="viewMemory('${memory.id}')">
                ${memory.image_url ? `<img src="${memory.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` : memory.emoji}
            </div>
        `).join('');
    }
}

// Cargar perfil de la pareja (el otro usuario)
async function loadPartnerProfile() {
    try {
        console.log('🔍 Buscando perfil de pareja para usuario:', currentUserId);
        console.log('   - Buscando en tabla: users');
        
        // Buscar TODOS los usuarios primero para debug
        const { data: allUsers, error: allError } = await supabase
            .from('users')
            .select('*');
        
        console.log('📊 Total de usuarios en la tabla:', allUsers ? allUsers.length : 0);
        if (allUsers && allUsers.length > 0) {
            allUsers.forEach((u, i) => {
                console.log(`   Usuario ${i + 1}:`, {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    couple_id: u.couple_id
                });
            });
        }
        
        // Buscar cualquier otro usuario que NO sea el actual
        console.log('🔍 Buscando pareja (cualquier usuario diferente a:', currentUserId, ')');
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .neq('id', currentUserId);
        
        console.log('📋 Resultados de búsqueda:', data ? data.length : 0, 'usuario(s)');
        
        if (error) {
            console.error('❌ Error en la consulta:', error);
            throw error;
        }
        
        if (data && data.length > 0) {
            partnerProfile = data[0];
            console.log('✅ Perfil de pareja encontrado:');
            console.log('   - Nombre:', partnerProfile.name);
            console.log('   - Email:', partnerProfile.email);
            console.log('   - ID:', partnerProfile.id);
            console.log('   - Couple ID:', partnerProfile.couple_id);
        } else {
            console.log('⚠️ No se encontró ningún otro usuario en la base de datos');
            console.log('   Esto significa que solo hay 1 usuario registrado');
            partnerProfile = null;
        }
    } catch (error) {
        console.error('❌ Error cargando perfil de pareja:', error);
        partnerProfile = null;
    }
}

// Ver perfil completo del usuario actual
function viewMyProfile() {
    if (!userProfile) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>👤 Mi Perfil Completo</h3>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div style="text-align: center; padding: 20px;">
                <div style="width: 150px; height: 150px; border-radius: 50%; margin: 0 auto 20px; overflow: hidden; border: 5px solid var(--pink-primary); box-shadow: 0 4px 15px var(--shadow);">
                    ${userProfile.profile_photo_url 
                        ? `<img src="${userProfile.profile_photo_url}" style="width: 100%; height: 100%; object-fit: cover;">` 
                        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--pink-light) 0%, var(--pink-primary) 100%); font-size: 80px;">${userProfile.profile_emoji || '👤'}</div>`
                    }
                </div>
                <h2 style="color: var(--pink-dark); margin-bottom: 10px;">${userProfile.name}</h2>
                <p style="color: var(--text-dark); font-size: 18px; margin-bottom: 10px;">${userProfile.country ? `🌍 ${userProfile.country}` : ''}</p>
                <p style="color: var(--text-dark); opacity: 0.8; font-size: 14px;">${userProfile.email}</p>
                <div style="margin-top: 20px;">
                    <button class="btn" onclick="this.closest('.modal').remove(); document.getElementById('editProfileBtn').click();">✏️ Editar Perfil</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Ver perfil completo de la pareja
function viewPartnerProfile() {
    if (!partnerProfile) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>💑 Perfil de ${partnerProfile.name}</h3>
                <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div style="text-align: center; padding: 20px;">
                <div style="width: 150px; height: 150px; border-radius: 50%; margin: 0 auto 20px; overflow: hidden; border: 5px solid var(--pink-primary); box-shadow: 0 4px 15px var(--shadow);">
                    ${partnerProfile.profile_photo_url 
                        ? `<img src="${partnerProfile.profile_photo_url}" style="width: 100%; height: 100%; object-fit: cover;">` 
                        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--pink-light) 0%, var(--pink-primary) 100%); font-size: 80px;">${partnerProfile.profile_emoji || '👩‍❤️‍👨'}</div>`
                    }
                </div>
                <h2 style="color: var(--pink-dark); margin-bottom: 10px;">${partnerProfile.name}</h2>
                <p style="color: var(--text-dark); font-size: 18px; margin-bottom: 10px;">${partnerProfile.country ? `🌍 ${partnerProfile.country}` : ''}</p>
                <p style="color: var(--text-dark); opacity: 0.8; font-size: 14px;">${partnerProfile.email}</p>
                <div style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, var(--pink-light) 0%, var(--pink-primary) 100%); border-radius: 10px;">
                    <p style="color: white; font-size: 16px; margin: 0;">💕 Tu pareja especial 💕</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ========== CARGAR DATOS ==========
async function loadAllData() {
    await loadCalendarNotes();
    await loadLetters();
    await loadMemories();
    await loadMessages();
    await loadProfile();
}

// ========== FUNCIONES GLOBALES ==========
window.viewLetter = viewLetter;
window.viewMemory = viewMemory;
