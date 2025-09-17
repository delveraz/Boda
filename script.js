// ▼▼▼ REEMPLAZA TODO TU ARCHIVO SCRIPT.JS CON ESTE CÓDIGO ▼▼▼

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURACIÓN Y ELEMENTOS DEL DOM ---
    const URL_API = "https://script.google.com/macros/s/AKfycbwCe_AVSJQO8ZWx6U__sIsKYO66lnMDpsmcCiKEMn4oiAUhuRo0gV0CTYDrMpFDvgiHvA/exec"; // Reemplaza con tu URL
    const bgMusic = document.getElementById('bg-music');
    const openButton = document.querySelector('.seal-prompt');
    const landingScreen = document.getElementById('landing-screen');
    const mainContent = document.getElementById('main-content');
    const confettiContainer = document.getElementById('confetti-container');

    // Elementos del formulario RSVP
    const btnVerificar = document.getElementById("btn-verificar");
    const codigoInput = document.getElementById("codigo");
    const errorElem = document.getElementById("login-error");
    const invitadoInfoDiv = document.getElementById("invitado-info");
    const guestListContainer = document.getElementById("guest-list-container");
    const btnConfirmarLista = document.getElementById("btn-confirmar-lista");


    // --- 2. LÓGICA DE INICIO Y APERTURA ---
    startCountdown(); // Iniciar el contador regresivo al cargar la página

    openButton.addEventListener('click', () => {
        bgMusic.muted = false;
        bgMusic.play().catch(err => console.log("Reproducción de audio bloqueada por el navegador."));

        const rect = openButton.getBoundingClientRect();
        const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 + window.scrollY };
        launchConfetti(origin);

        landingScreen.style.opacity = '0';
        landingScreen.style.pointerEvents = 'none';
        
        mainContent.style.display = 'block';
        setTimeout(() => {
            mainContent.style.opacity = '1';
        }, 500); // Dar tiempo a la transición

    }, { once: true });


    // --- 3. LÓGICA DE CONFIRMACIÓN DE ASISTENCIA (RSVP) - RECONSTRUIDA ---

    // A. Verificar el código y obtener la lista de invitados
    btnVerificar.addEventListener("click", async () => {
        const codigo = codigoInput.value.trim().toUpperCase();
        if (!codigo) {
            showError("Por favor, ingresa tu código.");
            return;
        }
        toggleLoading(true, btnVerificar, "Verificando...");
        invitadoInfoDiv.style.display = "none";
        errorElem.style.display = "none";

        try {
            const res = await fetch(`${URL_API}?codigo=${codigo}`);
            const data = await res.json();
            if (data.error) {
                showError(data.error);
            } else {
                mostrarListaInvitados(data);
            }
        } catch (err) {
            console.error("Error en fetch:", err);
            showError("Error de conexión. Inténtalo de nuevo.");
        } finally {
            toggleLoading(false, btnVerificar, "Verificar");
        }
    });

    // B. Mostrar la lista de invitados en la pantalla
    function mostrarListaInvitados(invitados) {
        invitadoInfoDiv.style.display = "block";
        guestListContainer.innerHTML = ''; // Limpiar lista anterior

        // Mostrar un saludo general para el grupo/familia
        document.getElementById("nombre-invitado").textContent = `¡Hola, confirma la asistencia de tu grupo!`;

        // Generar HTML para cada invitado
        invitados.forEach(invitado => {
            const siSelected = invitado.asistencia === 'Si' ? 'selected' : '';
            // Marcar 'No' por defecto si no hay respuesta previa
            const noSelected = invitado.asistencia === 'No' || !invitado.asistencia ? 'selected' : '';
            const asistenciaActual = invitado.asistencia || 'No';

            // CAMBIO: Se usa la estructura de "guest-card" para que coincida con el nuevo CSS.
            const guestCardHTML = `
                <div class="guest-card" data-nombre="${invitado.nombre}" data-asistencia="${asistenciaActual}">
                    <span class="guest-name">${invitado.nombre}</span>
                    <div class="attendance-buttons">
                        <button class="attendance-btn si ${siSelected}">Sí</button>
                        <button class="attendance-btn no ${noSelected}">No</button>
                    </div>
                </div>`;
            guestListContainer.insertAdjacentHTML('beforeend', guestCardHTML);
        });
        actualizarContadores();
    }
    
    // C. Manejar clics en los botones "Sí" y "No" (usando delegación de eventos)
    guestListContainer.addEventListener('click', (e) => {
        if (!e.target.classList.contains('attendance-btn')) return;

        const btn = e.target;
        // CAMBIO: Se busca el elemento padre ".guest-card" en lugar de ".guest-row".
        const guestCard = btn.closest('.guest-card');
        // CAMBIO: Se actualiza el orden de los botones para consistencia (Sí, luego No).
        const [btnSi, btnNo] = guestCard.querySelectorAll('.attendance-btn');
        
        const nuevaAsistencia = btn.classList.contains('si') ? 'Si' : 'No';
        guestCard.dataset.asistencia = nuevaAsistencia;

        // Actualizar estilos
        btnSi.classList.toggle('selected', nuevaAsistencia === 'Si');
        btnNo.classList.toggle('selected', nuevaAsistencia === 'No');
        
        actualizarContadores();
    });
    
    // D. Enviar la confirmación final de toda la lista
    btnConfirmarLista.addEventListener("click", async () => {
        const codigo = codigoInput.value.trim().toUpperCase();
        const updates = [];
        // CAMBIO: Se seleccionan todas las ".guest-card" para obtener los datos.
        const guestCards = guestListContainer.querySelectorAll('.guest-card');
        
        guestCards.forEach(card => {
            updates.push({
                nombre: card.dataset.nombre,
                asistencia: card.dataset.asistencia
            });
        });
        
        toggleLoading(true, btnConfirmarLista, "Enviando...");
        
        try {
            const res = await fetch(URL_API, {
                method: "POST",
                // Google Apps Script a veces es particular. JSON.stringify es generalmente el método moderno preferido.
                // Si esto falla, podrías necesitar volver a FormData, pero prueba esto primero.
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ codigo, updates })
            });
            const result = await res.json();

            if (result.success) {
                showMessage("¡Gracias! Hemos registrado la asistencia.", 'success');
            } else {
                throw new Error(result.error || "Error desconocido del servidor.");
            }

        } catch (err) {
            console.error("Error al confirmar:", err);
            showMessage("Error al guardar la confirmación. Inténtalo de nuevo.", 'error');
        } finally {
            toggleLoading(false, btnConfirmarLista, "Confirmar Asistencia");
        }
    });
    
    // --- 4. FUNCIONES AUXILIARES ---
    
    function actualizarContadores() {
        // CAMBIO: Se cuentan las ".guest-card" para los totales.
        const guestCards = guestListContainer.querySelectorAll('.guest-card');
        const totalInvitados = guestCards.length;
        const confirmados = Array.from(guestCards).filter(card => card.dataset.asistencia === 'Si').length;
        
        document.getElementById('total-invitados').textContent = totalInvitados;
        document.getElementById('invitados-confirmados').textContent = confirmados;
    }

    function toggleLoading(isLoading, button, text) {
        if(button) {
            button.disabled = isLoading;
            button.textContent = text;
        }
    }
    
    function showError(message) {
        errorElem.textContent = message;
        errorElem.style.display = 'block';
    }

    function showMessage(message, type = 'success') {
        const msgElem = document.getElementById('confirm-msg');
        msgElem.textContent = message;
        msgElem.className = type === 'success' ? 'success-msg' : 'error-msg';
        msgElem.style.display = 'block';
    }

  // --- 5. FUNCIONES DECORATIVAS Y DE UTILIDAD ---

