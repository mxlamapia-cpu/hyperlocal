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
const URL_CSV_PILOTO    = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGcorxjHpvr9WkNUQd2cRuAf1wRFlI5Jr67WeT9aZnz74Y677ZZ9u3iAFpwCl5RcuVM8npRYOrJbJ_/pub?gid=956712165&single=true&output=csv";
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
 limpiarLienzoMilisegundos();
 inicializarModoHiperlocal(coloniaParam);
 }
 else if (document.getElementById("mapa_general")) {
 mapaNegosistema = L.map("mapa_general").setView([19.361, -99.025], 14);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaNegosistema);
 limpiarLienzoMilisegundos();
 inicializarModoAnunciatePiloto();
 setTimeout(() => {
 if (mapaNegosistema) mapaNegosistema.invalidateSize();
 }, 800);
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
 if (mapaNegosistema && capaPinesActivos) capaPinesActivos.clearLayers();
 arregloComercios.forEach(comercio => {
 const coordenadasCrudas = (comercio[COL_COMERCIO.COORDENADAS] || "").split(",");
 if (coordenadasCrudas.length !== 2) return;
 const lat = parseFloat(coordenadasCrudas[0]);
 const lng = parseFloat(coordenadasCrudas[1]);
 if (isNaN(lat) || isNaN(lng)) return;
 let capaColor = (entornoActual === "productos") ? comercio[COL_COMERCIO.CAPA_PRODUCTO] : comercio[COL_COMERCIO.CAPA_SERVICIO];
 if (!capaColor || capaColor.trim() === "") capaColor = "gris";
 const tieneOferta = datosOfertasGlobales.some(o => String(o[COL_OFERTA.ID]).trim() === String(comercio[COL_COMERCIO.ID]).trim());
 let clasePinBase = parseInt(comercio[COL_COMERCIO.NIVEL]) === 5 ? "pin-personalizado pin-oro" : "pin-personalizado pin-plata";
 if (tieneOferta) clasePinBase += " pin-con-flama";
 const claseColorEntorno = (entornoActual === "productos") ? "btn-p-" + capaColor.trim().toLowerCase() : "btn-s-" + capaColor.trim().toLowerCase();
 const miIcono = L.divIcon({ className: clasePinBase + " " + claseColorEntorno, html: ' ', iconSize:[30, 30], iconAnchor: [15, 15] });
 const marcador = L.marker([lat, lng], { icon: miIcono }).bindPopup(inyectarPopupComercio(comercio));
 capaPinesActivos.addLayer(marcador);
 });
 if (capaPinesActivos.getLayers().length > 0 && mapaNegosistema) {
 mapaNegosistema.fitBounds(capaPinesActivos.getBounds(), { maxZoom: 15, padding: [20, 20] });
 }
}

