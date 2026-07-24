// ==========================================
// SECCIÓN 1: CONFIGURACIÓN Y ENRUTADOR GLOBAL
// ==========================================

// Configuración estricta de columnas para lectura de Sheets (Índices base 0)
const COL_ALCALDIA = {
  CVEGEO: 0,
  NOMGEO: 1,
  ESTATUS: 2,
  COLOR_HEX: 3
};

const COL_COLONIA = {
  WKT: 0,
  NOMBRE: 1,
  ESTATUS: 2
};

const COL_COMERCIO = {
  ID: 1,
  COLONIA: 2,
  CAPA_PRODUCTO: 4,
  CAPA_SERVICIO: 5,
  NIVEL: 6,
  NOMBRE: 7,
  SLOGAN: 8,
  LISTA_PROD_SERV: 9,
  HORARIO: 10,
  REDES: 11,
  YOUTUBE: 12,
  WHATSAPP: 13,
  COORDENADAS: 14,
  MAPS_LINK: 15
};

const COL_OFERTA = {
  ID: 1,
  FECHA_INICIO: 2,
  FECHA_FIN: 3,
  TEXTO_MENSAJE: 4,
  TEXTO_OFERTA: 5
};

// Instancias de control global compartidas por el motor
let mapaNegosistema = null;
let capaPoligonosActivos = null;
let capaPinesActivos = null;
// Estructuras de almacenamiento en memoria volátil
let datosComerciosGlobales = [];
let datosOfertasGlobales = [];
let entornoActual = "productos"; // "productos" o "servicios" (Arranca siempre aquí)

// URL de los archivos públicos CSV de Google Sheets
const URL_CSV_ALCALDIAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=1670206752&single=true&output=csv";
const URL_CSV_COLONIAS  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=383048417&single=true&output=csv";
const URL_CSV_COMERCIOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTpyTu542clbD3QGMLVlDJlprm_Kkl4u0QokBxOvUwmhNbAeQRZFy8q5zJdp5BSOC1ftHnkA53M74S4/pub?gid=0&single=true&output=csv";
const URL_CSV_OFERTAS   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgJ-fFKkYHuLy9RR0chu_2disYAKudHI7-A3phmQ08CdOZalAqPj1A6jCz9P2gVhbpoiYuCZOMq0T7/pub?gid=1521270051&single=true&output=csv";
const URL_CSV_PILOTO    = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTpyTu542clbD3QGMLVlDJlprm_Kkl4u0QokBxOvUwmhNbAeQRZFy8q5zJdp5BSOC1ftHnkA53M74S4/pub?gid=0&single=true&output=csv"; 



// Inicialización unificada del sistema corregida
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const alcaldiaParam = params.get("alcaldia");
  const coloniaParam = params.get("colonia");

  // CASO 1: Pantalla index.html
  if (document.getElementById("mapa-macro-contenedor")) {
    mapaNegosistema = L.map("mapa-macro-contenedor").setView([19.4326, -99.1332], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaNegosistema);
    limpiarLienzoMilisegundos();

    // CORRECCIÓN: Si NO hay parámetro, pinta el mapa macro. Si SÍ hay parámetro, carga sus colonias.
    if (!alcaldiaParam) {
      verificarYFiltarAlcaldias();
    } else {
      cargarMapaColonias(alcaldiaParam);
    }
  }
  // CASO 2: Pantalla comercial.html
  else if (document.getElementById("mapa-comercial-contenedor")) {
    mapaNegosistema = L.map("mapa-comercial-contenedor").setView([19.373, -99.018], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaNegosistema);
    limpiarLienzoMilisegundos();
    inicializarModoHiperlocal(coloniaParam);
  }
 // CASO 3: Pantalla anunciate.html
else if (document.getElementById("mapa_general")) {
  mapaNegosistema = L.map("mapa_general").setView([19.361, -99.025], 14);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaNegosistema);
  
  limpiarLienzoMilisegundos();
  
  // Llama directo a la función piloto sin arrastrar lógica de colonias
  inicializarModoAnunciatePiloto();
  
  // Solución al mapa dividido para estabilizar Leaflet
  setTimeout(() => {
    if (mapaNegosistema) {
      mapaNegosistema.invalidateSize();
    }
  }, 800);
}

});


// ==========================================
// SECCIÓN 2: MOTOR CARTOGRÁFICO MACRO (INDEX.HTML)
// ==========================================

/**
 * Procesa una cadena WKT POLYGON ((...)) e invierte sus coordenadas.
 * Sintaxis origen: (Longitud Latitud) -> Destino Leaflet: [Latitud, Longitud]
 */
// ==========================================
// SECCIÓN 2: MOTOR CARTOGRÁFICO MACRO (INDEX.HTML)
// ==========================================

/**
 * Procesa una cadena WKT POLYGON ((...)) e invierte sus coordenadas.
 * Sintaxis origen: (Longitud Latitud) -> Destino Leaflet: [Latitud, Longitud]
 */
function transformarCoordenadasWKT(cadenaWKT) {
  if (!cadenaWKT || !cadenaWKT.startsWith("POLYGON")) {
    return [];
  }
  const textoLimpio = cadenaWKT
    .replace("POLYGON", "")
    .replace(/\(/g, "")
    .replace(/\)/g, "")
    .trim();

  const paresPuntos = textoLimpio.split(",");
  const coordenadasInvertidas = paresPuntos.map(par => {
    const ejes = par.trim().split(" ");
    if (ejes.length < 2) return null;
    
    const longitud = parseFloat(ejes[0]);
    const latitud = parseFloat(ejes[1]);
    
    return [latitud, longitud]; 
  }).filter(coord => coord !== null);

  return coordenadasInvertidas;
}

