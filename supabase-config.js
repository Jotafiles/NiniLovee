// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

// IMPORTANTE: Reemplaza estos valores con tus credenciales de Supabase
// Puedes obtenerlas en: https://app.supabase.com/project/_/settings/api

const SUPABASE_URL = 'https://qgfxpheotwdangphxzmk.supabase.co'; // Ejemplo: https://xxxxxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZnhwaGVvdHdkYW5ncGh4em1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MzAyNDksImV4cCI6MjA3ODMwNjI0OX0.vDxhAgpQ6Yd2cZUnquREQOSOWY52KbiDQ6l0DmXagtE'; // Tu clave anon/public

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FUNCIONES DE ALMACENAMIENTO (STORAGE)
// ============================================

async function uploadImage(file, folder = 'images') {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;
        
        const { data, error } = await supabase.storage
            .from('nini-love')
            .upload(filePath, file);
        
        if (error) throw error;
        
        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('nini-love')
            .getPublicUrl(filePath);
        
        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        return { success: false, error: error.message };
    }
}

async function deleteImage(url) {
    try {
        // Extraer el path de la URL
        const path = url.split('/nini-love/')[1];
        
        const { error } = await supabase.storage
            .from('nini-love')
            .remove([path]);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

async function signUp(email, password, name) {
    try {
        // Registrar usuario con autoConfirm
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name
                },
                emailRedirectTo: window.location.origin + '/index.html'
            }
        });
        
        if (error) {
            console.error('Error en signUp:', error);
            throw error;
        }
        
        console.log('SignUp exitoso:', data);
        
        // Si hay sesión inmediata (email confirmation desactivado), retornar
        if (data.session) {
            console.log('Sesión creada automáticamente');
            return { success: true, data, hasSession: true };
        }
        
        // Si no hay sesión, hacer login manual
        console.log('No hay sesión, intentando login manual...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
        
        const loginResult = await signIn(email, password);
        return loginResult;
        
    } catch (error) {
        console.error('Error en registro:', error);
        return { success: false, error: error.message };
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error en login:', error);
        return { success: false, error: error.message };
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error en logout:', error);
        return { success: false, error: error.message };
    }
}

async function getCurrentUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        return null;
    }
}

async function getSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    } catch (error) {
        console.error('Error obteniendo sesión:', error);
        return null;
    }
}

// ============================================
// FUNCIONES DE BASE DE DATOS - PERFIL
// ============================================

async function getUserProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            // Si el usuario no existe, crearlo
            if (error.code === 'PGRST116') {
                console.log('⚠️ Perfil no existe, creando...');
                return await createUserProfile(userId);
            }
            throw error;
        }
        return { success: true, data };
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        return { success: false, error: error.message };
    }
}

async function createUserProfile(userId) {
    try {
        // Obtener datos del usuario de auth
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            throw new Error('No hay usuario autenticado');
        }
        
        const profileData = {
            id: userId,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            couple_id: 'pareja1',
            profile_emoji: '👩‍❤️‍👨'
        };
        
        console.log('📝 Creando perfil:', profileData);
        
        const { data, error } = await supabase
            .from('users')
            .insert([profileData])
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('✅ Perfil creado exitosamente:', data);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Error creando perfil:', error);
        return { success: false, error: error.message };
    }
}

