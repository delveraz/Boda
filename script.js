document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN Y ELEMENTOS DEL DOM ---
    const URL_API = "https://script.google.com/macros/s/AKfycbzvvwNakXQVO_ueQbBKirB_q9ZQwCClwxmEcw_xrB2ePXm-DMF1O6477fCgEeEsrcst/exec";
    const bgMusic = document.getElementById('bg-music');
    const openButton = document.querySelector('.seal-prompt');
    const landingScreen = document.getElementById('landing-screen');
    const mainContent = document.getElementById('main-content');
    const confettiContainer = document.getElementById('confetti-container');

    // --- LLAMADA PARA INICIAR EL CONTADOR ---
    startCountdown();

    // --- 1. LÓGICA DE APERTURA DE LA INVITACIÓN ---
    openButton.addEventListener('click', () => {
        // Reproducir música de fondo
        bgMusic.muted = false;
        bgMusic.play().catch(err => console.log("Reproducción automática bloqueada por el navegador."));

        // Lanzar confeti desde el botón "Abrir"
        const rect = openButton.getBoundingClientRect();
        const origin = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2 + window.scrollY
        };
        launchConfetti(origin);

        // Ocultar la pantalla de bienvenida con una transición suave
        landingScreen.style.opacity = '0';
        landingScreen.style.pointerEvents = 'none';
        
        // Mostrar el contenido principal después de la animación
        mainContent.style.display = 'block';
        setTimeout(() => {
            mainContent.style.opacity = '1';
        }, 100); // Pequeño retardo para asegurar que la animación de opacidad se ejecute

        // Inicializar los mapas una vez que el contenido es visible
        initMaps();

    }, { once: true }); // El evento solo se ejecuta una vez

    // --- 2. LÓGICA DE CONFIRMACIÓN DE ASISTENCIA (RSVP) ---
    document.getElementById("btn-verificar").addEventListener("click", async () => {
        const codigo = document.getElementById("codigo").value.trim().toUpperCase();
        const errorElem = document.getElementById("login-error");
        const invitadoInfoDiv = document.getElementById("invitado-info");

        if (!codigo) {
            errorElem.textContent = "Por favor, ingresa tu código.";
            errorElem.style.display = "block";
            return;
        }
        
        // Muestra un estado de "cargando"
        errorElem.style.display = "none";
        invitadoInfoDiv.style.display = "none";
        document.getElementById("btn-verificar").textContent = "Verificando...";
        document.getElementById("btn-verificar").disabled = true;

        try {
            const res = await fetch(`${URL_API}?codigo=${codigo}`);
            if (!res.ok) throw new Error(`Error en la respuesta del servidor: ${res.statusText}`);
            const data = await res.json();

            if (data.error) {
                errorElem.textContent = data.error;
                errorElem.style.display = "block";
            } else {
                errorElem.style.display = "none";
                mostrarInfoInvitado(data);
            }
        } catch (err) {
            console.error("Error al verificar código:", err);
            errorElem.textContent = "Error de conexión. Inténtalo de nuevo.";
            errorElem.style.display = "block";
        } finally {
            // Restablece el botón a su estado original
            document.getElementById("btn-verificar").textContent = "Verificar";
            document.getElementById("btn-verificar").disabled = false;
        }
    });

    function mostrarInfoInvitado(data) {
        const infoDiv = document.getElementById("invitado-info");
        infoDiv.style.display = "block";

        document.getElementById("nombre-invitado").textContent = `¡Hola, ${data.nombre}!`;
        document.getElementById("invitados-permitidos").textContent = data.invitados;
        document.getElementById("invitados-confirmados").textContent = data.confirmados;

        const pasesDisponibles = data.invitados - data.confirmados;
        const confirmarInput = document.getElementById("confirmar");
        confirmarInput.max = pasesDisponibles;
        confirmarInput.value = pasesDisponibles > 0 ? 1 : 0;
        confirmarInput.min = 0;
        
        // Si ya no hay pases disponibles, oculta el formulario de confirmación
        if (pasesDisponibles <= 0) {
            document.querySelector('.confirm-section').style.display = 'none';
            const msg = document.getElementById("confirm-msg");
            msg.textContent = "Ya has confirmado todos tus pases. ¡Gracias!";
            msg.style.display = "block";
        }
    }

    document.getElementById("btn-confirmar").addEventListener("click", async () => {
        const codigo = document.getElementById("codigo").value.trim().toUpperCase();
        const cantidad = parseInt(document.getElementById("confirmar").value);
        const maxPermitido = parseInt(document.getElementById("confirmar").max);
        const confirmMsg = document.getElementById("confirm-msg");

        if (isNaN(cantidad) || cantidad < 0 || cantidad > maxPermitido) {
            confirmMsg.textContent = `La cantidad debe ser entre 0 y ${maxPermitido}.`;
            confirmMsg.style.color = "red";
            confirmMsg.style.display = "block";
            return;
        }

        const btn = document.getElementById("btn-confirmar");
        btn.textContent = "Enviando...";
        btn.disabled = true;

        try {
            const res = await fetch(URL_API, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ codigo: codigo, confirmados: cantidad }),
            });
            const result = await res.json();
            
            if (result.success) {
                confirmMsg.textContent = "¡Gracias por confirmar! Tu asistencia ha sido registrada.";
                confirmMsg.style.color = "#27ae60";
                confirmMsg.style.display = "block";
                document.getElementById("invitados-confirmados").textContent = cantidad;
                document.querySelector('.confirm-section').style.display = 'none';
            } else {
                throw new Error(result.error || "Ocurrió un error desconocido.");
            }
        } catch (err) {
            console.error("Error al confirmar:", err);
            confirmMsg.textContent = "Error al registrar la confirmación. Inténtalo de nuevo.";
            confirmMsg.style.color = "red";
            confirmMsg.style.display = "block";
        } finally {
            btn.textContent = "Confirmar";
            btn.disabled = false;
        }
    });


    // --- 3. FUNCIONES DE ANIMACIÓN DECORATIVA ---

    // 🎉 Función para lanzar confeti con física
    const CONFETTI_COLORS = ['#8A8D7A', '#b0b3a2', '#434240', '#fdfcf9', '#e3a08d'];
    const CONFETTI_COUNT = 250;

    function launchConfetti(origin) {
        for (let i = 0; i < CONFETTI_COUNT; i++) {
            createConfettiPiece(origin);
        }
    }

    function createConfettiPiece(origin) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.backgroundColor = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 5 + Math.random() * 12;
        let x = origin.x;
        let y = origin.y;
        let vx = Math.cos(angle) * velocity;
        let vy = Math.sin(angle) * velocity - 10;
        let rotation = Math.random() * 360;
        const rotationSpeed = -8 + Math.random() * 16;
        const gravity = 0.4;
        let opacity = 1;
        const fadeSpeed = 0.01 + Math.random() * 0.01;
        
        confettiContainer.appendChild(el);
        
        (function update() {
            x += vx;
            y += vy;
            vy += gravity;
            rotation += rotationSpeed;
            opacity -= fadeSpeed;
            
            el.style.transform = `translate(${x - origin.x}px, ${y - origin.y}px) rotate(${rotation}deg)`;
            el.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(update);
            } else {
                el.remove();
            }
        })();
    }

    // 🌸 Función para generar pétalos que caen continuamente
    const spawnPetal = () => {
        const el = document.createElement('div');
        el.className = 'petal';
        const scale = 0.5 + Math.random() * 0.7;
        el.style.setProperty('--scale', scale);
        el.style.left = Math.random() * 100 + 'vw';
        el.style.animationDuration = (8 + Math.random() * 8) + 's';
        el.style.opacity = (0.5 + Math.random() * 0.5);
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 18000);
    };
    setInterval(spawnPetal, 600);

    // --- 4. FUNCIÓN DEL CONTADOR REGRESIVO ---
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
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            document.getElementById("days").textContent = days;
            document.getElementById("hours").textContent = hours;
            document.getElementById("minutes").textContent = minutes;
            document.getElementById("seconds").textContent = seconds;
        }, 1000);
    }

    // --- 5. INICIALIZACIÓN DE MAPAS (LEAFLET) ---
    function initMaps() {
        // Coordenadas de ejemplo para Estelí, Nicaragua.
        const ceremonyCoords = [13.0872, -86.3561]; 
        const receptionCoords = [13.1000, -86.3600];

        const ceremonyMap = L.map('map-ceremony').setView(ceremonyCoords, 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; Colaboradores de OpenStreetMap'
        }).addTo(ceremonyMap);
        L.marker(ceremonyCoords).addTo(ceremonyMap).bindPopup('<b>Iglesia Nuestra Señora del Carmen</b>').openPopup();

        const receptionMap = L.map('map-reception').setView(receptionCoords, 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; Colaboradores de OpenStreetMap'
        }).addTo(receptionMap);
        L.marker(receptionCoords).addTo(receptionMap).bindPopup('<b>Salón Jardín Villa Bella</b>').openPopup();
    }
});