/**
 * Borra de inmediato capas previas para evitar saturar la RAM de celulares
 */
function limpiarLienzoMilisegundos() {
  if (capaPoligonosActivos && mapaNegosistema) {
    mapaNegosistema.removeLayer(capaPoligonosActivos);
  }
  if (capaPinesActivos && mapaNegosistema) {
    mapaNegosistema.removeLayer(capaPinesActivos);
  }
  if (mapaNegosistema) {
    capaPoligonosActivos = L.featureGroup().addTo(mapaNegosistema);
    capaPinesActivos = L.featureGroup().addTo(mapaNegosistema);
  }
}

/**
 * Valida si solo hay una alcaldía activa para saltar directamente a ella,
 * de lo contrario manda a pintar el mapa macro de la CDMX.
 */
function verificarYFiltarAlcaldias() {
  Papa.parse(URL_CSV_ALCALDIAS, {
    download: true,
    complete: function(results) {
      const filas = results.data.slice(1);
      
      // Filtra las alcaldías operativas basándose en su estatus en Sheets
      const activas = filas.filter(f => {
        if (!f[COL_ALCALDIA.CVEGEO]) return false;
        const estatus = (f[COL_ALCALDIA.ESTATUS] || "").trim().toLowerCase();
        return estatus === "activo" || estatus === "explorando";
      });

      // CORRECCIÓN: Se elimina el bloque window.location.href. Siempre renderiza el lienzo macro de la CDMX.
      renderizarAlcaldiasMacro(activas);
    }
  });
}

/**
 * Carga el archivo geojson general e inyecta colores y eventos a las alcaldias activas.
 * Cruce lógico 100% matemático usando CVEGEO.
 */
function renderizarAlcaldiasMacro(alcaldiasActivas) {
  fetch("geo/alcaldias.geojson")
    .then(response => response.json())
    .then(geojsonData => {
      const contenedorBotones = document.getElementById("contenedor-botones-dinamicos");
      if (contenedorBotones) contenedorBotones.innerHTML = "";

      L.geoJSON(geojsonData, {
        style: function(feature) {
          // REGLA MATEMÁTICA: Extracción y limpieza del código de la propiedad del mapa
          const cvegeoGeojson = String(feature.properties.CVEGEO).trim();
          
          // Cruce exacto con la columna 0 del CSV de Google Sheets
          const datosCSV = alcaldiasActivas.find(a => 
            String(a[COL_ALCALDIA.CVEGEO]).trim() === cvegeoGeojson
          );

          if (datosCSV) {
            return {
              fillColor: datosCSV[COL_ALCALDIA.COLOR_HEX] || "#3498db",
              weight: 2.5,
              opacity: 1,
              color: "#ffffff",
              fillOpacity: 0.75
            };
          }
          // Polígonos de alcaldías inactivas se vuelven totalmente transparentes e intangibles
          return { fillOpacity: 0, weight: 0, color: "transparent" };
        },
        onEachFeature: function(feature, layer) {
          const cvegeoGeojson = String(feature.properties.CVEGEO).trim();
          const nombreGeo = feature.properties.NOMGEO; 
          
          const datosCSV = alcaldiasActivas.find(a => 
            String(a[COL_ALCALDIA.CVEGEO]).trim() === cvegeoGeojson
          );

          if (datosCSV) {
            // Normalización cosmética para estructurar parámetros limpios en la URL de navegación
            const nombreURLLimpio = nombreGeo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "");
            const urlDestino = `index.html?alcaldia=${nombreURLLimpio}`;

            // Camino A: Navegación Cartográfica táctil sobre el polígono renderizado
            layer.on("click", () => {
              window.location.href = urlDestino;
            });

            // Camino B: Accesibilidad mediante Botones Dinámicos
            if (contenedorBotones) {
              const boton = document.createElement("button");
              boton.className = "btn-accesibilidad-macro";
              boton.innerText = nombreGeo.trim();
              boton.style.borderColor = datosCSV[COL_ALCALDIA.COLOR_HEX];
              boton.addEventListener("click", () => {
                window.location.href = urlDestino;
              });
              contenedorBotones.appendChild(boton);
            }
          }
        }
      }).addTo(capaPoligonosActivos);
    });
}

/**
 * Nivel 2: Limpia el mapa macro, vuela a la alcaldía seleccionada, inyecta
 * los polígonos WKT de sus colonias y genera sus botones dinámicos de acceso.
 */
function cargarMapaColonias(alcaldiaNombre) {
  const rutaGeojson = `geo/${alcaldiaNombre}/${alcaldiaNombre}.geojson`;
  
  fetch(rutaGeojson)
    .then(response => response.json())
    .then(geojsonData => {
      limpiarLienzoMilisegundos();
      const capaGeo = L.geoJSON(geojsonData).addTo(capaPoligonosActivos);
      mapaNegosistema.fitBounds(capaGeo.getBounds(), { padding: [30, 30] });

      const textoGuia = document.getElementById("texto-guia");
      if (textoGuia) textoGuia.innerText = "Selecciona una Colonia";

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

              const poligonocol = L.polygon(coords, {
                fillColor: estatus === "activo" ? "#2ecc71" : "#f1c40f",
                weight: 1.5,
                opacity: 1,
                color: "#ffffff",
                fillOpacity: 0.5
              }).addTo(capaPoligonosActivos);

              poligonocol.on("click", () => {
                window.location.href = urlDestino;
              });

              if (contenedorBotones) {
                const boton = document.createElement("button");
                boton.className = "btn-accesibilidad-micro";
                boton.innerText = nombreColonia;
                boton.addEventListener("click", () => {
                  window.location.href = urlDestino;
                });
                contenedorBotones.appendChild(boton);
              }
            }
          });
        }
      });
    })
 .catch(err => {
   console.error("Error crítico: No se encontró el archivo GeoJSON de la alcaldía seleccionada.", err);
   const textoGuia = document.getElementById("texto-guia");
   if (textoGuia) textoGuia.innerText = "Error al cargar las colonias de esta región";
 });
}