async function updateUserProfile(userId, profileData) {
    try {
        const { data, error } = await supabase
            .from('users')
            .update(profileData)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// FUNCIONES DE BASE DE DATOS - CARTAS
// ============================================

async function getLetters(userId) {
    try {
        const { data, error } = await supabase
            .from('letters')
            .select('*')
            .eq('couple_id', 'pareja1') // Compartido por pareja
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error obteniendo cartas:', error);
        return { success: false, error: error.message };
    }
}

async function createLetter(userId, letterData) {
    try {
        const { data, error } = await supabase
            .from('letters')
            .insert([{
                couple_id: 'pareja1', // Compartido por pareja
                from_name: letterData.from,
                to_name: letterData.to,
                message: letterData.message
            }])
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error creando carta:', error);
        return { success: false, error: error.message };
    }
}

async function deleteLetter(letterId) {
    try {
        const { error } = await supabase
            .from('letters')
            .delete()
            .eq('id', letterId);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error eliminando carta:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// FUNCIONES DE BASE DE DATOS - RECUERDOS
// ============================================

async function getMemories(userId) {
    try {
        const { data, error } = await supabase
            .from('memories')
            .select('*')
            .eq('couple_id', 'pareja1') // Compartido por pareja
            .order('created_at', { ascending: false});
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error obteniendo recuerdos:', error);
        return { success: false, error: error.message };
    }
}

async function createMemory(userId, memoryData) {
    try {
        const { data, error } = await supabase
            .from('memories')
            .insert([{
                couple_id: 'pareja1', // Compartido por pareja
                title: memoryData.title,
                description: memoryData.description,
                emoji: memoryData.emoji,
                image_url: memoryData.image_url || null
            }])
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error creando recuerdo:', error);
        return { success: false, error: error.message };
    }
}

async function deleteMemory(memoryId) {
    try {
        const { error } = await supabase
            .from('memories')
            .delete()
            .eq('id', memoryId);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error eliminando recuerdo:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// FUNCIONES DE BASE DE DATOS - MENSAJES
// ============================================

async function getMessages(userId, partnerId) {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('couple_id', 'pareja1') // Compartido por pareja
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        return { success: false, error: error.message };
    }
}

async function sendMessage(senderId, receiverId, text, senderName, imageUrl = null) {
    try {
        const { data, error} = await supabase
            .from('messages')
            .insert([{
                couple_id: 'pareja1', // Compartido por pareja
                sender_name: senderName,
                text: text || null,
                image_url: imageUrl
            }])
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        return { success: false, error: error.message };
    }
}

// Suscripción en tiempo real para mensajes
function subscribeToMessages(userId, callback) {
    const subscription = supabase
        .channel('messages')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `couple_id=eq.pareja1`
        }, callback)
        .subscribe();
    
    return subscription;
}

// Suscripción en tiempo real para cartas
function subscribeToLetters(callback) {
    const subscription = supabase
        .channel('letters')
        .on('postgres_changes', {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'letters',
            filter: `couple_id=eq.pareja1`
        }, callback)
        .subscribe();
    
    return subscription;
}

// Suscripción en tiempo real para recuerdos
function subscribeToMemories(callback) {
    const subscription = supabase
        .channel('memories')
        .on('postgres_changes', {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'memories',
            filter: `couple_id=eq.pareja1`
        }, callback)
        .subscribe();
    
    return subscription;
}

// Suscripción en tiempo real para notas del calendario
function subscribeToCalendarNotes(callback) {
    const subscription = supabase
        .channel('calendar_notes')
        .on('postgres_changes', {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'calendar_notes',
            filter: `couple_id=eq.pareja1`
        }, callback)
        .subscribe();
    
    return subscription;
}

// ============================================
// FUNCIONES DE BASE DE DATOS - NOTAS CALENDARIO
// ============================================

async function getCalendarNotes(userId) {
    try {
        const { data, error } = await supabase
            .from('calendar_notes')
            .select('*')
            .eq('couple_id', 'pareja1'); // Compartido por pareja
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error obteniendo notas:', error);
        return { success: false, error: error.message };
    }
}

async function saveCalendarNote(userId, dateKey, note) {
    try {
        const { data, error } = await supabase
            .from('calendar_notes')
            .upsert({
                couple_id: 'pareja1', // Compartido por pareja
                date_key: dateKey,
                note: note
            })
            .select()
            .single();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error guardando nota:', error);
        return { success: false, error: error.message };
    }
}

async function deleteCalendarNote(userId, dateKey) {
    try {
        const { error } = await supabase
            .from('calendar_notes')
            .delete()
            .eq('couple_id', 'pareja1') // Compartido por pareja
            .eq('date_key', dateKey);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error eliminando nota:', error);
        return { success: false, error: error.message };
    }
}
