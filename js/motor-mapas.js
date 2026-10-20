// ==========================================================================
// SECCIÓN 1: CONFIGURACIÓN GLOBAL Y CORE GIS (DICCIONARIOS MAESTROS)
// ==========================================================================
const COL_ALCALDIA = { CVEGEO: 0, NOMGEO: 1, ESTATUS: 2, COLOR_HEX: 3 };
const COL_COLONIA = { WKT: 0, NOMBRE: 1, ESTATUS: 2 };

// Mapeo estructural de la pestaña "salida mapa" (Caché de comercios)
const COL_COMERCIO = {
 ID: 1, COLONIA: 2, MAPA: 3, CAPA_PRODUCTO: 4, CAPA_SERVICIO: 5,
 NIVEL: 6, NOMBRE: 7, SLOGAN: 8, LISTA_PROD_SERV: 9, HORARIO: 10,
 REDES: 11, YOUTUBE: 12, WHATSAPP: 13, COORDENADAS: 14, MAPS_LINK: 15,
 LOGO: 16 
};

// ==========================================================================
// MÓDULO INTEGRADO OFERTAS: CORE DE FILTRADO Y MAPEO DE DERECHOS PUBLICITARIOS
// ==========================================================================
const COL_OFERTA = {
    MARCA_TEMPORAL: 0, 
    FOLIO: 1, 
    FECHA_INICIO: 2, 
    FECHA_VENC: 3,
    GIRO_ESPECIFICO: 4,  // E: Tipo de negocio o producto específico
    TIPO_BENEFICIO: 5,   // F: ¿Qué tipo de beneficio comercial ofrece?
    CANTIDAD_GANCHO: 6,  // G: Cantidad o Gancho del Beneficio
    TEXTO_MENSAJE: 7,    // H: Texto del mensaje (Condición o Introducción)
    WHATSAPP_OFERTA: 8   // I: link wa.me creado por el cerebro en la nube
};

// Matriz de Cobertura Geográfica para Nivel 4 (Colonias vecinas directas)
const CAT_COLONIAS_COLINDANTES = {
    "xalpa ii": ["xalpa i", "san pablo", "atlahuilco", "el vergel"],
    "san pablo": ["xalpa ii", "chimalhuacan centro", "lomas de san pablo"]
};

// Variables de Control de Estado Global
let mapaNegosistema = null;
let capaPoligonosActivos = null;
let capaPinesActivos = null;
let datosComerciosGlobales = [];
let marcaroresGIS = [];
let entornoActual = "productos"; 
window.esCargaInicialEntorno = true;

// URLs de Publicación de Google Sheets
const URL_CSV_ALCALDIAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=1670206752&single=true&output=csv";
const URL_CSV_COLONIAS  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=383048417&single=true&output=csv";
const URL_CSV_COMERCIOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=1369751544&single=true&output=csv";
const URL_CSV_OFERTAS   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=1185111740&single=true&output=csv";
const URL_CSV_PILOTO    = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTpyTu542clbD3QGMLVlDJlprm_Kkl4u0QokBxOvUwmhNbAeQRZFy8q5zJdp5BSOC1ftHnkA53M74S4/pub?output=csv";
// PALETA MAESTRA UNIFICADA (Mapea directamente la palabra clave de Apps Script / Formulario)
const PALETAS_CAPAS_SISTEMA = {
 productos: [
   { id: "abarrotes", label: "Abarrotes y Tienditas", emoji: "🛒", color: "#27AE60", desc: "Tienditas, misceláneas, materias primas..." },
   { id: "frescos", label: "Alimentos Frescos", emoji: "🥩", color: "#2ECC71", desc: "Recauderías, carnicerías, pollerías..." },
   { id: "tortillerias", label: "Tortillerías y Purificadoras", emoji: "🌽", color: "#1E8449", desc: "Tortillerías, molinos, agua..." },
   { id: "comida", label: "Comida Preparada", emoji: "🌮", color: "#E67E22", desc: "Taquerías, pizzerías, antojitos..." },
   { id: "panaderias", label: "Panaderías y Postres", emoji: "🍞", color: "#F1C40F", desc: "Panaderías, pastelerías, cafeterías..." },
   { id: "farmacias", label: "Farmacias", emoji: "💊", color: "#E74C3C", desc: "Farmacias, tiendas naturistas..." },
   { id: "ferreterias", label: "Ferreterías y Tlapalerías", emoji: "🔧", color: "#D4AC0D", desc: "Ferreterías, materials, plomería..." },
   { id: "gas", label: "Gas y Carbón", emoji: "🔥", color: "#D35400", desc: "Depósitos de gas, carbón, leña..." },
   { id: "ropa", label: "Ropa y Zapaterías", emoji: "👕", color: "#9B59B6", desc: "Boutiques, ropa de paca, bazares..." },
   { id: "papelerias", label: "Papelerías y Regalos", emoji: "🎒", color: "#F48FB1", desc: "Papelerías, ciber, cosméticos..." },
   { id: "mascotas", label: "Alimento para Mascotas", emoji: "🐶", color: "#A04000", desc: "Croquetas por kilo, accesorios..." },
   { id: "tecnologia", label: "Celulares y Tecnología", emoji: "📱", color: "#1A5276", desc: "Celulares, fundas, computación..." },
   { id: "base", label: "Directorio Base", emoji: "⚪", color: "#E2E8F0", desc: "En verificación o sin plan..." }
 ],
 servicios: [
   { id: "medicos", label: "Consultorios y Médicos", emoji: "🩺", color: "#5DADE2", desc: "Médicos, dentistas, ópticas, veterinarias..." },
   { id: "talleres", label: "Talleres y Vulcanizadoras", emoji: "🚗", color: "#2471A3", desc: "Mecánicos, motos, vulcanizadoras..." },
   { id: "oficios", label: "Oficios del Hogar", emoji: "🛠️", color: "#2E4053", desc: "Plomeros, electricistas, carpinteros..." },
   { id: "esteticas", label: "Estéticas y Barberías", emoji: "✂", color: "#7D3C98", desc: "Salones de belleza, uñas, barberías..." },
   { id: "gimnasios", label: "Gimnasios y Deportes", emoji: "🥊", color: "#4A235A", desc: "Gimnasios, boxeo, canchas locales..." },
   { id: "lavanderias", label: "Lavanderías y Tintorerías", emoji: "🧼", color: "#138D75", desc: "Lavanderías, tintorerías, planchadurías..." },
   { id: "cerrajerias", label: "Cerrajerías y Reparaciones", emoji: "🔑", color: "#7B241C", desc: "Cerrajería, calzado, electrodomésticos..." },
   { id: "fletes", label: "Fletes y Paquetería", emoji: "📦", color: "#B7950B", desc: "Mudanzas, puntos de entrega..." },
   { id: "fiestas", label: "Salones y Jardines", emoji: "🎉", color: "#117A65", desc: "Salones infantiles, inflables, fotografía..." },
   { id: "escuelas", label: "Escuelas y Regularización", emoji: "📚", color: "#5D6D7E", desc: "Guarderías, regularización..." },
   { id: "tramites", label: "Trámites y Cibercafés", emoji: "📄", color: "#34495E", desc: "CURP, actas, contadores, abogados..." },
   { id: "urgencias", label: "Urgencias 24 Horas", emoji: "🚨", color: "#111111", desc: "Cerrajerías nocturnas, grúas, farmacias..." },
   { id: "base", label: "Directorio Base", emoji: "⚪", color: "#E2E8F0", desc: "Prestadores independientes no verificados..." }
 ]
};
// ========================================================
// SECCIÓN 2: MOTOR DE FILTRADO, RENDERIZADO Y BOTONES (JS)
// ========================================================
function filtrarPinesPorCapasActivas() {
  // INTERCAMBIO VISUAL EN 0MS: Alterna la visibilidad de los nodos ganándole al !important del CSS
  document.querySelectorAll('#capas-inferiores-contenedor .guia-item-filtro').forEach(item => {
    const origen = item.getAttribute("data-entorno-origen");
    if (origen === entornoActual) {
      // Forzamos el despliegue con máxima prioridad en el navegador
      item.style.setProperty("display", "flex", "important"); 
    } else {
      // Forzamos el ocultamiento absoluto destruyendo visualmente el !important del CSS
      item.style.setProperty("display", "none", "important"); 
    }
  });

  const capasActivas = [];
  
  // Captura qué checkboxes están encendidos para el entorno activo actual
  document.querySelectorAll(`.filtro-capa-chk[data-tipo="${entornoActual}"]`).forEach(sw => {
    if (sw.checked) {
      capasActivas.push(sw.getAttribute("data-capa").trim().toLowerCase());
    }
  });

  const comerciosFiltradosYVisibles = datosComerciosGlobales.filter(comercio => {
    if (!comercio || comercio.length === 0) return false;
    
    const entornoPin = String(comercio[COL_COMERCIO.MAPA]).trim().toLowerCase();
    if (entornoPin !== "ambos" && entornoPin !== "" && entornoPin !== entornoActual) return false;
    
    let capaClaveRaw = (entornoActual === "productos") 
      ? comercio[COL_COMERCIO.CAPA_PRODUCTO] 
      : comercio[COL_COMERCIO.CAPA_SERVICIO];
      
    if (!capaClaveRaw) return false;
    capaClaveRaw = capaClaveRaw.trim().toLowerCase();
    
    return capasActivas.includes(capaClaveRaw);
  });

renderizarPinesComerciales(comerciosFiltradosYVisibles);
}

// ==========================================================================
// SECCIÓN 2: MOTOR DE FILTRADO, RENDERIZADO Y BOTONES (GIS MÓVIL OPTIMIZADO)
// ==========================================================================

function renderizarPinesComerciales(arregloComercios) {
  if (window.contenedorPinesGlobal && typeof window.contenedorPinesGlobal.clearLayers === 'function') {
    window.contenedorPinesGlobal.clearLayers();
  }
  marcaroresGIS = [];

  const esSimulador = window.location.pathname.includes("anunciate") || !document.getElementById("mapa-comercial-contenedor");

  arregloComercios.forEach(comercio => {
    const coordRaw = String(comercio[COL_COMERCIO.COORDENADAS]).trim();
    if (!coordRaw || !coordRaw.includes(",")) return;

    const [lat, lng] = coordRaw.split(",").map(num => parseFloat(num.trim()));
    if (isNaN(lat) || isNaN(lng)) return;
    if (!esSimulador && (lat < 19.0 || lat > 19.6 || lng > -98.8 || lng < -99.4)) return;

    let capaActivaClave = (entornoActual === "productos")
      ? String(comercio[COL_COMERCIO.CAPA_PRODUCTO]).trim().toLowerCase()
      : String(comercio[COL_COMERCIO.CAPA_SERVICIO]).trim().toLowerCase();

    if (!capaActivaClave || capaActivaClave === "" || capaActivaClave === "vacio") {
      capaActivaClave = "base";
    }

    const configuracionCapa = PALETAS_CAPAS_SISTEMA[entornoActual].find(c => c.id === capaActivaClave) ||
                              PALETAS_CAPAS_SISTEMA[entornoActual].find(c => c.id === "base");

    const emojiCentral = configuracionCapa.emoji;
    const colorHexGota = configuracionCapa.color;

    const nivelComercioRaw = String(comercio[COL_COMERCIO.NIVEL]).trim();
    const nivelPuro = parseInt(nivelComercioRaw) || 1;
    const idComercio = String(comercio[COL_COMERCIO.ID]).trim();

    let contenidoInteriorPin = `<span class="pin-emoji-interior">${emojiCentral}</span>`;
    let campoLogoCSV = (comercio[COL_COMERCIO.LOGO] || "").trim().toLowerCase();
    campoLogoCSV = campoLogoCSV.replace(/\.[^/.]+\$/, "");

    if (nivelPuro >= 2 && campoLogoCSV !== "" && campoLogoCSV !== "vacio") {
      const urlFinalLogo = `css/logo/${campoLogoCSV}.png`;
      contenidoInteriorPin = `
        <img src="${urlFinalLogo}" class="pin-logo-interior"
             onerror="this.onerror=null; this.parentNode.innerHTML='<span class=\\'pin-emoji-interior\\'>${emojiCentral}</span>';">
      `;
    }

    let claseNivelComercial = "pin-incognito-gris";
    if (nivelPuro === 5) claseNivelComercial = "pin-oro premium-pulse";
    else if (nivelPuro === 4) claseNivelComercial = "pin-plata";
    else if (nivelPuro === 3) claseNivelComercial = "pin-bronce";
    else if (nivelPuro === 2) claseNivelComercial = "pin-estandar";

    const prefijoEntorno = (entornoActual === "productos") ? "btn-p-" : "btn-s-";

    const htmlIcono = `
    <div class="pin-personalizado ${claseNivelComercial}">
      <div class="gota-vectorial" style="--pin-color: ${colorHexGota};"></div>
      <div class="pin-centro-blanco">
        ${contenidoInteriorPin}
      </div>
    </div>
    `;

    const iconoGota = L.divIcon({
      className: `leaflet-marker-selectable ${prefijoEntorno}${capaActivaClave}`,
      html: htmlIcono,
      iconSize:[30, 42],
      iconAnchor:[15, 42],
      popupAnchor: [0, -15]
    });

    const marcador = L.marker([lat, lng], {
      icon: iconoGota,
      datosNegocio: {
        colorCapa: colorHexGota,
        idGiro: capaActivaClave
      }
    });

    // 📱 CONFIGURACIÓN MÓVIL CRÍTICA: SE ACABA LA PELEA CINEMÁTICA Y LOS BRINCOS
    const esMovil = window.innerWidth <= 768;
const opcionesPopup = {
  autoPan: false,        // 🟢 Apagado total: Tu flyTo personalizado se encargará de esto
  closeOnClick: false,   // Protege el popup si el usuario toca el fondo por error
  autoClose: false,      // Impide que Leaflet cierre el popup activamente al mover la cámara
  keepInView: false,     // 🟢 Impide que Leaflet fuerce el reencuadre automático
  className: esMovil ? 'popup-movil-optimizado' : 'popup-desktop-premium',
  maxWidth: esMovil ? 290 : 360,
  minWidth: esMovil ? 280 : 300
};


    marcador.bindPopup(
      typeof inyectarPopupComercioInteligente === "function"
        ? inyectarPopupComercioInteligente(comercio, nivelPuro)
        : `<b>${comercio[COL_COMERCIO.NOMBRE] || "Negocio"}</b>`,
      opcionesPopup
    );

  marcador.on('click', function(e) {
  // Evitamos que el click afecte a otras capas del mapa de fondo
  if (e && e.originalEvent) {
    L.DomEvent.stopPropagation(e.originalEvent);
  }

  if (window.innerWidth <= 768) {
    // 1. Limpiamos cualquier popup abierto previamente para evitar parpadeos
    marcador.closePopup();

    // 2. OBTENEMOS LA POSICIÓN EXACTA EN PÍXELES
    // Convertimos la coordenada geográfica del pin a un punto de píxeles en la pantalla actual
    const puntoActual = mapaNegosistema.latLngToContainerPoint(marcador.getLatLng());

    // 🟢 EL TRUCO MAESTRO: Restamos píxeles en el eje Y para "empujar" el centro visual hacia abajo.
    // Esto hace espacio para el acordeón inferior del celular de forma idéntica en cualquier marca/modelo.
    // Ajusta el '220' si quieres que el popup suba más o baje más en las pantallas B y D.
    const puntoCompensado = L.point(puntoActual.x, puntoActual.y - 220); 

    // Convertimos el punto de píxeles corregido de vuelta a coordenadas del mapa
    const coordCompensada = mapaNegosistema.containerPointToLatLng(puntoCompensado);
    const zoomActual = mapaNegosistema.getZoom();

    // 3. Volamos suavemente a la coordenada calculada matemáticamente en píxeles
    mapaNegosistema.flyTo(coordCompensada, Math.max(zoomActual, 17), {
      animate: true,
      duration: 0.45,
      easeLinearity: 0.25
    });

    // 4. SEÑAL DE CONTROL APERTURA DE POPUP
    // Usamos 'zoomend' o un temporizador limpio en lugar de un 'moveend' global inestable
    // para asegurar que abra exactamente centrado y anclado al marcador físico.
    setTimeout(() => {
      // Forzamos el anclaje nativo al marcador para que herede la punta del pin
      marcador.openPopup(); 
    }, 480); // 480ms es el tiempo ideal (un instante después de que acabe la animación flyTo de 450ms)
  }
});


    if (window.contenedorPinesGlobal) window.contenedorPinesGlobal.addLayer(marcador);
    marcaroresGIS.push(marcador);
  }); // <-- Aquí se cierra correctamente el bucle forEach de los comercios

  if (window.contenedorPinesGlobal && typeof window.contenedorPinesGlobal.getLayers === 'function' && window.contenedorPinesGlobal.getLayers().length > 0 && mapaNegosistema) {
    if (window.esCargaInicialEntorno) {
      mapaNegosistema.fitBounds(window.contenedorPinesGlobal.getBounds(), {
        maxZoom: 15,
        padding:[30, 30],
        animate: true,
        duration: 0.6
      });
      window.esCargaInicialEntorno = false;
    }
  }

  if (typeof generarDatosEstructuradosSEO === "function") {
    generarDatosEstructuradosSEO(arregloComercios);
  }
}

