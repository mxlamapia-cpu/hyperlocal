// === INICIO MÓDULO: CONFIGURACIÓN GENERAL ===
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
 MAPA: 3,  
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
let entornoActual = "productos"; // "productos" o "servicios"

// URL de los archivos públicos CSV de Google Sheets
const URL_CSV_ALCALDIAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=1670206752&single=true&output=csv";
const URL_CSV_COLONIAS  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=383048417&single=true&output=csv";
const URL_CSV_COMERCIOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=1369751544&single=true&output=csv";
const URL_CSV_OFERTAS   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgJ-fFKkYHuLy9RR0chu_2disYAKudHI7-A3phmQ08CdOZalAqPj1A6jCz9P2gVhbpoiYuCZOMq0T7/pub?gid=1521270051&single=true&output=csv";
const URL_CSV_PILOTO    = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTpyTu542clbD3QGMLVlDJlprm_Kkl4u0QokBxOvUwmhNbAeQRZFy8q5zJdp5BSOC1ftHnkA53M74S4/pub?output=csv";
// === FIN MÓDULO: CONFIGURACIÓN GENERAL ===

// === INICIO MÓDULO: RENDERIZADO CARTOGRÁFICO ===
document.addEventListener("DOMContentLoaded", () => {
 const params = new URLSearchParams(window.location.search);
 const alcaldiaParam = params.get("alcaldia");
 const coloniaParam = params.get("colonia");

 if (document.getElementById("mapa-macro-contenedor")) {
 mapaNegosistema = L.map("mapa-macro-contenedor").setView([19.4326, -99.1332], 11);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaNegosistema);
 limpiarLienzoMilisegundos();
 if (!alcaldiaParam) {
 verificarYFiltarAlcaldias();
 } else {
 cargarMapaColonias(alcaldiaParam);
 }
 }
  else if (document.getElementById("mapa-comercial-contenedor")) {
    mapaNegosistema = L.map("mapa-comercial-contenedor").setView([19.373, -99.018], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaNegosistema);
    
    // UNIFICACIÓN: Crear el FeatureGroup nativo para densidad real
    window.contenedorPinesGlobal = L.featureGroup().addTo(mapaNegosistema);
    
    limpiarLienzoMilisegundos();
    inicializarModoHiperlocal(coloniaParam);
  }
  else if (document.getElementById("mapa_general")) {
    mapaNegosistema = L.map("mapa_general").setView([19.361, -99.025], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaNegosistema);
    
    // UNIFICACIÓN: Crear el FeatureGroup nativo también para anunciate
    window.contenedorPinesGlobal = L.featureGroup().addTo(mapaNegosistema);
    
    limpiarLienzoMilisegundos();
    inicializarModoAnunciatePiloto();
    setTimeout(() => {
      if (mapaNegosistema) mapaNegosistema.invalidateSize();
    }, 800);
  }

  // Escucha activa de zoom unificada para ambos mapas (Controla tamaño de pines)
  if (mapaNegosistema) {
    mapaNegosistema.on('zoomend', function() {
        const zoomActual = mapaNegosistema.getZoom();
        const contenedorActivo = document.getElementById("mapa-comercial-contenedor") ? "mapa-comercial-contenedor" : "mapa_general";
        const mapaElemento = document.getElementById(contenedorActivo);
        
        if (mapaElemento) {
            mapaElemento.classList.remove('zoom-lejano', 'zoom-medio', 'zoom-cercano');
            if (zoomActual < 14) {
                mapaElemento.classList.add('zoom-lejano');
            } else if (zoomActual >= 14 && zoomActual <= 16) {
                mapaElemento.classList.add('zoom-medio');
            } else {
                mapaElemento.classList.add('zoom-cercano');
            }
        }
    });
  }
});


function transformarCoordenadasWKT(cadenaWKT) {
 if (!cadenaWKT || !cadenaWKT.startsWith("POLYGON")) return [];
 const textoLimpio = cadenaWKT.replace("POLYGON", "").replace(/\(/g, "").replace(/\)/g, "").trim();
 const paresPuntos = textoLimpio.split(",");
 return paresPuntos.map(par => {
 const ejes = par.trim().split(" ");
 if (ejes.length < 2) return null;
 return [parseFloat(ejes[1]), parseFloat(ejes[0])]; 
 }).filter(coord => coord !== null);
}