// ==========================================
// SECCIÓN 3: DIRECTORIO HIPERLOCAL Y CAPAS (COMERCIAL.HTML)
// ==========================================

/**
/**
 * Nivel 3: Descarga en memoria volátil las ofertas y comercios correspondientes 
 * a la colonia seleccionada e inicializa los componentes táctiles.
 */
function inicializarModoHiperlocal(coloniaFiltro) {
  // 1. ACTUALIZAR EL TÍTULO DE LA COLONIA ACTUAL EN EL HTML
  const elementoTitulo = document.getElementById("titulo-colonia-actual");
  if (elementoTitulo && coloniaFiltro) {
    const nombreFormateado = coloniaFiltro.replace(/-/g, " ").toUpperCase();
    elementoTitulo.innerText = `Colonia: ${nombreFormateado}`;
  }

  // 2. LEER EL CSV DE COLONIAS PARA GENERAR LOS BOTONES ALEDAÑOS
  Papa.parse(URL_CSV_COLONIAS, {
    download: true,
    complete: function(coloniasResults) {
      const filasColonias = coloniasResults.data.slice(1);
      const contenedorAledanas = document.getElementById("contenedor-colonias-aledanas");
 
      if (contenedorAledanas) {
        contenedorAledanas.innerHTML = ""; // Limpieza preventiva de RAM
 
        filasColonias.forEach(colonia => {
          const nombreColonia = colonia[COL_COLONIA.NOMBRE];
          const estatus = (colonia[COL_COLONIA.ESTATUS] || "").trim().toLowerCase();
 
          if (nombreColonia && (estatus === "activo" || estatus === "explorando")) {
            const nombreURLLimpio = nombreColonia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "");
 
            if (nombreURLLimpio !== String(coloniaFiltro).toLowerCase().trim()) {
              const botonVecino = document.createElement("button");
              botonVecino.className = "btn-accesibilidad-dinamico"; 
              botonVecino.innerText = nombreColonia;
 
              if (estatus === "explorando") {
                botonVecino.style.borderLeft = "4px solid #f1c40f";
              } else {
                botonVecino.style.borderLeft = "4px solid #2ecc71";
              }

            // Busca esta línea dentro del bucle forEach de las colonias aledañas:
            botonVecino.addEventListener("click", () => {
           // En lugar de enviar ${entornoActual}, forzamos que viaje como 'productos'
           window.location.href = `comercial.html?colonia=${nombreURLLimpio}&entorno=productos`;
           });
              contenedorAledanas.appendChild(botonVecino);
            }
          }
        });
      }

            // 3. CONTINUAR CON LA CARGA DE OFERTAS Y COMERCIOS
      Papa.parse(URL_CSV_OFERTAS, {
        download: true,
        complete: function(ofertasResults) {
          datosOfertasGlobales = ofertasResults.data.slice(1);
          renderizarSliderOfertas(datosOfertasGlobales);
 
          Papa.parse(URL_CSV_COMERCIOS, {
            download: true,
            complete: function(comerciosResults) {
              const todasLasFilas = comerciosResults.data.slice(1);
 
              // Filtrado estricto en memoria volátil eliminando espacios y mayúsculas
              datosComerciosGlobales = todasLasFilas.filter(f => {
                const colCSV = (f[COL_COMERCIO.COLONIA] || "").toLowerCase().replace(/ /g, "");
                return colCSV === String(coloniaFiltro).toLowerCase().replace(/ /g, "");
              });
 
              // =========================================================================
              // CORRECCIÓN CRÍTICA: INYECTAR PRIMERO LOS BOTONES ANTES DE FILTRAR EL MAPA
              // =========================================================================
              // Forzamos el entorno actual de forma estricta a productos
              entornoActual = "productos";

              const btnSwitch = document.getElementById("btn-switch-entorno");
              if (btnSwitch) {
                btnSwitch.setAttribute("data-entorno", "productos");
                btnSwitch.innerHTML = 'Ver Servicios <span id="emoji-switch">🛠️</span>';
              }
    
              // Dibuja físicamente los checkboxes en el contenedor HTML
              reconstruirBotonesCapasInferiores();

              // Renderiza los pines iniciales en el mapa
              renderizarPinesComerciales(datosComerciosGlobales);
              inicializarBuscadorPredictivo();
              configurarSwitchEntornos();
          
              // Ejecuta el filtro inicial para sincronizar el mapa con los interruptores recién inyectados
              filtrarPinesPorCapasActivas();
            } // Fin complete Comercios
          });
        } // Fin complete Ofertas
      });
    } // Fin complete Colonias
  });
} // Fin inicializarModoHiperlocal


/**
 * Renderiza los marcadores vectoriales en el lienzo utilizando L.divIcon
 * para aplicar los estilos de gamificación y colores oficiales del ramo.
 */
