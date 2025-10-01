// ▼▼▼ REEMPLAZA TODO TU ARCHIVO SCRIPT.JS CON ESTE CÓDIGO ▼▼▼

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. CONFIGURACIÓN Y ELEMENTOS DEL DOM ---
    const URL_API = "https://script.google.com/macros/s/AKfycbw0ffMPrCCLD8-0T3ogeVFrwuM3qJJ6kW0fBDggmQpyff-0trhvLOm_uI7uphJ7qxcc9w/exec";
    const bgMusic = document.getElementById('bg-music');
    const openButton = document.querySelector('.seal-prompt');
    const landingScreen = document.getElementById('landing-screen');
    const mainContent = document.getElementById('main-content');

    // Elementos del formulario RSVP
    const btnVerificar = document.getElementById("btn-verificar");
    const codigoInput = document.getElementById("codigo");
    const errorElem = document.getElementById("login-error");
    const invitadoInfoDiv = document.getElementById("invitado-info");
    const guestListContainer = document.getElementById("guest-list-container");
    const btnConfirmarLista = document.getElementById("btn-confirmar-lista");

    // Paleta de colores para las partículas (tu verde olivo y acentos)
    const REVEAL_SPARKLE_COLORS = ['hsl(70, 15%, 55%)', 'hsl(70, 15%, 75%)', 'hsl(40, 40%, 75%)'];


    // --- 2. LÓGICA DE INICIO Y APERTURA CON BARRIDO DE ESTRELLAS REVELADORAS ---

    openButton.addEventListener('click', () => {
        // Reproducir música
        bgMusic.muted = false;
        bgMusic.play().catch(err => console.log("Reproducción de audio bloqueada."));

        const rect = openButton.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;

        // Desvanecer la pantalla de inicio primero
        landingScreen.style.opacity = '0';
        landingScreen.style.pointerEvents = 'none'; // Deshabilitar interacción
        
        // Hacer el contenido principal visible de inmediato para que las estrellas lo "revelen"
        mainContent.style.display = 'block';
        mainContent.style.opacity = '1';
        
        // Iniciar la "onda" de estrellas desde el botón
        let delay = 0;
        const maxParticles = 100; // Número de partículas en la ola inicial
        for (let i = 0; i < maxParticles; i++) {
            const angle = (i / maxParticles) * Math.PI * 2;
            const startOffset = 20;
            const initialX = originX + Math.cos(angle) * startOffset;
            const initialY = originY + Math.sin(angle) * startOffset;

            setTimeout(() => {
                createSparkleReveal(initialX, initialY, originX, originY);
            }, delay);
            delay += 5;
        }

        // Limpieza final de la pantalla de inicio
        setTimeout(() => {
            landingScreen.remove();
        }, 1500);
        
    }, { once: true });


    // --- 3. LÓGICA DE CONFIRMACIÓN DE ASISTENCIA (RSVP) ---

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

    function mostrarListaInvitados(data) {
    invitadoInfoDiv.style.display = "block";
    guestListContainer.innerHTML = '';

    // CAMBIO CLAVE: Usa data.familia para el saludo dinámico
    document.getElementById("nombre-invitado").textContent = `¡Hola, ${data.familia}!`;

    // Ahora el bucle itera sobre data.invitados, que es la lista de personas
    data.invitados.forEach(invitado => {
        const siSelected = invitado.asistencia === 'Si' ? 'selected' : '';
        const noSelected = invitado.asistencia === 'No' || !invitado.asistencia ? 'selected' : '';
        const asistenciaActual = invitado.asistencia || 'No';
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
    
    guestListContainer.addEventListener('click', (e) => {
        if (!e.target.classList.contains('attendance-btn')) return;
        const btn = e.target;
        const guestCard = btn.closest('.guest-card');
        const [btnSi, btnNo] = guestCard.querySelectorAll('.attendance-btn');
        const nuevaAsistencia = btn.classList.contains('si') ? 'Si' : 'No';
        guestCard.dataset.asistencia = nuevaAsistencia;
        btnSi.classList.toggle('selected', nuevaAsistencia === 'Si');
        btnNo.classList.toggle('selected', nuevaAsistencia === 'No');
        actualizarContadores();
    });
    
   // POST confirmación de asistencia
// POST confirmación de asistencia
btnConfirmarLista.addEventListener("click", async () => {
    const codigo = codigoInput.value.trim().toUpperCase();
    const updates = [];
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
            // ▼▼▼ CAMBIO CLAVE APLICADO AQUÍ ▼▼▼
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
    // --- 4. FUNCIONES AUXILIARES (RSVP) ---
    
    function actualizarContadores() {
        const guestCards = guestListContainer.querySelectorAll('.guest-card');
        const totalInvitados = guestCards.length;
        const confirmados = Array.from(guestCards).filter(card => card.dataset.asistencia === 'Si').length;
        document.getElementById('total-invitados').textContent = totalInvitados;
        document.getElementById('invitados-confirmados').textContent = confirmados;
    }

    function toggleLoading(isLoading, button, text) {
        if (button) {
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


    // --- 5. FUNCIONES DECORATIVAS ---

    /**
    * ✨ Crea luces y estrellas que "revelan" el contenido ✨
    */
    function createSparkleReveal(startX, startY, originX, originY) {
        const sparkle = document.createElement('div');
        const style = Math.random() > 0.4 ? 'star' : 'light';
        sparkle.className = `sparkle-reveal ${style}`;
        
        sparkle.style.backgroundColor = REVEAL_SPARKLE_COLORS[Math.floor(Math.random() * REVEAL_SPARKLE_COLORS.length)];
        if (style === 'light') {
            sparkle.style.boxShadow = `0 0 10px 2px ${sparkle.style.backgroundColor}`;
        }

        sparkle.style.left = startX + 'px';
        sparkle.style.top = startY + 'px';

        const angle = Math.atan2(startY - originY, startX - originX) + (Math.random() - 0.5) * 0.5;
        const distance = Math.random() * 800 + 400;
        const endX = startX + Math.cos(angle) * distance;
        const endY = startY + Math.sin(angle) * distance;
        const duration = 1500 + Math.random() * 1000;

        sparkle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0 }
        ], {
            duration: duration,
            easing: 'ease-out'
        });

        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), duration);
    }

    /**
    * 🌸 Crea pétalos que caen
    */
    function spawnPetal() {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        petal.style.left = Math.random() * 100 + 'vw';
        petal.style.animationDuration = (Math.random() * 5 + 8) + 's';
        petal.style.opacity = Math.random() * 0.5 + 0.3;
        petal.style.setProperty('--scale', Math.random() * 0.5 + 0.5);
        document.body.appendChild(petal);
        setTimeout(() => petal.remove(), 13000);
    }

    // Inicia la lluvia de pétalos
    setInterval(spawnPetal, 600);


    // --- 6. FUNCIÓN DEL CONTADOR ---

    function startCountdown() {
        const weddingDate = new Date("October 25, 2025 16:30:00").getTime();
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

    // Inicia el contador al cargar la página
    startCountdown();

}); // Cierre final del DOMContentLoaded