function limpiarLienzoMilisegundos() {
 if (capaPoligonosActivos && mapaNegosistema) mapaNegosistema.removeLayer(capaPoligonosActivos);
 if (capaPinesActivos && mapaNegosistema) mapaNegosistema.removeLayer(capaPinesActivos);
 if (mapaNegosistema) {
 capaPoligonosActivos = L.featureGroup().addTo(mapaNegosistema);
 capaPinesActivos = L.featureGroup().addTo(mapaNegosistema);
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
 if (datosCSV) {
 return { fillColor: datosCSV[COL_ALCALDIA.COLOR_HEX] || "#3498db", weight: 2.5, opacity: 1, color: "#ffffff", fillOpacity: 0.75 };
 }
 return { fillOpacity: 0, weight: 0, color: "transparent" };
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
  // CORRECCIÓN SEO: Cambiamos de button a elemento de enlace nativo 'a'
  const boton = document.createElement("a");
  boton.className = "btn-accesibilidad-macro";
  boton.innerText = nombreGeo.trim();
  boton.href = urlDestino; // Googlebot rastrea esta URL de inmediato
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
 })
 .catch(err => {
 console.error("Error GeoJSON", err);
 const textoGuia = document.getElementById("texto-guia");
 if (textoGuia) textoGuia.innerText = "Error al cargar las colonias de esta región";
 });
}
// === FIN MÓDULO: RENDERIZADO CARTOGRÁFICO ===
// === INICIO MÓDULO: CONTROL DE CAPAS ===
function inicializarModoHiperlocal(coloniaFiltro) {
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
   contenedorAledanas.appendChild(botonVecino);
  }
  }
 });
 }
 Papa.parse(URL_CSV_OFERTAS, {
 download: true,
 complete: function(ofertasResults) {
  datosOfertasGlobales = ofertasResults.data.slice(1);
  renderizarSliderOfertas(datosOfertasGlobales);
  Papa.parse(URL_CSV_COMERCIOS, {
  download: true,
  complete: function(comerciosResults) {
   const todasLasFilas = comerciosResults.data.slice(1);
   datosComerciosGlobales = todasLasFilas.filter(f => {
   const colCSV = (f[COL_COMERCIO.COLONIA] || "").toLowerCase().replace(/ /g, "");
   return colCSV === String(coloniaFiltro).toLowerCase().replace(/ /g,"");
   });
   entornoActual = "productos";
   const btnSwitch = document.getElementById("btn-switch-entorno");
   if (btnSwitch) {
   btnSwitch.setAttribute("data-entorno", "productos");
   btnSwitch.innerHTML = 'Ver Servicios <span id="emoji-switch">&#128736;</span>';
   }
   reconstruirBotonesCapasInferiores();
   renderizarPinesComerciales(datosComerciosGlobales);
   inicializarBuscadorPredictivo();
   configurarSwitchEntornos();
   filtrarPinesPorCapasActivas();
  }
  });
 }
 });
 }
 });
}