function renderizarPinesComerciales(arregloComercios) {
  if (mapaNegosistema && capaPinesActivos) {
    capaPinesActivos.clearLayers();
  }

  arregloComercios.forEach(comercio => {
    const coordenadasCrudas = (comercio[COL_COMERCIO.COORDENADAS] || "").split(",");
    if (coordenadasCrudas.length !== 2) return;

      // CÓDIGO CORREGIDO UNIFICADO
    const lat = parseFloat(coordenadasCrudas[0]);
    const lng = parseFloat(coordenadasCrudas[1]);


    // Validar de forma preventiva que no existan coordenadas rotas
    if (isNaN(lat) || isNaN(lng)) return;

    let capaColor = (entornoActual === "productos") 
      ? comercio[COL_COMERCIO.CAPA_PRODUCTO] 
      : comercio[COL_COMERCIO.CAPA_SERVICIO];

    if (!capaColor || capaColor.trim() === "") {
      capaColor = "gris";
    }

    const tieneOferta = datosOfertasGlobales.some(o => 
      String(o[COL_OFERTA.ID]).trim() === String(comercio[COL_COMERCIO.ID]).trim()
    );

    let clasePinBase = "pin-personalizado pin-plata";
    if (parseInt(comercio[COL_COMERCIO.NIVEL]) === 5) {
      clasePinBase = "pin-personalizado pin-oro";
    }
    if (tieneOferta) {
      clasePinBase += " pin-con-flama";
    }

    const claseColorEntorno = (entornoActual === "productos") 
      ? `btn-p-${capaColor.trim().toLowerCase()}` 
      : `btn-s-${capaColor.trim().toLowerCase()}`;

    const miIcono = L.divIcon({
      className: `${clasePinBase} ${claseColorEntorno}`,
      html: ' ',
      iconSize:[30, 30],
      iconAnchor: [15, 15]
    });

    const marcador = L.marker([lat, lng], { icon: miIcono })
      .bindPopup(inyectarPopupComercio(comercio));

    capaPinesActivos.addLayer(marcador);
  });

  if (capaPinesActivos.getLayers().length > 0 && mapaNegosistema) {
    mapaNegosistema.fitBounds(capaPinesActivos.getBounds(), { maxZoom: 15, padding: [20, 20] });
  }
}


/**
 * Configura el comportamiento del Botón Switch central para alternar
 * entornos en milisegundos sin refrescar la página.
 */
function configurarSwitchEntornos() {
  const btnSwitch = document.getElementById("btn-switch-entorno");
  if (!btnSwitch) return;
 
  btnSwitch.addEventListener("click", () => {
    // Alternancia de variable operativa global
    entornoActual = (entornoActual === "productos") ? "servicios" : "productos";
 
    if (entornoActual === "productos") {
      btnSwitch.innerHTML = 'Ver Servicios <span id="emoji-switch">🛠</span>';
      btnSwitch.setAttribute("data-entorno", "productos");
    } else {
      btnSwitch.innerHTML = 'Ver Productos <span id="emoji-switch">🛒</span>';
      btnSwitch.setAttribute("data-entorno", "servicios");
    }
 
    // Redibujado secuencial estricto de componentes táctiles y marcadores
    reconstruirBotonesCapasInferiores();
    limpiarLienzoMilisegundos();
    renderizarPinesComerciales(datosComerciosGlobales);
  });
}

/**
 * Reconstruye el menú dinámico inferior basándose en las paletas y emojis oficiales.
 */
function reconstruirBotonesCapasInferiores() {
  const contenedor = document.getElementById("capas-inferiores-contenedor");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  const paletas = {
    productos: [
      { id: "verde", label: "Canasta Básica", emoji: "🍎", desc: "Abarrotes, Carnicería, Recaudería, Tortillería, Expendio de Huevo..." },
      { id: "naranja", label: "Comida Preparada", emoji: "🌮", desc: "Taquerías, Pizzerías, Cocinas Económicas, Cafeterías, Postres..." },
      { id: "amarillo", label: "Ferretería y Hogar", emoji: "🛠", desc: "Tlapalerías, Materiales de Construcción, Eléctricos, Pinturas..." },
      { id: "rojo", label: "Salud y Farmacia", emoji: "💊", desc: "Farmacias, Tiendas Naturistas, Ópticas, Venta de Equipo Médico..." },
      { id: "rosa", label: "Variedades y Moda", emoji: "🛍", desc: "Papelerías, Zapaterías, Boutiques, Mercería, Juguetería, Regalos..." },
      { id: "cafe", label: "Mascotas", emoji: "🐾", desc: "Alimento por kilo, Accesorios, Acuarios, Estética Canina..." },
      { id: "azul", label: "Tecnología", emoji: "🔌", desc: "Celulares (Venta/Reparación), Computación, Videojuegos, Alarmas..." },
      { id: "gris", label: "Directorio Base", emoji: "🏪", desc: "Solo ubicación, en proceso de verificación de datos." }
    ],
    servicios: [
      { id: "azulclaro", label: "Salud y Consultas", emoji: "🩺", desc: "Médicos Generales, Dentistas, Psicólogos, Laboratorios, Veterinarias..." },
      { id: "azulmedio", label: "Talleres y Oficios", emoji: "🔧", desc: "Mecánicos, Llanteras, Plomeros, Electricistas, Carpinteros..." },
      { id: "morado", label: "Bienestar y Estilo", emoji: "✂", desc: "Barberías, Estéticas, Salones de Uñas, Gimnasios, Studios de Yoga..." },
      { id: "grisoscuro", label: "Asesoría y Oficina", emoji: "💼", desc: "Seguros/PPR, Contadores, Abogados, Cibercafés, Mensajería..." },
      { id: "vino", label: "Hogar y Eventos", emoji: "🎈", desc: "Salones de Fiesta, Lavanderías, Cerrajerías, Sastrerías, Fletes..." },
      { id: "blanco", label: "Educación y Apoyo", emoji: "📚", desc: "Tareas Dirigidas, Clases Particulares, Escuelas, Guarderías..." },
      { id: "negro", label: "Urgencias 24/7", emoji: "🚨", desc: "Cerrajerías Nocturnas, Grúas, Reparación de Fugas Urgentes..." },
      { id: "gris", label: "Directorio Base", emoji: "🏪", desc: "Solo ubicación, en proceso de verificación de datos." }
    ]
  };

  const capasEntorno = paletas[entornoActual] || [];

  capasEntorno.forEach(capa => {
    const itemFiltro = document.createElement("div");
    itemFiltro.className = "guia-item-filtro";
    
    // Inyección de la estructura de palanca deslizante compatible
    itemFiltro.innerHTML = `
      <label class="toggle-switch">
        <input type="checkbox" class="filtro-capa-chk" data-tipo="${entornoActual}" data-capa="${capa.id}" checked>
        <span class="slider-palanca visual-${capa.id}"></span>
      </label>
      <div class="texto-filtro-info" style="margin-left: 10px; font-size: 13px; color: #2c3e50; text-align: left;">
        <strong>${capa.emoji} ${capa.label}:</strong> 
        <span style="font-size: 11px; color: #7f8c8d; font-weight: normal; display: block; margin-top: 2px;">
          (${capa.desc})
        </span>
      </div>
    `;

    // Escucha el evento nativo del checkbox e invoca al filtro
    const checkbox = itemFiltro.querySelector(".filtro-capa-chk");
    checkbox.addEventListener("change", filtrarPinesPorCapasActivas);

    contenedor.appendChild(itemFiltro);
  });
}



