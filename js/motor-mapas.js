
// ==========================================================
// SECCIÓN 1: CONFIGURACIÓN GLOBAL Y CORE GIS
// ==========================================================
const COL_ALCALDIA = { CVEGEO: 0, NOMGEO: 1, ESTATUS: 2, COLOR_HEX: 3 };
const COL_COLONIA = { WKT: 0, NOMBRE: 1, ESTATUS: 2 };
const COL_COMERCIO = { 
 ID: 1, COLONIA: 2, MAPA: 3, CAPA_PRODUCTO: 4, CAPA_SERVICIO: 5, 
 NIVEL: 6, NOMBRE: 7, SLOGAN: 8, LISTA_PROD_SERV: 9, HORARIO: 10, 
 REDES: 11, YOUTUBE: 12, WHATSAPP: 13, COORDENADAS: 14, MAPS_LINK: 15 
};
let mapaNegosistema = null;
let capaPoligonosActivos = null;
let capaPinesActivos = null;
let datosComerciosGlobales = [];
let marcaroresGIS = [];
let entornoActual = "productos"; // "productos" o "servicios"
window.esCargaInicialEntorno = true;

// URLs de Publicación de Google Sheets
const URL_CSV_ALCALDIAS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=1670206752&single=true&output=csv";
const URL_CSV_COLONIAS  = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=383048417&single=true&output=csv";
const URL_CSV_COMERCIOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQtpbVZGhb318tEVKgcGJUHQ34E84mc5bSsViofcXcGMLyTmPp39k4wwxcjwT08Zl4QjM2A9xtCDPaO/pub?gid=1369751544&single=true&output=csv";
const URL_CSV_OFERTAS   = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgJ-fFKkYHuLy9RR0chu_2disYAKudHI7-A3phmQ08CdOZalAqPj1A6jCz9P2gVhbpoiYuCZOMq0T7/pub?gid=1521270051&single=true&output=csv";
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
   { id: "oficios", label: "Oficios del Hogar", emoji: "🔧🔨", color: "#2E4053", desc: "Plomeros, electricistas, carpinteros..." },
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
    const nivelPuro = parseInt(comercio[COL_COMERCIO.NIVEL]) || 1; 
    
    let claseNivelComercial = "pin-incognito-gris";
    if (nivelPuro === 5) claseNivelComercial = "pin-oro premium-pulse";
    else if (nivelPuro === 4) claseNivelComercial = "pin-plata";
    else if (nivelPuro === 3) claseNivelComercial = "pin-bronce";
    else if (nivelPuro === 2) claseNivelComercial = "pin-estandar"; 

    const prefijoEntorno = (entornoActual === "productos") ? "btn-p-" : "btn-s-";

    const htmlIcono = `
      <div class="pin-personalizado ${claseNivelComercial}">
        <div class="gota-vectorial" style="--pin-color: ${colorHexGota};"></div>
        <span class="pin-emoji-interior">${emojiCentral}</span>
      </div>
    `;

    const iconoGota = L.divIcon({
      className: `leaflet-marker-selectable ${prefijoEntorno}${capaActivaClave}`,
      html: htmlIcono,
      iconSize:[30, 42],
      iconAnchor:[15, 42],  
      popupAnchor: [0, -40]
    });

    const marcador = L.marker([lat, lng], { 
      icon: iconoGota,
      datosNegocio: {
        colorCapa: colorHexGota,
        idGiro: capaActivaClave
      }
    });

 const opcionesPopup = {
 autoPan: true,
 autoPanPadding: L.point(15, 15), // Ajuste quirúrgico para pantallas compactas
 closeOnClick: true,
 className: 'popup-movil-optimizado', // Clase de control CSS
 maxHeight: 420, // Techo rígido para evitar colapsos
 tap: !L.Browser.mobile 
 };
 
 marcador.bindPopup(
 typeof inyectarPopupComercioInteligente === "function" 
 ? inyectarPopupComercioInteligente(comercio, nivelPuro) 
 : `<b>${comercio[COL_COMERCIO.NOMBRE] || "Negocio"}</b>`,
 opcionesPopup // IMPORTANTE: Agregamos la configuración que le faltaba a tu bindPopup
 );

    if (window.contenedorPinesGlobal) window.contenedorPinesGlobal.addLayer(marcador);
    marcaroresGIS.push(marcador);
  });

  if (window.contenedorPinesGlobal && typeof window.contenedorPinesGlobal.getLayers === 'function' && window.contenedorPinesGlobal.getLayers().length > 0 && mapaNegosistema) {
    if (window.esCargaInicialEntorno) {
      mapaNegosistema.fitBounds(window.contenedorPinesGlobal.getBounds(), { 
        maxZoom: 15, 
        padding:[50, 59], 
        animate: true, 
        duration: 0.8
      });
      window.esCargaInicialEntorno = false;
    }
  }
  if (typeof generarDatosEstructuradosSEO === "function") {
    generarDatosEstructuradosSEO(arregloComercios);
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
      itemFiltro.className = "guia-item-filtro guia-item-filter";

      // Atributo técnico para alternar visibilidad instantánea con display:none/flex
      itemFiltro.setAttribute("data-entorno-origen", entorno);
      
      itemFiltro.innerHTML = `
        <label class="toggle-switch">
          <input type="checkbox" class="filtro-capa-chk" data-tipo="${entorno}" data-capa="${capa.id}" checked>
          <span class="slider-palanca visual-${capa.id}" style="background-color: ${capa.color};"></span>
        </label>
        <div class="texto-filtro-info" style="margin-left: 10px;">
          <strong>${capa.emoji} ${capa.label}:</strong>
          <span>(${capa.desc})</span>
        </div>
      `;
      
      itemFiltro.querySelector(".filtro-capa-chk").addEventListener("change", filtrarPinesPorCapasActivas);
      contenedor.appendChild(itemFiltro);
    });
  });
    filtrarPinesPorCapasActivas(); 
}
// Nueva microfunción JS de apoyo para celulares (Abre la descripción al tocar a un costado)
function alternarDetalleFiltroMovil(elemento) {
  if (window.innerWidth <= 480) {
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
    mapaNegosistema = L.map("mapa-comercial-contenedor").setView([19.373, -99.018], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaNegosistema);
    
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
    mapaNegosistema = L.map("mapa_general").setView([19.361, -99.025], 14);
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
});
function transformarCoordenadasWKT(cadenaWKT) {
  if (!cadenaWKT || !cadenaWKT.startsWith("POLYGON")) return [];
  const textoLimpio = cadenaWKT.replace("POLYGON", "").replace(/\(/g, "").replace(/\)/g, "").trim();
  return textoLimpio.split(",").map(par => {
    const ejes = par.trim().split(" ");
    return ejes.length < 2 ? null : [parseFloat(ejes[1]), parseFloat(ejes[0])];
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
  // ... (el resto de tu código de abajo se queda exactamente igual)

  
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
      const filaColoniaActiva = filasColonias.find(c => {
        const n = String(c[COL_COLONIA.NOMBRE]).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "");
        return n === String(coloniaFiltro).toLowerCase().trim();
      });

      if (filaColoniaActiva && filaColoniaActiva[COL_COLONIA.WKT]) {
        const coordsBorde = transformarCoordenadasWKT(filaColoniaActiva[COL_COLONIA.WKT]);
        if (coordsBorde.length > 0) {
          L.polygon(coordsBorde, {
            color: "#000000",
            weight: 4, // Franja negra robusta y bien definida
            opacity: 0.9,
            fillColor: "#000000",
            fillOpacity: 0.03, // Fondo sutil casi transparente
            dashArray: "1, 1",
            interactive: false
          }).addTo(mapaNegosistema);
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
function cargarDatosComerciosHiperlocales(coloniaFiltro) {
  Papa.parse(URL_CSV_OFERTAS, {
    download: true,
    complete: function(ofertasResults) {
      if (typeof renderizarSliderOfertas === "function") {
        renderizarSliderOfertas(ofertasResults.data.slice(1));
      }
      
      Papa.parse(URL_CSV_COMERCIOS, {
        download: true,
        complete: function(comerciosResults) {
          const todasLasFilas = comerciosResults.data.slice(1);
          datosComerciosGlobales = todasLasFilas.filter(f => {
            const colCSV = (f[COL_COMERCIO.COLONIA] || "").toLowerCase().replace(/ /g, "");
            return colCSV === String(coloniaFiltro).toLowerCase().replace(/ /g,"");
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
            return fNorm;
          });
          
          entornoActual = "productos";
          const btnSwitch = document.getElementById("btn-switch-entorno");
          if (btnSwitch) {
            btnSwitch.setAttribute("data-entorno", "productos");
            btnSwitch.innerHTML = 'Ver Servicios <span id="emoji-switch">🛠️</span>'; 
          }
          reconstruirBotonesCapasInferiores();
          if (typeof inicializarBuscadorPredictivo === "function") {
            inicializarBuscadorPredictivo();
          }
          configurarSwitchEntornos();
          window.esCargaInicialEntorno = true;
          filtrarPinesPorCapasActivas();
        }
      });
    }
  });
}

function inicializarBuscadorPredictivo() {
  const inputBuscar = document.getElementById("input-buscador-predictivo");
  const contenedorResultados = document.getElementById("resultados-autocompletado");
  if (!inputBuscar || !contenedorResultados) return;

  inputBuscar.addEventListener("input", function() {
    const query = this.value.toLowerCase().trim();
    contenedorResultados.innerHTML = "";
    if (!query) { 
      contenedorResultados.style.display = "none"; 
      return; 
    }

    const coincidencias = datosComerciosGlobales.filter(comercio => {
      return String(comercio[COL_COMERCIO.NOMBRE]).toLowerCase().includes(query) || 
             String(comercio[COL_COMERCIO.SLOGAN]).toLowerCase().includes(query) || 
             String(comercio[COL_COMERCIO.LISTA_PROD_SERV]).toLowerCase().includes(query);
    });

    if (coincidencias.length === 0) {
      contenedorResultados.innerHTML = `<div style="padding:12px; color:#64748b; font-size:13px; text-align:center;">No se encontraron resultados</div>`;
    } else {
      coincidencias.slice(0, 8).forEach(comercio => {
        const item = document.createElement("div");
        item.className = "item-predictivo-buscar";
        const entCom = comercio[COL_COMERCIO.MAPA];
        const capId = (entCom === "productos") ? comercio[COL_COMERCIO.CAPA_PRODUCTO] : comercio[COL_COMERCIO.CAPA_SERVICIO];
        const conf = PALETAS_CAPAS_SISTEMA[entCom].find(c => c.id === capId) || {color:"#94a3b8", label:"General"};

        item.innerHTML = `
          <div>
            <strong style="display:block; color:#0f172a;">${comercio[COL_COMERCIO.NOMBRE]}</strong>
            <span style="font-size:11px; color:#64748b;">${comercio[COL_COMERCIO.SLOGAN].slice(0,40)}...</span>
          </div>
          <span class="badge-categoria-buscar" style="background-color:${conf.color};">${conf.label}</span>
        `;

        item.addEventListener("click", () => {
          inputBuscar.value = comercio[COL_COMERCIO.NOMBRE];
          contenedorResultados.style.display = "none";

          if (entornoActual !== entCom) {
            entornoActual = entCom;
            const btn = document.getElementById("btn-switch-entorno");
            if (btn) {
              btn.setAttribute("data-entorno", entornoActual);
              btn.innerHTML = entornoActual === "productos" ? 'Ver Servicios <span id="emoji-switch">🛠️</span>' : 'Ver Productos <span id="emoji-switch">🍎</span>';
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
    }
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
function controlarFalloImagenSlide(img, id, secuencia, extensionesRestantes, rutaBase) {
  const cola = [...extensionesRestantes]; 
  if (cola.length > 0) { 
    const sExt = cola.shift(); 
    img.onerror = function() { controlarFalloImagenSlide(this, id, secuencia, cola, rutaBase); }; 
    img.src = `${rutaBase}${id}-${secuencia}.${sExt}`; 
  } else { 
    const s = img.closest('.carrusel-item'); 
    const c = img.closest('.popup-multimedia-carrusel'); 
    if (s && c) { 
      const idx = s.getAttribute('data-index'); 
      s.remove(); 
      const dot = c.querySelector(`.carrusel-dot[data-target="${idx}"]`); 
      if (dot) dot.remove(); 
      reajustarEstructuraCarrusel(c); 
    } 
  }
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

 // CONTENEDOR DE ACORDEONES (AJUSTE 2)
 html += `<div class="popup-acordeon-grupo">`;

 // SECCIÓN 1: MULTIMEDIA (FOTOS Y VIDEO)
 if (nivel >= 3 && id) {
 html += `
 <div class="acordeon-item">
 <button class="acordeon-disparador" onclick="alternarAcordeonSeccion(this, 'multimedia')">
 <span>📸 Fotos y Video</span> <i class="flecha-icono">▼</i>
 </button>
 <div class="acordeon-contenido cont-multimedia">`;
 
 const esSim = window.location.pathname.includes("anunciate") || !document.getElementById("mapa-comercial-contenedor");
 const rBase = esSim ? "geo/iztapalapa/img-nego/anunciate/" : "geo/iztapalapa/img-nego/";
 let sH = ""; let dH = ""; let sC = 0;
 
 for (let i = 1; i <= 3; i++) {
 sH += `<div class="carrusel-item ${sC===0?'active':''}" data-index="${i}"><img data-src="${rBase}${id}-${i}.png" class="carrusel-media-elemento lazy-popup-img" onerror="controlarFalloImagenSlide(this, '${id}', ${i}, ['jpg','jpeg','webp'], '${rBase}')" alt="Imagen ${i}"></div>`;
 dH += `<span class="carrusel-dot ${sC===0?'active':''}" data-target="${i}" onclick="irASlideMultimedia(this, ${sC})"></span>`; 
 sC++;
 }
 if (nivel >= 4 && youtubeUrl) {
 let vId = "";
 if (youtubeUrl.includes("v=")) vId = youtubeUrl.split("v=")[1].split("&")[0];
 else if (youtubeUrl.includes("youtu.be/")) vId = youtubeUrl.split("youtu.be/")[1].split("?")[0];
 else if (youtubeUrl.includes("shorts/")) vId = youtubeUrl.split("shorts/")[1].split("?")[0];
 
 if (vId && vId.trim() !== "") { 
 sH += `<div class="carrusel-item" data-index="video"><iframe data-src="https://youtube.com/embed/${vId.trim()}" class="carrusel-media-elemento lazy-popup-iframe" allowfullscreen></iframe></div>`; 
 dH += `<span class="carrusel-dot" data-target="video" onclick="irASlideMultimedia(this, ${sC})"></span>`; 
 }
 }
 html += `<div class="popup-multimedia-carrusel"><div class="carrusel-viewport">${sH}</div><button class="carrusel-nav prev" onclick="moverMultimedia(this, -1)">&#10094;</button><button class="carrusel-nav next" onclick="moverMultimedia(this, 1)">&#10095;</button><div class="carrusel-dots-container">${dH}</div></div>`;
 html += `</div></div>`;
 }

 // SECCIÓN 2: LISTA DE PRODUCTOS O SERVICIOS
 if (listaItems) {
 html += `
 <div class="acordeon-item">
 <button class="acordeon-disparador" onclick="alternarAcordeonSeccion(this)">
 <span>📋 ${entornoActual==="productos"?"Productos":"Servicios"}</span> <i class="flecha-icono">▼</i>
 </button>
 <div class="acordeon-contenido">
 <div class="popup-nego-seccion"><span class="popup-nego-contenido">${listaItems}</span></div>
 </div>
 </div>`;
 }

 // SECCIÓN 3: HORARIOS (BASE PARA EL AJUSTE 3 DEL CRONÓMETRO)
 if (nivel >= 3 && horarios) {
 html += `
 <div class="acordeon-item">
 <button class="acordeon-disparador" onclick="alternarAcordeonSeccion(this)">
 <span>⏰ Horario de Atención</span> <i class="flecha-icono">▼</i>
 </button>
 <div class="acordeon-contenido">
 <div class="popup-nego-seccion">
 <div id="cronometro-contenedor-modulo" data-horario-crudo="${horarios}">
 <span class="reloj-cargando">Calculando...</span>
 </div>
 <span class="popup-nego-label" style="margin-top:6px;">Horario Completo:</span>
 <span class="popup-nego-contenido">${horarios}</span>
 </div>
 </div>
 </div>`;
 }

 // SECCIÓN 4: REDES SOCIALES
 if (nivel >= 4 && redes) {
 html += `
 <div class="acordeon-item">
 <button class="acordeon-disparador" onclick="alternarAcordeonSeccion(this)">
 <span>🌐 Canales Digitales</span> <i class="flecha-icono">▼</i>
 </button>
 <div class="acordeon-contenido">
 <div class="popup-nego-seccion"><a href="${redes}" target="_blank" class="enlace-web-profesional">Visitar Sitio Web Oficial</a></div>
 </div>
 </div>`;
 }

 html += `</div>`; // Cierre de popup-acordeon-grupo

  // BOTONES DE ACCIÓN ICONOGRÁFICOS CÍRCULARES (CON ETIQUETA UI)
 html += `
 <div class="popup-seccion-enlaces-contenedor">
   <span class="popup-enlaces-subtitulo-ui">Contacto y Navegación</span>
   <div class="popup-nego-botones-circulares">
 `;

 
 // Botón 1: WhatsApp (Círculo Puro)
 if (nivel >= 4 && whatsapp && String(whatsapp).trim() !== "") {
 html += `<a href="${String(whatsapp).trim()}" target="_blank" class="btn-circular-ui btn-ui-wa" title="WhatsApp">
 <svg class="icono-svg-puro" viewBox="0 0 24 24"><path fill="currentColor" d="M12.004 2c-5.523 0-10 4.477-10 10a9.95 9.95 0 0 0 1.393 5.075L2 22l5.121-1.344A9.95 9.95 0 0 0 12.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 1.5c4.687 0 8.5 3.813 8.5 8.5s-3.813 8.5-8.5 8.5a8.45 8.45 0 0 1-4.321-1.185l-.309-.181-3.053.801.815-2.973-.2-.33A8.44 8.44 0 0 1 3.504 12c0-4.687 3.813-8.5 8.5-8.5zm-3.553 4.54a.65.65 0 0 0-.47.22c-.156.17-.597.583-.597 1.42s.61 1.64.695 1.76c.086.115 1.177 1.796 2.85 2.517.399.172.71.274.953.351.401.127.766.109 1.054.066.32-.047 1.055-.43 1.203-.844.148-.414.148-.77.104-.844-.044-.074-.162-.117-.339-.205-.178-.089-1.055-.52-1.218-.58-.163-.059-.281-.088-.4.089-.118.177-.457.577-.56.695-.104.118-.207.133-.385.044-.177-.089-.75-.276-1.428-.881-.527-.47-.883-.995-1.06-1.113-.178-.118-.019-.182.07-.27.079-.08.177-.207.266-.31.089-.104.118-.178.177-.296.059-.119.03-.222-.015-.311-.044-.088-.4-1.02-.548-1.378-.144-.347-.291-.3-.4-.3z"/></svg>
 </a>`;
 }
 
 // Botón 2: Google Maps (Círculo Puro)
 if (linkGoogle) {
 html += `<a href="${linkGoogle}" target="_blank" class="btn-circular-ui btn-ui-gmaps" title="Google Maps">
 <svg class="icono-svg-puro" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
 </a>`;
 } else if (mapsLinkRaw && mapsLinkRaw.trim() !== "" && !linkWaze) {
 html += `<a href="${mapsLinkRaw.replace(/"/g, "").trim()}" target="_blank" class="btn-circular-ui btn-ui-gmaps" title="Ubicación">
 <svg class="icono-svg-puro" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
 </a>`;
 }

 // Botón 3: Waze (Círculo Puro - Se renderiza de forma independiente si existe en la cadena)
 if (linkWaze) {
 html += `<a href="${linkWaze}" target="_blank" class="btn-circular-ui btn-ui-waze" title="Waze">
 <svg class="icono-svg-puro" viewBox="0 0 24 24"><path fill="currentColor" d="M22.043 12.338a2.533 2.533 0 0 0-2.47-1.996h-.565a6.953 6.953 0 0 0-6.1-5.32 6.955 6.955 0 0 0-7.394 6.924c0 .324.025.644.07.96a2.235 2.235 0 0 0-.256 4.316l.228.046a2.23 2.23 0 0 0 4.195-.81h3.454a2.234 2.234 0 0 0 4.2.03l.067-.03a2.232 2.232 0 0 0 4.103-.925 2.53 2.53 0 0 0 .468-3.215zm-15.11 1.637a1.18 1.18 0 1 1 0-2.36 1.18 1.18 0 0 1 0 2.36zm6.208 0a1.18 1.18 0 1 1 0-2.36 1.18 1.18 0 0 1 0 2.36z"/></svg>
 </a>`;
 }
 
 html += `</div></div>`;
 return html;

}

function alternarAcordeonSeccion(btn, tipo) {
 const item = btn.closest('.acordeon-item');
 const contenido = item.querySelector('.acordeon-contenido');
 const estaAbierto = item.classList.contains('activo');
 
 btn.closest('.popup-acordeon-grupo').querySelectorAll('.acordeon-item').forEach(i => {
 i.classList.remove('activo');
 i.querySelector('.acordeon-contenido').style.maxHeight = null;
 });

 if (!estaAbierto) {
 item.classList.add('activo');
 contenido.style.maxHeight = contenido.scrollHeight + "px";
 
 // DISPARADOR SEGURO (Fix Calculando): Si abren la sección de horarios, arranca el cronómetro
 if (contenido.querySelector('#cronometro-contenedor-modulo')) {
   setTimeout(iniciarCronometroPopup, 50);
 }
 
 if (tipo === 'multimedia') {
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

// Oyentes globales para activar/desactivar el cronómetro dinámico en segundo plano
if (mapaNegosistema) {
 mapaNegosistema.on('popupopen', function(e) {
 iniciarCronometroPopup();
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