// ==========================================================================
// CONTROLADOR DE ACORDEONES CON ACTIVACIÓN VISUAL DE CARRUSEL (CORREGIDO)
// ==========================================================================
function alternarAcordeonSeccion(btn) {
  const item = btn.closest('.acordeon-item');
  const contenido = item.querySelector('.acordeon-contenido');
  const estaAbierto = item.classList.contains('activo');

  // Cerrar todos los demás acordeones del grupo para mantener orden visual
  btn.closest('.popup-acordeon-grupo').querySelectorAll('.acordeon-item').forEach(i => {
    i.classList.remove('activo');
    const c = i.querySelector('.acordeon-contenido');
    if (c) c.style.maxHeight = null;
  });

  if (!estaAbierto) {
    item.classList.add('activo');
    contenido.style.maxHeight = contenido.scrollHeight + "px";

    // DISPARADOR AUTOMÁTICO DE HORARIOS
    if (contenido.querySelector('#cronometro-contenedor-modulo')) {
      setTimeout(iniciarCronometroPopup, 50);
    }

    // DISPARADOR AUTOMÁTICO DE IMÁGENES Y VIDEO LAZY-LOADING
    contenido.querySelectorAll('.lazy-popup-img, .lazy-popup-iframe').forEach(el => {
      if (el.getAttribute('data-src')) {
        el.src = el.getAttribute('data-src');
        el.removeAttribute('data-src');
      }
    });

    // 🔥 EL CAMBIO MAESTRO: Esperamos a que termine la animación CSS para medir y encender el carrusel
    setTimeout(() => {
      const carruselDOM = contenido.querySelector('.popup-multimedia-carrusel');
      if (carruselDOM && typeof reajustarEstructuraCarrusel === 'function') {
        // Cuenta las imágenes .webp activas y dibuja las flechas ❮ y ❯
        reajustarEstructuraCarrusel(carruselDOM);
      }

      // Forzar a Leaflet a recalcular el tamaño del mapa por la expansión física del popup
      if (mapaNegosistema) {
        mapaNegosistema.invalidateSize({ pan: true });
      }
    }, 260); // 260ms es el tiempo exacto que tarda en desplegarse el acordeón
  }
}

function reconstruirBotonesCapasInferiores() {
  const contenedor = document.getElementById("capas-inferiores-contenedor");
  if (!contenedor) return;
  contenedor.innerHTML = ""; // Limpia el placeholder inicial de carga

  // RENDERIZADO SIMULTÁNEO EN MEMORIA: Crea ambos entornos de golpe
  ["productos", "servicios"].forEach(entorno => {
    const capasEntorno = PALETAS_CAPAS_SISTEMA[entorno] || [];

    capasEntorno.forEach(capa => {
      const itemFiltro = document.createElement("div");
      itemFiltro.className = "guia-item-filtro";
      itemFiltro.setAttribute("data-entorno-origen", entorno);

      // Inyección limpia: Eliminamos estilos inline para que el CSS responsivo tome el control total
      itemFiltro.innerHTML = `
        <label class="toggle-switch">
          <input type="checkbox" class="filtro-capa-chk" data-tipo="${entorno}" data-capa="${capa.id}" checked>
          <span class="slider-palanca visual-${capa.id}" style="background-color: ${capa.color};"></span>
        </label>
        <div class="texto-filtro-info">
          <span class="emoji-filtro-span">${capa.emoji}</span>
          <strong class="label-filtro-span">${capa.label}:</strong>
          <span class="desc-filtro-span">(${capa.desc})</span>
        </div>
      `;

      // ESCUCHADOR INTELIGENTE EN EL CUADRANTE: Separa el clic informativo del comportamiento del checkbox
      itemFiltro.addEventListener("click", function(e) {
        // Si el usuario tocó directamente el switch o su palanca, dejamos que actúe el filtro normal
        if (e.target.closest('.toggle-switch')) return;

        // Si está en celular, disparamos la creación dinámica de la tarjeta flotante oscura
        if (window.innerWidth <= 768) {
          mostrarTarjetaInformativaDinamica(capa.label, capa.desc);
        }
      });

      itemFiltro.querySelector(".filtro-capa-chk").addEventListener("change", filtrarPinesPorCapasActivas);
      contenedor.appendChild(itemFiltro);
    });
  });
  filtrarPinesPorCapasActivas();
}

// Microfunción JS que abre o cierra la tarjeta flotante al dar clic en celulares
function alternarDetalleFiltroMovil(elemento) {
  if (window.innerWidth <= 480) {
    // Si ya hay un elemento abierto en pantalla, lo cerramos antes de abrir el nuevo
    document.querySelectorAll('.texto-filtro-info').forEach(el => {
      if (el !== elemento) el.classList.remove('expandido-movil');
    });
    // Alternamos el estado del elemento actual
    elemento.classList.toggle("expandido-movil");
  }
}