/**
/**
 * Escanea el estado de los nuevos interruptores de palanca para borrar o repintar pines permitidos.
 */

/**
 * Escanea el estado de los nuevos interruptores de palanca para borrar o repintar pines permitidos.
 */
function filtrarPinesPorCapasActivas() {
  // CORRECCIÓN CRÍTICA: En lugar de crear un grupo nuevo con L.featureGroup() y duplicar pines,
  // verificamos si ya existe para vaciarlo, o lo creamos una sola vez si es la primera carga.
  if (typeof capaPinesActivos !== 'undefined' && mapaNegosistema.hasLayer(capaPinesActivos)) {
    capaPinesActivos.clearLayers(); // Vacía los pines viejos de la pantalla de forma limpia
  } else {
    capaPinesActivos = L.featureGroup().addTo(mapaNegosistema); // Se crea solo la primera vez
  }

  // 1. Obtiene las capas que están encendidas (Checked) filtrando por el entorno actual
  const capasActivas = [];
  const switches = document.querySelectorAll(`.filtro-capa-chk[data-tipo="${entornoActual}"]`);
  
  switches.forEach(sw => {
    if (sw.checked) {
      // Guardamos el nombre de la capa en minúsculas para comparar libre de errores
      capasActivas.push(sw.getAttribute("data-capa").trim().toLowerCase());
    }
  });

  // 2. Itera y filtra los comercios cargados en memoria volátil
  datosComerciosGlobales.forEach(comercio => {
    // Si la fila está vacía o corrupta, detiene la iteración de este renglón
    if (!comercio || comercio.length === 0) return;

    // Lee la columna correspondiente según el entorno activo
    let capaColor = (entornoActual === "productos") 
      ? comercio[COL_COMERCIO.CAPA_PRODUCTO] 
      : comercio[celda || COL_COMERCIO.CAPA_SERVICIO]; // Asegura tu variable de columna
      
    if (!capaColor || capaColor.trim() === "") {
      capaColor = "gris";
    }
    
    // Normaliza el nombre de la capa del comercio para evitar fallos por mayúsculas o espacios
    const capaComercioNormalizada = capaColor.trim().toLowerCase();

    // 3. Validación de mapeo: Compara la capa del CSV con las capas encendidas en los interruptores
    if (capasActivas.includes(capaComercioNormalizada)) {
      
      // Extrae la coordenada fija de la columna 14 ("Latitud,Longitud")
      const cadenaCoordenadas = comercio[COL_COMERCIO.COORDENADAS] || "";
      const coordenadasCrudas = cadenaCoordenadas.split(",");
      
      if (coordenadasCrudas.length === 2) {
        const lat = parseFloat(coordenadasCrudas[0]);
        const lng = parseFloat(coordenadasCrudas[1]);
        
        // El salto preventivo asume la validación estricta isNaN
        if (!isNaN(lat) && !isNaN(lng)) {
          // Determina el tipo de Pin (Oro o Plata) basándose en la columna 6 (NIVEL)
          let clasePinBase = "pin-personalizado pin-plata";
          if (parseInt(comercio[COL_COMERCIO.NIVEL]) === 5) {
            clasePinBase = "pin-personalizado pin-oro";
          }
          
          const claseColorEntorno = (entornoActual === "productos") 
            ? `btn-p-${capaComercioNormalizada}` 
            : `btn-s-${capaComercioNormalizada}`;
            
          const miIcono = L.divIcon({
            className: `${clasePinBase} ${claseColorEntorno}`,
            html: ' ',
            iconSize:[32, 32],
            iconAnchor: [16, 32]
          });
          
          // Dibuja el marcador e inyecta el Popup interactivo
          const marcador = L.marker([lat, lng], { icon: miIcono });
          
          // Validación de seguridad por si la función inyectarPopupComercio aún no se ha declarado
          if (typeof inyectarPopupComercio === "function") {
            marcador.bindPopup(inyectarPopupComercio(comercio));
          } else {
            marcador.bindPopup(`<b>${comercio[0] || "Negocio"}</b>`);
          }
            
          capaPinesActivos.addLayer(marcador);
        }
      }
    }
  });
}




