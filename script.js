const $ = (id) => document.getElementById(id);

let temperatura = 24.6;
let humedad = 58;
let umbral = 30;
let conectado = true;

let historial = [22.1, 23.0, 21.8, 24.0, 23.6, 25.1, 24.2, 26.0, 24.6];

function horaActual() {
    return new Date().toLocaleTimeString("es-PE", {
        hour12: false
    });
}

function fechaISO() {
    return new Date().toISOString();
}

function registrarEvento(evento, detalle, tipo = "info", etiqueta = "Información") {
    const tabla = $("eventsBody");

    const fila = document.createElement("tr");
    const celdaHora = document.createElement("td");
    const celdaEvento = document.createElement("td");
    const celdaDetalle = document.createElement("td");
    const celdaEstado = document.createElement("td");
    const tag = document.createElement("span");

    celdaHora.textContent = horaActual();
    celdaEvento.textContent = evento;
    celdaDetalle.textContent = detalle;

    tag.className = `event-tag ${tipo}`;
    tag.textContent = etiqueta;
    celdaEstado.appendChild(tag);

    fila.append(celdaHora, celdaEvento, celdaDetalle, celdaEstado);
    tabla.prepend(fila);

    while (tabla.children.length > 8) {
        tabla.removeChild(tabla.lastElementChild);
    }
}

function dibujarGrafico() {
    const puntos = historial.map((valor, indice) => {
        const x = 10 + indice * (480 / (historial.length - 1));
        const y = 165 - ((valor - 10) / 30) * 145;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    $("chartLine").setAttribute("points", puntos.join(" "));
}

function actualizarPanel() {
    $("tempValue").textContent = temperatura.toFixed(1);
    $("humidityValue").textContent = Math.round(humedad);

    $("heroTemp").textContent = `${temperatura.toFixed(1)} °C`;
    $("heroHumidity").textContent = `${Math.round(humedad)} %`;

    $("tempMeter").style.width =
        `${Math.min(100, Math.max(0, temperatura / 50 * 100))}%`;

    $("humidityMeter").style.width =
        `${Math.min(100, Math.max(0, humedad))}%`;

    $("thresholdLabel").textContent = `${umbral} °C`;
    $("lastUpdate").textContent = horaActual();

    $("jsonTemp").textContent = temperatura.toFixed(1);
    $("jsonHumidity").textContent = Math.round(humedad);
    $("jsonTime").textContent = fechaISO();

    const alerta = temperatura > umbral;

    $("alertCard").classList.toggle("is-alert", alerta);

    $("alertTitle").textContent = alerta
        ? "¡Umbral superado!"
        : "Dentro del umbral";

    $("alertMessage").textContent = alerta
        ? `La temperatura supera el límite configurado de ${umbral} °C.`
        : "Las condiciones están dentro del límite configurado.";

    $("connectionLabel").textContent = conectado
        ? "Sistema de demostración activo"
        : "Red desconectada";

    $("statusDot").classList.toggle("offline", !conectado);

    $("wifiDetail").textContent = conectado
        ? "Conexión simulada"
        : "Sin conexión simulada";

    $("wifiState").textContent = conectado ? "Activa" : "Sin red";
    $("mqttState").textContent = conectado ? "Conectado" : "Desconectado";

    $("wifiState").classList.toggle("offline", !conectado);
    $("mqttState").classList.toggle("offline", !conectado);

    $("toggleNetwork").textContent = conectado
        ? "Simular pérdida de red"
        : "Restaurar conexión simulada";

    dibujarGrafico();
}

$("applyThreshold").addEventListener("click", () => {
    const valor = Number($("thresholdInput").value);

    if (!Number.isFinite(valor) || valor < 10 || valor > 50) {
        alert("Introduce un umbral entre 10 y 50 °C.");
        return;
    }

    umbral = valor;
    actualizarPanel();

    registrarEvento(
        "Umbral actualizado",
        `Nuevo límite configurado: ${umbral} °C.`,
        "info",
        "Configuración"
    );

    if (temperatura > umbral) {
        registrarEvento(
            "Alerta ambiental",
            `La temperatura actual es ${temperatura.toFixed(1)} °C.`,
            "warning",
            "Alerta"
        );
    }
});

$("newReading").addEventListener("click", () => {
    if (!conectado) {
        registrarEvento(
            "Lectura no recibida",
            "La red está desconectada en esta simulación.",
            "warning",
            "Sin conexión"
        );
        return;
    }

    // Generar nuevas mediciones de demostración.
    temperatura = Math.max(
        15,
        Math.min(42, +(temperatura + Math.random() * 8 - 3).toFixed(1))
    );

    humedad = Math.max(
        25,
        Math.min(85, Math.round(humedad + Math.random() * 12 - 6))
    );

    historial.push(temperatura);

    if (historial.length > 9) {
        historial.shift();
    }

    actualizarPanel();

    registrarEvento(
        "Nueva lectura demo",
        `Temperatura: ${temperatura.toFixed(1)} °C; humedad: ${humedad} %.`,
        "ok",
        "Recibido"
    );

    if (temperatura > umbral) {
        registrarEvento(
            "Alerta ambiental",
            `Temperatura superior al umbral de ${umbral} °C.`,
            "warning",
            "Alerta"
        );
    }
});

$("toggleNetwork").addEventListener("click", () => {
    conectado = !conectado;

    actualizarPanel();

    registrarEvento(
        conectado ? "Conexión restaurada" : "Pérdida de conectividad",
        conectado
            ? "La simulación permite generar nuevas lecturas."
            : "La simulación representa una interrupción de Wi-Fi y MQTT.",
        conectado ? "ok" : "warning",
        conectado ? "Restaurado" : "Sin conexión"
    );
});

$("clearEvents").addEventListener("click", () => {
    $("eventsBody").innerHTML = "";

    registrarEvento(
        "Historial limpiado",
        "Los nuevos eventos aparecerán en esta tabla.",
        "info",
        "Información"
    );
});

$("copyTopic").addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText("aula/ambiente");
        $("copyTopic").textContent = "Copiado";
    } catch {
        $("copyTopic").textContent = "aula/ambiente";
    }

    setTimeout(() => {
        $("copyTopic").textContent = "Copiar";
    }, 1500);
});

// Inicializar el panel al abrir la página.
actualizarPanel();

registrarEvento(
    "Panel iniciado",
    "Sistema de demostración listo para generar lecturas.",
    "info",
    "Información"
);