// FUNCIÓN MAESTRA GLOBAL GIS: Construye las donas SVG para cualquier clusterizador activo
function iconCreateFunctionDona(cluster) {
  const markers = cluster.getAllChildMarkers();
  const conteoCapas = {};
  let total = markers.length;

  // Barrer marcadores colisionados y extraer colores de su capa activa
  markers.forEach(m => {
    const info = m.options.datosNegocio;
    if (info) {
      const color = info.colorCapa || "#E2E8F0";
      conteoCapas[color] = (conteoCapas[color] || 0) + 1;
    }
  });

  // Crear anillo perimetral dinámico en un <svg> con los colores exactos de cada giro
  let svgHtml = `<svg width="40" height="40" viewBox="0 0 40 40" style="display:block;">`;
  let anguloAcumulado = 0;

  for (const [color, cantidad] of Object.entries(conteoCapas)) {
    const porcentaje = cantidad / total;
    const anguloGiro = porcentaje * 360;
    
    const r = 16; const cx = 20; const cy = 20;
    const x1 = cx + r * Math.cos((anguloAcumulado - 90) * Math.PI / 180);
    const y1 = cy + r * Math.sin((anguloAcumulado - 90) * Math.PI / 180);
    anguloAcumulado += anguloGiro;
    const x2 = cx + r * Math.cos((anguloAcumulado - 90) * Math.PI / 180);
    const y2 = cy + r * Math.sin((anguloAcumulado - 90) * Math.PI / 180);
    
    const granArco = anguloGiro > 180 ? 1 : 0;
    if (anguloGiro === 360) {
      svgHtml += `<circle cx="20" cy="20" r="16" fill="none" stroke="${color}" stroke-width="5"/>`;
    } else {
      svgHtml += `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${granArco} 1 ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="5"/>`;
    }
  }
  
  svgHtml += `<circle cx="20" cy="20" r="12" fill="#FFFFFF"/>`;
  svgHtml += `<text x="20" y="24" text-anchor="middle" font-size="11" font-weight="700" fill="#0F172A">${total}</text>`;
  svgHtml += `</svg>`;

  return L.divIcon({
    html: svgHtml,
    className: 'cluster-dona-svg-personalizado',
    iconSize:[40, 40],
    iconAnchor: [20, 20]
  });
}
// INICIALIZADOR ASÍNCRONO CORE AL CARGAR LA VENTANA
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const alcaldiaParam = params.get("alcaldia");
  const coloniaParam = params.get("colonia");
  
  if (document.getElementById("mapa-macro-contenedor")) {
    mapaNegosistema = L.map("mapa-macro-contenedor").setView([19.4326, -99.1332], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaNegosistema);
    limpiarLienzoMilisegundos();
    
    // 🛠️ RECUPERACIÓN INTELIGENTE DE NAVEGACIÓN
    const ultimaAlcaldia = localStorage.getItem("ultima_alcaldia_explorada");
    
    // Si el usuario entra al index limpio pero estuvo explorando una región previa, la despliega
    if (!alcaldiaParam && ultimaAlcaldia) {
      cargarMapaColonias(ultimaAlcaldia);
    } else if (!alcaldiaParam) {
      verificarYFiltarAlcaldias();
    } else {
      cargarMapaColonias(alcaldiaParam);
    }
  }

  else if (document.getElementById("mapa-comercial-contenedor")) {
    // 🛠️ MEJORA DE ZOOM OPTIMIZADA POR QA: Desbloqueo de nivel 21 para smartphones
mapaNegosistema = L.map("mapa-comercial-contenedor", {
  maxZoom: 21,
  closePopupOnClick: false,
  tap: false, // 🟢 CRÍTICO MÓVIL: Elimina el doble clic táctil fantasma que cierra el popup
  bounceAtZoomLimits: false
}).setView([19.373, -99.018], 14);

    // Activamos el estiramiento digital a partir del nivel 19 para evitar pantallas en blanco
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 21,
      maxNativeZoom: 19
    }).addTo(mapaNegosistema);
    // Inicialización del Clusterizador para la Vista Comercial
    window.contenedorPinesGlobal = L.markerClusterGroup({
      maxClusterRadius: 20,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: iconCreateFunctionDona
    }).addTo(mapaNegosistema);

    limpiarLienzoMilisegundos();
    inicializarModoHiperlocal(coloniaParam);
  }
    else if (document.getElementById("mapa_general")) {
mapaNegosistema = L.map("mapa_general", {
  closePopupOnClick: false,
  tap: false // 🟢 CRÍTICO MÓVIL: Evita el auto-cierre en el simulador piloto
}).setView([19.361, -99.025], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaNegosistema);
    
    // UNIFICACIÓN GIS: Activamos el clusterizador también en el mapa piloto
    window.contenedorPinesGlobal = L.markerClusterGroup({
      maxClusterRadius: 20,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: iconCreateFunctionDona
    }).addTo(mapaNegosistema);

    limpiarLienzoMilisegundos();
    inicializarModoAnunciatePiloto();
  }
  
  // Forzar redibujo físico de Leaflet adaptado al Layout Vertical en ambas pantallas
  setTimeout(() => { 
    if (mapaNegosistema) {
      mapaNegosistema.invalidateSize(); 
    }
  }, 450);
  
    if (mapaNegosistema) {
    mapaNegosistema.on('zoomend', () => {
      const zoomActual = mapaNegosistema.getZoom();
      const contenedorActivo = document.getElementById("mapa-comercial-contenedor") ? "mapa-comercial-contenedor" : "mapa_general";
      const mapaElemento = document.getElementById(contenedorActivo);
      if (mapaElemento) {
        mapaElemento.classList.remove('zoom-lejano', 'zoom-medio', 'zoom-cercano');
        if (zoomActual < 14) mapaElemento.classList.add('zoom-lejano');
        else if (zoomActual >= 14 && zoomActual <= 16) mapaElemento.classList.add('zoom-medio');
        else mapaElemento.classList.add('zoom-cercano');
      }
    });
  }

  // ==========================================================
  // INYECCIÓN DEL CONTROL DE UBICACIÓN EN TIEMPO REAL (GPS)
  // ==========================================================
  if (mapaNegosistema && (document.getElementById("mapa-comercial-contenedor") || document.getElementById("mapa_general"))) {
    const botonGps = document.createElement("button");
    botonGps.className = "boton-gps-flotante";
    botonGps.setAttribute("title", "Mi ubicación actual");
    botonGps.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9z"/>
      </svg>
    `;
    
    const contenedorMapaId = document.getElementById("mapa-comercial-contenedor") ? "mapa-comercial-contenedor" : "mapa_general";
    document.getElementById(contenedorMapaId).appendChild(botonGps);

    let marcadorUsuarioGps = null;
    let circuloPrecisionGps = null;

    botonGps.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Tu navegador o dispositivo no soporta el acceso a la geolocalización.");
        return;
      }
      botonGps.style.color = "#3b82f6";

      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const lat = posicion.coords.latitude;
          const lng = posicion.coords.longitude;
          const precision = posicion.coords.accuracy;

          if (marcadorUsuarioGps) mapaNegosistema.removeLayer(marcadorUsuarioGps);
          if (circuloPrecisionGps) mapaNegosistema.removeLayer(circuloPrecisionGps);

          circuloPrecisionGps = L.circle([lat, lng], {
            radius: precision,
            color: "#3b82f6",
            weight: 1,
            fillColor: "#3b82f6",
            fillOpacity: 0.15,
            interactive: false
          }).addTo(mapaNegosistema);

          const iconoPuntoAzul = L.divIcon({
            className: "contenedor-icono-punto-azul",
            html: '<div class="punto-azul-gps"></div>',
            iconSize:[14, 14],
            iconAnchor: [7, 7]
          });

          marcadorUsuarioGps = L.marker([lat, lng], { icon: iconoPuntoAzul }).addTo(mapaNegosistema);
          marcadorUsuarioGps.bindPopup("<b style='color:#0f172a;'>Estás aquí</b><br><span style='font-size:11px; color:#64748b;'>Navegando por el barrio</span>");

          mapaNegosistema.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
          botonGps.style.color = "#0f172a";
        },
        (error) => {
          console.error("Error al obtener la geolocalización activa:", error);
          botonGps.style.color = "#ef4444";
          setTimeout(() => { botonGps.style.color = "#0f172a"; }, 2000);
          if (error.code === error.PERMISSION_DENIED) {
            alert("Por favor, activa los permisos de ubicación en tu celular para ver tu posición en el mapa.");
          } else {
            alert("No fue posible determinar tu ubicación. Inténtalo de nuevo en unos segundos.");
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  }

}); 
function transformarCoordenadasWKT(cadenaWKT) {
 if (!cadenaWKT || !String(cadenaWKT).toUpperCase().trim().startsWith("POLYGON")) return [];
 
 // Limpieza absoluta de la estructura de control WKT conservando el orden original
 let textoLimpio = String(cadenaWKT)
 .replace(/POLYGON/i, "")
 .replace(/\(/g, "")
 .replace(/\)/g, "")
 .trim();
 
 // Dividimos cada vértice por la coma
 return textoLimpio.split(",").map(par => {
 // \s+ es el secreto GIS: intercepta 1 o infinitos espacios en blanco, tabuladores o saltos de línea
 const ejes = par.trim().split(/\s+/);
 
 if (ejes.length < 2) return null;
 
 const lng = parseFloat(ejes[0]);
 const lat = parseFloat(ejes[1]);
 
 // Retorna la estructura nativa que Leaflet espera para dibujar e interpretar [Lat, Lng]
 return (!isNaN(lat) && !isNaN(lng)) ? [lat, lng] : null;
 }).filter(coord => coord !== null);
}

function limpiarLienzoMilisegundos() {
  if (capaPoligonosActivos && mapaNegosistema) {
    mapaNegosistema.removeLayer(capaPoligonosActivos);
  }
  if (capaPinesActivos && mapaNegosistema) {
    mapaNegosistema.removeLayer(capaPinesActivos);
  }
  if (window.contenedorPinesGlobal && typeof window.contenedorPinesGlobal.clearLayers === 'function') {
    window.contenedorPinesGlobal.clearLayers();
  }
  if (mapaNegosistema) {
    capaPoligonosActivos = L.featureGroup().addTo(mapaNegosistema);
    const tieneClusterLib = typeof L.markerClusterGroup === 'function';
    const esVistaComercial = document.getElementById("mapa-comercial-contenedor") || document.getElementById("mapa_general");
    
    if (!esVistaComercial || !tieneClusterLib) {
      capaPinesActivos = L.featureGroup().addTo(mapaNegosistema);
    }
  }
}
function verificarYFiltarAlcaldias() {
  Papa.parse(URL_CSV_ALCALDIAS, {
    download: true,
    complete: function(results) {
      const filas = results.data.slice(1);
      const activas = filas.filter(f => {
        if (!f[COL_ALCALDIA.CVEGEO]) return false;
        const estatus = (f[COL_ALCALDIA.ESTATUS] || "").trim().toLowerCase();
        return estatus === "activo" || estatus === "explorando";
      });
      renderizarAlcaldiasMacro(activas);
    }
  });
}

function renderizarAlcaldiasMacro(alcaldiasActivas) {
  fetch("geo/alcaldias.geojson")
    .then(response => response.json())
    .then(geojsonData => {
      const contenedorBotones = document.getElementById("contenedor-botones-dinamicos");
      if (contenedorBotones) contenedorBotones.innerHTML = "";
      L.geoJSON(geojsonData, {
        style: function(feature) {
          const cvegeoGeojson = String(feature.properties.CVEGEO).trim();
          const datosCSV = alcaldiasActivas.find(a => String(a[COL_ALCALDIA.CVEGEO]).trim() === cvegeoGeojson);
          return datosCSV ? { fillColor: datosCSV[COL_ALCALDIA.COLOR_HEX] || "#3498db", weight: 2.5, opacity: 1, color: "#ffffff", fillOpacity: 0.75 } : { fillOpacity: 0, weight: 0, color: "transparent" };
        },
        onEachFeature: function(feature, layer) {
          const cvegeoGeojson = String(feature.properties.CVEGEO).trim();
          const nombreGeo = feature.properties.NOMGEO; 
          const datosCSV = alcaldiasActivas.find(a => String(a[COL_ALCALDIA.CVEGEO]).trim() === cvegeoGeojson);
          if (datosCSV) {
            const nombreURLLimpio = nombreGeo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "");
            const urlDestino = "index.html?alcaldia=" + nombreURLLimpio;
            layer.on("click", () => { window.location.href = urlDestino; });
            if (contenedorBotones) {
              const boton = document.createElement("a");
              boton.className = "btn-accesibilidad-macro";
              boton.innerText = nombreGeo.trim();
              boton.href = urlDestino;
              boton.style.borderColor = datosCSV[COL_ALCALDIA.COLOR_HEX];
              boton.style.display = "inline-block";
              contenedorBotones.appendChild(boton);
            }
          }
        }
      }).addTo(capaPoligonosActivos);
    });
}
function cargarMapaColonias(alcaldiaNombre) {
  fetch(`geo/${alcaldiaNombre}/${alcaldiaNombre}.geojson`)
    .then(response => response.json())
    .then(geojsonData => {
      limpiarLienzoMilisegundos();
      const capaGeo = L.geoJSON(geojsonData).addTo(capaPoligonosActivos);
      mapaNegosistema.fitBounds(capaGeo.getBounds(), { padding: [30, 30] });
      if (document.getElementById("texto-guia")) {
        document.getElementById("texto-guia").innerText = "Selecciona una Colonia";
      }
      
      Papa.parse(URL_CSV_COLONIAS, {
        download: true,
        complete: function(coloniasResults) {
          const filasColonias = coloniasResults.data.slice(1);
          const contenedorBotones = document.getElementById("contenedor-botones-dinamicos");
          if (contenedorBotones) contenedorBotones.innerHTML = "";
          filasColonias.forEach(colonia => {
            const cadenaWKT = colonia[COL_COLONIA.WKT];
            const nombreColonia = colonia[COL_COLONIA.NOMBRE];
            const estatus = (colonia[COL_COLONIA.ESTATUS] || "").trim().toLowerCase();
            if ((estatus === "activo" || estatus === "explorando") && cadenaWKT) {
              const coords = transformarCoordenadasWKT(cadenaWKT);
              if (coords.length === 0) return;
              const nombreURLLimpio = nombreColonia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "");
              const urlDestino = `comercial.html?colonia=${nombreURLLimpio}&entorno=productos`;
              const poligonocol = L.polygon(coords, { fillColor: estatus === "activo" ? "#2ecc71" : "#f1c40f", weight: 1.5, opacity: 1, color: "#ffffff", fillOpacity: 0.5 }).addTo(capaPoligonosActivos);
              poligonocol.on("click", () => { window.location.href = urlDestino; });
              if (contenedorBotones) {
                const boton = document.createElement("button");
                boton.className = "btn-accesibilidad-micro";
                boton.innerText = nombreColonia;
                boton.addEventListener("click", () => { window.location.href = urlDestino; });
                contenedorBotones.appendChild(boton);
              }
            }
          });
        }
      });
    }).catch(err => { if (document.getElementById("texto-guia")) document.getElementById("texto-guia").innerText = "Error al cargar las colonias de esta región"; });
}

function configurarSwitchEntornos() {
  const btnSwitch = document.getElementById("btn-switch-entorno");
  if (!btnSwitch) return;
  
  btnSwitch.replaceWith(btnSwitch.cloneNode(true));
  const botonActivo = document.getElementById("btn-switch-entorno");
  botonActivo.addEventListener("click", function() {
    if (this.getAttribute("data-entorno") === "productos") {
      this.setAttribute("data-entorno", "servicios");
      this.innerHTML = 'Ver Productos <span id="emoji-switch">🍎</span>';
      entornoActual = "servicios";
    } else {
      this.setAttribute("data-entorno", "productos");
      this.innerHTML = 'Ver Servicios <span id="emoji-switch">🛠️</span>';
      entornoActual = "productos";
    }
    filtrarPinesPorCapasActivas();
  });
}
// ==========================================================
// SECCIÓN 4A: INGESTA HIPERLOCAL Y MODO PILOTO (JS)
// ==========================================================
function inicializarModoHiperlocal(coloniaFiltro) {
  if (coloniaFiltro) {
    // 🛠️ GRABACIÓN MAGNÉTICA AUTOMÁTICA
    localStorage.setItem("ultima_colonia_explorada", coloniaFiltro);
    
    // Obtenemos la alcaldía actual directamente desde el texto guía o la URL macro
    const paramsMacro = new URLSearchParams(window.location.search);
    let alcaldiaOrigen = paramsMacro.get("alcaldia");
    
    // Si la URL de comercial no la trae, la deducimos de forma inteligente
    if (!alcaldiaOrigen) {
      // Como tu sistema navega en cascada, guardamos una marca genérica o la actual activa
      alcaldiaOrigen = "iztapalapa"; // Alcaldía piloto por defecto del árbol de carpetas
    }
    
    localStorage.setItem("ultima_alcaldia_explorada", alcaldiaOrigen);
  }
  
  const elementoTitulo = document.getElementById("titulo-colonia-actual");
  if (elementoTitulo && coloniaFiltro) {
    elementoTitulo.innerText = "Colonia: " + coloniaFiltro.replace(/-/g, " ").toUpperCase();
  }
  
  
  Papa.parse(URL_CSV_COLONIAS, {
    download: true,
    complete: function(coloniasResults) {
      const filasColonias = coloniasResults.data.slice(1);
      const contenedorAledanas = document.getElementById("contenedor-colonias-aledanas");
      if (contenedorAledanas) {
        contenedorAledanas.innerHTML = "";
      }

      // ========================================================
      // ENFOQUE GIS: DIBUJO AUTOMÁTICO DE LA FRANJA NEGRA PERIMETRAL
      // ========================================================
      const normalizarTextoGIS = (str) => {
        return String(str || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remueve acentos de forma segura
          .replace(/[^a-z0-9]/g, "")       // Deja solo letras y números
          .trim();
      };

      const tokenBusqueda = normalizarTextoGIS(coloniaFiltro);

      const filaColoniaActiva = filasColonias.find(c => {
        return normalizarTextoGIS(c[COL_COLONIA.NOMBRE]) === tokenBusqueda;
      });

      if (filaColoniaActiva && filaColoniaActiva[COL_COLONIA.WKT]) {
        const coordsBorde = transformarCoordenadasWKT(filaColoniaActiva[COL_COLONIA.WKT]);
        if (coordsBorde.length > 0) {
          const poligonoLimiteColonia = L.polygon(coordsBorde, {
            color: "#000000",
            weight: 4, // Franja negra robusta y bien definida
            opacity: 0.9,
            fillColor: "#000000",
            fillOpacity: 0.03, // Fondo sutil casi transparente
            dashArray: "1, 1",
            interactive: false
          }).addTo(mapaNegosistema);

          // 🔥 ENCUADRE DE CÁMARA AUTOMÁTICO EN TIEMPO REAL
          if (mapaNegosistema) {
            mapaNegosistema.fitBounds(poligonoLimiteColonia.getBounds(), {
              padding:[30, 30], // Margen de seguridad estético en píxeles
              maxZoom: 16,       // Limita el zoom para mantener la escala comercial
              animate: true,
              duration: 1.2      // Transición fluida de la cámara
            });
          }
        }
      }

      // ========================================================

      // Dibujo de los botones de las colonias vecinas (Salto de Rana)
      filasColonias.forEach(colonia => {
        const nombreColonia = colonia[COL_COLONIA.NOMBRE];
        const estatus = (colonia[COL_COLONIA.ESTATUS] || "").trim().toLowerCase();
        if (nombreColonia && (estatus === "activo" || estatus === "explorando")) {
          const nombreURLLimpio = nombreColonia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "");
          if (nombreURLLimpio !== String(coloniaFiltro).toLowerCase().trim()) {
            const botonVecino = document.createElement("button");
            botonVecino.className = "btn-accesibilidad-dinamico"; 
            botonVecino.innerText = nombreColonia;
            botonVecino.style.borderLeft = estatus === "explorando" ? "4px solid #f1c40f" : "4px solid #2ecc71";
            botonVecino.addEventListener("click", () => { 
              window.location.href = "comercial.html?colonia=" + nombreURLLimpio + "&entorno=productos"; 
            });
            if (contenedorAledanas) contenedorAledanas.appendChild(botonVecino);
          }
        }
      });

      // DISPARADOR SECUENCIAL: Llama a la Sección 12 para cargar los negocios y filtros
      cargarDatosComerciosHiperlocales(coloniaFiltro);

    } // Cierre de complete
  }); // Cierre de Papa.parse
} // Cierre de la función inicializarModoHiperlocal
// ==========================================================================
// SECCIÓN 4A: INGESTA HIPERLOCAL Y MODO PILOTO UNIFICADO CON OFERTAS (JS)
// ==========================================================================
function cargarDatosComerciosHiperlocales(coloniaFiltro) {
    console.log("Iniciando motor de descarga unificado Negosistema...");
    
    // 1. DESCARGA PRIORITARIA DE OFERTAS (Evita Rate Limit de Google)
    Papa.parse(URL_CSV_OFERTAS, {
        download: true,
        skipEmptyLines: true,
        complete: function(ofertasResults) {
            const filasOfertasRaw = ofertasResults.data;
            if (filasOfertasRaw && filasOfertasRaw.length > 0) {
                const primeraFilaTexto = JSON.stringify(filasOfertasRaw[0]).toLowerCase();
                // Limpieza segura de cabeceras en memoria global
                window.datosOfertasGlobales = primeraFilaTexto.includes("temporal") || primeraFilaTexto.includes("folio") ? filasOfertasRaw.slice(1) : filasOfertasRaw;
            } else {
                window.datosOfertasGlobales = [];
            }
            console.log("Ofertas sincronizadas en caché global. Descargando comercios...");

            // 2. DESCARGA ENCADENADA DE COMERCIOS (Se ejecuta inmediatamente después)
            Papa.parse(URL_CSV_COMERCIOS, {
                download: true,
                skipEmptyLines: true,
                complete: function(comerciosResults) {
                    // Compartimos la base de datos completa de comercios al objeto window
                    window.datosComerciosGlobales = comerciosResults.data.slice(1);
                    const todasLasFilas = comerciosResults.data.slice(1);
                    
                    // --- CONTINÚA TU LÓGICA DE GEOMARKETING ORIGINAL ---
                    // 1. OBTENER COORDENADAS PROMEDIO DE LA COLONIA ACTUAL ANTES DEL FILTRADO
                    const comerciosLocalesBase = todasLasFilas.filter(f => {
                        const colCSV = (f[COL_COMERCIO.COLONIA] || "").toLowerCase().replace(/ /g, "");
                        return colCSV === String(coloniaFiltro).toLowerCase().replace(/ /g,"");
                    });
                    
                    let latCentroColonia = 19.373; // Coordenadas de respaldo
                    let lngCentroColonia = -99.018;
                    let conteoValidas = 0;
                    let sumaLat = 0;
                    let sumaLng = 0;
                    
                    comerciosLocalesBase.forEach(f => {
                        const coordRaw = String(f[COL_COMERCIO.COORDENADAS]).trim();
                        if (coordRaw.includes(",")) {
                            const [lat, lng] = coordRaw.split(",").map(num => parseFloat(num.trim()));
                            if (!isNaN(lat) && !isNaN(lng)) {
                                sumaLat += lat;
                                sumaLng += lng;
                                conteoValidas++;
                            }
                        }
                    });
                    
                    if (conteoValidas > 0) {
                        latCentroColonia = sumaLat / conteoValidas;
                        lngCentroColonia = sumaLng / conteoValidas;
                    }
                    
                    // 2. FILTRADO CON EXPANSIÓN GEOGRÁFICA COBERTURA PREMIUM (NIVEL 5 - HAVERSINE)
                    datosComerciosGlobales = todasLasFilas.filter(f => {
                        if (!f || f.length < 7) return false;
                        
                        const colCSV = (f[COL_COMERCIO.COLONIA] || "").toLowerCase().replace(/ /g, "");
                        const esDeEstaColonia = (colCSV === String(coloniaFiltro).toLowerCase().replace(/ /g,""));
                        
                        if (esDeEstaColonia) return true;
                        
                        const nivelNegocio = parseInt(f[COL_COMERCIO.NIVEL]) || 1;
                        const coordRaw = String(f[COL_COMERCIO.COORDENADAS]).trim();
                        
                        if (nivelNegocio === 5 && coordRaw.includes(",")) {
                            const [latN5, lngN5] = coordRaw.split(",").map(num => parseFloat(num.trim()));
                            if (!isNaN(latN5) && !isNaN(lngN5)) {
                                // Invoca a tu función Haversine de la página 37
                                const distanciaEnKm = calcularDistanciaEntreCoordenadas(latCentroColonia, lngCentroColonia, latN5, lngN5);
                                return distanciaEnKm <= 2.0; 
                            }
                        }
                        return false;
                    }).map(fila => {
                        let fNorm = [];
                        fNorm[COL_COMERCIO.ID] = fila[COL_COMERCIO.ID] || "";
                        fNorm[COL_COMERCIO.COLONIA] = fila[COL_COMERCIO.COLONIA] || "";
                        
                        const tipoMapaCrudo = String(fila[COL_COMERCIO.MAPA] || "").toLowerCase().trim();
                        fNorm[COL_COMERCIO.MAPA] = tipoMapaCrudo.includes("serv") ? "servicios" : "productos";
                        
                        const capaFinalProd = String(fila[COL_COMERCIO.CAPA_PRODUCTO] || "").trim().toLowerCase();
                        const capaFinalServ = String(fila[COL_COMERCIO.CAPA_SERVICIO] || "").trim().toLowerCase();
                        
                        fNorm[COL_COMERCIO.CAPA_PRODUCTO] = (capaFinalProd === "" || capaFinalProd === "vacio") ? "base" : capaFinalProd;
                        fNorm[COL_COMERCIO.CAPA_SERVICIO] = (capaFinalServ === "" || capaFinalServ === "vacio") ? "base" : capaFinalServ;
                        
                        fNorm[COL_COMERCIO.NIVEL] = fila[COL_COMERCIO.NIVEL] || "1"; 
                        fNorm[COL_COMERCIO.NOMBRE] = fila[COL_COMERCIO.NOMBRE] || "";
                        fNorm[COL_COMERCIO.SLOGAN] = fila[COL_COMERCIO.SLOGAN] || "";
                        fNorm[COL_COMERCIO.LISTA_PROD_SERV] = fila[COL_COMERCIO.LISTA_PROD_SERV] || "";
                        fNorm[COL_COMERCIO.HORARIO] = fila[COL_COMERCIO.HORARIO] || "";
                        fNorm[COL_COMERCIO.REDES] = fila[COL_COMERCIO.REDES] || "";
                        fNorm[COL_COMERCIO.YOUTUBE] = fila[COL_COMERCIO.YOUTUBE] || "";
                        fNorm[COL_COMERCIO.WHATSAPP] = fila[COL_COMERCIO.WHATSAPP] || "";
                        fNorm[COL_COMERCIO.COORDENADAS] = fila[COL_COMERCIO.COORDENADAS] || "";
                        fNorm[COL_COMERCIO.MAPS_LINK] = fila[COL_COMERCIO.MAPS_LINK] || "";
                        fNorm[COL_COMERCIO.LOGO] = fila[COL_COMERCIO.LOGO] || "default_comercio.png";
                        return fNorm;
                    });
                    
                    entornoActual = "productos";
                    const btnSwitch = document.getElementById("btn-switch-entorno");
                    if (btnSwitch) {
                        btnSwitch.setAttribute("data-entorno", "productos");
                        btnSwitch.innerHTML = 'Ver Servicios <span id="emoji-switch">⚙️</span>';
                    }
                    
                    reconstruirBotonesCapasInferiores();
                    if (typeof inicializarBuscadorPredictivo === "function") {
                        inicializarBuscadorPredictivo();
                    }
                    configurarSwitchEntornos();
                    window.esCargaInicialEntorno = true;
                    filtrarPinesPorCapasActivas();

                    // DISPARADOR MAESTRO DEL SLIDER: Inyecta las ofertas en la vista comercial
                    if (typeof procesarYRenderizarSliderComercial === "function") {
                        procesarYRenderizarSliderComercial(coloniaFiltro);
                    }
                }
            });
        }
    });
}

// ==========================================================
// SECCIÓN: BUSCADOR PREDICTIVO GEOLOCALIZADO (PARTE 1 DE 2)
// ==========================================================
function inicializarBuscadorPredictivo() {
  const inputBuscar = document.getElementById("input-buscador-predictivo");
  const contenedorResultados = document.getElementById("resultados-autocompletado");
  if (!inputBuscar || !contenedorResultados) return;

  // Monitoreo pasivo de la ubicación del dispositivo móvil del vecino
  let coorUsuario = null;
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => { coorUsuario = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
      (err) => { console.log("Navegación por GPS declinada. Usando centro de colonia para ordenamiento."); },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }

  inputBuscar.addEventListener("input", function() {
    const query = this.value.toLowerCase().trim();
    contenedorResultados.innerHTML = "";
    if (!query) { 
      contenedorResultados.style.display = "none"; 
      return; 
    }

    // 1. Filtrar coincidencias por palabras clave en los campos de texto
    let coincidencias = datosComerciosGlobales.filter(comercio => {
      return String(comercio[COL_COMERCIO.NOMBRE]).toLowerCase().includes(query) ||
             String(comercio[COL_COMERCIO.SLOGAN]).toLowerCase().includes(query) ||
             String(comercio[COL_COMERCIO.LISTA_PROD_SERV]).toLowerCase().includes(query);
    });

    if (coincidencias.length === 0) {
      contenedorResultados.innerHTML = `<div style="padding:12px; color:#64748b; font-size:13px; text-align:center;">No se encontraron resultados</div>`;
      contenedorResultados.style.display = "block";
      return;
    }

    // 2. CÁLCULO DE MATRIZ DE DISTANCIAS EN TIEMPO REAL PARA EL ORDENAMIENTO
    coincidencias = coincidencias.map(comercio => {
      const coordRaw = String(comercio[COL_COMERCIO.COORDENADAS]).trim();
      let distanciaCalculada = 99999; // Distancia infinita por si no tiene coordenadas válidas

      if (coordRaw.includes(",")) {
        const [latC, lngC] = coordRaw.split(",").map(num => parseFloat(num.trim()));
        if (!isNaN(latC) && !isNaN(lngC)) {
          if (coorUsuario) {
            // Ordenar por distancia real al celular del usuario
            distanciaCalculada = calcularDistanciaEntreCoordenadas(coorUsuario.lat, coorUsuario.lng, latC, lngC);
          } else if (typeof latCentroColonia !== "undefined" && typeof lngCentroColonia !== "undefined") {
            // Respaldar ordenando por cercanía al centro de la colonia actual
            distanciaCalculada = calcularDistanciaEntreCoordenadas(latCentroColonia, lngCentroColonia, latC, lngC);
          }
        }
      }
      return { datos: comercio, distancia: distanciaCalculada };
    });

    // 3. ORDENAR AUTOMÁTICAMENTE DE MENOR A MAYOR DISTANCIA (MÁS CERCANO PRIMERO)
    coincidencias.sort((a, b) => a.distancia - b.distancia);
    // ==========================================================
    // SECCIÓN: BUSCADOR PREDICTIVO GEOLOCALIZADO (PARTE 2 DE 2)
    // ==========================================================
    // Tomamos los 8 locales comerciales más cercanos que coinciden
    coincidencias.slice(0, 8).forEach(itemObjeto => {
      const comercio = itemObjeto.datos;
      const distancia = itemObjeto.distancia;
      const item = document.createElement("div");
      item.className = "item-predictivo-buscar";
      
      const entCom = comercio[COL_COMERCIO.MAPA];
      const capId = (entCom === "productos") ? comercio[COL_COMERCIO.CAPA_PRODUCTO] : comercio[COL_COMERCIO.CAPA_SERVICIO];
      const conf = PALETAS_CAPAS_SISTEMA[entCom].find(c => c.id === capId) || {color:"#94a3b8", label:"General"};
      
      // Formatear el texto de la distancia para el vecino (Metros o Kilómetros)
      let textoDistancia = "";
      if (distancia !== 99999) {
        textoDistancia = distancia < 1 
          ? `📍 A ${Math.round(distancia * 1000)}m` 
          : `📍 A ${distancia.toFixed(1)} km`;
      }

      item.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <strong style="display:block; color:#0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${comercio[COL_COMERCIO.NOMBRE]}</strong>
          <span style="font-size:11px; color:#64748b; display:block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${comercio[COL_COMERCIO.SLOGAN]}</span>
          <span style="font-size:10px; color:#10b981; font-weight: 600; margin-top: 2px; display: inline-block;">${textoDistancia}</span>
        </div>
        <span class="badge-categoria-buscar" style="background-color:${conf.color}; flex-shrink: 0; margin-left: 8px;">${conf.label}</span>
      `;

      item.addEventListener("click", () => {
        inputBuscar.value = comercio[COL_COMERCIO.NOMBRE];
        contenedorResultados.style.display = "none";
        
        if (entornoActual !== entCom) {
          entornoActual = entCom;
          const btn = document.getElementById("btn-switch-entorno");
          if (btn) {
            btn.setAttribute("data-entorno", entornoActual);
            btn.innerHTML = entornoActual === "productos" ? 'Ver Servicios <span id="emoji-switch">⚙️</span>' : 'Ver Productos <span id="emoji-switch">🍎</span>';
          }
        }
        
        const chk = document.querySelector(`.filtro-capa-chk[data-capa="${capId}"][data-tipo="${entCom}"]`);
        if (chk) chk.checked = true;
        filtrarPinesPorCapasActivas();
        
        const coordRaw = String(comercio[COL_COMERCIO.COORDENADAS]).trim();
        if (coordRaw.includes(",")) {
          const [lat, lng] = coordRaw.split(",").map(num => parseFloat(num.trim()));
          mapaNegosistema.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
          
          setTimeout(() => {
            window.contenedorPinesGlobal.eachLayer(function(layer) {
              if (layer instanceof L.Marker && Math.abs(layer.getLatLng().lat - lat) < 0.0001 && Math.abs(layer.getLatLng().lng - lng) < 0.0001) {
                layer.openPopup();
              }
            });
          }, 1300);
        }
      });
      contenedorResultados.appendChild(item);
    });
    
    contenedorResultados.style.display = "block";
  });

  document.addEventListener("click", function(e) {
    if (!inputBuscar.contains(e.target) && !contenedorResultados.contains(e.target)) {
      contenedorResultados.style.display = "none";
    }
  });
}