// ==========================================
// SECCIÓN 4: ALGORITMO DE HORARIOS Y POPUPS DINÁMICOS
// ==========================================

/**
 * Traduce cadenas crudas (ej: lun-vie:08:00-12:00) y define el color de la cabecera.
 * Descarte inmediato del bloque: procesa solo el día de hoy para ahorrar batería.
 */
function calcularMotorTemporal(cadenaHorario) {
  if (!cadenaHorario || cadenaHorario.trim() === "") {
    return { colorClass: "popup-pausa", texto: "Sin horario registrado" };
  }

  const fechaActual = new Date();
  const diaIndex = fechaActual.getDay(); 
  const horaActualMinutos = (fechaActual.getHours() * 60) + fechaActual.getMinutes();

  const diasMapa = { "dom": 0, "lun": 1, "mar": 2, "mie": 3, "jue": 4, "vie": 5, "sab": 6 };
  const bloques = cadenaHorario.toLowerCase().split("|");
  let horarioHoy = null;

  for (let bloque of bloques) {
    const partes = bloque.trim().split(":");
    if (partes.length < 2) continue;

    // CORRECCIÓN: Lectura estricta del índice cero del arreglo de strings
    const rangoDias = partes[0].split("-");
    let diaInicio = diasMapa[rangoDias[0].trim()];
    let diaFin = rangoDias[1] ? diasMapa[rangoDias[1].trim()] : diaInicio;

    if (diaIndex >= diaInicio && diaIndex <= diaFin) {
      horarioHoy = partes.slice(1).join(":"); 
      break;
    }
  }

  if (!horarioHoy) {
    return { colorClass: "popup-cerrado", texto: "CERRADO (Hoy)" };
  }

  const horasRango = horarioHoy.split("-");
  if (horasRango.length < 2) {
    return { colorClass: "popup-cerrado", texto: "CERRADO" };
  }

  const [hInicio, mInicio] = horasRango[0].split(":").map(Number);
  const [hFin, mFin] = horasRango[1].split(":").map(Number);
  const minutosInicioTotal = (hInicio * 60) + mInicio;
  const minutosFinTotal = (hFin * 60) + mFin;

  if (horaActualMinutos >= minutosInicioTotal && horaActualMinutos < minutosFinTotal) {
    const tiempoRestante = minutosFinTotal - horaActualMinutos;
    if (tiempoRestante <= 30) {
      return { colorClass: "popup-critico", texto: "PRÓXIMO A CERRAR" };
    }
    return { colorClass: "popup-abierto", texto: "ABIERTO" };
  } else {
    return { colorClass: "popup-cerrado", texto: "CERRADO" };
  }
}


/**
 * Genera el contenedor HTML del carrusel de fotos buscando secuencialmente por ID.
 * Estructura de nombres requerida: {id_negocio}-1.jpg, {id_negocio}-2.jpg, etc.
 * Ejemplo: 07-306-001-1.jpg, 07-306-001-2.jpg...
 */
/**
 * Genera el contenedor HTML del carrusel de fotos.
 * Corrige la ruta para buscar siempre en la alcaldía correspondiente y no en la colonia.
 */
/**
 * Genera el contenedor HTML del carrusel de fotos.
 * Versión pasiva: Bloquea alteraciones de tamaño para garantizar la estabilidad de Leaflet.
 */
function generarCarruselFotosHTML(idNegocio, alcaldiaRuta) {
  if (!idNegocio) return '';

  const rutaBase = `geo/iztapalapa/img-nego/`;
  let htmlCarrusel = `<div class="popup-carrusel-fotos" style="display: flex; gap: 8px; max-height: 100px; margin-top: 8px; overflow-x: auto;">`;

  // 1. Definimos los formatos permitidos ordenados por preferencia (ej. WebP es más ligero)
  const formatos = ['webp', 'jpg', 'jpeg', 'png'];
  const idLimpio = idNegocio.trim();

  for (let i = 1; i <= 1; i++) { 
    // 2. Construimos la ruta de la primera opción (.webp)
    const rutaInicial = `${rutaBase}${idLimpio}-${i}.${formatos[0]}`;
    
    // 3. Creamos la cadena con el orden de caída para los siguientes formatos
    const fallbackWebp = `${rutaBase}${idLimpio}-${i}.webp`;
    const fallbackJpg  = `${rutaBase}${idLimpio}-${i}.jpg`;
    const fallbackJpeg = `${rutaBase}${idLimpio}-${i}.jpeg`;
    const fallbackPng  = `${rutaBase}${idLimpio}-${i}.png`;
    const fallbackSvg  = `data:image/svg+xml;utf8,<svg xmlns='http://w3.org' viewBox='0 0 24 24' fill='%23999'><path d='M4 4h16v16H4V4zm4 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 11h8l-4-6-4 6z'/></svg>`;

    htmlCarrusel += `
      <div style="width: 80px; height: 80px; background-color: #e0e0e0; border-radius: 6px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
        <img src="${rutaInicial}" 
             alt="Foto" 
             loading="lazy"
             style="width: 100%; height: 100%; object-fit: cover;"
             onerror="
               if(this.src.endsWith('.webp')) { this.src='${fallbackJpg}'; }
               else if(this.src.endsWith('.jpg')) { this.src='${fallbackJpeg}'; }
               else if(this.src.endsWith('.jpeg')) { this.src='${fallbackPng}'; }
               else if(this.src.endsWith('.png')) { this.src='${fallbackSvg}'; }
             ">
      </div>`;
  }

  htmlCarrusel += `</div>`;
  return htmlCarrusel;
}