function reconstruirBotonesCapasInferiores() {
 const contenedor = document.getElementById("capas-inferiores-contenedor");
 if (!contenedor) return;
 contenedor.innerHTML = "";
 const paletas = {
 productos: [
 { id: "verde", label: "Canasta Básica", emoji: "&#127822;", desc: "Abarrotes, Carnicería, Recaudería..." },
 { id: "naranja", label: "Comida Preparada", emoji: "&#127854;", desc: "Taquerías, Pizzerías, Cafeterías..." },
 { id: "amarillo", label: "Ferretería y Hogar", emoji: "&#128736;", desc: "Tlapalerías, Materiales, Pinturas..." },
 { id: "rojo", label: "Salud y Farmacia", emoji: "&#128138;", desc: "Farmacias, Ópticas, Equipo Médico..." },
 { id: "rosa", label: "Variedades y Moda", emoji: "&#128093;", desc: "Papelerías, Boutiques, Regalos..." },
 { id: "cafe", label: "Mascotas", emoji: "&#128062;", desc: "Alimento, Estética Canina..." },
 { id: "azul", label: "Tecnología", emoji: "&#128031;", desc: "Celulares, Computación, Videojuegos..." },
 { id: "gris", label: "Directorio Base", emoji: "&#127980;", desc: "Solo ubicación verificándose." }
 ],
 servicios: [
 { id: "azulclaro", label: "Salud y Consultas", emoji: "&#129658;", desc: "Médicos, Dentistas, Laboratorios..." },
 { id: "azulmedio", label: "Talleres y Oficios", emoji: "&#128295;", desc: "Mecánicos, Plomeros, Carpinteros..." },
 { id: "morado", label: "Bienestar y Estilo", emoji: "&#x2702;", desc: "Barberías, Estéticas, Gimnasios..." },
 { id: "grisoscuro", label: "Asesoría y Oficina", emoji: "&#128188;", desc: "Seguros, Contadores, Abogados..." },
 { id: "vino", label: "Hogar y Eventos", emoji: "&#127880;", desc: "Salones, Lavanderías, Cerrajerías..." },
 { id: "blanco", label: "Educación y Apoyo", emoji: "&#128214;", desc: "Tareas Dirigidas, Escuelas..." },
 { id: "negro", label: "Urgencias 24/7", emoji: "&#128680;", desc: "Cerrajerías Nocturnas, Grúas..." },
 { id: "gris", label: "Directorio Base", emoji: "&#127980;", desc: "Solo ubicación verificándose." }
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
 if (typeof capaPinesActivos !== 'undefined' && mapaNegosistema.hasLayer(capaPinesActivos)) {
 capaPinesActivos.clearLayers();
 } else {
 capaPinesActivos = L.featureGroup().addTo(mapaNegosistema);
 }
 const capasActivas = [];
 const switches = document.querySelectorAll(".filtro-capa-chk[data-tipo=\"" + entornoActual + "\"]");
 switches.forEach(sw => {
 if (sw.checked) capasActivas.push(sw.getAttribute("data-capa").trim().toLowerCase());
 });
 datosComerciosGlobales.forEach(comercio => {
 if (!comercio || comercio.length === 0) return;
 let capaColor = (entornoActual === "productos") ? comercio[COL_COMERCIO.CAPA_PRODUCTO] : comercio[COL_COMERCIO.CAPA_SERVICIO];
 if (!capaColor || capaColor.trim() === "") capaColor = "gris";
 const capaComercioNormalizada = capaColor.trim().toLowerCase();
 if (capasActivas.includes(capaComercioNormalizada)) {
 const coordenadasCrudas = (comercio[COL_COMERCIO.COORDENADAS] || "").split(",");
 if (coordenadasCrudas.length === 2) {
  const lat = parseFloat(coordenadasCrudas[0]);
  const lng = parseFloat(coordenadasCrudas[1]);
  if (!isNaN(lat) && !isNaN(lng)) {
  let clasePinBase = parseInt(comercio[COL_COMERCIO.NIVEL]) === 5 ? "pin-personalizado pin-oro" : "pin-personalizado pin-plata";
  const claseColorEntorno = (entornoActual === "productos") ? "btn-p-" + capaComercioNormalizada : "btn-s-" + capaComercioNormalizada;
  const miIcono = L.divIcon({ className: clasePinBase + " " + claseColorEntorno, html: ' ', iconSize:[32, 32], iconAnchor: [16, 32] });
  const marcador = L.marker([lat, lng], { icon: miIcono });
  marcador.bindPopup(typeof inyectarPopupComercio === "function" ? inyectarPopupComercio(comercio) : "<b>" + (comercio[7] || "Negocio") + "</b>");
  capaPinesActivos.addLayer(marcador);
  }
 }
 }
 });
 }
// Agrega esta lógica al final de la función filtrarPinesPorCapasActivas(), justo después del bucle de comercios:
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

function generarCarruselFotosHTML(idNegocio, alcaldiaRuta) {
 if (!idNegocio) return '';
 const rutaBase = "geo/iztapalapa/img-nego/";
 let htmlCarrusel = '<div class="popup-carrusel-fotos" style="display: flex; gap: 8px; max-height: 100px; margin-top: 8px; overflow-x: auto;">';
 const formatos = ['webp', 'jpg', 'jpeg', 'png'];
 const idLimpio = idNegocio.trim();
 for (let i = 1; i <= 1; i++) { 
 const rutaInicial = rutaBase + idLimpio + "-" + i + "." + formatos[0];
 const fallbackJpg = rutaBase + idLimpio + "-" + i + ".jpg";
 const fallbackJpeg = rutaBase + idLimpio + "-" + i + ".jpeg";
 const fallbackPng = rutaBase + idLimpio + "-" + i + ".png";
 const fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://w3.org' viewBox='0 0 24 24' fill='%23999'><path d='M4 4h16v16H4V4zm4 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 11h8l-4-6-4 6z'/></svg>";
 htmlCarrusel += '<div style="width: 80px; height: 80px; background-color: #e0e0e0; border-radius: 6px; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;"><img src="' + rutaInicial + '" alt="Foto" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" onerror="if(this.src.endsWith(\'.webp\')) { this.src=\'' + fallbackJpg + '\'; } else if(this.src.endsWith(\'.jpg\')) { this.src=\'' + fallbackJpeg + '\'; } else if(this.src.endsWith(\'.jpeg\')) { this.src=\'' + fallbackPng + '\'; } else if(this.src.endsWith(\'.png\')) { this.src=\'' + fallbackSvg + '\'; }"></div>';
 }
 htmlCarrusel += "</div>";
 return htmlCarrusel;
}

function inyectarPopupComercio(registro) {
 const estatusHorario = calcularMotorTemporal(registro[COL_COMERCIO.HORARIO]);
 const nivel = parseInt(registro[COL_COMERCIO.NIVEL]) || 1;
 const idNegocio = registro[COL_COMERCIO.ID] || "";
 const coloniaMapeo = (registro[COL_COMERCIO.COLONIA] || "").toLowerCase().replace(/ /g, "");
 let html = '<div class="popup-tarjeta"><div class="popup-cabecera ' + estatusHorario.colorClass + '"><h3>' + (registro[COL_COMERCIO.NOMBRE] || "Dato no disponible") + '</h3><span>' + estatusHorario.texto + '</span></div>';
 if (nivel >= 3) {
 html += '<p class="popup-slogan"><i>' + (registro[COL_COMERCIO.SLOGAN] || "") + '</i></p>';
 html += generarCarruselFotosHTML(idNegocio, coloniaMapeo);
 }
 if (nivel >= 2) {
 html += '<details class="popup-acordeon"><summary>Ver Horario y Catálogo</summary><div class="acordeon-contenido"><p><b>Productos/Servicios:</b> ' + (registro[COL_COMERCIO.LISTA_PROD_SERV] || "Dato no disponible") + '</p><p><b>Horario Completo:</b> ' + (registro[COL_COMERCIO.HORARIO] || "Dato no disponible") + '</p></div></details>';
 }
 if (nivel >= 4 && registro[COL_COMERCIO.YOUTUBE] && registro[COL_COMERCIO.YOUTUBE].trim() !== "") {
 html += '<div class="popup-multimedia"><iframe width="100%" height="120" src="' + registro[COL_COMERCIO.YOUTUBE] + '" frameborder="0" allowfullscreen></iframe></div>';
 }
 html += '<div class="popup-acciones"><a href="' + (registro[COL_COMERCIO.MAPS_LINK] || "#") + '" target="_blank" class="btn-popup-nav"><i class="fa-solid fa-location-arrow"></i> Cómo llegar</a><a href="' + (registro[COL_COMERCIO.WHATSAPP] || "#") + '" target="_blank" class="btn-popup-wa"><i class="fa-brands fa-whatsapp"></i> Contactar</a></div></div>';
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
 if (mapaNegosistema && capaPinesActivos) capaPinesActivos.clearLayers();
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
  tarjeta.innerHTML = '<div class="capa-texto-seo"><span class="oferta-resaltada-html">' + (oferta[COL_OFERTA.TEXTO_OFERTA] || "Dato no disponible") + '</span><p class="condicion-oferta-html">' + (oferta[COL_OFERTA.TEXTO_MENSAJE] || "") + '</p></div><button class="btn-ir-al-pin" onclick="enfocarPinNegocio(\'' + oferta[COL_OFERTA.ID] + '\')">Ver local &#128205;</button>';
  riel.appendChild(tarjeta);
 }
 });
}

function enfocarPinNegocio(idNegocio) {
 if (!mapaNegosistema || !capaPinesActivos) return;
 let marcadorEncontrado = null;
 capaPinesActivos.eachLayer((layer) => {
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
 Papa.parse(URL_CSV_PILOTO, {
 download: true,
 complete: function(results) {
  datosComerciosGlobales = results.data.slice(1);
  datosOfertasGlobales = []; 
  entornoActual = "productos";
  renderizarPinesComerciales(datosComerciosGlobales);
 }
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
  this.innerHTML = 'Ver Productos <span id="emoji-switch">&#127822;</span>';
  alternarEntornoMapa("servicios");
 } else {
  this.setAttribute("data-entorno", "productos");
  this.innerHTML = 'Ver Servicios <span id="emoji-switch">&#128736;</span>';
  alternarEntornoMapa("productos");
 }
 reconstruirBotonesCapasInferiores();
 });
}
// === FIN MÓDULO: MOTOR AUXILIAR Y SEO ===