function inicializarModoAnunciatePiloto() {
  if (!window.contenedorPinesGlobal && mapaNegosistema) {
    window.contenedorPinesGlobal = L.markerClusterGroup({ 
      maxClusterRadius: 35, 
      iconCreateFunction: iconCreateFunctionDona 
    }).addTo(mapaNegosistema);
  }
  
  Papa.parse(URL_CSV_PILOTO, { 
    download: true, 
    skipEmptyLines: true, 
    error: function() { }, 
    complete: function(results) {
      const contenedorFiltros = document.getElementById("capas-inferiores-contenedor");
      if (!results || !results.data || results.data.length <= 1) return;
      if (contenedorFiltros) contenedorFiltros.innerHTML = "";
      
      datosComerciosGlobales = results.data.slice(1).map(fila => {
        if (!fila || fila.length < 5) return null;
        let fNorm = []; 
        fNorm[COL_COMERCIO.ID] = fila[COL_COMERCIO.ID] || ""; 
        fNorm[COL_COMERCIO.COLONIA] = fila[COL_COMERCIO.COLONIA] || "Piloto";
        fNorm[COL_COMERCIO.MAPA] = String(fila[COL_COMERCIO.MAPA] || "").toLowerCase().trim().includes("serv") ? "servicios" : "productos";
        
        let cFinal = "base"; 
        const rP = String(fila[COL_COMERCIO.CAPA_PRODUCTO] || "").trim().toLowerCase(); 
        const rS = String(fila[COL_COMERCIO.CAPA_SERVICIO] || "").trim().toLowerCase();
        
        if (rP !== "vacio" && rP !== "") cFinal = rP; 
        else if (rS !== "vacio" && rS !== "") cFinal = rS;
        
        if (fNorm[COL_COMERCIO.MAPA] === "productos") { 
          fNorm[COL_COMERCIO.CAPA_PRODUCTO] = cFinal; 
          fNorm[COL_COMERCIO.CAPA_SERVICIO] = "base"; 
        } else { 
          fNorm[COL_COMERCIO.CAPA_PRODUCTO] = "base"; 
          fNorm[COL_COMERCIO.CAPA_SERVICIO] = cFinal; 
        }
        
        fNorm[COL_COMERCIO.NIVEL] = fila[COL_COMERCIO.NIVEL] || "1"; 
        fNorm[COL_COMERCIO.NOMBRE] = fila[COL_COMERCIO.NOMBRE] || "Negocio de Muestra";
        fNorm[COL_COMERCIO.SLOGAN] = fila[COL_COMERCIO.SLOGAN] || ""; 
        fNorm[COL_COMERCIO.LISTA_PROD_SERV] = fila[COL_COMERCIO.LISTA_PROD_SERV] || "";
        fNorm[COL_COMERCIO.HORARIO] = fila[COL_COMERCIO.HORARIO] || ""; 
        fNorm[COL_COMERCIO.REDES] = fila[COL_COMERCIO.REDES] || ""; 
        fNorm[COL_COMERCIO.YOUTUBE] = fila[COL_COMERCIO.YOUTUBE] || "";
        fNorm[COL_COMERCIO.WHATSAPP] = fila[COL_COMERCIO.WHATSAPP] || ""; 
        fNorm[COL_COMERCIO.COORDENADAS] = fila[COL_COMERCIO.COORDENADAS] || ""; 
        fNorm[COL_COMERCIO.MAPS_LINK] = fila[COL_COMERCIO.MAPS_LINK] || "";
        fNorm[COL_COMERCIO.LOGO] = fila[COL_COMERCIO.LOGO] || "default_comercio.png";
        return fNorm;
      }).filter(item => item !== null);

      entornoActual = datosComerciosGlobales.length > 0 ? datosComerciosGlobales[0][COL_COMERCIO.MAPA] : "productos";
      const btn = document.getElementById("btn-switch-entorno");
      if (btn) { 
        btn.setAttribute("data-entorno", entornoActual); 
        btn.innerHTML = entornoActual === "productos" ? 'Ver Servicios <span id="emoji-switch">🛠️</span>' : 'Ver Productos <span id="emoji-switch">🍎</span>'; 
      }
      reconstruirBotonesCapasInferiores(); 
      configurarSwitchEntornos(); 
      window.esCargaInicialEntorno = true; 
      filtrarPinesPorCapasActivas();
    }
  });
}