/**
 * Ensambla el HTML estructurado e inyecta la lógica de niveles de servicio de los popups.
 */
function inyectarPopupComercio(registro) {
  const estatusHorario = calcularMotorTemporal(registro[COL_COMERCIO.HORARIO]);
  const nivel = parseInt(registro[COL_COMERCIO.NIVEL]) || 1;
  const idNegocio = registro[COL_COMERCIO.ID] || "";
  
  // Extraer el nombre de la colonia/alcaldía del registro para mapear la ruta de fotos de forma dinámica
  const coloniaMapeo = (registro[COL_COMERCIO.COLONIA] || "").toLowerCase().replace(/ /g, "");

  let html = `<div class="popup-tarjeta">
    <div class="popup-cabecera ${estatusHorario.colorClass}">
      <h3>${registro[COL_COMERCIO.NOMBRE] || "Dato no disponible"}</h3>
      <span>${estatusHorario.texto}</span>
    </div>`;

  // Nivel 3 en adelante: Habilita Slogan y el carrusel de fotografías estructurado por ID
  if (nivel >= 3) {
    html += `<p class="popup-slogan"><i>${registro[COL_COMERCIO.SLOGAN] || ""}</i></p>`;
    // El carrusel busca de forma automatizada las imágenes correspondientes en la carpeta de la colonia
    html += generarCarruselFotosHTML(idNegocio, coloniaMapeo);
  }

  // Nivel 2 en adelante: Despliega el Acordeón HTML nativo <details> para no romper el mapa
  if (nivel >= 2) {
    html += `<details class="popup-acordeon">
      <summary>Ver Horario y Catálogo</summary>
      <div class="acordeon-contenido">
        <p><b>Productos/Servicios:</b> ${registro[COL_COMERCIO.LISTA_PROD_SERV] || "Dato no disponible"}</p>
        <p><b>Horario Completo:</b> ${registro[COL_COMERCIO.HORARIO] || "Dato no disponible"}</p>
      </div>
    </details>`;
  }

  // Nivel 4 y 5: Integra el reproductor embebido <iframe> de YouTube
  if (nivel >= 4 && registro[COL_COMERCIO.YOUTUBE] && registro[COL_COMERCIO.YOUTUBE].trim() !== "") {
    html += `<div class="popup-multimedia">
      <iframe width="100%" height="120" src="${registro[COL_COMERCIO.YOUTUBE]}" frameborder="0" allowfullscreen></iframe>
    </div>`;
  }

  // Enlaces de acción rápidos para navegación GPS y API de WhatsApp
  const linkNavegacion = registro[COL_COMERCIO.MAPS_LINK] || "#";
  const linkWhatsApp = registro[COL_COMERCIO.WHATSAPP] || "#";

  html += `<div class="popup-acciones">
      <a href="${linkNavegacion}" target="_blank" class="btn-popup-nav">
        <i class="fa-solid fa-location-arrow"></i> Cómo llegar
      </a>
      <a href="${linkWhatsApp}" target="_blank" class="btn-popup-wa">
        <i class="fa-brands fa-whatsapp"></i> Contactar
      </a>
    </div>
  </div>`;

  return html;
}
// ==========================================
// SECCIÓN 5: BUSCADOR PREDICTIVO Y SLIDER DE OFERTAS (SEO LOCAL)
// ==========================================

/**
 * Inicializa el comportamiento del buscador predictivo en tiempo real.
 * Evalúa coincidencias omitiendo acentos y reajusta la pantalla con .fitBounds()
 */
function inicializarBuscadorPredictivo() {
  const inputBuscar = document.getElementById("input-buscador-comercial");
  if (!inputBuscar) return;

  inputBuscar.addEventListener("input", (e) => {
    const termino = e.target.value
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // CORRECCIÓN: Restablece limpiamente los pines sin redibujar el HTML de la botonera inferior
    if (termino === "") {
      renderizarPinesComerciales(datosComerciosGlobales);
      return;
    }

    const resultados = datosComerciosGlobales.filter(comercio => {
      const nombre = (comercio[COL_COMERCIO.NOMBRE] || "")
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const catalogo = (comercio[COL_COMERCIO.LISTA_PROD_SERV] || "")
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const giroColor = (entornoActual === "productos") 
        ? (comercio[COL_COMERCIO.CAPA_PRODUCTO] || "") 
        : (comercio[COL_COMERCIO.CAPA_SERVICIO] || "");
      const giro = giroColor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      return nombre.includes(termino) || giro.includes(termino) || catalogo.includes(termino);
    });

    // Filtra los marcadores de forma segura en memoria
    if (mapaNegosistema && capaPinesActivos) {
      capaPinesActivos.clearLayers();
    }
    
    // Ejecuta el repintado aislado
    renderizarPinesComerciales(resultados);
  });
}


/**
 * Procesa las ofertas vigentes bajo un cruce matemático estricto de fechas calendario.
 * Inyecta texto visible encima de la imagen default.png para indexación SEO Local.
 */