function renderizarPinesComerciales(arregloComercios) {
  // 1. Limpieza absoluta de la capa global de Leaflet
  if (window.contenedorPinesGlobal) {
    window.contenedorPinesGlobal.clearLayers();
  }
  
  marcaroresGIS = []; 

  arregloComercios.forEach(comercio => {
    // Extracción limpia de coordenadas
    const coordRaw = String(comercio[COL_COMERCIO.COORDENADAS]).trim();
    if (!coordRaw || !coordRaw.includes(",")) return;
    const [lat, lng] = coordRaw.split(",").map(num => parseFloat(num.trim()));
    if (isNaN(lat) || isNaN(lng)) return;

    // Blindaje perimetral GIS seguro para la CDMX (Ampliado para San Miguel Teotongo)
    if (lat < 19.0 || lat > 19.6 || lng > -98.8 || lng < -99.4) return;

    // Mapeo de variables del Cerebro
    const entornoPin = String(comercio[COL_COMERCIO.MAPA || 3]).trim().toLowerCase(); 
    const capaProd   = String(comercio[COL_COMERCIO.CAPA_PRODUCTO]).trim().toLowerCase(); 
    const capaServ   = String(comercio[COL_COMERCIO.CAPA_SERVICIO]).trim().toLowerCase(); 
    const nivelPuro  = parseInt(comercio[COL_COMERCIO.NIVEL]) || 1; 

    // Filtro de exclusividad de entornos
    if (entornoPin !== "ambos" && entornoPin !== entornoActual) {
      return; 
    }

        // Decidir la palabra clave limpia de la capa
    let capaActivaClave = (entornoActual === "productos") ? capaProd : capaServ;

    // =========================================================================
    // TRADUCTOR DE IDENTIFICADORES A COLORES DE LA BASE DE DATOS
    // =========================================================================
    const mapeoClasesColor = {
      // Mapa A: Productos
      "canasta": "verde", "comida": "naranja", "ferreteria": "amarillo", 
      "farmacia": "rojo", "variedades": "rosa", "mascotas": "cafe", "tecnologia": "azul",
      // Mapa B: Servicios
      "salud": "azulclaro", "talleres": "azulmedio", "bienestar": "morado", 
      "profesional": "grisoscuro", "hogar": "vino", "educacion": "blanco", "urgencias": "negro",
      // Caída por defecto
      "base": "gris"
    };

    // Obtener la palabra de color asociada al identificador
    let colorFinalCSS = mapeoClasesColor[capaActivaClave] || "gris";
  
    // Escalera comercial de hardware metálico (Niveles 1 al 5)
    let claseNivelComercial = "pin-incognito-gris";
    if (nivelPuro === 5) claseNivelComercial = "pin-oro";
    else if (nivelPuro === 4) claseNivelComercial = "pin-plata";
    else if (nivelPuro >= 2) claseNivelComercial = "pin-bronce";

    // Prefijo del entorno combinado con el ID de la capa limpia para hacer match con tu css
    const prefijoEntorno = (entornoActual === "productos") ? "btn-p-" : "btn-s-";
    
    const iconoGota = L.divIcon({
      // Corregido: Usamos capaActivaClave para apuntar a btn-p-canasta, btn-s-salud, etc.
      className: `pin-personalizado ${prefijoEntorno}${capaActivaClave} ${claseNivelComercial}`,
      html: nivelPuro === 4 ? '<i class="fa-solid fa-fire icono-interno-flama"></i>' : '<i class="fa-solid fa-shop"></i>',
      iconSize:[30, 42],
      iconAnchor:[15, 42], // Centrado horizontal y anclado firmemente en la punta inferior
      popupAnchor: [0, -42]
    });

    // Creación del marcador Leaflet
    const marcador = L.marker([lat, lng], { icon: iconoGota });

    
    marcador.bindPopup(
      typeof inyectarPopupComercio === "function" 
        ? inyectarPopupComercio(comercio) 
        : `<b>${comercio[COL_COMERCIO.NOMBRE] || "Negocio"}</b>`
    );

    if (window.contenedorPinesGlobal) {
      window.contenedorPinesGlobal.addLayer(marcador);
    }
    
    marcaroresGIS.push(marcador);
  });

  // Encuadre suave del mapa sobre los pines reales visibles
  if (window.contenedorPinesGlobal && window.contenedorPinesGlobal.getLayers().length > 0 && mapaNegosistema) {
    mapaNegosistema.fitBounds(window.contenedorPinesGlobal.getBounds(), { maxZoom: 15, padding: [50, 50] });
  }
}

function reconstruirBotonesCapasInferiores() {
 const contenedor = document.getElementById("capas-inferiores-contenedor");
 if (!contenedor) return;
 contenedor.innerHTML = "";
 const paletas = {
 productos: [
 { id: "canasta", label: "Canasta Básica", emoji: "🍎", desc: "Abarrotes, Carnicería, Recaudería..." },
 { id: "comida", label: "Comida Preparada", emoji: "🍮", desc: "Taquerías, Pizzerías, Cafeterías..." },
 { id: "ferreteria", label: "Ferretería y Hogar", emoji: "🛠", desc: "Tlapalerías, Materiales, Pinturas..." },
 { id: "farmacia", label: "Farmacia y Salud", emoji: "💊", desc: "Farmacias, Ópticas, Equipo Médico..." },
 { id: "variedades", label: "Variedades y Moda", emoji: "👝", desc: "Papelerías, Boutiques, Regalos..." },
 { id: "mascotas", label: "Mascotas", emoji: "🐾", desc: "Alimento, Estética Canina..." },
 { id: "tecnologia", label: "Tecnología", emoji: "🎮", desc: "Celulares, Computación, Videojuegos..." },
 { id: "base", label: "Directorio Base", emoji: "🏬", desc: "Solo ubicación verificándose." }
 ],
 servicios: [
 { id: "salud", label: "Salud y Consultas", emoji: "🩺", desc: "Médicos, Dentistas, Laboratorios..." },
 { id: "talleres", label: "Talleres y Oficios", emoji: "🔧", desc: "Mecánicos, Plomeros, Carpinteros..." },
 { id: "bienestar", label: "Bienestar y Estilo", emoji: "✂️", desc: "Barberías, Estéticas, Gimnasios..." },
 { id: "profesional", label: "Profesional y Trámites", emoji: "💼", desc: "Seguros, Contadores, Abogados..." },
 { id: "hogar", label: "Hogar y Eventos", emoji: "🎈", desc: "Salones, Lavanderías, Cerrajerías..." },
 { id: "educacion", label: "Educación y Apoyo", emoji: "📖", desc: "Tareas Dirigidas, Escuelas..." },
 { id: "urgencias", label: "Urgencias 24/7", emoji: "🚨", desc: "Cerrajerías Nocturnas, Grúas..." },
 { id: "base", label: "Directorio Base", emoji: "🏬", desc: "Solo ubicación verificándose." }
 ]
 };
 const capasEntorno = paletas[entornoActual] || [];
 capasEntorno.forEach(capa => {
 const itemFiltro = document.createElement("div");
 itemFiltro.className = "guia-item-filtro";
 itemFiltro.innerHTML = '<label class="toggle-switch"><input type="checkbox" class="filtro-capa-chk" data-tipo="' + entornoActual + '" data-capa="' + capa.id + '" checked><span class="slider-palanca visual-' + capa.id + '"></span></label><div class="texto-filtro-info" style="margin-left: 10px; font-size: 13px; color: #2c3e50;"><strong>' + capa.emoji + ' ' + capa.label + ':</strong><span style="font-size: 11px; color: #7f8c8d; display:block;">(' + capa.desc + ')</span></div>';
 itemFiltro.querySelector(".filtro-capa-chk").addEventListener("change", filtrarPinesPorCapasActivas);
 contenedor.appendChild(itemFiltro);
 });
}