function reajustarEstructuraCarrusel(contenedor) {
  const items = Array.from(contenedor.querySelectorAll('.carrusel-item')); 
  const dots = Array.from(contenedor.querySelectorAll('.carrusel-dot'));
  if (items.length <= 1) { 
    contenedor.querySelectorAll('.carrusel-nav').forEach(b => b.style.display = 'none'); 
    const dc = contenedor.querySelector('.carrusel-dots-container'); 
    if (dc) dc.style.display = 'none'; 
  }
  if (items.length > 0 && !contenedor.querySelector('.carrusel-item.active')) { 
    items[0].classList.add('active'); 
    if (dots[0]) dots[0].classList.add('active'); 
  }
  dots.forEach((dot, idx) => { dot.setAttribute('onclick', `irASlideMultimedia(this, ${idx})`); });
}

function moverMultimedia(btn, dir) {
  const c = btn.closest('.popup-multimedia-carrusel'); 
  const items = Array.from(c.querySelectorAll('.carrusel-item')); 
  const dots = Array.from(c.querySelectorAll('.carrusel-dot'));
  if (items.length <= 1) return; 
  let act = items.findIndex(i => i.classList.contains('active')); 
  if (act === -1) act = 0;
  items[act].classList.remove('active'); 
  if (dots[act]) dots[act].classList.remove('active');
  let n = (act + dir + items.length) % items.length; 
  items[n].classList.add('active'); 
  if (dots[n]) dots[n].classList.add('active');
}

function irASlideMultimedia(dot, index) {
  const c = dot.closest('.popup-multimedia-carrusel'); 
  c.querySelectorAll('.carrusel-item').forEach(i => i.classList.remove('active')); 
  c.querySelectorAll('.carrusel-dot').forEach(d => d.classList.remove('active'));
  const items = c.querySelectorAll('.carrusel-item'); 
  if (items[index]) items[index].classList.add('active'); 
  dot.classList.add('active');
}