function renderizarSliderOfertas(arregloOfertas) {
  const riel = document.getElementById("carrusel-riel");
  if (!riel) return;

  riel.innerHTML = "";
  const hoy = new Date();

  arregloOfertas.forEach(oferta => {
    // Conversión de fechas de control para validez temporal
    const fInicio = new Date(oferta[COL_OFERTA.FECHA_INICIO]);
    const fVencimiento = new Date(oferta[COL_OFERTA.FECHA_FIN]);

    // Cruce Matemático de Ventana de Tiempo
    if (hoy >= fInicio && hoy <= fVencimiento) {
      const tarjeta = document.createElement("div");
      tarjeta.className = "tarjeta-oferta-carrusel";
      tarjeta.style.backgroundImage = "url('./ofertas/default.png')";

      // Estructura semántica con texto explícito legible por Google
      tarjeta.innerHTML = `
        <div class="capa-texto-seo">
          <span class="oferta-resaltada-html">${oferta[COL_OFERTA.TEXTO_OFERTA] || "Dato no disponible"}</span>
          <p class="condicion-oferta-html">${oferta[COL_OFERTA.TEXTO_MENSAJE] || ""}</p>
        </div>
        <button class="btn-ir-al-pin" onclick="enfocarPinNegocio('${oferta[COL_OFERTA.ID]}')">Ver local 📍</button>
      `;
      riel.appendChild(tarjeta);
    }
  });
}

/**
 * Centra el mapa en un comercio específico mediante zoom de aproximación hiperlocal
 * y despliega su popup de manera automática al interactuar con el Slider.
 */
function enfocarPinNegocio(idNegocio) {
  if (!mapaNegosistema || !capaPinesActivos) return;
  let marcadorEncontrado = null;

  // Escaneo lineal del lienzo buscando coincidencia matemática de coordenadas
  capaPinesActivos.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      const comercioAsociado = datosComerciosGlobales.find(c => 
        String(c[COL_COMERCIO.ID]).trim() === String(idNegocio).trim()
      );

      if (comercioAsociado) {
        const coords = (comercioAsociado[COL_COMERCIO.COORDENADAS] || "").split(",");
        if (coords.length === 2) {
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          if (layer.getLatLng().lat === lat && layer.getLatLng().lng === lng) {
            marcadorEncontrado = layer;
          }
        }
      }
    }
  });

  if (marcadorEncontrado) {
    // Zoom hiperlocal nivel 17 y apertura inmediata del popup con sus fotos
    mapaNegosistema.setView(marcadorEncontrado.getLatLng(), 17);
    marcadorEncontrado.openPopup();
  } else {
    // Forzado de reencendido preventivo de capas si el pin estaba oculto
    const comercio = datosComerciosGlobales.find(c => 
      String(c[COL_COMERCIO.ID]).trim() === String(idNegocio).trim()
    );
    if (comercio) {
      const coords = (comercio[COL_COMERCIO.COORDENADAS] || "").split(",");
      if (coords.length === 2) {
        mapaNegosistema.setView([parseFloat(coords[0]), parseFloat(coords[1])], 17);
        renderizarPinesComerciales(datosComerciosGlobales);
        reconstruirBotonesCapasInferiores();
      }
    }
  }
}

/**
 * Inicializa el modo piloto aislado para la landing de ventas
 */
function inicializarModoAnunciatePiloto() {
  Papa.parse(URL_CSV_PILOTO, {
    download: true,
    complete: function(results) {
      // Almacena los 26 comercios de prueba (omitiendo la cabecera)
      datosComerciosGlobales = results.data.slice(1);
      
      // Modo aislado: se vacían las ofertas para evitar conflictos
      datosOfertasGlobales = []; 
      
      // Fuerza el entorno a productos para pintar la paleta inicial
      entornoActual = "productos";
      
      // Renderiza los pines puntuales utilizando las coordenadas del CSV
      renderizarPinesComerciales(datosComerciosGlobales);
    }
  });
}
/**
 * Alterna de forma automática el contenedor visual de filtros en el HTML
 * @param {string} nuevoEntorno - Puede recibir "productos" o "servicios"
 */
function alternarEntornoMapa(nuevoEntorno) {
  entornoActual = nuevoEntorno;
  
  const contenedorFiltros = document.getElementById("contenedor-filtros-global");
  if (contenedorFiltros) {
    if (entornoActual === "productos") {
      contenedorFiltros.className = "modo-productos";
    } else {
      contenedorFiltros.className = "modo-servicios";
    }
  }

  // Ejecuta el filtro de inmediato para limpiar y repintar las nuevas capas
  filtrarPinesPorCapasActivas();
}

/**
 * Modificación del Switch Superior para alternar entornos y menús de palancas
 */
function configurarSwitchEntornos() {
    const btnSwitch = document.getElementById("btn-switch-entorno");
    if (!btnSwitch) return;
    
    btnSwitch.replaceWith(btnSwitch.cloneNode(true));
    const botonActivo = document.getElementById("btn-switch-entorno");
    
    botonActivo.addEventListener("click", function() {
        const entornoActualBoton = this.getAttribute("data-entorno");
        if (entornoActualBoton === "productos") {
            this.setAttribute("data-entorno", "servicios");
            this.innerHTML = 'Ver Productos <span id="emoji-switch"></span> 🍎';
            alternarEntornoMapa("servicios");
        } else {
            this.setAttribute("data-entorno", "productos");
            this.innerHTML = 'Ver Servicios <span id="emoji-switch"></span> 🛠';
            alternarEntornoMapa("productos");
        }
        
        // ¡AJUSTE CRÍTICO AQUÍ!: Invocar la reconstrucción de botones inferiores
        reconstruirBotonesCapasInferiores();
    });
}