function filtrarPinesPorCapasActivas() {
  // 1. Recolectar palabras clave activas desde los switches en parrilla
  const capasActivas = [];
  const switches = document.querySelectorAll(".filtro-capa-chk[data-tipo=\"" + entornoActual + "\"]");
  switches.forEach(sw => {
    if (sw.checked) capasActivas.push(sw.getAttribute("data-capa").trim().toLowerCase());
  });
  
  // 2. Filtrar los comercios en la memoria que pertenezcan a las capas encendidas
  const comerciosFiltradosYVisibles = datosComerciosGlobales.filter(comercio => {
    if (!comercio || comercio.length === 0) return false;
    
    // Extrae la palabra limpia de la columna correspondiente del Cerebro
    const capaColorRaw = (entornoActual === "productos") 
      ? comercio[COL_COMERCIO.CAPA_PRODUCTO]  // Columna E (Índice 4)
      : comercio[COL_COMERCIO.CAPA_SERVICIO]; // Columna F (Índice 5)
      
    if (!capaColorRaw) return false;
    const capaComercioLimpia = capaColorRaw.trim().toLowerCase();
    
    // Retorna verdadero si la capa del negocio está activa en la parrilla
    return capasActivas.includes(capaComercioLimpia);
  });
  
  // 3. Forzar el re-dibujo inmediato de las gotas en el mapa de Leaflet
  renderizarPinesComerciales(comerciosFiltradosYVisibles);
}

function generarDatosEstructuradosSEO(comerciosFiltrados) {
 // Eliminamos scripts previos para evitar duplicar información en memoria
 const scriptPrevio = document.getElementById("seo-local-jsonld");
 if (scriptPrevio) scriptPrevio.remove();
 if (comerciosFiltrados.length === 0) return;
 // Estructura un formato unificado compatible con el estándar Schema.org
 const estructuraData = {
 "@context": "https://schema.org",
 "@type": "ItemList",
 "itemListElement": comerciosFiltrados.map((comercio, indice) => {
  const coords = (comercio[COL_COMERCIO.COORDENADAS] || "").split(",");
  return {
  "@type": "ListItem",
  "position": indice + 1,
  "item": {
   "@type": "LocalBusiness",
   "name": comercio[COL_COMERCIO.NOMBRE] || "Negocio Local",
   "description": comercio[COL_COMERCIO.SLOGAN] || "Comercio de barrio registrado en el mapa.",
   "telephone": comercio[COL_COMERCIO.WHATSAPP] || "",
   "geo": coords.length === 2 ? {
   "@type": "GeoCoordinates",
   "latitude": parseFloat(coords[0]),
   "longitude": parseFloat(coords[1])
   } : null
  }
  };
 })
 };

 const scriptSEO = document.createElement("script");
 scriptSEO.id = "seo-local-jsonld";
 scriptSEO.type = "application/ld+json";
 scriptSEO.text = JSON.stringify(estructuraData);
 document.head.appendChild(scriptSEO);
}
// === FIN MÓDULO: CONTROL DE CAPAS ===
// === INICIO MÓDULO: CALCULO TIEMPOS Y POPUPS ===
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
 const rangoDias = partes[0].split("-");
 let diaInicio = diasMapa[rangoDias[0].trim()];
 let diaFin = rangoDias[1] ? diasMapa[rangoDias[1].trim()] : diaInicio;
 if (diaIndex >= diaInicio && diaIndex <= diaFin) {
 horarioHoy = partes.slice(1).join(":"); 
 break;
 }
 }
 if (!horarioHoy) return { colorClass: "popup-cerrado", texto: "CERRADO (Hoy)" };
 const horasRango = horarioHoy.split("-");
 if (horasRango.length < 2) return { colorClass: "popup-cerrado", texto: "CERRADO" };
 const [hInicio, mInicio] = horasRango[0].split(":").map(Number);
 const [hFin, mFin] = horasRango[1].split(":").map(Number);
 const minutosInicioTotal = (hInicio * 60) + mInicio;
 const minutosFinTotal = (hFin * 60) + mFin;
 if (horaActualMinutos >= minutosInicioTotal && horaActualMinutos < minutosFinTotal) {
 return (minutosFinTotal - horaActualMinutos <= 30) ? { colorClass: "popup-critico", texto: "PRÓXIMO A CERRAR" } : { colorClass: "popup-abierto", texto: "ABIERTO" };
 } else {
 return { colorClass: "popup-cerrado", texto: "CERRADO" };
 }
}