function inyectarPopupComercioInteligente(comercio, nivel) {
 const id = comercio[COL_COMERCIO.ID] || ""; 
 const nombre = comercio[COL_COMERCIO.NOMBRE] || "Establecimiento"; 
 const slogan = comercio[COL_COMERCIO.SLOGAN] || "";
 const listaItems = comercio[COL_COMERCIO.LISTA_PROD_SERV] || ""; 
 const horarios = comercio[COL_COMERCIO.HORARIO] || ""; 
 const redes = comercio[COL_COMERCIO.REDES] || "";
 const youtubeUrl = comercio[COL_COMERCIO.YOUTUBE] || ""; 
 const whatsapp = comercio[COL_COMERCIO.WHATSAPP] || ""; 
 const mapsLinkRaw = comercio[COL_COMERCIO.MAPS_LINK] || "";

 const wazeMatch = mapsLinkRaw.match(/https:\/\/waze\.com\/[^\s"<>]+/);
 const googleMatch = mapsLinkRaw.match(/https:\/\/(?:www\.)?google\.com\/maps\/[^\s"<>]+/);
 const linkWaze = wazeMatch ? wazeMatch[0] : null;
 const linkGoogle = googleMatch ? googleMatch[0] : null;

 if (nivel === 1) {
 return `<div class="popup-nego-contenedor">
 <p style="margin:0; font-size:12px; font-weight:bold; color:#64748B;">Directorio Base Comercial</p>
 <h4 style="margin:4px 0 0 0; font-size:14px; color:#1E293B;">Ubicación en verificación</h4>
 </div>`;
 }
 
 // CABECERA FIJA Y COMPACTA
 let html = `<div class="popup-nego-contenedor" style="position:relative;">
 <div class="popup-nego-header">
 <div class="ui-titulo-fila-contenedor" style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 4px;">
 <h4 class="popup-nego-titulo" style="margin: 0; font-size: 16px; font-weight: 800; color: #0F172A; line-height: 1.2;">${nombre}</h4>
 <span class="popup-id-disenado" style="font-size: 14px; font-weight: 800; color: #64748B; font-family: monospace; background: #F1F5F9; padding: 2px 6px; border-radius: 4px; border: 1px solid #E2E8F0;">#${id}</span>
 </div>`;
 if (slogan) html += `<p class="popup-nego-slogan">"${slogan}"</p>`;
 html += `</div>`;

   // CONTENEDOR DE ACORDEONES (APERTURA OFICIAL DEL GRUPO)
  html += `<div class="popup-acordeon-grupo">`;

  // ==========================================================================
  // SECCIÓN 1: MULTIMEDIA CON CONTROL DE FALLO RETRASADO
  // ==========================================================================
  if (nivel >= 3 && id) {
    const partesIdPopup = String(id).split("-");
    const codigoColoniaPopup = partesIdPopup[1] || "306";
    const esSim = window.location.pathname.includes("anunciate") || !document.getElementById("mapa-comercial-contenedor");

    const rBase = esSim
      ? "geo/iztapalapa/img-nego/anunciate/"
      : `geo/iztapalapa/img-nego/${codigoColoniaPopup}/`;

    let sH = ""; let dH = ""; let sC = 0;
    let tieneVideo = (nivel >= 4 && youtubeUrl && youtubeUrl.trim() !== "" && youtubeUrl !== "vacio");

    for (let i = 1; i <= 3; i++) {
      const rutaImagenFija = `${rBase}${id}-${i}.webp`;

      // Eliminamos la ruta del logo por defecto del onerror. 
      // Ahora, si la imagen falla al abrirse el acordeón, se añade la clase 'img-inexistente'
      sH += `
      <div class="carrusel-item ${sC===0?'active':''}" data-slide-index="${i}">
        <img src="${rutaImagenFija}"
             class="popup-img-carrusel-fija"
             alt="Imagen ${i}"
             style="width:100%; height:100%; object-fit:cover;"
             onerror="this.classList.add('img-inexistente'); verificarVisibilidadAcordeon(this);"
        >
      </div>`;

      dH += `<span class="carrusel-dot ${sC===0?'active':''}" data-dot-index="${i}"></span>`;
      sC++;
    }

    if (tieneVideo) {
      let vId = "";
      if (youtubeUrl.includes("v=")) vId = youtubeUrl.split("v=")[1].split("&")[0];
      else if (youtubeUrl.includes("youtu.be/")) vId = youtubeUrl.split("youtu.be/")[1].split("?")[0];
      else if (youtubeUrl.includes("shorts/")) vId = youtubeUrl.split("shorts/")[1].split("?")[0].split("&")[0];

      if (vId && vId.trim() !== "") {
        sH += `<div class="carrusel-item" data-slide-index="video"><iframe data-src="https://youtube.com/embed/${vId.trim()}" class="carrusel-media-elemento lazy-popup-iframe" allowfullscreen style="width:100%; height:100%; border:none;"></iframe></div>`;
        dH += `<span class="carrusel-dot" data-dot-index="video"></span>`;
      }
    }

    // Le añadimos la clase fija 'bloque-multimedia-contenedor' para poder rastrearlo con CSS/JS
    html += `
    <div class="acordeon-item bloque-multimedia-contenedor" data-has-video="${tieneVideo}">
      <button class="acordeon-disparador" onclick="alternarAcordeonSeccion(this)">
        <span>📸 Galería Multimedia y Video</span> <i class="flecha-icono">▼</i>
      </button>
      <div class="acordeon-contenido">
        <div class="popup-multimedia-carrusel" style="padding-top: 10px;">
          <div class="carrusel-viewport">${sH}</div>
          <button class="carrusel-nav prev" onclick="moverMultimedia(this, -1)">❮</button>
          <button class="carrusel-nav next" onclick="moverMultimedia(this, 1)">❯</button>
          <div class="carrusel-dots-container">${dH}</div>
        </div>
      </div>
    </div>`;
  }

  // ==========================================================================
  // SECCIÓN 2: LISTA DE PRODUCTOS O SERVICIOS TRADUCIDA AUTOMÁTICAMENTE
  // ==========================================================================
  if (listaItems) {
    let htmlBadgesServicio = "";
    if (nivel >= 4) {
      const textoAnalizar = String(listaItems).toLowerCase();
      const palabrasEnvio = ["envio", "domicilio", "reparto", "entregamos", "lleva", "mandamos", "enviamos"];
      const palabrasGratis = ["gratis", "sin costo", "incluido", "cortesia"];
      const palabrasLlevar = ["llevar", "pasar", "recoger", "takeout", "pick up"];

      let tieneEntrega = palabrasEnvio.some(palabra => textoAnalizar.includes(palabra));
      let esGratis = palabrasGratis.some(palabra => textoAnalizar.includes(palabra));
      let tieneParaLlevar = palabrasLlevar.some(palabra => textoAnalizar.includes(palabra));

      htmlBadgesServicio = `<div class="contenedor-micro-badges-ui" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">`;

      if (tieneEntrega) {
        if (esGratis) {
          htmlBadgesServicio += `<span class="badge-micro-item" style="background: #e6f4ea; color: #137333; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">🛵 Entrega Gratis</span>`;
        } else {
          htmlBadgesServicio += `<span class="badge-micro-item" style="background: #e8f0fe; color: #1a73e8; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">📦 Envío a Domicilio</span>`;
        }
      }
      if (tieneParaLlevar) {
        htmlBadgesServicio += `<span class="badge-micro-item" style="background: #fef7e0; color: #b06000; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">🛍️ Ordena y Recoge</span>`;
      }
      htmlBadgesServicio += `</div>`;

      if (!tieneEntrega && !tieneParaLlevar) {
        htmlBadgesServicio = "";
      }
    }

    // 🔥 EL CAMBIO MAESTRO: Pasamos la lista de items por nuestro formateador de comas inteligente
    const htmlMenuEstructurado = procesarListaItemsConComas(listaItems);

    html += `
    <div class="acordeon-item">
      <button class="acordeon-disparador" onclick="alternarAcordeonSeccion(this)">
        <span>📋 ${entornoActual==="productos"?"Productos":"Servicios"} y Menú</span> <i class="flecha-icono">▼</i>
      </button>
      <div class="acordeon-contenido">
        <div class="popup-nego-seccion" style="padding: 12px 14px;">
          ${htmlBadgesServicio}
          <div class="popup-nego-contenido">
            ${htmlMenuEstructurado}
          </div>
        </div>
      </div>
    </div>`;
  }

    // ==========================================================================
  // SECCIÓN 3: REINCORPORACIÓN DE HORARIOS (CON CRONÓMETRO DE CONTEO REGRESIVO)
  // ==========================================================================
  if (nivel >= 3 && horarios) {
    html += `
    <div class="acordeon-item">
      <button class="acordeon-disparador" onclick="alternarAcordeonSeccion(this)">
        <span>⏰ Horario de Atención</span> <i class="flecha-icono">▼</i>
      </button>
      <div class="acordeon-contenido">
        <div class="popup-nego-seccion" style="padding-top: 10px;">
          <div id="cronometro-contenedor-modulo" data-horario-crudo="${horarios}">
            <span class="reloj-cargando">Calculando...</span>
          </div>
          <span class="popup-nego-label" style="margin-top:6px; display:block; font-weight:700; font-size:11px; color:#64748b; text-transform:uppercase;">Horario Completo:</span>
          <span class="popup-nego-contenido" style="font-size:13px; color:#334155;">${horarios}</span>
        </div>
      </div>
    </div>`;
  }

  // ==========================================================================
  // SECCIÓN 4: REDES SOCIALES (SITIO WEB / LANDING PAGE)
  // ==========================================================================
  if (nivel >= 4 && redes) {
    html += `
    <div class="acordeon-item">
      <button class="acordeon-disparador" onclick="alternarAcordeonSeccion(this)">
        <span>🌐 Canales Digitales</span> <i class="flecha-icono">▼</i>
      </button>
      <div class="acordeon-contenido">
        <div class="popup-nego-seccion" style="padding: 10px 0;"><a href="${redes}" target="_blank" class="enlace-web-profesional" style="display:block; text-align:center; background:#0f172a; color:#fff; text-decoration:none; padding:8px; border-radius:6px; font-size:13px; font-weight:600;">Visitar Sitio Web Oficial</a></div>
      </div>
    </div>`;
  }

  html += `</div>`; // Cierre definitivo y seguro de .popup-acordeon-grupo

  // ==========================================================================
  // BOTONES DE ACCIÓN ICONOGRÁFICOS INFERIORES (CON NUEVA MOTITO DE ENTREGA)
  // ==========================================================================
  html += `
  <div class="popup-seccion-enlaces-contenedor" style="margin-top:12px; border-top:1px solid #e2e8f0; padding-top:10px;">
    <span class="popup-enlaces-subtitulo-ui" style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:8px;">Contacto y Navegación</span>
    <div class="popup-nego-botones-circulares" style="display:flex; gap:8px; align-items:center;">
  `;

  // 1. Botón Universal de WhatsApp
  if (nivel >= 4 && whatsapp && String(whatsapp).trim() !== "") {
    html += `
    <a href="${String(whatsapp).trim()}" target="_blank" class="btn-circular-ui btn-ui-wa" title="WhatsApp" style="width:36px; height:36px; border-radius:50%; background:#25D366; color:white; display:flex; align-items:center; justify-content:center; text-decoration:none;">
      <svg style="width:20px; height:20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M12.004 2c-5.523 0-10 4.477-10 10a9.95 9.95 0 0 0 1.393 5.075L2 22l5.121-1.344A9.95 9.95 0 0 0 12.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 1.5c4.687 0 8.5 3.813 8.5 8.5s-3.813 8.5-8.5 8.5a8.45 8.45 0 0 1-4.321-1.185l-.309-.181-3.053.801.815-2.973-.2-.33A8.44 8.44 0 0 1 3.504 12c0-4.687 3.813-8.5 8.5-8.5zm-3.553 4.54a.65.65 0 0 0-.47.22c-.156.17-.597.583-.597 1.42s.61 1.64.695 1.76c.086.115 1.177 1.796 2.85 2.517.399.172.71.274.953.351.401.127.766.109 1.054.066.32-.047 1.055-.43 1.203-.844.148-.414.148-.77.104-.844-.044-.074-.162-.117-.339-.205-.178-.089-1.055-.52-1.218-.58-.163-.059-.281-.088-.4.089-.118.177-.457.577-.56.695-.104.118-.207.133-.385.044-.177-.089-.75-.276-1.428-.881-.527-.47-.883-.995-1.06-1.113-.178-.118-.019-.182.07-.27.079-.08.177-.207.266-.31.089-.104.118-.178.177-.296.059-.119.03-.222-.015-.311-.044-.088-.4-1.02-.548-1.378-.144-.347-.291-.3-.4-.3z"/></svg>
    </a>`;
  }

  // 2. NUEVO BOTÓN DE CONVERSIÓN DE MARKETING: ACCIÓN DE REPARTO / ENTREGA A DOMICILIO (🛵)
  if (nivel >= 4 && listaItems) {
    const textoAnalizar = String(listaItems).toLowerCase();
    const palabrasEnvio = ["envio", "domicilio", "reparto", "entregamos", "lleva", "mandamos", "enviamos"];
    let tieneEntrega = palabrasEnvio.some(palabra => textoAnalizar.includes(palabra));

    if (tieneEntrega && whatsapp && String(whatsapp).trim() !== "") {
      // Estrategia de conversión: Si tiene envío, creamos un enlace directo de pedido por WhatsApp con un mensaje pre-cargado
      const linkPedidoEnvio = `${String(whatsapp).trim()}&text=¡Hola!%20Vi%20en%20el%20mapa%20que%20tienen%20servicio%20a%20domicilio.%20Me%20gustaría%20hacer%20un%20pedido.`;
      
      html += `
      <a href="${linkPedidoEnvio}" target="_blank" class="btn-circular-ui btn-ui-delivery" title="Pedir a Domicilio" style="width:36px; height:36px; border-radius:50%; background:#e6f4ea; color:#137333; display:flex; align-items:center; justify-content:center; text-decoration:none; border: 1px solid #137333;">
        <span style="font-size:16px;">🛵</span>
      </a>`;
    }
  }

  // 3. Botón de Google Maps
  if (linkGoogle) {
    html += `
    <a href="${linkGoogle}" target="_blank" class="btn-circular-ui btn-ui-gmaps" title="Google Maps" style="width:36px; height:36px; border-radius:50%; background:#4285F4; color:white; display:flex; align-items:center; justify-content:center; text-decoration:none;">
      <svg style="width:18px; height:18px;" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
    </a>`;
  } else if (mapsLinkRaw && mapsLinkRaw.trim() !== "" && !linkWaze) {
    html += `
    <a href="${mapsLinkRaw.replace(/"/g, "").trim()}" target="_blank" class="btn-circular-ui btn-ui-gmaps" title="Ubicación" style="width:36px; height:36px; border-radius:50%; background:#4285F4; color:white; display:flex; align-items:center; justify-content:center; text-decoration:none;">
      <svg style="width:18px; height:18px;" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
    </a>`;
  }

  // 4. Botón de Waze
  if (linkWaze) {
    html += `
    <a href="${linkWaze}" target="_blank" class="btn-circular-ui btn-ui-waze" title="Waze" style="width:36px; height:36px; border-radius:50%; background:#33ccff; color:white; display:flex; align-items:center; justify-content:center; text-decoration:none;">
      <svg style="width:18px; height:18px;" viewBox="0 0 24 24"><path fill="currentColor" d="M22.043 12.338a2.533 2.533 0 0 0-2.47-1.996h-.565a6.953 6.953 0 0 0-6.1-5.32 6.955 6.955 0 0 0-7.394 6.924c0 .324.025.644.07.96a2.235 2.235 0 0 0-.256 4.316l.228.046a2.23 2.23 0 0 0 4.195-.81h3.454a2.234 2.234 0 0 0 4.2.03l.067-.03a2.232 2.232 0 0 0 4.103-.925 2.53 2.53 0 0 0 .468-3.215zm-15.11 1.637a1.18 1.18 0 1 1 0-2.36 1.18 1.18 0 0 1 0 2.36zm6.208 0a1.18 1.18 0 1 1 0-2.36 1.18 1.18 0 0 1 0 2.36z"/></svg>
    </a>`;
  }

  html += `</div></div></div>`; // Cierres finales seguros de los contenedores del popup
  return html;
}

function alternarAcordeonSeccion(btn) {
 const item = btn.closest('.acordeon-item');
 const contenido = item.querySelector('.acordeon-contenido');
 const estaAbierto = item.classList.contains('activo');
 
 // Cerrar todos los demás acordeones del grupo
 btn.closest('.popup-acordeon-grupo').querySelectorAll('.acordeon-item').forEach(i => {
 i.classList.remove('activo');
 i.querySelector('.acordeon-contenido').style.maxHeight = null;
 });
 
 if (!estaAbierto) {
 item.classList.add('activo');
 contenido.style.maxHeight = contenido.scrollHeight + "px";
 
 // DISPARADOR AUTOMÁTICO DE HORARIOS
 if (contenido.querySelector('#cronometro-contenedor-modulo')) {
 setTimeout(iniciarCronometroPopup, 50);
 }
 
 // DISPARADOR AUTOMÁTICO DE IMÁGENES Y VIDEO LAZY-LOADING
 contenido.querySelectorAll('.lazy-popup-img').forEach(img => {
 if (img.getAttribute('data-src')) {
 img.src = img.getAttribute('data-src');
 img.removeAttribute('data-src');
 }
 });
 
 contenido.querySelectorAll('.lazy-popup-iframe').forEach(iframe => {
 if (iframe.getAttribute('data-src')) {
 iframe.src = iframe.getAttribute('data-src');
 iframe.removeAttribute('data-src');
 }
 });
}
}



function generarDatosEstructuradosSEO(comerciosFiltrados) {
  const scriptPrevio = document.getElementById("seo-local-jsonld");
  if (scriptPrevio) scriptPrevio.remove();
  if (comerciosFiltrados.length === 0) return;

  const scriptSEO = document.createElement("script");
  scriptSEO.id = "seo-local-jsonld";
  scriptSEO.type = "application/ld+json";

  const estructuraData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": comerciosFiltrados.map((c, i) => {
      const co = (c[COL_COMERCIO.COORDENADAS] || "").split(",");
      return {
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "LocalBusiness",
          "name": c[COL_COMERCIO.NOMBRE] || "Negocio Local",
          "description": c[COL_COMERCIO.SLOGAN] || "Comercio de barrio.",
          "telephone": c[COL_COMERCIO.WHATSAPP] || "",
          "geo": co.length === 2 ? {
            "@type": "GeoCoordinates",
            "latitude": parseFloat(co[0]),
            "longitude": parseFloat(co[1])
          } : null
        }
      };
    })
  };

  scriptSEO.text = JSON.stringify(estructuraData);
  document.head.appendChild(scriptSEO);
}

// Oyentes globales para activar/desactivar componentes al abrir o cerrar popups
if (mapaNegosistema) {
 mapaNegosistema.on('popupopen', function(e) {
   // 1. Activa el cálculo dinámico del reloj de apertura/cierre
   iniciarCronometroPopup();
   
   // 2. 🔥 ACTIVACIÓN MAESTRA DEL CARRUSEL DE IMÁGENES Y VIDEO (TIPO MYMAPS)
   const carruselActivo = document.querySelector('.popup-multimedia-carrusel');
   if (carruselActivo && typeof reajustarEstructuraCarrusel === 'function') {
       reajustarEstructuraCarrusel(carruselActivo);
   }

   // Forzar a Leaflet a reajustar el tamaño si se expande una sección acordeón
   setTimeout(() => { mapaNegosistema.invalidateSize(); }, 300);
 });
 
 mapaNegosistema.on('popupclose', function(e) {
   if (window.intervaloCronometro) {
     clearInterval(window.intervaloCronometro);
   }
 });
}

// CONTROLADOR GLOBAL DEL TEMPORIZADOR DE PANTALLA (VERSIÓN ULTRA-SEGURA A PRUEBA DE FALLAS)
function iniciarCronometroPopup() {
  const modulo = document.getElementById("cronometro-contenedor-modulo");
  if (!modulo) return;

  try {
    const horarioTexto = modulo.getAttribute("data-horario-crudo").trim().toLowerCase();
    
    // Si la celda del CSV está vacía o dice cerrado/sin horario
    if (!horarioTexto || horarioTexto === "vacio" || horarioTexto === "cerrado") {
      modulo.innerHTML = `<span class="reloj-badge cerrado-now">● CERRADO</span>`;
      return;
    }

    function actualizarReloj() {
      const ahora = new Date();
      const diaSemana = ahora.getDay(); // 0 = dom, 1 = lun...
      const horaActual = ahora.getHours();
      const minActual = ahora.getMinutes();
      const tiempoActualEnMinutos = (horaActual * 60) + minActual;

      const mapaDias = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
      const diaHoyTexto = mapaDias[diaSemana];

      const bloques = horarioTexto.split("|");
      let horarioDeHoy = "";

      for (let bloque of bloques) {
        bloque = bloque.trim();
        if (bloque.startsWith("lun-vie:") && (diaSemana >= 1 && diaSemana <= 5)) {
          horarioDeHoy = bloque.replace("lun-vie:", "");
          break;
        } else if (bloque.startsWith(diaHoyTexto + ":")) {
          horarioDeHoy = bloque.replace(diaHoyTexto + ":", "");
          break;
        }
      }

      if (!horarioDeHoy) {
        modulo.innerHTML = `
          <div class="cronometro-flex-wrapper">
            <span class="reloj-badge cerrado-now">● CERRADO</span>
            <span class="cuenta-regresiva-reloj cerrado">No abre hoy</span>
          </div>
        `;
        return;
      }

      const regexRangos = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g;
      let rangosEncontrados = [];
      let coincidencia;

      while ((coincidencia = regexRangos.exec(horarioDeHoy)) !== null) {
        const minApertura = (parseInt(coincidencia[1], 10) * 60) + parseInt(coincidencia[2], 10);
        const minCierre = (parseInt(coincidencia[3], 10) * 60) + parseInt(coincidencia[4], 10);
        rangosEncontrados.push({ inicio: minApertura, fin: minCierre });
      }

      if (rangosEncontrados.length === 0) {
        modulo.innerHTML = `<span class="reloj-badge horario-estatico">⏰ Abierto</span>`;
        return;
      }

      let rangoActual = null;
      let siguienteRango = null;

      for (let rango of rangosEncontrados) {
        if (tiempoActualEnMinutos >= rango.inicio && tiempoActualEnMinutos < rango.fin) {
          rangoActual = rango;
          break;
        }
        if (rango.inicio > tiempoActualEnMinutos && !siguienteRango) {
          siguienteRango = rango;
        }
      }

      if (rangoActual) {
        let minutosRestantes = rangoActual.fin - tiempoActualEnMinutos;
        const hrsRegreso = Math.floor(minutosRestantes / 60);
        const minRegreso = minutosRestantes % 60;
        const segRegreso = 59 - ahora.getSeconds();

        let textoCuentaRegresiva = "";
        if (hrsRegreso > 0) textoCuentaRegresiva += `${hrsRegreso}h `;
        textoCuentaRegresiva += `${minRegreso}m ${segRegreso}s`;

        modulo.innerHTML = `
          <div class="cronometro-flex-wrapper">
            <span class="reloj-badge abierto-now">● ABIERTO</span>
            <span class="cuenta-regresiva-reloj">Cierra en: <b>${textoCuentaRegresiva}</b></span>
          </div>
        `;
      } else if (siguienteRango) {
        let minutosParaAbrir = siguienteRango.inicio - tiempoActualEnMinutos;
        const hrsAbre = Math.floor(minutosParaAbrir / 60);
        const minAbre = minutosParaAbrir % 60;

        modulo.innerHTML = `
          <div class="cronometro-flex-wrapper" style="background:#fffbeb; border-color:#fde68a;">
            <span class="reloj-badge cerrado-now" style="background:#fef3c7; color:#d97706;">● PAUSA</span>
            <span class="cuenta-regresiva-reloj" style="color:#b45309;">Reabre en: <b>${hrsAbre}h ${minAbre}m</b></span>
          </div>
        `;
      } else {
        modulo.innerHTML = `
          <div class="cronometro-flex-wrapper">
            <span class="reloj-badge cerrado-now">● CERRADO</span>
            <span class="cuenta-regresiva-reloj cerrado">Terminó jornada</span>
          </div>
        `;
      }
    }

    actualizarReloj();
    if (window.intervaloCronometro) clearInterval(window.intervaloCronometro);
    window.intervaloCronometro = setInterval(actualizarReloj, 1000);

  } catch (error) {
    // SALVAVIDAS TÉCNICO: Si algo falla en el texto, muestra esto en lugar de trabarse
    console.error("Error en formato de horario:", error);
    modulo.innerHTML = `<span class="reloj-badge horario-estatico" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1;">⏰ Horario Establecido</span>`;
  }
}