// 🎉 Función para lanzar confeti con física
const CONFETTI_COLORS = ['#8A8D7A', '#b0b3a2', '#434240', '#fdfcf9', '#e3a08d'];
const CONFETTI_COUNT = 150;

function launchConfetti(origin) {
    for (let i = 0; i < CONFETTI_COUNT; i++) {
        createConfettiPiece(origin);
    }
}

function createConfettiPiece(origin) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];

    // ARREGLO CLAVE: Se añaden estas dos líneas para posicionar el confeti
    el.style.left = origin.x + 'px';
    el.style.top = origin.y + 'px';

    const angle = Math.random() * Math.PI * 2, velocity = 5 + Math.random() * 12;
    let x = origin.x, y = origin.y;
    let vx = Math.cos(angle) * velocity, vy = Math.sin(angle) * velocity - 10;
    let rotation = Math.random() * 360;
    const rotationSpeed = -8 + Math.random() * 16, gravity = 0.4;
    let opacity = 1;
    const fadeSpeed = 0.01 + Math.random() * 0.01;
    
    confettiContainer.appendChild(el);

    (function update() {
        x += vx; y += vy; vy += gravity; rotation += rotationSpeed; opacity -= fadeSpeed;
        el.style.transform = `translate(${x - origin.x}px, ${y - origin.y}px) rotate(${rotation}deg)`;
        el.style.opacity = opacity;
        if (opacity > 0) requestAnimationFrame(update); else el.remove();
    })();
}

// 🌸 Función para generar pétalos
function spawnPetal() {
    const petal = document.createElement('div');
    petal.classList.add('petal');

    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.animationDuration = (Math.random() * 5 + 8) + 's';
    petal.style.opacity = Math.random() * 0.5 + 0.3;
    petal.style.setProperty('--scale', Math.random() * 0.5 + 0.5);

    document.body.appendChild(petal);

    setTimeout(() => {
        petal.remove();
    }, 13000);
}

// Inicia la lluvia de pétalos
setInterval(spawnPetal, 600);


// 🕒 Función del contador regresivo
function startCountdown() {
    const weddingDate = new Date("October 25, 2025 16:00:00").getTime();
    const countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById("countdown").innerHTML = "<h3 style='font-size:1.2em;'>¡El gran día llegó!</h3>";
            return;
        }
        
        document.getElementById("days").textContent = Math.floor(distance / (1000 * 60 * 60 * 24));
        document.getElementById("hours").textContent = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        document.getElementById("minutes").textContent = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById("seconds").textContent = Math.floor((distance % (1000 * 60)) / 1000);
    }, 1000);
}



}); // Cierre final del DOMContentLoaded