function generarCarruselFotosHTML(idNegocio, esPiloto) {
    if (!idNegocio) return '';
    const rutaBase = esPiloto ? "geo/iztapalapa/img-nego/anunciate/" : "geo/iztapalapa/img-nego/";
    
    let htmlCarrusel = '<div class="popup-carrusel-fotos" style="display: flex; gap: 8px; max-height: 100px; margin-top: 8px; overflow-x: auto;">';
    const formatos = esPiloto ? ['png', 'jpg', 'jpeg'] : ['webp', 'jpg', 'jpeg', 'png'];
    const idLimpio = idNegocio.trim();
    
    for (let i = 1; i <= 3; i++) { 
        const rutaInicial = rutaBase + idLimpio + "-" + i + "." + formatos[0];
        const fallbackJpg = rutaBase + idLimpio + "-" + i + ".jpg";
        const fallbackJpeg = rutaBase + idLimpio + "-" + i + ".jpeg";
        const fallbackPng = rutaBase + idLimpio + "-" + i + ".png";
        const fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://w3.org' viewBox='0 0 24 24' fill='%23999'><path d='M4 4h16v16H4V4zm4 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 11h8l-4-6-4 6z'/></svg>";
        
        htmlCarrusel += '<div style="width: 80px; height: 80px; background-color: #e0e0e0; border-radius: 6px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;"><img src="' + rutaInicial + '" alt="Foto ' + i + '" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" onerror="if(this.src.endsWith(\'.webp\')) { this.src=\'' + fallbackJpg + '\'; } else if(this.src.endsWith(\'.jpg\')) { this.src=\'' + fallbackJpeg + '\'; } else if(this.src.endsWith(\'.jpeg\')) { this.src=\'' + fallbackPng + '\'; } else if(this.src.endsWith(\'.png\')) { this.src=\'' + fallbackSvg + '\'; }"></div>';
    }
    htmlCarrusel += "</div>";
    return htmlCarrusel;
}

// FILTRO MULTIPLATAFORMA: Convierte cualquier enlace crudo de video en un formato reproducible dentro del mapa
function obtenerHtmlVideoIncrustable(urlVideo) {
    if (!urlVideo || urlVideo.trim() === "") return "";
    const url = urlVideo.trim();

    // Caso 1: YouTube Shorts o Videos Estándar
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        let videoId = "";
        if (url.includes("shorts/")) {
            videoId = url.split("shorts/")[1].split("?")[0];
        } else if (url.includes("v=")) {
            videoId = url.split("v=")[1].split("&")[0];
        } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1].split("?")[0];
        }
        return `<div class="popup-multimedia" style="margin-top: 10px;"><iframe width="100%" height="160" src="https://youtube.com{videoId}" frameborder="0" allowfullscreen></iframe></div>`;
    }

    // Caso 2: TikTok
    if (url.includes("tiktok.com")) {
        let videoId = "";
        if (url.includes("/video/")) {
            videoId = url.split("/video/")[1].split("?")[0];
            return `<div class="popup-multimedia" style="margin-top: 10px;"><iframe width="100%" height="160" src="https://tiktok.com{videoId}" frameborder="0" allowfullscreen></iframe></div>`;
        }
        // Si el link es recortado (ej. ://tiktok.com), se genera un botón de redirección seguro para no romper la app
        return `<div style="margin-top: 10px;"><a href="${url}" target="_blank" class="btn-popup-nav" style="background:#000; color:#fff; font-size:11px; text-align:center; padding:6px; display:block; border-radius:4px;"><i class="fa-brands fa-tiktok"></i> Ver Video en TikTok</a></div>`;
    }

    // Caso 3: Instagram Reels / Videos
    if (url.includes("instagram.com")) {
        let cleanUrl = url.split("?")[0];
        if (!cleanUrl.endsWith("/")) cleanUrl += "/";
        return `<div class="popup-multimedia" style="margin-top: 10px;"><iframe width="100%" height="160" src="${cleanUrl}embed/" frameborder="0" allowfullscreen></iframe></div>`;
    }

    return "";
}