// ==========================================================
// FUNCIÓN AUXILIAR GIS: CÁLCULO DE DISTANCIA (HAVERSINE)
// ==========================================================
function calcularDistanciaEntreCoordenadas(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Devuelve la distancia en kilómetros
}

function calcularHeroTextOferta(tipoBeneficio, cantidad) {
    if (!tipoBeneficio || !cantidad) return "OFERTA";
    const beneficio = tipoBeneficio.toLowerCase().trim();
    const valor = cantidad.trim();
    if (beneficio.includes("porcentaje") || beneficio.includes("%")) return `${valor}% OFF`;
    if (beneficio.includes("monto") || beneficio.includes("$")) return `-$${valor}`;
    if (beneficio.includes("bonificacion") || beneficio.includes("x")) return `¡${valor}!`;
    if (beneficio.includes("regalo") || beneficio.includes("gratis")) return "¡GRATIS!";
    return valor.toUpperCase();
}

// ==========================================================================
// SECCIÓN 2: MOTOR DE IMÁGENES EN CASCADA CON DIRECCIONAMIENTO LOCAL
// ==========================================================================
function generarHtmlImagenCascadaComercial(folio, giroEspecifico, capaFallback) {
    const partesId = String(folio).split('-');
    const codigoColonia = partesId[1] || "306";
    
    // Saneamiento de cadenas de texto para evitar errores en rutas locales
    const limpiarTextoRuta = (str) => {
        return String(str || "").toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "").trim();
    };

    const ramoClave = limpiarTextoRuta(giroEspecifico);
    const capaClave = limpiarTextoRuta(capaFallback);

    // Jerarquía secuencial de rutas locales físicas
    const rutaPromoPropia = `geo/iztapalapa/img-nego/colonia-${codigoColonia}/${folio}-promo1.jpg`;
    const rutaGiroEspecifico = `css/promos/${ramoClave}.jpg`;
    const rutaCapaBase = `css/promos/${capaClave}.jpg`;
    const fallbackObligatorio = `css/promos/base.jpg`;

    // Retorna inyección HTML con disparadores controlados 'onerror'
    return `
        <img src="${rutaPromoPropia}" class="card-bg-img-canvas" alt="Promo"
             onerror="this.onerror=null; this.src='${rutaGiroEspecifico}';
             this.onerror=function(){ this.src='${rutaCapaBase}';
             this.onerror=function(){ this.src='${fallbackObligatorio}';
             this.onerror=function(){ this.src='css/promos/base.jpg'; }; }; };">
    `;
}

function parsearFechaCSVComercial(fechaStr) {
    if (!fechaStr) return null;
    const partes = fechaStr.trim().split('/');
    if (partes.length !== 3) return null;
    return new Date(parseInt(partes[2], 10), parseInt(partes[1], 10) - 1, parseInt(partes[0], 10), 0, 0, 0, 0);
}