function inyectarPopupComercio(registro) {
    const estatusHorario = calcularMotorTemporal(registro[COL_COMERCIO.HORARIO]);
    const nivel = parseInt(registro[COL_COMERCIO.NIVEL]) || 1;
    const idNegocio = registro[COL_COMERCIO.ID] || "";
    const esPilotoNegocio = idNegocio.toString().includes('-p');
    
    let html = '<div class="popup-tarjeta"><div class="popup-cabecera ' + estatusHorario.colorClass + '"><h3>' + (registro[COL_COMERCIO.NOMBRE] || "Dato no disponible") + '</h3><span>' + estatusHorario.texto + '</span></div>';
    
    if (nivel >= 3) {
        html += '<p class="popup-slogan"><i>' + (registro[COL_COMERCIO.SLOGAN] || "") + '</i></p>';
        html += generarCarruselFotosHTML(idNegocio, esPilotoNegocio);
    }
    if (nivel >= 2) {
        html += '<details class="popup-acordeon"><summary>Ver Horario y Catálogo</summary><div class="acordeon-contenido"><p><b>Productos/Servicios:</b> ' + (registro[COL_COMERCIO.LISTA_PROD_SERV] || "Dato no disponible") + '</p><p><b>Horario Completo:</b> ' + (registro[COL_COMERCIO.HORARIO] || "Dato no disponible") + '</p></div></details>';
    }
    
    // Inyección de Video Inteligente al final del flujo multimedia (Soporta YouTube, Shorts, TikTok e Instagram)
    if (nivel >= 4 && registro[COL_COMERCIO.YOUTUBE]) {
        html += obtenerHtmlVideoIncrustable(registro[COL_COMERCIO.YOUTUBE]);
    }
    
    html += '<div class="popup-acciones" style="margin-top: 10px; display: flex; gap: 5px;">';
    
    if (registro[COL_COMERCIO.MAPS_LINK] && registro[COL_COMERCIO.MAPS_LINK].trim() !== "") {
        html += '<a href="' + registro[COL_COMERCIO.MAPS_LINK] + '" target="_blank" class="btn-popup-nav"><i class="fa-solid fa-location-arrow"></i> Cómo llegar</a>';
    }
    // CORRECCIÓN DIRECTA DEL CSV: Se inyecta la URL de WhatsApp limpia tal cual viene de tu hoja de cálculo
    if (registro[COL_COMERCIO.WHATSAPP] && registro[COL_COMERCIO.WHATSAPP].trim() !== "") {
        html += '<a href="' + registro[COL_COMERCIO.WHATSAPP].trim() + '" target="_blank" class="btn-popup-wa"><i class="fa-brands fa-whatsapp"></i> Contactar</a>';
    }
    if (nivel == 5 && registro[COL_COMERCIO.LANDING_LINK] && registro[COL_COMERCIO.LANDING_LINK].trim() !== "") {
        html += '<a href="' + registro[COL_COMERCIO.LANDING_LINK] + '" target="_blank" class="btn-popup-landing" style="background-color: #d4af37; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-globe"></i> Web Xalpa</a>';
    }
    
    html += '</div></div>';
    return html;
}
// === FIN MÓDULO: CALCULO TIEMPOS Y POPUPS ===