// ==========================================================================
// SECCIÓN C: MOTOR UNIFICADO DE RENDEREZADO RESPONSIVO (CORREGIDO)
// ==========================================================================
function procesarYRenderizarSliderComercial(coloniaFiltro) {
    const track = document.getElementById("ofertasSliderTrack");
    const cuadriculaEscaparate = document.getElementById("contenedor-escaparate-grid");

    if (!track && !cuadriculaEscaparate) return;
    if (!window.datosOfertasGlobales || !window.datosComerciosGlobales) return;

    if (track) track.innerHTML = "";
    if (cuadriculaEscaparate) cuadriculaEscaparate.innerHTML = "";

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const tokenColoniaActual = String(coloniaFiltro || "").toLowerCase().trim();
    let ofertasFiltradasGIS = [];

    window.datosOfertasGlobales.forEach(oferta => {
        const folioOferta = oferta[COL_OFERTA.FOLIO];
        if (!folioOferta) return;

        const negocio = window.datosComerciosGlobales.find(c => {
            if (!c) return false;
            return String(c[COL_COMERCIO.ID]).trim().toUpperCase() === String(folioOferta).trim().toUpperCase();
        });
        if (!negocio) return;

        const fechaInicio = parsearFechaCSVComercial(oferta[COL_OFERTA.FECHA_INICIO]);
        const fechaVenc = parsearFechaCSVComercial(oferta[COL_OFERTA.FECHA_VENC]);
        if (fechaInicio && fechaVenc && (hoy < fechaInicio || hoy > fechaVenc)) return;

        const nivelServicio = parseInt(String(negocio[COL_COMERCIO.NIVEL]).replace(/[^0-9]/g, '')) || 1;
        if (nivelServicio < 3 || nivelServicio > 5) return;

        const coloniaOrigenBiz = negocio[COL_COMERCIO.COLONIA] || "S/C";
        const normalizar = (str) => String(str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();

        const tokenColoniaActualLimpio = normalizar(tokenColoniaActual);
        const tokenColoniaBizLimpio = normalizar(coloniaOrigenBiz);

        let calificaParaSlider = false;
        const esVistaCatalogoPura = window.location.pathname.includes("catalogo") || cuadriculaEscaparate;

        if (esVistaCatalogoPura) {
            calificaParaSlider = true;
        } else {
            if (nivelServicio === 3) {
                calificaParaSlider = (tokenColoniaBizLimpio === tokenColoniaActualLimpio);
            } else if (nivelServicio === 4) {
                const colindantes = CAT_COLONIAS_COLINDANTES[tokenColoniaBizLimpio] || [];
                const colindantesNormalizadas = colindantes.map(c => normalizar(c));
                calificaParaSlider = (tokenColoniaBizLimpio === tokenColoniaActualLimpio || colindantesNormalizadas.includes(tokenColoniaActualLimpio));
            } else if (nivelServicio === 5) {
                if (window.latCentroColonia && window.lngCentroColonia && String(negocio[COL_COMERCIO.COORDENADAS]).includes(",")) {
                    const [latN5, lngN5] = String(negocio[COL_COMERCIO.COORDENADAS]).split(",").map(num => parseFloat(num.trim()));
                    if (!isNaN(latN5) && !isNaN(lngN5)) {
                        const distanciaKm = calcularDistanciaEntreCoordenadas(window.latCentroColonia, window.lngCentroColonia, latN5, lngN5);
                        calificaParaSlider = (distanciaKm <= 2.0);
                    }
                } else {
                    calificaParaSlider = (tokenColoniaBizLimpio === tokenColoniaActualLimpio);
                }
            }
        }

        if (!calificaParaSlider) return;

        oferta._metaBiz = {
            nombre: negocio[COL_COMERCIO.NOMBRE] || "Negocio Local",
            coords: negocio[COL_COMERCIO.COORDENADAS] || "",
            whatsapp: negocio[COL_COMERCIO.WHATSAPP] || ""
        };
        ofertasFiltradasGIS.push(oferta);
    });

    let todasLasTarjetasHtml = [];

    ofertasFiltradasGIS.forEach((oferta) => {
        const biz = oferta._metaBiz;
        const [lat, lon] = String(biz.coords).split(",");
        const idPublicitario = String(oferta[COL_OFERTA.FOLIO]).trim().toUpperCase();
        const linkWhatsAppFinal = oferta[COL_OFERTA.WHATSAPP_OFERTA] || "https://wa.me";

        // 🛠️ SOLUCIÓN EXTRACCIÓN: Convierte el ID en string y limpia los espacios de cada índice del array de manera independiente
        const partesId = idPublicitario.split('-');
        const codigoColonia = (partesId && partesId[1]) ? partesId[1].trim() : "306"; 

        let numeroPromo = 1;

        while (numeroPromo <= 3) {
            const rutaBase = `geo/iztapalapa/img-nego/${codigoColonia}/`;
            const nombreArchivoBase = `${idPublicitario}-promo${numeroPromo}`;

            const tarjetaHtml = `
            <div class="tarjeta-promo-slide" data-nombre-base="${nombreArchivoBase}" data-ruta-base="${rutaBase}">
                <img src="" alt="Promoción ${idPublicitario}" class="img-promo-dinamica">
                <div class="tarjeta-promo-acciones">
                    <button class="btn-promo-accion btn-promo-ubicar" data-id="${idPublicitario}" data-lat="${lat ? lat.trim() : ''}" data-lon="${lon ? lon.trim() : ''}">
                        📍 UBICAR
                    </button>
                    <button class="btn-promo-accion btn-promo-contactar" data-wa="${linkWhatsAppFinal}">
                        💬 CONTACTAR
                    </button>
                </div>
            </div>
            `;

            todasLasTarjetasHtml.push(tarjetaHtml);
            numeroPromo++;
        }
    });

    if (cuadriculaEscaparate) {
        cuadriculaEscaparate.innerHTML = todasLasTarjetasHtml.join("");
    } else if (track) {
        track.innerHTML = todasLasTarjetasHtml.join("");

        // Cálculo dinámico para la paginación responsiva
        let tarjetasPorPantalla = 1;
        if (window.innerWidth > 480 && window.innerWidth <= 1024) {
            tarjetasPorPantalla = 2; 
        } else if (window.innerWidth > 1024) {
            tarjetasPorPantalla = 3; 
        }

        const totalGruposResponsivos = Math.ceil(todasLasTarjetasHtml.length / tarjetasPorPantalla);
        
        if (todasLasTarjetasHtml.length > 0 && typeof inicializarNavegacionYAutoslide === "function") {
            inicializarNavegacionYAutoslide(totalGruposResponsivos, tarjetasPorPantalla);
        }
    }

    document.querySelectorAll(".tarjeta-promo-slide").forEach(tarjeta => {
        const img = tarjeta.querySelector(".img-promo-dinamica");
        const rutaBase = tarjeta.getAttribute("data-ruta-base");
        const nombreBase = tarjeta.getAttribute("data-nombre-base");

        if (img && rutaBase && nombreBase) {
            const extensionesAProbar = ["jpg", "jpeg", "png", "webp"];
            controlarFalloImagenSliderOfertas(img, nombreBase, extensionesAProbar, rutaBase);
        }
    });
}

function inicializarNavegacionYAutoslide(totalGrupos, tarjetasPorPantalla) {
    const dotsContenedor = document.getElementById("ofertasNavDots");
    const track = document.getElementById("ofertasSliderTrack");
    if (!dotsContenedor || !track) return;

    if (totalGrupos <= 1) {
        track.style.animation = "none";
        track.style.transform = "none";
        dotsContenedor.innerHTML = "";
        return;
    }

    dotsContenedor.innerHTML = "";
    for (let i = 0; i < totalGrupos; i++) {
        dotsContenedor.innerHTML += `<span class="dot ${i === 0 ? 'active' : ''}" onclick="window.navegarGrupoSliderManual(${i})"></span>`;
    }

    // El ancho del track se calcula multiplicando el total de páginas por 100%
    track.style.width = `${totalGrupos * 100}%`;
    track.style.animation = "none"; 

    // 🛠️ REPARACIÓN RESPONSIVA: Asigna la base de tamaño ideal respetando el crecimiento del riel
    document.querySelectorAll('.tarjeta-promo-slide').forEach(el => {
        const baseCalculada = `calc(${100 / (totalGrupos * tarjetasPorPantalla)}% - 12px)`;
        el.style.setProperty("flex-basis", baseCalculada, "important");
        el.style.setProperty("width", "auto", "important"); // Permite la expansión elástica en PC
    });

    window.navegarGrupoSliderManual = function(index) {
        const dots = dotsContenedor.querySelectorAll('.dot');
        // El desplazamiento se calcula en base al porcentaje dividido por el número de páginas reales
        const desplazamiento = index * -(100 / totalGrupos);

        track.style.transform = `translateX(${desplazamiento}%)`;

        dots.forEach(d => d.classList.remove('active'));
        if (dots[index]) dots[index].classList.add('active');
    };
}

// ==========================================================================
// CONTROLADOR DE EVENTOS: INTERACCIONES DEL SLIDER Y LIGHTBOX VISOR
// ==========================================================================

// Escuchamos de forma global todos los clics del ecosistema
// ==========================================================================
// CONTROLADOR DE EVENTOS: INTERACCIONES DEL SLIDER Y LIGHTBOX VISOR (CORREGIDO)
// ==========================================================================

document.addEventListener("click", function (evento) {

  // ZONA 1: CLIC EN EL CENTRO DE LA TARJETA (Abrir Lightbox HD)
  const tarjeta = evento.target.closest(".tarjeta-promo-slide");
  if (tarjeta && !evento.target.closest(".btn-promo-accion")) {
      const imgTarjeta = tarjeta.querySelector("img");
      if (imgTarjeta && imgTarjeta.src) {
          abrirLightboxPromocional(imgTarjeta.src);
      }
  }

  // ZONA 2: CLIC EN EL BOTÓN "📍 UBICAR" (Cambia entorno, enciende capa y vuela)
  const botonUbicar = evento.target.closest(".btn-promo-ubicar");
  if (botonUbicar) {
      evento.stopPropagation(); // 🛑 Detiene la propagación en el mapa

      const lat = parseFloat(botonUbicar.dataset.lat);
      const lon = parseFloat(botonUbicar.dataset.lon);
      const idNegocioAnuncio = botonUbicar.dataset.id ? botonUbicar.dataset.id.trim().toUpperCase() : "";

      if (typeof mapaNegosistema === "undefined" || !mapaNegosistema || isNaN(lat) || isNaN(lon)) return;

      // 🚨 CRUCE RELACIONAL AUTOMÁTICO EN MEMORIA (Previene el punto ciego de entornos)
      if (idNegocioAnuncio !== "" && window.datosComerciosGlobales) {
          const negocioMatch = window.datosComerciosGlobales.find(c =>
              String(c[COL_COMERCIO.ID]).trim().toUpperCase() === idNegocioAnuncio
          );

          if (negocioMatch) {
              const entornoAnuncio = String(negocioMatch[COL_COMERCIO.MAPA]).toLowerCase().trim();
              let capaAnuncio = (entornoAnuncio === "servicios")
                  ? String(negocioMatch[COL_COMERCIO.CAPA_SERVICIO] || negocioMatch[COL_COMERCIO.CAPA_SERVICIO]).toLowerCase().trim()
                  : String(negocioMatch[COL_COMERCIO.CAPA_PRODUCTO]).toLowerCase().trim();

              if (!capaAnuncio || capaAnuncio === "" || capaAnuncio === "vacio") {
                  capaAnuncio = "base";
              }

              // INTERCAMBIO DE ENTORNO EN 0MS (Productos 🔄 Servicios)
              if (entornoAnuncio !== entornoActual) {
                  const btnSwitch = document.getElementById("btn-switch-entorno");
                  if (btnSwitch) {
                      if (entornoAnuncio === "servicios") {
                          btnSwitch.setAttribute("data-entorno", "servicios");
                          btnSwitch.innerHTML = 'Ver Productos <span id="emoji-switch">🍎</span>';
                          entornoActual = "servicios";
                      } else {
                          btnSwitch.setAttribute("data-entorno", "productos");
                          btnSwitch.innerHTML = 'Ver Servicios <span id="emoji-switch">🛠️</span>';
                          entornoActual = "productos";
                      }
                  }
              }

              // BLINDAJE DE CAPA COMERCIAL (Fuerza el encendido del Checkbox si estaba apagado)
              const chkCapa = document.querySelector(`.filtro-capa-chk[data-capa="${capaAnuncio}"][data-tipo="${entornoAnuncio}"]`);
              if (chkCapa && !chkCapa.checked) {
                  chkCapa.checked = true;
              }

              // Redibujamos Leaflet de golpe con el entorno y las capas sincronizadas
              filtrarPinesPorCapasActivas();
          }
      }

      // EL VUELO COMERCIAL FINAL Y APERTURA DE POPUP
      mapaNegosistema.flyTo([lat, lon], 17, { animate: true, duration: 1.2 });

      setTimeout(() => {
          if (window.contenedorPinesGlobal) {
              window.contenedorPinesGlobal.eachLayer(function(layer) {
                  if (layer instanceof L.Marker &&
                      Math.abs(layer.getLatLng().lat - lat) < 0.0001 &&
                      Math.abs(layer.getLatLng().lng - lon) < 0.0001) {
                      layer.openPopup();
                  }
              });
          }
      }, 1300);
  }

  // ZONA 3: CLIC EN EL BOTÓN "💬 CONTACTAR" (Enlace directo a WhatsApp)
  const botonContactar = evento.target.closest(".btn-promo-contactar");
  if (botonContactar) {
      evento.stopPropagation();
      const urlWhatsapp = botonContactar.dataset.wa;
      if (urlWhatsapp && urlWhatsapp.startsWith("http")) {
          window.open(urlWhatsapp, "_blank");
      }
  }

  // CIERRE: CLIC EN EL BOTÓN DE CERRAR (&times;) O EN EL FONDO OSCURO BLUR
  const lightboxVisor = document.getElementById("negosistema-lightbox-visor");
  if (evento.target.id === "lightbox-btn-cerrar" || evento.target === lightboxVisor) {
      cerrarLightboxPromocional();
  }
});

// FUNCIONES MAESTRAS DE VISIBILIDAD DEL LIGHTBOX PROMO
function abrirLightboxPromocional(rutaImagen) {
  const visor = document.getElementById("negosistema-lightbox-visor");
  const imgHD = document.getElementById("lightbox-imagen-hd");
  
  if (visor && imgHD) {
      imgHD.src = rutaImagen;         // Inyectamos la imagen correspondiente
      visor.style.display = "flex";    // Forzamos el despliegue estructural flex
      
      // Retraso de un milisegundo para activar la transición CSS de opacidad suave
      setTimeout(() => {
          visor.classList.add("activo");
      }, 10);
  }
}

function cerrarLightboxPromocional() {
  const visor = document.getElementById("negosistema-lightbox-visor");
  if (visor) {
      visor.classList.remove("activo"); // Quitamos la opacidad suave
      
      // Esperamos a que la animación de desvanecimiento termine (0.3s) para apagar el display
      setTimeout(() => {
          visor.style.display = "none";
          const imgHD = document.getElementById("lightbox-imagen-hd");
          if (imgHD) imgHD.src = "";  // Vaciamos el contenedor para liberar memoria del navegador
      }, 300);
  }
}

// ==========================================================================
// PARTE 3: MOTOR DE EXTENSIONES EN CASCADA PARA EL SLIDER DE OFERTAS
// ==========================================================================
function controlarFalloImagenSliderOfertas(imgElemento, nombreArchivo, extensionesRestantes, rutaBase) {
    const colaExtensiones = [...extensionesRestantes];
    
    if (colaExtensiones.length > 0) {
        const siguienteExt = colaExtensiones.shift();
        
        // Si la extensión actual falla, reintentamos con la siguiente en la lista
        imgElemento.onerror = function() { 
            controlarFalloImagenSliderOfertas(this, nombreArchivo, colaExtensiones, rutaBase); 
        };
        
        const nuevaRuta = `${rutaBase}${nombreArchivo}.${siguienteExt}`;
        imgElemento.src = nuevaRuta;
        
        // Sincronizamos el contenedor HD del Lightbox para que use la misma extensión que funcionó
        const contenedorTarjeta = imgElemento.closest(".tarjeta-promo-slide");
        if (contenedorTarjeta) {
            contenedorTarjeta.setAttribute("data-src-hd", nuevaRuta);
        }
    } else {
        // SALVAVIDAS FINAL: Si ninguna extensión funcionó, ocultamos la tarjeta rota de forma limpia
        const tarjetaCompleta = imgElemento.closest(".tarjeta-promo-slide");
        if (tarjetaCompleta) {
            tarjetaCompleta.remove();
        }
    }
}

// FUNCIÓN MAESTRA: CREACIÓN E INYECCIÓN 100% DINÁMICA DE LA TARJETA OSCURA EN MÓVILES
function mostrarTarjetaInformativaDinamica(titulo, descripcion) {
  // Buscamos si ya existe una tarjeta inyectada previamente en el DOM
  let tarjeta = document.getElementById("negosistema-tooltip-flotante");

  if (!tarjeta) {
    // Si no existe, la creamos desde cero
    tarjeta = document.createElement("div");
    tarjeta.id = "negosistema-tooltip-flotante";
    tarjeta.className = "tarjeta-informativa-movil-oscura";
    document.body.appendChild(tarjeta);

    // Destruir la tarjeta automáticamente tras 4.5 segundos para no saturar la interfaz
    tarjeta.addEventListener("click", () => tarjeta.remove());
  }

  // Inyectamos el contenido actualizado estructurado de forma limpia
  tarjeta.innerHTML = `
    <strong>${titulo}</strong>
    <span>${descripcion}</span>
  `;

  // Reiniciar el temporizador de auto-ocultado cada vez que se toque una capa nueva
  if (window.timerTooltipFlotante) clearTimeout(window.timerTooltipFlotante);
  window.timerTooltipFlotante = setTimeout(() => {
    if (tarjeta) tarjeta.remove();
  }, 4500);
}

function verificarVisibilidadAcordeon(imgElemento) {
  const carrusel = imgElemento.closest('.popup-multimedia-carrusel');
  const acordeonPadre = imgElemento.closest('.bloque-multimedia-contenedor');
  if (!carrusel || !acordeonPadre) return;

  const slideContenedor = imgElemento.closest('.carrusel-item');
  const indexOrigen = slideContenedor ? slideContenedor.getAttribute('data-slide-index') : null;

  // 1. Eliminamos el slide roto y su dot correspondiente en caliente
  if (slideContenedor) slideContenedor.remove();
  if (indexOrigen) {
    const dotEquivalente = carrusel.querySelector(`.carrusel-dot[data-dot-index="${indexOrigen}"]`);
    if (dotEquivalente) dotEquivalente.remove();
  }

  // 2. Evaluamos si el carrusel se quedó completamente vacío
  const imagenesTotales = carrusel.querySelectorAll('.popup-img-carrusel-fija').length;
  const imagenesConError = carrusel.querySelectorAll('.popup-img-carrusel-fija.img-inexistente').length;
  const tieneVideoRegistrado = acordeonPadre.getAttribute('data-has-video') === 'true';

  // Si todas las imágenes fallaron y la base de datos no tiene video, eliminamos el acordeón entero
  if (imagenesConError >= imagenesTotales && !tieneVideoRegistrado) {
    acordeonPadre.remove();
  } else {
    // Si sobrevivió alguna foto o el video, reajustamos el primer elemento activo para que no se quede en blanco
    const slidesRestantes = carrusel.querySelectorAll('.carrusel-item');
    const dotsRestantes = carrusel.querySelectorAll('.carrusel-dot');
    
    if (slidesRestantes.length > 0 && !carrusel.querySelector('.carrusel-item.active')) {
      slidesRestantes[0].classList.add('active');
      if (dotsRestantes[0]) dotsRestantes[0].classList.add('active');
    }

    // Ocultamos las flechas si solo quedó un elemento multimedia vivo (1 foto o solo el video)
    if (slidesRestantes.length <= 1) {
      carrusel.querySelectorAll('.carrusel-nav').forEach(btn => btn.style.display = 'none');
      const contenedorDots = carrusel.querySelector('.carrusel-dots-container');
      if (contenedorDots) contenedorDots.style.display = 'none';
    }
  }
}

// ==========================================================================
// MOTOR TRADUCTOR DE COMAS, GIROS SECUNDARIOS Y MÉTODOS DE PAGO (NIVEL 3)
// ==========================================================================
function procesarListaItemsConComas(cadenaRaw) {
    if (!cadenaRaw || cadenaRaw.trim() === "" || cadenaRaw.trim().toLowerCase() === "vacio") {
        return "";
    }

    // Separamos por comas y limpiamos espacios vacíos o elementos nulos
    const elementos = cadenaRaw.split(",").map(item => item.trim()).filter(item => item !== "");
    
    let htmlResultado = "";
    let seccionActual = "principal"; // Estados: principal, secundaria, pagos
    let contadorPrincipales = 0;

    let itemsPrincipal = [];
    let itemsSecundaria = [];
    let itemsPagos = [];

    // Clasificación semántica de elementos en un solo barrido
    elementos.forEach(elemento => {
        const elementoMinuscula = elemento.toLowerCase();

        if (elementoMinuscula === "sec") {
            seccionActual = "secundaria";
            return; // Brinca al siguiente ciclo sin agregar la palabra clave
        }
        if (elementoMinuscula === "pag") {
            seccionActual = "pagos";
            return; // Brinca al siguiente ciclo sin agregar la palabra clave
        }

        // Distribución por bloques con tope de 5 para la sección principal
        if (seccionActual === "principal") {
            if (contadorPrincipales < 5) {
                itemsPrincipal.push(elemento);
                contadorPrincipales++;
            } else {
                // Salvavidas: si meten más de 5 principales sin poner "sec", los manda a secundarios para no romper el diseño
                itemsSecundaria.push(elemento);
            }
        } else if (seccionActual === "secundaria") {
            itemsSecundaria.push(elemento);
        } else if (seccionActual === "pagos") {
            itemsPagos.push(elemento);
        }
    });

    // RENDERIZADO BLOQUE 1: Especialidades / Productos Estrella
    if (itemsPrincipal.length > 0) {
        htmlResultado += `<div class="menu-bloque-ui principal">`;
        htmlResultado += `<span class="menu-titulo-categoria">⭐ ESPECIALIDADES DESTACADAS</span>`;
        htmlResultado += `<ul class="menu-lista-items">`;
        itemsPrincipal.forEach(item => {
            htmlResultado += `<li>${item}</li>`;
        });
        htmlResultado += `</ul></div>`;
    }

    // RENDERIZADO BLOQUE 2: Complementos y Catálogo Extra
    if (itemsSecundaria.length > 0) {
        htmlResultado += `<div class="menu-bloque-ui secundaria" style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">`;
        htmlResultado += `<span class="menu-titulo-categoria">💎 COMPLEMENTOS Y EXTRAS</span>`;
        htmlResultado += `<ul class="menu-lista-items">`;
        itemsSecundaria.forEach(item => {
            htmlResultado += `<li>${item}</li>`;
        });
        htmlResultado += `</ul></div>`;
    }

    // RENDERIZADO BLOQUE 3: Transacciones y Finanzas
    if (itemsPagos.length > 0) {
        htmlResultado += `<div class="menu-bloque-ui pagos" style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">`;
        htmlResultado += `<span class="menu-titulo-categoria">💳 MÉTODOS DE PAGO</span>`;
        htmlResultado += `<div class="menu-pagos-badges">`;
        itemsPagos.forEach(item => {
            htmlResultado += `<span class="badge-pago-item">${item}</span>`;
        });
        htmlResultado += `</div></div>`;
    }

    return htmlResultado;
}