// === INICIO MÓDULO: MOTOR AUXILIAR Y SEO ===
function inicializarBuscadorPredictivo() {
 const inputBuscar = document.getElementById("input-buscador-comercial");
 if (!inputBuscar) return;
 inputBuscar.addEventListener("input", (e) => {
 const termino = e.target.value.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
 if (termino === "") {
  renderizarPinesComerciales(datosComerciosGlobales);
  return;
 }
 const resultados = datosComerciosGlobales.filter(comercio => {
  const nombre = (comercio[COL_COMERCIO.NOMBRE] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const catalogo = (comercio[COL_COMERCIO.LISTA_PROD_SERV] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const giroColor = (entornoActual === "productos") ? (comercio[COL_COMERCIO.CAPA_PRODUCTO] || "") : (comercio[COL_COMERCIO.CAPA_SERVICIO] || "");
  const giro = giroColor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return nombre.includes(termino) || giro.includes(termino) || catalogo.includes(termino);
 });
 
 // CORRECCIÓN: Limpieza del FeatureGroup unificado global para evitar que se amontonen los resultados
 if (window.contenedorPinesGlobal) window.contenedorPinesGlobal.clearLayers();
 renderizarPinesComerciales(resultados);
 });
}

function renderizarSliderOfertas(arregloOfertas) {
 const riel = document.getElementById("carrusel-riel");
 if (!riel) return;
 riel.innerHTML = "";
 const hoy = new Date();
 arregloOfertas.forEach(oferta => {
 const fInicio = new Date(oferta[COL_OFERTA.FECHA_INICIO]);
 const fVencimiento = new Date(oferta[COL_OFERTA.FECHA_FIN]);
 if (hoy >= fInicio && hoy <= fVencimiento) {
  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta-oferta-carrusel";
  tarjeta.style.backgroundImage = "url('./ofertas/default.png')";
  tarjeta.innerHTML = '<div class="capa-texto-seo"><span class="oferta-resaltada-html">' + (oferta[COL_OFERTA.TEXTO_OFERTA] || "Dato no disponible") + '</span><p class="condicion-oferta-html">' + (oferta[COL_OFERTA.TEXTO_MENSAJE] || "") + '</p></div><button class="btn-ir-al-pin" onclick="enfocarPinNegocio(\'' + oferta[COL_OFERTA.ID] + '\')">Ver local 📍</button>';
  riel.appendChild(tarjeta);
 }
 });
}

function enfocarPinNegocio(idNegocio) {
 if (!mapaNegosistema || !window.contenedorPinesGlobal) return;
 let marcadorEncontrado = null;
 
 // CORRECCIÓN: Barrido adaptado al FeatureGroup unificado para encontrar el local en el mapa
 window.contenedorPinesGlobal.eachLayer((layer) => {
 if (layer instanceof L.Marker) {
  const comercioAsociado = datosComerciosGlobales.find(c => String(c[COL_COMERCIO.ID]).trim() === String(idNegocio).trim());
  if (comercioAsociado) {
  const coords = (comercioAsociado[COL_COMERCIO.COORDENADAS] || "").split(",");
  if (coords.length === 2 && layer.getLatLng().lat === parseFloat(coords[0]) && layer.getLatLng().lng === parseFloat(coords[1])) {
   marcadorEncontrado = layer;
  }
  }
 }
 });
 if (marcadorEncontrado) {
 mapaNegosistema.setView(marcadorEncontrado.getLatLng(), 17);
 marcadorEncontrado.openPopup();
 } else {
 const comercio = datosComerciosGlobales.find(c => String(c[COL_COMERCIO.ID]).trim() === String(idNegocio).trim());
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

function inicializarModoAnunciatePiloto() {
 console.log("Procesando datos del simulador interactivo en modo Anúnciate...");
 
 Papa.parse(URL_CSV_PILOTO, {
 download: true,
 complete: function(results) {
 const filasPiloto = results.data.slice(1);
 
 datosComerciosGlobales = filasPiloto.map(fila => {
 let filaNormalizada = [];
 
 filaNormalizada[COL_COMERCIO.ID] = fila[1] || ""; 
 filaNormalizada[COL_COMERCIO.COLONIA] = fila[2] || ""; 
 
 // Extraemos y normalizamos el entorno (Productos o Servicios)
 const tipoMapaCrudo = String(fila[3] || "").toLowerCase().trim(); 
 filaNormalizada[COL_COMERCIO.MAPA] = tipoMapaCrudo.includes("serv") ? "servicios" : "productos";
 
  // =========================================================================
 // TRADUCTOR QUIRÚRGICO DE COLORES ANTIGUOS A LAS 8 NUEVAS CAPAS DEL CEREBRO
 // =========================================================================
 const mapeoColoresPalabras = {
   "verde": "canasta", "naranja": "comida", "amarillo": "ferreteria", 
   "rojo": "farmacia", "rosa": "variedades", "cafe": "mascotas", 
   "azul": "tecnologia", "azulclaro": "salud", "azulmedio": "talleres", 
   "morado": "bienestar", "grisoscuro": "profesional", "vino": "hogar", 
   "blanco": "educacion", "negro": "urgencias", "gris": "base"
 };

 // Extraemos el valor del CSV, lo limpiamos, lo traducimos y si no existe cae a "base"
 const colorProdCrudo = String(fila[4] || "").toLowerCase().trim();
 const colorServCrudo = String(fila[5] || "").toLowerCase().trim();

 filaNormalizada[COL_COMERCIO.CAPA_PRODUCTO] = mapeoColoresPalabras[colorProdCrudo] || "base";
 filaNormalizada[COL_COMERCIO.CAPA_SERVICIO] = mapeoColoresPalabras[colorServCrudo] || "base";
 // =========================================================================

 filaNormalizada[COL_COMERCIO.NIVEL] = fila[6] || "1"; 
 filaNormalizada[COL_COMERCIO.NOMBRE] = fila[7] || ""; 
 filaNormalizada[COL_COMERCIO.SLOGAN] = fila[8] || ""; 
 filaNormalizada[COL_COMERCIO.LISTA_PROD_SERV] = fila[9] || "";
 filaNormalizada[COL_COMERCIO.HORARIO] = fila[10] || ""; 
 filaNormalizada[COL_COMERCIO.YOUTUBE] = fila[12] || ""; 
 filaNormalizada[COL_COMERCIO.WHATSAPP] = fila[13] || ""; 
 filaNormalizada[COL_COMERCIO.COORDENADAS] = fila[14] || ""; 
 filaNormalizada[COL_COMERCIO.MAPS_LINK] = fila[15] || ""; 
 
 return filaNormalizada;
 });
 
 const primerRegistro = datosComerciosGlobales[0];
 entornoActual = primerRegistro ? primerRegistro[COL_COMERCIO.MAPA] : "productos";
 
 const btnSwitch = document.getElementById("btn-switch-entorno");
 if (btnSwitch) {
 btnSwitch.setAttribute("data-entorno", entornoActual);
 btnSwitch.innerHTML = entornoActual === "productos" 
 ? 'Ver Servicios <span id="emoji-switch">🛠</span>' 
 : 'Ver Productos <span id="emoji-switch">🍎</span>'; 
 }
 
 // Despertamos los componentes frontend sincronizados con el ecosistema
 reconstruirBotonesCapasInferiores(); 
 configurarSwitchEntornos(); 
 filtrarPinesPorCapasActivas(); 
 }
 });
}


/**
 * Fabrica el marcador HTML vinculando las propiedades de styles.css
 * e inyectando la corrección geométrica de anclaje y escala metálica.
 */
function crearIconoComercial(colorCapa, nivelComercio, registroComercio) {
  const nivel = parseInt(nivelComercio) || 1;
  let claseMetalica = 'pin-estandar';
  
  // 1. Asignación estricta de la escalera de valor hiperlocal en los pines
  if (nivel === 5) claseMetalica = 'pin-oro pulso-dorado';
  if (nivel === 4) claseMetalica = 'pin-plata';
  if (nivel === 3) claseMetalica = 'pin-bronce';
  if (nivel === 1) claseMetalica = 'pin-incognito-gris';

  // 2. Si es Nivel 1, forzamos que el color del fondo sea gris absoluto
  const colorFinalRamo = (nivel === 1) ? 'gris' : colorCapa.toLowerCase().trim();

  // 3. Validación de oferta activa para inyectar la flama animada en Nivel 4
  let iconoInternoHtml = '<i class="fa-solid fa-shop" style="font-size: 12px;"></i>';
  if (nivel === 4 && registroComercio) {
    // Buscamos si la columna de oferta activa del CSV contiene texto de promoción
    const tieneOferta = registroComercio[COL_COMERCIO.OFERTA_ACTIVA] || registroComercio.OFERTA_ACTIVA;
    if (tieneOferta && tieneOferta.trim() !== "") {
      iconoInternoHtml = '<div class="icono-interno-flama">🔥</div>';
    }
  }

  return L.divIcon({
    // UNIFICACIÓN TÉCNICA: Se fuerza un contenedor limpio para disolver el marco cuadrado nativo de Leaflet
    className: "pin-personalizado bg-limpio " + claseMetalica + " " + (entornoActual === "productos" ? "btn-p-" + colorFinalRamo : "btn-s-" + colorFinalRamo),
    html: iconoInternoHtml,
    iconSize: [30, 42],       // Dimensiones reales de la gota invertida en pixeles planos
    iconAnchor: [15, 42],     // Coordenadas en texto plano: Clava milimétricamente la punta inferior en la calle
    popupAnchor: [0, -42]     // Despliega el popup centrado por encima de la gota redonda
  });


}

function alternarEntornoMapa(nuevoEntorno) {
 entornoActual = nuevoEntorno;
 const contenedorFiltros = document.getElementById("contenedor-filtros-global");
 if (contenedorFiltros) contenedorFiltros.className = (entornoActual === "productos") ? "modo-productos" : "modo-servicios";
 filtrarPinesPorCapasActivas();
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
      
      // 1. Primero notificamos al mapa el cambio de entorno
      alternarEntornoMapa("servicios");
    } else {
      this.setAttribute("data-entorno", "productos");
      this.innerHTML = 'Ver Servicios <span id="emoji-switch">🛠</span>';
      
      // 1. Primero notificamos al mapa el cambio de entorno
      alternarEntornoMapa("productos");
    }
    
    // 2. SEGUNDO: Ahora que el mapa ya cambió internamente, reconstruimos los botones de colores
    reconstruirBotonesCapasInferiores();
    
    // 3. TERCERO: Forzamos el refresco visual de los pines abiertos (densidad protegida por FeatureGroup)
    if (typeof filtrarPinesPorCapasActivas === "function") {
      filtrarPinesPorCapasActivas();
    }
  });
}
// === FIN MÓDULO: MOTOR AUXILIAR Y SEO ===