
// ── Generar estrellas/datos en el cielo ──
(function(){
  const stars=document.getElementById('lpStars');
  if(stars){
    for(let i=0;i<40;i++){
      const s=document.createElement('div');
      s.className='lp-star';
      s.style.left=Math.random()*100+'%';
      s.style.top=Math.random()*60+'%';
      s.style.animationDelay=Math.random()*3+'s';
      stars.appendChild(s);
    }
  }
  // Cultivos
  const crops=['🍒 Cerezos','🥝 Kiwi','🍇 Uva de mesa','🍑 Ciruela D\'Agen','🍎 Manzanas','🍐 Perales','✨ entre otros'];
  const cropWrap=document.getElementById('lpCrops');
  if(cropWrap){
    crops.forEach((c,i)=>{
      const t=document.createElement('div');
      t.className='lp-crop-tag';
      t.textContent=c;
      t.style.animationDelay=(0.8+i*0.08)+'s';
      cropWrap.appendChild(t);
    });
  }
})();

// ── Transición a la plataforma ──
function enterPlatform(){
  const landing=document.getElementById('landing');
  landing.classList.add('exit');
  setTimeout(()=>{
    landing.style.display='none';
    // Trigger animaciones de entrada de la plataforma
    document.body.classList.add('platform-active');
    // Recalcular tamaño del mapa (Leaflet necesita esto al hacerse visible)
    if(window.map && window.map.invalidateSize) {
      setTimeout(()=>window.map.invalidateSize(),100);
    }
  },900);
}



// ════════════════════════════════════════════════════════════
//  APIs del servidor proxy (credenciales están en server.py)
// ════════════════════════════════════════════════════════════
const TOKEN_URL     = '/api/token';
const PROCESS_URL   = '/api/process';
const STATS_URL     = '/api/statistics';
const CATALOG_URL   = '/api/catalog';

// ════════════════════════════════════════════════════════════
//  ÍNDICES ESPECTRALES
// ════════════════════════════════════════════════════════════
const INDICES = {
  NDVI: {
    name:'NDVI', desc:'Vigor vegetativo',
    info:'Normalized Difference Vegetation Index. Mide la cantidad y salud de la vegetación verde.',
    bands:['B04','B08'], formula:'(B08-B04)/(B08+B04)',
    palette:['#d73027','#fc8d59','#fee08b','#d9ef8b','#91cf60','#1a9850','#006837'],
    min:-0.2, max:0.8,
    labels:['-0.2','0','0.2','0.4','0.6','0.8'],
    legend:['🔴 &lt;0 — Sin vegetación','🟡 0–0.25 — Escasa','🟢 0.25–0.5 — Moderada','💚 0.5–0.75 — Densa','🌿 &gt;0.75 — Muy vigorosa'],
    evalscript: `//VERSION=3
function setup(){return{input:["B04","B08","dataMask"],output:{bands:4}}}
function evaluatePixel(s){
  if(s.dataMask===0)return[0,0,0,0];
  var n=(s.B08-s.B04)/(s.B08+s.B04+1e-4);
  if(n<-0.2)return[0.843,0.188,0.153,1];
  if(n<0)return[0.988,0.553,0.349,1];
  if(n<0.2)return[0.996,0.878,0.545,1];
  if(n<0.4)return[0.851,0.937,0.545,1];
  if(n<0.6)return[0.569,0.812,0.376,1];
  if(n<0.75)return[0.102,0.596,0.314,1];
  return[0,0.408,0.216,1];
}`
  },
  NDWI: {
    name:'NDWI', desc:'Estrés hídrico',
    info:'Normalized Difference Water Index. Detecta contenido de agua en la vegetación. Valores altos = bien hidratado.',
    bands:['B03','B08'], formula:'(B03-B08)/(B03+B08)',
    palette:['#8c510a','#d8b365','#f6e8c3','#c7eae5','#5ab4ac','#01665e'],
    min:-0.6, max:0.6,
    labels:['-0.6','-0.3','0','0.3','0.6'],
    legend:['🟫 &lt;-0.2 — Suelo seco','🟡 -0.2–0 — Estrés hídrico','🩵 0–0.3 — Hidratación media','💧 &gt;0.3 — Buena hidratación'],
    evalscript:`//VERSION=3
function setup(){return{input:["B03","B08","dataMask"],output:{bands:4}}}
function evaluatePixel(s){
  if(s.dataMask===0)return[0,0,0,0];
  var n=(s.B03-s.B08)/(s.B03+s.B08+1e-4);
  if(n<-0.4)return[0.549,0.318,0.039,1];
  if(n<-0.2)return[0.847,0.702,0.396,1];
  if(n<0)return[0.965,0.910,0.765,1];
  if(n<0.2)return[0.780,0.918,0.898,1];
  if(n<0.4)return[0.353,0.706,0.675,1];
  return[0.004,0.400,0.369,1];
}`
  },
  EVI: {
    name:'EVI', desc:'Índice mejorado',
    info:'Enhanced Vegetation Index. Más sensible que NDVI en zonas densas. Corrige efectos atmosféricos y del suelo.',
    bands:['B02','B04','B08'], formula:'2.5*(B08-B04)/(B08+6*B04-7.5*B02+1)',
    palette:['#d73027','#fc8d59','#fee08b','#d9ef8b','#1a9850','#003f20'],
    min:-0.2, max:0.8,
    labels:['-0.2','0','0.3','0.6','0.8'],
    legend:['🔴 &lt;0 — Sin vegetación','🟡 0–0.2 — Escasa','🟢 0.2–0.5 — Moderada','🌿 &gt;0.5 — Densa'],
    evalscript:`//VERSION=3
function setup(){return{input:["B02","B04","B08","dataMask"],output:{bands:4}}}
function evaluatePixel(s){
  if(s.dataMask===0)return[0,0,0,0];
  var n=2.5*(s.B08-s.B04)/(s.B08+6*s.B04-7.5*s.B02+1);
  if(n<-0.2)return[0.843,0.188,0.153,1];
  if(n<0)return[0.988,0.553,0.349,1];
  if(n<0.2)return[0.996,0.878,0.545,1];
  if(n<0.4)return[0.569,0.812,0.376,1];
  if(n<0.6)return[0.102,0.596,0.314,1];
  return[0,0.247,0.125,1];
}`
  },
  SAVI: {
    name:'SAVI', desc:'Suelo ajustado',
    info:'Soil Adjusted Vegetation Index. Minimiza el efecto del suelo en zonas con poca cobertura vegetal.',
    bands:['B04','B08'], formula:'1.5*(B08-B04)/(B08+B04+0.5)',
    palette:['#d73027','#fc8d59','#fee08b','#d9ef8b','#91cf60','#1a9850'],
    min:-0.2, max:0.7,
    labels:['-0.2','0','0.2','0.4','0.6'],
    legend:['🔴 Suelo desnudo','🟡 Vegetación muy escasa','🟢 Moderada','💚 Densa'],
    evalscript:`//VERSION=3
function setup(){return{input:["B04","B08","dataMask"],output:{bands:4}}}
function evaluatePixel(s){
  if(s.dataMask===0)return[0,0,0,0];
  var n=1.5*(s.B08-s.B04)/(s.B08+s.B04+0.5);
  if(n<-0.1)return[0.843,0.188,0.153,1];
  if(n<0.1)return[0.988,0.553,0.349,1];
  if(n<0.25)return[0.996,0.878,0.545,1];
  if(n<0.4)return[0.851,0.937,0.545,1];
  if(n<0.55)return[0.569,0.812,0.376,1];
  return[0.102,0.596,0.314,1];
}`
  },
  NBR: {
    name:'NBR', desc:'Quemas / estrés',
    info:'Normalized Burn Ratio. Detecta áreas quemadas y estrés severo. Útil post-helada o sequía extrema.',
    bands:['B08','B12'], formula:'(B08-B12)/(B08+B12)',
    palette:['#7f0000','#d73027','#fc8d59','#fee08b','#d9ef8b','#1a9850'],
    min:-0.5, max:0.9,
    labels:['-0.5','0','0.3','0.6','0.9'],
    legend:['🔴 &lt;0 — Quemado/estrés severo','🟡 0–0.2 — Estrés','🟢 &gt;0.4 — Saludable'],
    evalscript:`//VERSION=3
function setup(){return{input:["B08","B12","dataMask"],output:{bands:4}}}
function evaluatePixel(s){
  if(s.dataMask===0)return[0,0,0,0];
  var n=(s.B08-s.B12)/(s.B08+s.B12+1e-4);
  if(n<-0.2)return[0.498,0,0,1];
  if(n<0)return[0.843,0.188,0.153,1];
  if(n<0.2)return[0.988,0.553,0.349,1];
  if(n<0.4)return[0.996,0.878,0.545,1];
  if(n<0.6)return[0.851,0.937,0.545,1];
  return[0.102,0.596,0.314,1];
}`
  },
  NDRE: {
    name:'NDRE', desc:'Clorofila / nitrógeno',
    info:'Normalized Difference Red Edge. Más sensible que NDVI para detectar deficiencias de nitrógeno y clorofila.',
    bands:['B05','B08'], formula:'(B08-B05)/(B08+B05)',
    palette:['#ffffcc','#c2e699','#78c679','#31a354','#006837'],
    min:0, max:0.6,
    labels:['0','0.15','0.3','0.45','0.6'],
    legend:['⚪ &lt;0.1 — Déficit severo N','🟡 0.1–0.2 — Déficit leve','🟢 0.2–0.4 — Adecuado','💚 &gt;0.4 — Óptimo'],
    evalscript:`//VERSION=3
function setup(){return{input:["B05","B08","dataMask"],output:{bands:4}}}
function evaluatePixel(s){
  if(s.dataMask===0)return[0,0,0,0];
  var n=(s.B08-s.B05)/(s.B08+s.B05+1e-4);
  if(n<0.1)return[1,1,0.8,1];
  if(n<0.2)return[0.761,0.902,0.600,1];
  if(n<0.35)return[0.471,0.776,0.475,1];
  if(n<0.5)return[0.192,0.639,0.329,1];
  return[0,0.408,0.216,1];
}`
  },
  MSAVI: {
    name:'MSAVI', desc:'Suelo modificado',
    info:'Modified SAVI. Versión mejorada del SAVI sin necesidad de factor L. Ideal en zonas áridas.',
    bands:['B04','B08'],     formula:'(2*B08+1-Math.sqrt(Math.pow(2*B08+1,2)-8*(B08-B04)))/2',
    palette:['#d73027','#fc8d59','#fee08b','#91cf60','#1a9850'],
    min:-0.1, max:0.7,
    labels:['-0.1','0.1','0.3','0.5','0.7'],
    legend:['🔴 Suelo desnudo','🟡 Muy escasa','🟢 Moderada','💚 Densa'],
    evalscript:`//VERSION=3
function setup(){return{input:["B04","B08","dataMask"],output:{bands:4}}}
function evaluatePixel(s){
  if(s.dataMask===0)return[0,0,0,0];
  var n=(2*s.B08+1-Math.sqrt(Math.pow(2*s.B08+1,2)-8*(s.B08-s.B04)))/2;
  if(n<0.1)return[0.843,0.188,0.153,1];
  if(n<0.25)return[0.988,0.553,0.349,1];
  if(n<0.4)return[0.996,0.878,0.545,1];
  if(n<0.55)return[0.569,0.812,0.376,1];
  return[0.102,0.596,0.314,1];
}`
  },
  MNDWI: {
    name:'MNDWI', desc:'Agua superficial',
    info:'Modified NDWI. Detecta agua superficial (ríos, canales, lagunas). Positivo = agua.',
    bands:['B03','B11'], formula:'(B03-B11)/(B03+B11)',
    palette:['#8c510a','#d8b365','#f5f5f5','#74add1','#313695'],
    min:-0.5, max:0.5,
    labels:['-0.5','-0.2','0','0.2','0.5'],
    legend:['🟫 Suelo seco','⬜ Transición','🔵 Agua superficial'],
    evalscript:`//VERSION=3
function setup(){return{input:["B03","B11","dataMask"],output:{bands:4}}}
function evaluatePixel(s){
  if(s.dataMask===0)return[0,0,0,0];
  var n=(s.B03-s.B11)/(s.B03+s.B11+1e-4);
  if(n<-0.2)return[0.549,0.318,0.039,1];
  if(n<0)return[0.847,0.702,0.396,1];
  if(n<0.1)return[0.961,0.961,0.961,1];
  if(n<0.3)return[0.455,0.678,0.820,1];
  return[0.192,0.212,0.584,1];
}`
  }
};

// ════════════════════════════════════════════════════════════
//  PALETAS DE COLOR (estilo QGIS / matplotlib)
// ════════════════════════════════════════════════════════════
const PALETAS = {
  RdYlGn:   {name:'Rojo-Amarillo-Verde', colors:['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837']},
  Viridis:  {name:'Viridis', colors:['#440154','#482878','#3e4a89','#31688e','#26828e','#1f9e89','#35b779','#6ece58','#b5de2b','#fde725']},
  Spectral: {name:'Spectral', colors:['#9e0142','#d53e4f','#f46d43','#fdae61','#fee08b','#e6f598','#abdda4','#66c2a5','#3288bd','#5e4fa2']},
  RdYlBu:   {name:'Rojo-Amarillo-Azul', colors:['#a50026','#d73027','#f46d43','#fdae61','#fee090','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695']},
  Greens:   {name:'Verdes', colors:['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#006d2c','#00441b']},
  BrBG:     {name:'Marron-Verde-Azul', colors:['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#c7eae5','#80cdc1','#35978f','#01665e','#003c30']},
  Plasma:   {name:'Plasma', colors:['#0d0887','#5302a3','#8b0aa5','#b83289','#db5c68','#f48849','#febd2a','#f0f921']},
  Inferno:  {name:'Inferno', colors:['#000004','#1b0c41','#4a0c6b','#781c6d','#a52c60','#cf4446','#ed6925','#fb9b06','#f7d03c','#fcffa4']},
  YlGn:     {name:'Amarillo-Verde', colors:['#ffffe5','#f7fcb9','#d9f0a3','#addd8e','#78c679','#41ab5d','#238443','#006837','#004529']},
  BuGn:     {name:'Azul-Verde', colors:['#f7fcfd','#e5f5f9','#ccece6','#99d8c9','#66c2a4','#41ae76','#238b45','#006d2c','#00441b']},
  Turbo:    {name:'Turbo', colors:['#30123b','#4145ab','#4675ed','#39a2fc','#1bcfd4','#24eca6','#61fc6c','#a4fc3b','#d1e834','#f3c63a','#fe9b2d','#f36315','#d93806','#b11901','#7a0402']},
  RdBu:     {name:'Rojo-Azul', colors:['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#d1e5f0','#92c5de','#4393c3','#2166ac','#053061']}
};

function hexToRgb(h){const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255];}
function rgbToHex(r,g,b){return '#'+[r,g,b].map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');}
function lerp(a,b,t){return a+(b-a)*t;}
function interpolatePalette(colors,t){
  if(t<=0) return colors[0];
  if(t>=1) return colors[colors.length-1];
  const scaled=t*(colors.length-1);
  const i=Math.floor(scaled);
  const f=scaled-i;
  const c1=hexToRgb(colors[i]), c2=hexToRgb(colors[Math.min(i+1,colors.length-1)]);
  return rgbToHex(lerp(c1[0],c2[0],f),lerp(c1[1],c2[1],f),lerp(c1[2],c2[2],f));
}
function samplePalette(colors,n){
  const out=[];
  for(let i=0;i<n;i++) out.push(interpolatePalette(colors,n===1?0.5:i/(n-1)));
  return out;
}
function paletteGradient(colors){return `linear-gradient(to right,${colors.join(',')})`;}

function buildDynamicEvalscript(idx, paletteColors, nClases, continuo){
  const allBands=[...new Set(idx.bands)];
  const formulaJS=idx.formula.replace(/B(\d+)/g,'s.B$1');
  const min=idx.min, max=idx.max, range=max-min;

  if(continuo){
    const stops=samplePalette(paletteColors, 16).map(hexToRgb).map(c=>[c[0]/255,c[1]/255,c[2]/255]);
    const stopsStr=JSON.stringify(stops.map(c=>c.map(x=>Math.round(x*1000)/1000)));
    return `//VERSION=3
function setup(){return{input:["${allBands.join('","')}","dataMask"],output:{bands:4}}}
var COLORS=${stopsStr};
function ramp(t){
  if(t<=0)return COLORS[0];
  if(t>=1)return COLORS[COLORS.length-1];
  var sc=t*(COLORS.length-1);var i=Math.floor(sc);var f=sc-i;
  var a=COLORS[i];var b=COLORS[Math.min(i+1,COLORS.length-1)];
  return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];
}
function evaluatePixel(s){
  if(s.dataMask===0)return[0,0,0,0];
  var v=${formulaJS};
  var t=(v-(${min}))/(${range});
  if(t<0)t=0;if(t>1)t=1;
  var c=ramp(t);
  return [c[0],c[1],c[2],1];
}`;
  } else {
    const colors=samplePalette(paletteColors, nClases).map(hexToRgb).map(c=>[c[0]/255,c[1]/255,c[2]/255]);
    let conditions='';
    for(let i=0;i<nClases;i++){
      const thr=min+range*((i+1)/nClases);
      const c=colors[i];
      if(i<nClases-1) conditions+=`  if(v<${thr.toFixed(4)})return[${c[0].toFixed(3)},${c[1].toFixed(3)},${c[2].toFixed(3)},1];\n`;
      else conditions+=`  return[${c[0].toFixed(3)},${c[1].toFixed(3)},${c[2].toFixed(3)},1];\n`;
    }
    return `//VERSION=3
function setup(){return{input:["${allBands.join('","')}","dataMask"],output:{bands:4}}}
function evaluatePixel(s){
  if(s.dataMask===0)return[0,0,0,0];
  var v=${formulaJS};
${conditions}}`;
  }
}

// Genera geometría GeoJSON del polígono dibujado ([[lng,lat],...])
function getPolygonGeometry(){
  if(!drawnLayer || !drawnLayer.getLatLngs) return null;
  try {
    var ring = drawnLayer.getLatLngs()[0];
    if(!ring || ring.length < 3) return null;
    var coords = ring.map(function(ll){ return [ll.lng, ll.lat]; });
    coords.push(coords[0]); // cerrar anillo
    return { type: 'Polygon', coordinates: [coords] };
  } catch(e) { return null; }
}

// Retorna bounds con geometría (polígono) si existe, o bbox como fallback
function getBounds(bboxArr){
  var geom = getPolygonGeometry();
  if(geom) {
    return { geometry: geom, properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' } };
  }
  return { bbox: bboxArr, properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' } };
}

// Recorta la imagen PNG al polígono usando un canvas, para mostrar solo el área de interés
async function clipImageToPolygon(imgUrl, layer, bbox) {
  const [w, s, e, n] = bbox;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imgUrl;
  });
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  const latlngs = layer.getLatLngs()[0];
  if (!latlngs || latlngs.length < 3) return imgUrl;
  ctx.beginPath();
  for (let i = 0; i < latlngs.length; i++) {
    const ll = latlngs[i];
    const x = ((ll.lng - w) / (e - w)) * img.width;
    const y = ((n - ll.lat) / (n - s)) * img.height;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fill();
  return canvas.toDataURL('image/png');
}

// ════════════════════════════════════════════════════════════
//  ESTADO
// ════════════════════════════════════════════════════════════
let accessToken=null, tokenExpiry=0;
let drawnLayer=null, sentinelLayer=null, kmlLayers={};
let currentLayerType='indice', currentIndex='NDVI';
let myChart=null;
let pendingKMLData=null;
let vizConfig = { paleta:'RdYlGn', nClases:7, continuo:true };
let lastAnalysis = null;  // Guarda resultado completo para exportar
let lastImageUrl = null;  // PNG del índice generado

// ════════════════════════════════════════════════════════════
//  MAPA
// ════════════════════════════════════════════════════════════
const map = L.map('map',{doubleClickZoom:false}).setView([-34.5,-70.8],9);
window.map = map;

// Mapa base claro satelital
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
  attribution:'© Esri',maxZoom:19
}).addTo(map);

// Labels encima
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',{
  attribution:'© Carto',maxZoom:19,pane:'shadowPane'
}).addTo(map);

// ── LOCALIZACIÓN ESPAÑOL para Leaflet Draw ──
L.drawLocal.draw.handlers.polygon.tooltip.start = 'Haz clic para empezar a dibujar el polígono';
L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Haz clic para seguir dibujando';
L.drawLocal.draw.handlers.polygon.tooltip.end = 'Haz clic en el primer punto para cerrar';
L.drawLocal.draw.handlers.rectangle.tooltip.start = 'Haz clic y arrastra para dibujar un rectángulo';
L.drawLocal.draw.toolbar.buttons.polygon = 'Dibujar polígono';
L.drawLocal.draw.toolbar.buttons.rectangle = 'Dibujar rectángulo';
L.drawLocal.draw.toolbar.undo.title = 'Deshacer último punto';
L.drawLocal.draw.toolbar.actions.title = 'Cancelar dibujo';
L.drawLocal.draw.toolbar.actions.text = 'Cancelar';
L.drawLocal.draw.toolbar.finish.title = 'Terminar dibujo';
L.drawLocal.draw.toolbar.finish.text = 'Terminar';
L.drawLocal.edit.toolbar.buttons.edit = 'Editar';
L.drawLocal.edit.toolbar.buttons.remove = 'Eliminar';
L.drawLocal.edit.toolbar.actions.save.title = 'Guardar cambios';
L.drawLocal.edit.toolbar.actions.save.text = 'Guardar';
L.drawLocal.edit.toolbar.actions.cancel.title = 'Cancelar edición';
L.drawLocal.edit.toolbar.actions.cancel.text = 'Cancelar';

const drawnItems = new L.FeatureGroup().addTo(map);
const drawControl = new L.Control.Draw({
  draw:{
    polygon:{
      shapeOptions:{color:'#f5820d',weight:2.5,fillColor:'#f5820d',fillOpacity:0.18},
      allowIntersection:true,showArea:true,repeatMode:false
    },
    rectangle:{shapeOptions:{color:'#f5820d',weight:2,fillColor:'#f5820d',fillOpacity:0.12},repeatMode:false},
    circle:false,circlemarker:false,marker:false,polyline:false
  },
  edit:{featureGroup:drawnItems}
});
map.addControl(drawControl);

// Al crear un polígono → se desactiva el dibujo automáticamente y se guarda
// Botón flotante "Terminar" que aparece al dibujar
var finishBtn = L.DomUtil.create('div', 'finish-btn');
finishBtn.innerHTML = '🔴 Terminar (Enter)';
finishBtn.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#e85a3a;color:#fff;border:none;border-radius:30px;padding:10px 28px;font-size:15px;font-weight:700;z-index:99999;cursor:pointer;display:none;box-shadow:0 4px 20px rgba(0,0,0,0.4);font-family:Plus Jakarta Sans,sans-serif';
document.body.appendChild(finishBtn);

function forceCompleteDrawing() {
  try {
    var tb = drawControl._toolbars.draw;
    for (var k in tb._modes) {
      var h = tb._modes[k].handler;
      if (h && h._enabled) {
        // Método público completoDrawing (Leaflet Draw >=1.0.0)
        if (typeof h.completeDrawing === 'function') {
          h.completeDrawing();
          return;
        }
        // Fallback: método privado _finishShape
        if (typeof h._finishShape === 'function') {
          h._finishShape();
          return;
        }
        // Si no hay forma de cerrar, deshabilitamos el handler
        if (typeof h.disable === 'function') {
          h.disable();
          return;
        }
      }
    }
  } catch(err) {
    console.error('ERROR al finalizar dibujo:', err);
  }
}

finishBtn.onclick = forceCompleteDrawing;

// Tecla Enter para cerrar polígono mientras se dibuja
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && finishBtn.style.display === 'block') {
    e.preventDefault();
    forceCompleteDrawing();
  }
});

// Mostrar botón Terminar cuando empieza el dibujo
map.on(L.Draw.Event.DRAWSTART, function() {
  finishBtn.style.display = 'block';
});

// Ocultar botón Terminar cuando se completa o cancela
function hideFinishBtn() {
  finishBtn.style.display = 'none';
}

map.on(L.Draw.Event.CREATED,function(e){
  hideFinishBtn();
  console.log('CREATED event fired');
  try {
    drawnItems.clearLayers();
    drawnLayer=e.layer;
    drawnItems.addLayer(drawnLayer);
    setStatus('✅ Polígono guardado — ahora presiona ▶ Calcular índice','success');
    var div = document.createElement('div');
    div.className = 'toast-msg';
    div.innerHTML = '✅ Polígono completado';
    div.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1a3a2a;color:#fff;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.3)';
    document.body.appendChild(div);
    setTimeout(function(){div.style.opacity='0';div.style.transition='opacity 0.5s';setTimeout(function(){div.remove()},500)},2500);
  } catch(err) {
    console.error('ERROR en CREATED:', err);
    setStatus('❌ Error: ' + err.message,'error');
  }
});
// Por si el usuario cierra sin completar
map.on(L.Draw.Event.DRAWSTOP,function(e){
  hideFinishBtn();
  if(!drawnLayer) setStatus('✏️ Dibujo cancelado — vuelve a intentar','warn');
});

// ════════════════════════════════════════════════════════════
//  UI ÍNDICES
// ════════════════════════════════════════════════════════════
function buildIndexGrid(){
  const grid=document.getElementById('indexGrid');
  grid.innerHTML='';
  Object.keys(INDICES).forEach(k=>{
    const idx=INDICES[k];
    const d=document.createElement('div');
    d.className='idx-pill'+(k===currentIndex?' active':'');
    d.innerHTML=`<div class="iname">${idx.name}</div><div class="idesc">${idx.desc}</div>`;
    d.onclick=()=>selectIndex(k);
    grid.appendChild(d);
  });
  updateVizLegend();
  document.getElementById('idxInfo').textContent=INDICES[currentIndex].info;
}

function selectIndex(k){
  currentIndex=k;
  document.querySelectorAll('#indexGrid .idx-pill').forEach((el,i)=>{
    el.classList.toggle('active',Object.keys(INDICES)[i]===k);
  });
  updateVizLegend();
  document.getElementById('idxInfo').textContent=INDICES[k].info;
}


// ════════════════════════════════════════════════════════════
//  CONTROL DE PALETAS
// ════════════════════════════════════════════════════════════
function buildPalDropdown(){
  const dd = document.getElementById('palDropdown');
  if(!dd) return;
  dd.innerHTML = Object.keys(PALETAS).map(k=>{
    const p = PALETAS[k];
    return `<div class="pal-option${k===vizConfig.paleta?' active':''}" onclick="selectPalette('${k}')">
      <div class="po-bar" style="background:${paletteGradient(p.colors)}"></div>
      <span class="po-name">${p.name}</span>
    </div>`;
  }).join('');
}

function togglePalDropdown(){
  const dd = document.getElementById('palDropdown');
  dd.classList.toggle('open');
}

function selectPalette(key){
  vizConfig.paleta = key;
  const p = PALETAS[key];
  document.getElementById('palCurrentBar').style.background = paletteGradient(p.colors);
  document.getElementById('palCurrentName').textContent = p.name;
  document.getElementById('palDropdown').classList.remove('open');
  buildPalDropdown();
  updateVizLegend();
}

function setVizMode(continuo){
  vizConfig.continuo = continuo;
  document.getElementById('vizContinuo').classList.toggle('active', continuo);
  document.getElementById('vizDiscreto').classList.toggle('active', !continuo);
  document.getElementById('clasesWrap').style.display = continuo ? 'none' : 'block';
  updateVizLegend();
}

// Actualiza la leyenda visual según paleta + clases + modo
function updateVizLegend(){
  const idx = INDICES[currentIndex];
  const p = PALETAS[vizConfig.paleta];
  const bar = document.getElementById('legendBar');
  if(!bar) return;

  if(vizConfig.continuo){
    bar.style.background = paletteGradient(p.colors);
  } else {
    // Bloques discretos
    const colors = samplePalette(p.colors, vizConfig.nClases);
    const stops = colors.map((c,i)=>{
      const a = (i/vizConfig.nClases*100).toFixed(1);
      const b = ((i+1)/vizConfig.nClases*100).toFixed(1);
      return `${c} ${a}%, ${c} ${b}%`;
    }).join(',');
    bar.style.background = `linear-gradient(to right,${stops})`;
  }

  // Labels min→max del índice
  const labels = document.getElementById('legendLabels');
  if(labels){
    const steps = 5;
    let html = '';
    for(let i=0;i<=steps;i++){
      const v = idx.min + (idx.max-idx.min)*(i/steps);
      html += `<span>${v.toFixed(2)}</span>`;
    }
    labels.innerHTML = html;
  }
  // Descripción interpretativa
  const desc = document.getElementById('legendDesc');
  if(desc && idx.legend){
    desc.innerHTML = idx.legend.map(l=>`<div>${l}</div>`).join('');
  }
}

function updateLegend(){
  const idx=INDICES[currentIndex];
  document.getElementById('legendBar').style.background=
    `linear-gradient(to right,${idx.palette.join(',')})`;
  document.getElementById('legendLabels').innerHTML=
    idx.labels.map(l=>`<span>${l}</span>`).join('');
  document.getElementById('legendDesc').innerHTML=
    idx.legend.map(l=>`<div>${l}</div>`).join('');
}

// ════════════════════════════════════════════════════════════
//  TABS
// ════════════════════════════════════════════════════════════
function switchTab(tab){
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.getElementById('content-'+tab).classList.add('active');
  if(tab==='historial') renderHistorial();
  if(tab==='kmls') renderKMLList();
  if(tab==='biblioteca') renderBiblioteca();
}

// ════════════════════════════════════════════════════════════
//  FETCH CON TIMEOUT (evita que se cuelgue para siempre)
// ════════════════════════════════════════════════════════════
async function fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// ════════════════════════════════════════════════════════════
//  TOKEN
// ════════════════════════════════════════════════════════════
async function getToken(retries=3){
  if(accessToken&&Date.now()<tokenExpiry) return accessToken;
  for(let i=0;i<retries;i++){
    try{
      const res=await fetchWithTimeout(TOKEN_URL,{method:'GET'},30000);
      if(!res.ok) throw new Error('Auth '+res.status);
      const d=await res.json();
      accessToken=d.access_token;
      tokenExpiry=Date.now()+(d.expires_in-60)*1000;
      return accessToken;
    } catch(e){
      if(i===retries-1) throw e;
      await new Promise(r=>setTimeout(r,2000*(i+1)));
    }
  }
}

// ════════════════════════════════════════════════════════════
//  CALCULAR
// ════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════
//  CATEGORÍAS POR CLASE (hectáreas y %)
// ════════════════════════════════════════════════════════════
// Calcula el área del bbox en hectáreas (aproximación con coseno de latitud)
function bboxAreaHa(bbox){
  const [w,s,e,n]=bbox;
  const latMid=(s+n)/2*Math.PI/180;
  const mPerDegLat=111320;
  const mPerDegLon=111320*Math.cos(latMid);
  const widthM=Math.abs(e-w)*mPerDegLon;
  const heightM=Math.abs(n-s)*mPerDegLat;
  return (widthM*heightM)/10000; // m² a ha
}

// Obtiene histograma del índice dividido en N clases vía Statistical API
async function calcularClases(token,bbox,inicio,fin,nubes,satelite,idx,nClases){
  const allBands=[...new Set(idx.bands)];
  const bandsStr=JSON.stringify([...allBands,"dataMask"]);
  const formulaJS=idx.formula.replace(/B(\d+)/g,'s.B$1');
  const evalS=`//VERSION=3
function setup(){return{input:[{bands:${bandsStr}}],output:[{id:"val",bands:1},{id:"dataMask",bands:1}]}}
function evaluatePixel(s){return{val:[${formulaJS}],dataMask:[s.dataMask]}}`;

  const body={
    input:{
      bounds:getBounds(bbox),
      data:[{type:satelite,dataFilter:{
        timeRange:{from:inicio+"T00:00:00Z",to:fin+"T23:59:59Z"},
        maxCloudCoverage:nubes
      }}]
    },
    aggregation:{
      timeRange:{from:inicio+"T00:00:00Z",to:fin+"T23:59:59Z"},
      aggregationInterval:{of:"P30D"},
      resx:0.0003,resy:0.0003,
      evalscript:evalS
    },
    calculations:{val:{histograms:{default:{nBins:nClases,lowEdge:idx.min,highEdge:idx.max}}}}
  };

  try{
    const res=await fetchWithTimeout(STATS_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    },60000);
    if(!res.ok) {
      const txt = await res.text().catch(()=>'');
      throw new Error('Clases '+res.status+': '+txt.slice(0,200));
    }
    const data=await res.json();

    // Acumular bins de todos los intervalos temporales
    let bins=null, totalCount=0;
    (data.data||[]).forEach(iv=>{
      const h=iv?.outputs?.val?.bands?.B0?.histogram?.bins;
      if(h){
        if(!bins) bins=h.map(b=>({low:b.lowEdge,high:b.highEdge,count:0}));
        h.forEach((b,i)=>{ if(bins[i]){bins[i].count+=b.count; totalCount+=b.count;} });
      }
    });
    if(!bins||totalCount===0) return null;

    const areaTotalHa=bboxAreaHa(bbox);
    const colors=samplePalette(PALETAS[vizConfig.paleta].colors, nClases);

    return bins.map((b,i)=>({
      clase:i+1,
      rango:`${b.low.toFixed(2)} a ${b.high.toFixed(2)}`,
      low:b.low, high:b.high,
      count:b.count,
      pct:(b.count/totalCount*100),
      ha:(b.count/totalCount*areaTotalHa),
      color:colors[i]
    }));
  } catch(e){
    console.warn('calcularClases error:',e);
    return null;
  }
}

// Renderiza la tabla de categorías
function renderCategorias(clases, areaTotalHa){
  if(!clases||!clases.length){
    return '<p class="ph" style="padding:10px 0">Sin datos de categorías</p>';
  }
  let rows='';
  clases.forEach(c=>{
    rows+=`<tr>
      <td><span class="cat-swatch" style="background:${c.color}"></span></td>
      <td style="font-family:'JetBrains Mono';font-size:10px">${c.rango}</td>
      <td style="text-align:right;font-weight:700;color:var(--g600)">${c.ha.toFixed(2)}</td>
      <td style="text-align:right;font-family:'JetBrains Mono';color:var(--g500)">${c.pct.toFixed(1)}%</td>
    </tr>`;
  });
  return `
    <table class="cat-table">
      <thead><tr><th></th><th>Rango ${currentIndex}</th><th style="text-align:right">Hectáreas</th><th style="text-align:right">%</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td></td><td style="font-weight:700">TOTAL</td>
        <td style="text-align:right;font-weight:700;color:var(--g700)">${areaTotalHa.toFixed(2)}</td>
        <td style="text-align:right;font-weight:700">100%</td>
      </tr></tfoot>
    </table>`;
}

async function calcular(){
  if(!drawnLayer && Object.keys(kmlLayers).length===0){
    setStatus('⚠️ Dibuja un área o carga un KML primero','error'); return;
  }

  const btn=document.getElementById('btnCalc');
  btn.disabled=true; btn.innerHTML='<div class="spinner"></div> Calculando…';
  setStatus('','');

  try{
    const token=await getToken();
    let bbox;
    if(drawnLayer){
      const b=drawnLayer.getBounds();
      bbox=[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()];
    } else {
      const firstKey=Object.keys(kmlLayers)[0];
      const b=kmlLayers[firstKey].getBounds();
      bbox=[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()];
    }

    const inicio=document.getElementById('fechaInicio').value;
    const fin=document.getElementById('fechaFin').value;
    const nubes=parseInt(document.getElementById('nubes').value);
    const satelite=document.getElementById('satelite').value;
    const opacidad=parseInt(document.getElementById('opacidad').value)/100;
    const idx=INDICES[currentIndex];

    setStatus('<div class="spinner"></div> Generando imagen…','loading');
    console.log('[1/5] Solicitando imagen satelital…');
    await new Promise(r=>setTimeout(r,50)); // permite que el navegador renderice

    const paletteColors = PALETAS[vizConfig.paleta].colors;
    const evalViz = currentLayerType==='indice'
      ? buildDynamicEvalscript(idx, paletteColors, vizConfig.nClases, vizConfig.continuo)
      : currentLayerType==='rgb'
        ? `//VERSION=3\nfunction setup(){return{input:["B04","B03","B02","dataMask"],output:{bands:4}}}\nfunction evaluatePixel(s){return[3.5*s.B04,3.5*s.B03,3.5*s.B02,s.dataMask]}`
        : `//VERSION=3\nfunction setup(){return{input:["B08","B04","B03","dataMask"],output:{bands:4}}}\nfunction evaluatePixel(s){return[3.5*s.B08,3.5*s.B04,3.5*s.B03,s.dataMask]}`;

    const imgBody={
      input:{
        bounds:getBounds(bbox),
        data:[{type:satelite,dataFilter:{
          timeRange:{from:inicio+"T00:00:00Z",to:fin+"T23:59:59Z"},
          maxCloudCoverage:nubes
        }}]
      },
      output:{width:512,height:512,responses:[{identifier:"default",format:{type:"image/png"}}]},
      evalscript:evalViz
    };

    console.log('[1/5] Enviando petición a Copernicus…');
    const imgRes=await fetchWithTimeout(PROCESS_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'image/png'},
      body:JSON.stringify(imgBody)
    },90000);
    if(!imgRes.ok){const t=await imgRes.text();throw new Error('Imagen '+imgRes.status+': '+t.substring(0,120));}

    console.log('[1/5] Imagen recibida, superponiendo en mapa…');
    const blob=await imgRes.blob();
    const imgUrl=URL.createObjectURL(blob);
    lastImageUrl=imgUrl;
    if(sentinelLayer) map.removeLayer(sentinelLayer);
    // Recortar imagen al polígono dibujado
    var clippedUrl = imgUrl;
    if (drawnLayer && drawnLayer.getLatLngs) {
      try {
        clippedUrl = await clipImageToPolygon(imgUrl, drawnLayer, bbox);
      } catch(e) { console.warn('Clip error:', e); }
    }
    sentinelLayer=L.imageOverlay(clippedUrl,[[bbox[1],bbox[0]],[bbox[3],bbox[2]]],{opacity:opacidad,className:'smooth-overlay',interactive:false}).addTo(map);
    map.fitBounds([[bbox[1],bbox[0]],[bbox[3],bbox[2]]]);

    // Obtener fecha real de la imagen usada y abrir timeline
    console.log('[2/5] Consultando fechas satelitales…');
    setStatus('<div class="spinner"></div> Consultando fechas satelitales…','loading');
    await new Promise(r=>setTimeout(r,50));
    const fechasDisp = await buscarFechasDisponibles(token, bbox, inicio, fin, satelite);
    if(fechasDisp.length){
      // La imagen mostrada (leastCC) suele ser la de menor nubosidad; mostramos la más reciente con menos nubes
      const masReciente = fechasDisp[fechasDisp.length-1];
      actualizarFechaBadge(masReciente.date);
    }

    console.log('[3/5] Calculando estadísticas…');
    setStatus('<div class="spinner"></div> Calculando estadísticas…','loading');
    await new Promise(r=>setTimeout(r,50));
    const statsResult=await calcularStats(token,bbox,inicio,fin,nubes,satelite,idx);

    console.log('[4/5] Calculando categorías por hectárea…');
    setStatus('<div class="spinner"></div> Calculando categorías por hectárea…','loading');
    await new Promise(r=>setTimeout(r,50));
    const nClasesCat = vizConfig.continuo ? 5 : vizConfig.nClases;
    const clases = await calcularClases(token,bbox,inicio,fin,nubes,satelite,idx,nClasesCat);
    const areaTotalHa = bboxAreaHa(bbox);
    if(clases){
      const catHtml = renderCategorias(clases, areaTotalHa);
      const cont = document.getElementById('statsContainer');
      cont.innerHTML += '<div class="cat-block"><div class="cat-title">📐 Categorías por superficie</div>'+catHtml+'</div>';
    }

    console.log('[5/5] Cargando serie temporal…');
    setStatus('<div class="spinner"></div> Cargando serie temporal…','loading');
    await new Promise(r=>setTimeout(r,50));
    await calcularSerie(token,bbox,inicio,fin,nubes,satelite,idx);

    // Guardar en historial
    if(statsResult) guardarHistorial(statsResult, bbox, inicio, fin);

    // Guardar análisis completo para exportar
    lastAnalysis = {
      indice: currentIndex,
      indiceNombre: idx.fullname || idx.name,
      stats: statsResult,
      clases: clases,
      areaTotalHa: areaTotalHa,
      bbox: bbox,
      inicio: inicio, fin: fin,
      nubes: nubes, satelite: satelite,
      paleta: vizConfig.paleta,
      fecha: new Date().toLocaleString('es-CL')
    };
    document.getElementById('exportBar').style.display='grid';
    const ph=document.getElementById('exportPlaceholder'); if(ph) ph.style.display='none';

    // Preparar timeline con las fechas ya consultadas
    timelineBbox = bbox;
    if(fechasDisp && fechasDisp.length){
      timelineDates = fechasDisp;
      mostrarBotonTimeline();
    }

    setStatus('✅ Análisis completo','success');

  } catch(e){
    console.error(e);
    if(e.name==='AbortError') setStatus('❌ La solicitud tardó demasiado. Intenta con un área más pequeña, menos fechas, o revisa tu conexión.','error');
    else setStatus('❌ '+e.message,'error');
  } finally{
    btn.disabled=false; btn.innerHTML='▶ &nbsp;Calcular índice';
  }
}

function setLayer(type){
  currentLayerType=type;
  ['indice','rgb','false'].forEach(t=>{
    const id=t==='indice'?'btnIndice':t==='rgb'?'btnRGB':'btnFalse';
    document.getElementById(id).classList.toggle('active',t===type);
  });
}
function updateOpacity(v){ if(sentinelLayer) sentinelLayer.setOpacity(v/100); }

// ════════════════════════════════════════════════════════════
//  ESTADÍSTICAS
// ════════════════════════════════════════════════════════════
async function calcularStats(token,bbox,inicio,fin,nubes,satelite,idx){
  const allBands=[...new Set(idx.bands)];
  const bandsStr=JSON.stringify([...allBands,"dataMask"]);
  const formulaJS=idx.formula.replace(/B(\d+)/g,'s.B$1');
  const evalS=`//VERSION=3
function setup(){return{input:[{bands:${bandsStr}}],output:[{id:"val",bands:1},{id:"dataMask",bands:1}]}}
function evaluatePixel(s){return{val:[${formulaJS}],dataMask:[s.dataMask]}}`;

  const body={
    input:{
      bounds:getBounds(bbox),
      data:[{type:satelite,dataFilter:{
        timeRange:{from:inicio+"T00:00:00Z",to:fin+"T23:59:59Z"},
        maxCloudCoverage:nubes
      }}]
    },
    aggregation:{
      timeRange:{from:inicio+"T00:00:00Z",to:fin+"T23:59:59Z"},
      aggregationInterval:{of:"P30D"},
      resx:0.0003,resy:0.0003,
      evalscript:evalS
    },
    calculations:{val:{statistics:{default:{}}}}
  };

  try{
    const res=await fetchWithTimeout(STATS_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    },60000);
    if(!res.ok) {
      const txt = await res.text().catch(()=>'');
      throw new Error('Stats '+res.status+': '+txt.slice(0,300));
    }
    const data=await res.json();

    let means=[],mins=[],maxs=[];
    (data.data||[]).forEach(iv=>{
      const s=iv?.outputs?.val?.bands?.B0?.stats;
      if(s&&s.mean!==null&&!isNaN(s.mean)){means.push(s.mean);mins.push(s.min);maxs.push(s.max);}
    });
    if(!means.length){
      document.getElementById('statsContainer').innerHTML='<p class="ph">Sin datos en el período<br>Aumenta el rango de fechas o nubosidad</p>';
      return null;
    }

    const media=means.reduce((a,b)=>a+b,0)/means.length;
    const minV=Math.min(...mins), maxV=Math.max(...maxs);
    const std=Math.sqrt(means.reduce((s,m)=>s+Math.pow(m-media,2),0)/means.length);

    // Interpretación por índice
    let iColor='#2d7a3a',iEmoji='🌿',iText='';
    if(currentIndex==='NDVI'){
      if(media>0.6){iColor='#1a9850';iEmoji='🌿';iText='Cultivo muy vigoroso';}
      else if(media>0.4){iColor='#91cf60';iEmoji='💚';iText='Vegetación densa';}
      else if(media>0.25){iColor='#d9ef8b';iEmoji='🟢';iText='Vegetación moderada';}
      else if(media>0.1){iColor='#e8a83a';iEmoji='🟡';iText='Vegetación escasa';}
      else{iColor='#e85a3a';iEmoji='🔴';iText='Sin vegetación';}
    } else if(currentIndex==='NDWI'){
      if(media>0.2){iColor='#5ab4ac';iEmoji='💧';iText='Buena hidratación';}
      else if(media>0){iColor='#c7eae5';iEmoji='🩵';iText='Hidratación media';}
      else if(media>-0.2){iColor='#e8a83a';iEmoji='🟡';iText='Estrés hídrico leve';}
      else{iColor='#8c510a';iEmoji='🟫';iText='Estrés hídrico severo';}
    } else if(currentIndex==='NBR'){
      if(media<0){iColor='#e85a3a';iEmoji='🔴';iText='Área quemada/estrés severo';}
      else if(media<0.2){iColor='#e8a83a';iEmoji='🟡';iText='Estrés moderado';}
      else{iColor='#1a9850';iEmoji='🌿';iText='Vegetación saludable';}
    } else if(currentIndex==='NDRE'){
      if(media>0.4){iColor='#006837';iEmoji='💚';iText='Nitrógeno óptimo';}
      else if(media>0.2){iColor='#31a354';iEmoji='🟢';iText='N adecuado';}
      else if(media>0.1){iColor='#e8a83a';iEmoji='🟡';iText='Déficit N leve';}
      else{iColor='#e85a3a';iEmoji='🔴';iText='Déficit N severo';}
    } else if(currentIndex==='MNDWI'){
      if(media>0.1){iColor='#313695';iEmoji='🔵';iText='Agua superficial';}
      else if(media>-0.1){iColor='#74add1';iEmoji='🩵';iText='Humedad transición';}
      else{iColor='#8c510a';iEmoji='🟫';iText='Suelo seco';}
    } else {
      if(media>0.5){iColor='#1a9850';iEmoji='🌿';iText='Vigor alto';}
      else if(media>0.3){iColor='#91cf60';iEmoji='🟢';iText='Vigor moderado';}
      else if(media>0.1){iColor='#e8a83a';iEmoji='🟡';iText='Vigor bajo';}
      else{iColor='#e85a3a';iEmoji='🔴';iText='Sin vegetación';}
    }

    document.getElementById('statsContainer').innerHTML=`
      <div class="stats-grid">
        <div class="stat-card full">
          <div class="val" style="color:${iColor}">${media.toFixed(3)}</div>
          <div class="lbl">${currentIndex} Promedio del período</div>
        </div>
        <div class="stat-card"><div class="val" style="font-size:15px">${minV.toFixed(3)}</div><div class="lbl">Mínimo</div></div>
        <div class="stat-card"><div class="val" style="font-size:15px">${maxV.toFixed(3)}</div><div class="lbl">Máximo</div></div>
        <div class="stat-card full"><div class="val" style="font-size:15px">±${std.toFixed(3)}</div><div class="lbl">Desviación estándar</div></div>
      </div>
      <div class="interp" style="background:${iColor}1a;border:1px solid ${iColor}44;color:${iColor}">
        ${iEmoji} ${iText}
      </div>`;

    return {indice:currentIndex,media,min:minV,max:maxV,std};
  } catch(e){
    document.getElementById('statsContainer').innerHTML='<p class="ph">⚠️ No se pudieron cargar estadísticas</p>';
    return null;
  }
}

// ════════════════════════════════════════════════════════════
//  SERIE TEMPORAL
// ════════════════════════════════════════════════════════════
async function calcularSerie(token,bbox,inicio,fin,nubes,satelite,idx){
  const allBands=[...new Set(idx.bands)];
  const formulaJS=idx.formula.replace(/B(\d+)/g,'s.B$1');
  const bandsStr=JSON.stringify([...allBands,"dataMask"]);
  const evalS=`//VERSION=3\nfunction setup(){return{input:[{bands:${bandsStr}}],output:[{id:"val",bands:1},{id:"dataMask",bands:1}]}}\nfunction evaluatePixel(s){return{val:[${formulaJS}],dataMask:[s.dataMask]}}`;

  const body={
    input:{
      bounds:getBounds(bbox),
      data:[{type:satelite,dataFilter:{
        timeRange:{from:inicio+"T00:00:00Z",to:fin+"T23:59:59Z"},
        maxCloudCoverage:nubes
      }}]
    },
    aggregation:{
      timeRange:{from:inicio+"T00:00:00Z",to:fin+"T23:59:59Z"},
      aggregationInterval:{of:"P15D"},
      resx:0.0003,resy:0.0003,
      evalscript:evalS
    },
    calculations:{val:{statistics:{default:{}}}}
  };
  try{
    const res=await fetchWithTimeout(STATS_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    },60000);
    if(!res.ok) throw new Error();
    const data=await res.json();
    const labels=[],values=[];
    (data.data||[]).forEach(iv=>{
      const s=iv?.outputs?.val?.bands?.B0?.stats;
      if(s&&s.mean!==null&&!isNaN(s.mean)&&s.sampleCount>5){
        labels.push(iv.interval.from.substring(0,10));
        values.push(parseFloat(s.mean.toFixed(4)));
      }
    });
    if(!labels.length){
      document.getElementById('chartContainer').innerHTML='<p class="ph">Sin datos para serie temporal</p>';
      return;
    }
    document.getElementById('chartContainer').innerHTML='<canvas id="chartCanvas"></canvas>';
    if(myChart) myChart.destroy();
    myChart=new Chart(document.getElementById('chartCanvas').getContext('2d'),{
      type:'line',
      data:{
        labels,
        datasets:[{
          label:currentIndex,data:values,
          borderColor:'#2d7a3a',backgroundColor:'rgba(45,122,58,0.1)',
          borderWidth:2,pointBackgroundColor:'#7ecf5a',pointRadius:4,fill:true,tension:0.3
        }]
      },
      options:{
        responsive:true,
        plugins:{legend:{display:false},tooltip:{
          backgroundColor:'#1a3a2a',borderColor:'#2d7a3a',borderWidth:1,
          titleColor:'#a8d5b5',bodyColor:'#7ecf5a'
        }},
        scales:{
          x:{ticks:{color:'#7a9e8a',font:{size:9},maxRotation:45},grid:{color:'rgba(45,122,58,0.1)'}},
          y:{ticks:{color:'#7a9e8a',font:{family:'JetBrains Mono',size:10}},grid:{color:'rgba(45,122,58,0.1)'}}
        }
      }
    });
  } catch(e){
    document.getElementById('chartContainer').innerHTML='<p class="ph">⚠️ Error en serie temporal</p>';
  }
}

// ════════════════════════════════════════════════════════════
//  HISTORIAL (localStorage)
// ════════════════════════════════════════════════════════════
function guardarHistorial(stats,bbox,inicio,fin){
  const hist=JSON.parse(localStorage.getItem('ndvi_historial')||'[]');
  hist.unshift({
    ...stats,
    bbox,inicio,fin,
    fecha:new Date().toLocaleString('es-CL'),
    zona:`${bbox[1].toFixed(3)},${bbox[0].toFixed(3)} → ${bbox[3].toFixed(3)},${bbox[2].toFixed(3)}`
  });
  if(hist.length>200) hist.pop();
  localStorage.setItem('ndvi_historial',JSON.stringify(hist));
}

function renderHistorial(){
  const hist=JSON.parse(localStorage.getItem('ndvi_historial')||'[]');
  const filtro=document.getElementById('filtroIdx').value;

  // Actualizar opciones filtro
  const idxSet=new Set(hist.map(h=>h.indice));
  const sel=document.getElementById('filtroIdx');
  const cur=sel.value;
  sel.innerHTML='<option value="">Todos los índices</option>';
  idxSet.forEach(i=>sel.innerHTML+=`<option value="${i}"${i===cur?' selected':''}>${i}</option>`);

  const filtered=filtro?hist.filter(h=>h.indice===filtro):hist;
  const el=document.getElementById('historialList');

  if(!filtered.length){
    el.innerHTML='<p class="ph" style="padding:30px 0">No hay análisis registrados aún</p>';
    return;
  }
  el.innerHTML=filtered.map((h,i)=>`
    <div class="hist-item">
      <div class="hi-top">
        <span class="hi-idx">${h.indice}</span>
        <div class="hi-date">📅 ${h.fecha}</div>
      </div>
      <div class="hi-vals">
        <div class="hv">Media: <span>${h.media.toFixed(3)}</span></div>
        <div class="hv">Mín: <span>${h.min.toFixed(3)}</span></div>
        <div class="hv">Máx: <span>${h.max.toFixed(3)}</span></div>
        <div class="hv">σ: <span>±${h.std.toFixed(3)}</span></div>
      </div>
      <div class="hi-zone">📍 ${h.zona} &nbsp;·&nbsp; 📅 ${h.inicio} → ${h.fin}</div>
    </div>`).join('');
}

function limpiarHistorial(){
  if(!confirm('¿Eliminar todo el historial?')) return;
  localStorage.removeItem('ndvi_historial');
  renderHistorial();
}

// ════════════════════════════════════════════════════════════
//  KML
// ════════════════════════════════════════════════════════════
function handleDrop(e){
  e.preventDefault();
  document.getElementById('uploadZone').classList.remove('drag');
  const f=e.dataTransfer.files[0];
  if(f) handleKMLFile(f);
}

function handleKMLFile(file){
  if(!file) return;
  const reader=new FileReader();
  reader.onload=function(e){
    pendingKMLData=e.target.result;
    document.getElementById('kmlNombre').value=file.name.replace(/\.(kml|kmz)$/i,'');
    document.getElementById('btnGuardarKML').disabled=false;
    document.getElementById('kmlStatus').innerHTML=
      '<div class="status success">✅ KML cargado — completa los datos y guarda</div>';
    // Preview en mapa
    previewKML(pendingKMLData);
  };
  reader.readAsText(file);
}

function previewKML(kmlText){
  try{
    const parser=new DOMParser();
    const kmlDoc=parser.parseFromString(kmlText,'text/xml');
    const layer=kmlToLayer(kmlDoc);
    if(layer){
      layer.addTo(map);
      map.fitBounds(layer.getBounds());
      setTimeout(()=>map.removeLayer(layer),500);
    }
  } catch(e){}
}

function kmlToLayer(kmlDoc){
  // Simple KML parser: extrae coordenadas de Polygon
  const coords=[];
  const coordNodes=kmlDoc.getElementsByTagName('coordinates');
  const layers=[];
  Array.from(coordNodes).forEach(node=>{
    const raw=node.textContent.trim().split(/\s+/);
    const pts=raw.map(c=>{const p=c.split(',');return[parseFloat(p[1]),parseFloat(p[0])];}).filter(p=>!isNaN(p[0]));
    if(pts.length>2){
      layers.push(L.polygon(pts,{color:'#f5820d',weight:2.5,fillColor:'#f5820d',fillOpacity:0.15}));
    }
  });
  if(!layers.length) return null;
  const group=L.featureGroup(layers);
  return group;
}

function guardarKML(){
  if(!pendingKMLData) return;
  const nombre=document.getElementById('kmlNombre').value.trim()||'Sin nombre';
  const desc=document.getElementById('kmlDesc').value.trim();
  const kmls=JSON.parse(localStorage.getItem('ndvi_kmls')||'[]');
  kmls.unshift({id:Date.now(),nombre,desc,data:pendingKMLData,fecha:new Date().toLocaleString('es-CL')});
  localStorage.setItem('ndvi_kmls',JSON.stringify(kmls));
  pendingKMLData=null;
  document.getElementById('kmlNombre').value='';
  document.getElementById('kmlDesc').value='';
  document.getElementById('btnGuardarKML').disabled=true;
  document.getElementById('kmlStatus').innerHTML=
    '<div class="status success">✅ KML guardado correctamente</div>';
  renderKMLList();
}

function renderKMLList(){
  const kmls=JSON.parse(localStorage.getItem('ndvi_kmls')||'[]');
  document.getElementById('kmlCount').textContent=kmls.length+' archivo'+(kmls.length!==1?'s':'');
  const el=document.getElementById('kmlList');
  if(!kmls.length){
    el.innerHTML='<p class="ph" style="padding:30px 0">No hay KMLs guardados aún</p>';
    return;
  }
  el.innerHTML=kmls.map(k=>`
    <div class="kml-item">
      <div class="ki-icon">🗺️</div>
      <div class="ki-info">
        <div class="ki-name">${k.nombre}</div>
        <div class="ki-desc">${k.desc||'Sin descripción'} &nbsp;·&nbsp; ${k.fecha}</div>
        <div class="ki-actions">
          <button class="ki-btn view" onclick="verKML(${k.id})">👁 Ver en mapa</button>
          <button class="ki-btn del" onclick="eliminarKML(${k.id})">🗑 Eliminar</button>
        </div>
      </div>
    </div>`).join('');
}

function verKML(id){
  const kmls=JSON.parse(localStorage.getItem('ndvi_kmls')||'[]');
  const k=kmls.find(x=>x.id===id);
  if(!k) return;
  // Limpiar capa previa del mismo id
  if(kmlLayers[id]) map.removeLayer(kmlLayers[id]);
  try{
    const parser=new DOMParser();
    const doc=parser.parseFromString(k.data,'text/xml');
    const layer=kmlToLayer(doc);
    if(layer){
      kmlLayers[id]=layer;
      layer.addTo(map);
      map.fitBounds(layer.getBounds());
      switchTab('analisis');
      setStatus('✅ KML "'+k.nombre+'" cargado en el mapa','success');
      drawnLayer=null; // usar KML como región
    }
  } catch(e){ alert('Error al cargar KML'); }
}

function eliminarKML(id){
  if(!confirm('¿Eliminar este KML?')) return;
  let kmls=JSON.parse(localStorage.getItem('ndvi_kmls')||'[]');
  kmls=kmls.filter(k=>k.id!==id);
  localStorage.setItem('ndvi_kmls',JSON.stringify(kmls));
  if(kmlLayers[id]){map.removeLayer(kmlLayers[id]);delete kmlLayers[id];}
  renderKMLList();
}

// ════════════════════════════════════════════════════════════
//  STATUS
// ════════════════════════════════════════════════════════════
function setStatus(msg,type){
  const el=document.getElementById('statusMsg');
  if(el) el.innerHTML=msg?`<div class="status ${type}">${msg}</div>`:'';
  const el2=document.getElementById('statusMsgMobile');
  if(el2) el2.innerHTML=msg?`<div class="status ${type}">${msg}</div>`:'';
}

// ════════════════════════════════════════════════════════════
//  UBICACIÓN GPS
// ════════════════════════════════════════════════════════════
let userLocationMarker = null;

function irAMiUbicacion(){
  const btn=document.getElementById('gpsBtn');
  if(!navigator.geolocation){
    setStatus('⚠️ Tu navegador no soporta geolocalización','error');
    return;
  }
  btn.classList.add('locating');
  navigator.geolocation.getCurrentPosition(
    pos=>{
      btn.classList.remove('locating');
      btn.classList.add('active');
      const lat=pos.coords.latitude, lon=pos.coords.longitude;
      if(userLocationMarker) map.removeLayer(userLocationMarker);
      // Marcador pulsante
      const icon=L.divIcon({
        className:'user-loc-icon',
        html:'<div class="uli-pulse"></div><div class="uli-dot"></div>',
        iconSize:[20,20],iconAnchor:[10,10]
      });
      userLocationMarker=L.marker([lat,lon],{icon}).addTo(map);
      userLocationMarker.bindPopup('📍 Estás aquí<br><span style="font-family:monospace;font-size:11px">'+lat.toFixed(5)+', '+lon.toFixed(5)+'</span>');
      map.setView([lat,lon],15,{animate:true});
      setStatus('✅ Ubicación encontrada','success');
      setTimeout(()=>btn.classList.remove('active'),2000);
    },
    err=>{
      btn.classList.remove('locating');
      let msg='No se pudo obtener tu ubicación';
      if(err.code===1) msg='Permiso de ubicación denegado';
      else if(err.code===2) msg='Ubicación no disponible';
      else if(err.code===3) msg='Tiempo de espera agotado';
      setStatus('⚠️ '+msg,'error');
    },
    {enableHighAccuracy:true,timeout:10000,maximumAge:0}
  );
}

// ════════════════════════════════════════════════════════════
//  CATÁLOGO DE FECHAS (timeline tipo Google Earth)
// ════════════════════════════════════════════════════════════
let timelineDates = [];   // fechas disponibles [{date, cloud}]
let timelinePlaying = false;
let timelinePlayTimer = null;
let timelineBbox = null;

// Busca fechas con imágenes disponibles en el bbox
async function buscarFechasDisponibles(token, bbox, inicio, fin, satelite){
  const collection = satelite==='S2L1C' ? 'sentinel-2-l1c' : 'sentinel-2-l2a';
  const body = {
    collections:[collection],
    datetime:`${inicio}T00:00:00Z/${fin}T23:59:59Z`,
    bbox:bbox,
    limit:100,
    fields:{include:['properties.datetime','properties.eo:cloud_cover'],exclude:[]}
  };
  try{
    const res=await fetchWithTimeout(CATALOG_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body)
    },60000);
    if(!res.ok) throw new Error('Catalog '+res.status);
    const data=await res.json();
    const dates=(data.features||[]).map(f=>({
      date:f.properties.datetime.substring(0,10),
      cloud:f.properties['eo:cloud_cover']!=null?Math.round(f.properties['eo:cloud_cover']):null
    }));
    // Únicas por fecha, ordenadas
    const seen={};
    const unique=[];
    dates.sort((a,b)=>a.date.localeCompare(b.date)).forEach(d=>{
      if(!seen[d.date]){seen[d.date]=1;unique.push(d);}
    });
    return unique;
  } catch(e){
    console.warn('buscarFechas error:',e);
    return [];
  }
}

// Abre el timeline tras un análisis
async function abrirTimeline(bbox, inicio, fin, satelite){
  timelineBbox = bbox;
  const tl=document.getElementById('mapTimeline');
  tl.style.display='block';
  document.getElementById('mtlHint').textContent='Cargando fechas disponibles…';
  try{
    const token=await getToken();
    timelineDates = await buscarFechasDisponibles(token, bbox, inicio, fin, satelite);
    const slider=document.getElementById('mtlSlider');
    if(!timelineDates.length){
      document.getElementById('mtlHint').textContent='No se encontraron imágenes en este período';
      return;
    }
    slider.min=0;
    slider.max=timelineDates.length-1;
    slider.value=timelineDates.length-1;
    onTimelineSlide(timelineDates.length-1);
    document.getElementById('mtlHint').textContent=`${timelineDates.length} imágenes disponibles · desliza o reproduce ▶`;
  } catch(e){
    document.getElementById('mtlHint').textContent='Error al cargar fechas';
  }
}

// Cuando se desliza el timeline → genera imagen de esa fecha
let slideDebounce=null;
function onTimelineSlide(idx){
  idx=parseInt(idx);
  const d=timelineDates[idx];
  if(!d) return;
  const cloudTxt = d.cloud!=null ? ` · ☁️ ${d.cloud}%` : '';
  document.getElementById('mtlCurrent').textContent = d.date + cloudTxt;
  // Debounce para no saturar la API mientras arrastra
  if(slideDebounce) clearTimeout(slideDebounce);
  slideDebounce=setTimeout(()=>renderFechaEspecifica(d.date),350);
}

// Genera la imagen del índice para una fecha específica
async function renderFechaEspecifica(fecha){
  if(!timelineBbox) return;
  try{
    const token=await getToken();
    const idx=INDICES[currentIndex];
    const satelite=document.getElementById('satelite').value;
    const opacidad=parseInt(document.getElementById('opacidad').value)/100;
    const paletteColors=PALETAS[vizConfig.paleta].colors;
    const evalViz = currentLayerType==='indice'
      ? buildDynamicEvalscript(idx, paletteColors, vizConfig.nClases, vizConfig.continuo)
      : currentLayerType==='rgb'
        ? `//VERSION=3\nfunction setup(){return{input:["B04","B03","B02","dataMask"],output:{bands:4}}}\nfunction evaluatePixel(s){return[3.5*s.B04,3.5*s.B03,3.5*s.B02,s.dataMask]}`
        : `//VERSION=3\nfunction setup(){return{input:["B08","B04","B03","dataMask"],output:{bands:4}}}\nfunction evaluatePixel(s){return[3.5*s.B08,3.5*s.B04,3.5*s.B03,s.dataMask]}`;

    const body={
      input:{
        bounds:{bbox:timelineBbox,properties:{crs:"http://www.opengis.net/def/crs/EPSG/0/4326"}},
        data:[{type:satelite,dataFilter:{
          timeRange:{from:fecha+"T00:00:00Z",to:fecha+"T23:59:59Z"}
        }}]
      },
      output:{width:1024,height:1024,responses:[{identifier:"default",format:{type:"image/png"}}]},
      evalscript:evalViz
    };
    const res=await fetchWithTimeout(PROCESS_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'image/png'},
      body:JSON.stringify(body)
    },60000);
    if(!res.ok) return;
    const blob=await res.blob();
    const url=URL.createObjectURL(blob);
    if(sentinelLayer) map.removeLayer(sentinelLayer);
    sentinelLayer=L.imageOverlay(url,[[timelineBbox[1],timelineBbox[0]],[timelineBbox[3],timelineBbox[2]]],{opacity:opacidad,className:'smooth-overlay',interactive:false}).addTo(map);
    // Actualizar badge de fecha
    actualizarFechaBadge(fecha);
  } catch(e){ console.warn(e); }
}

function toggleTimelinePlay(){
  const btn=document.getElementById('mtlPlay');
  if(timelinePlaying){
    timelinePlaying=false;
    btn.textContent='▶';
    if(timelinePlayTimer) clearInterval(timelinePlayTimer);
  } else {
    timelinePlaying=true;
    btn.textContent='⏸';
    const slider=document.getElementById('mtlSlider');
    timelinePlayTimer=setInterval(()=>{
      let v=parseInt(slider.value);
      v = v>=timelineDates.length-1 ? 0 : v+1;
      slider.value=v;
      onTimelineSlide(v);
    }, 1400);
  }
}

function cerrarTimeline(){
  document.getElementById('mapTimeline').style.display='none';
  timelinePlaying=false;
  if(timelinePlayTimer) clearInterval(timelinePlayTimer);
  document.getElementById('mtlPlay').textContent='▶';
  const btn=document.getElementById('timelineToggleBtn');
  if(btn) btn.style.display='flex';
}

// Badge de fecha de imagen satelital
function actualizarFechaBadge(fecha){
  const badge=document.getElementById('mapDateBadge');
  badge.style.display='flex';
  // Formato legible
  const partes=fecha.split('-');
  const meses=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const txt = partes[2]+' '+meses[parseInt(partes[1])-1]+' '+partes[0];
  document.getElementById('mapDateValue').textContent=txt;
}

// Botón flotante para abrir el timeline
function mostrarBotonTimeline(){
  let btn=document.getElementById('timelineToggleBtn');
  if(!btn){
    btn=document.createElement('button');
    btn.id='timelineToggleBtn';
    btn.className='timeline-toggle';
    btn.innerHTML='📅 Línea de tiempo';
    btn.onclick=()=>{
      const tl=document.getElementById('mapTimeline');
      if(tl.style.display==='none'||!tl.style.display){
        tl.style.display='block';
        const slider=document.getElementById('mtlSlider');
        slider.min=0; slider.max=timelineDates.length-1; slider.value=timelineDates.length-1;
        onTimelineSlide(timelineDates.length-1);
        document.getElementById('mtlHint').textContent=timelineDates.length+' imágenes disponibles · desliza o reproduce ▶';
        btn.style.display='none';
      }
    };
    document.getElementById('map').appendChild(btn);
  }
  btn.style.display='flex';
}

// ════════════════════════════════════════════════════════════
//  EXPORTACIÓN
// ════════════════════════════════════════════════════════════

function exportNombreBase(){
  if(!lastAnalysis) return 'AgroVision';
  const f=new Date().toISOString().slice(0,10);
  return `AgroVision_${lastAnalysis.indice}_${f}`;
}

// ── EXCEL ──
function exportarExcel(){
  if(!lastAnalysis){ setStatus('⚠️ Calcula un índice primero','error'); return; }
  try{
    const a=lastAnalysis;
    const wb=XLSX.utils.book_new();

    // Hoja 1: Resumen
    const resumen=[
      ['AGROVISION · INFORME DE ANÁLISIS'],
      [''],
      ['Índice espectral', a.indice],
      ['Nombre completo', a.indiceNombre],
      ['Fecha de análisis', a.fecha],
      ['Período analizado', `${a.inicio} a ${a.fin}`],
      ['Satélite', a.satelite],
      ['Máx. nubosidad', a.nubes+'%'],
      ['Paleta de color', a.paleta],
      ['Superficie total (ha)', a.areaTotalHa.toFixed(2)],
      [''],
      ['ESTADÍSTICAS DEL ÍNDICE'],
      ['Media', a.stats?a.stats.media.toFixed(4):'N/A'],
      ['Mínimo', a.stats?a.stats.min.toFixed(4):'N/A'],
      ['Máximo', a.stats?a.stats.max.toFixed(4):'N/A'],
      ['Desviación estándar', a.stats?a.stats.std.toFixed(4):'N/A'],
      [''],
      ['Coordenadas (bbox)', `O:${a.bbox[0].toFixed(5)} S:${a.bbox[1].toFixed(5)} E:${a.bbox[2].toFixed(5)} N:${a.bbox[3].toFixed(5)}`],
      [''],
      ['Generado por AgroVision · Ing. Agr. Matías Meza Paredes']
    ];
    const ws1=XLSX.utils.aoa_to_sheet(resumen);
    ws1['!cols']=[{wch:24},{wch:50}];
    XLSX.utils.book_append_sheet(wb,ws1,'Resumen');

    // Hoja 2: Categorías por superficie
    if(a.clases&&a.clases.length){
      const cats=[['Clase','Rango '+a.indice+' (desde)','Rango (hasta)','Hectáreas','Porcentaje (%)','Color HEX']];
      a.clases.forEach(c=>{
        cats.push([c.clase, c.low.toFixed(3), c.high.toFixed(3), parseFloat(c.ha.toFixed(2)), parseFloat(c.pct.toFixed(2)), c.color]);
      });
      cats.push(['TOTAL','','',parseFloat(a.areaTotalHa.toFixed(2)),100,'']);
      const ws2=XLSX.utils.aoa_to_sheet(cats);
      ws2['!cols']=[{wch:8},{wch:18},{wch:14},{wch:12},{wch:14},{wch:10}];
      XLSX.utils.book_append_sheet(wb,ws2,'Categorías');
    }

    XLSX.writeFile(wb, exportNombreBase()+'.xlsx');
    setStatus('✅ Excel descargado','success');
  } catch(e){ console.error(e); setStatus('❌ Error al exportar Excel','error'); }
}

// ── IMAGEN DEL MAPA (pantallazo) ──
async function exportarMapa(){
  if(!lastAnalysis){ setStatus('⚠️ Calcula un índice primero','error'); return; }
  setStatus('<div class="spinner"></div> Capturando mapa…','loading');
  try{
    const mapEl=document.getElementById('map');
    // Esperar a que los tiles carguen
    await new Promise(r=>setTimeout(r,600));
    const canvas=await html2canvas(mapEl,{useCORS:true,allowTaint:false,backgroundColor:'#e8f0eb',scale:2,logging:false});
    canvas.toBlob(blob=>{
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url; a.download=exportNombreBase()+'_mapa.png';
      a.click();
      URL.revokeObjectURL(url);
      setStatus('✅ Imagen del mapa descargada','success');
    });
  } catch(e){
    console.error(e);
    setStatus('⚠️ El mapa base no permite captura directa. Descarga el PNG del índice.','error');
  }
}

// ── PNG DEL ÍNDICE (capa pura) ──
function exportarIndicePNG(){
  if(!lastImageUrl){ setStatus('⚠️ Calcula un índice primero','error'); return; }
  const a=document.createElement('a');
  a.href=lastImageUrl;
  a.download=exportNombreBase()+'_indice.png';
  a.click();
  setStatus('✅ PNG del índice descargado','success');
}

// ── INFORME PDF (imagen + tabla) ──
async function exportarPDF(){
  if(!lastAnalysis){ setStatus('⚠️ Calcula un índice primero','error'); return; }
  setStatus('<div class="spinner"></div> Generando informe…','loading');
  try{
    const a=lastAnalysis;
    // Construir un HTML temporal e imprimirlo como PDF vía ventana
    const win=window.open('','_blank');
    let catRows='';
    if(a.clases){
      a.clases.forEach(c=>{
        catRows+=`<tr>
          <td><span style="display:inline-block;width:16px;height:16px;border-radius:3px;background:${c.color}"></span></td>
          <td>${c.low.toFixed(2)} a ${c.high.toFixed(2)}</td>
          <td style="text-align:right">${c.ha.toFixed(2)}</td>
          <td style="text-align:right">${c.pct.toFixed(1)}%</td>
        </tr>`;
      });
    }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${exportNombreBase()}</title>
    <style>
      body{font-family:Arial,sans-serif;color:#1a3a2a;padding:32px;max-width:800px;margin:0 auto}
      h1{color:#2d7a3a;font-size:22px;border-bottom:3px solid #7ecf5a;padding-bottom:8px}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;margin:16px 0;background:#f0f8f3;padding:14px;border-radius:8px}
      .meta b{color:#2d7a3a}
      img{width:100%;border-radius:10px;border:2px solid #7ecf5a;margin:16px 0}
      table{width:100%;border-collapse:collapse;font-size:13px;margin-top:12px}
      th{background:#1a3a2a;color:#fff;padding:8px;text-align:left}
      td{padding:7px 8px;border-bottom:1px solid #ddd}
      .foot{margin-top:24px;text-align:center;color:#7a9e8a;font-size:11px;border-top:1px solid #ddd;padding-top:12px}
    </style></head><body>
    <h1>🛰️ AgroVision · Informe de Análisis</h1>
    <div class="meta">
      <div><b>Índice:</b> ${a.indice} — ${a.indiceNombre}</div>
      <div><b>Fecha:</b> ${a.fecha}</div>
      <div><b>Período:</b> ${a.inicio} a ${a.fin}</div>
      <div><b>Satélite:</b> ${a.satelite}</div>
      <div><b>Superficie total:</b> ${a.areaTotalHa.toFixed(2)} ha</div>
      <div><b>Media ${a.indice}:</b> ${a.stats?a.stats.media.toFixed(3):'N/A'}</div>
    </div>
    <img src="${lastImageUrl}" alt="Índice"/>
    <h3 style="color:#2d7a3a">Categorías por superficie</h3>
    <table>
      <thead><tr><th></th><th>Rango ${a.indice}</th><th style="text-align:right">Hectáreas</th><th style="text-align:right">%</th></tr></thead>
      <tbody>${catRows}</tbody>
    </table>
    <div class="foot">Generado por AgroVision · Agricultura Basada en Datos<br>Ing. Agr. Matías Meza Paredes</div>
    </body></html>`);
    win.document.close();
    setTimeout(()=>{ win.print(); },800);
    setStatus('✅ Informe listo para imprimir/guardar','success');
  } catch(e){ console.error(e); setStatus('❌ Error al generar informe','error'); }
}

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
(async function init(){
  // Advertencia si se abre como archivo local (CORS bloquea las APIs)
  if(location.protocol==='file:'){
    const warn=document.createElement('div');
    warn.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#e85a3a;color:#fff;text-align:center;padding:14px 20px;font-size:14px;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,0.3)';
    warn.innerHTML='⚠️ Abre este archivo con un servidor web (http://localhost) — desde <code>file://</code> el navegador BLOQUEA las llamadas a Copernicus. Usa <code>npx serve .</code> o <code>python -m http.server 8080</code>';
    document.body.prepend(warn);
  }
  buildIndexGrid();
  buildPalDropdown();
  selectPalette('RdYlGn');
  renderKMLList();
  try{
    await getToken();
    document.getElementById('tokenBadge').textContent='✅ Conectado';
    document.getElementById('tokenBadge').className='badge ok';
  } catch(e){
    document.getElementById('tokenBadge').textContent='❌ Sin conexión';
    document.getElementById('tokenBadge').className='badge err';
    setStatus('❌ Error al conectar con Copernicus','error');
  }
})();



// ── BOTTOM SHEET ──────────────────────────────────────────────
let sheetOpen = false;
function toggleSheet(){
  sheetOpen = !sheetOpen;
  const bs = document.getElementById('bottomSheet');
  bs.style.display = sheetOpen ? 'block' : 'none';
  document.getElementById('sheetToggleBtn').textContent = sheetOpen ? '✕ Cerrar' : '⚙️ Configurar';
}

function bsTab(name){
  document.querySelectorAll('.bs-tab').forEach((t,i)=>{
    t.classList.toggle('active', ['indice','config','stats','serie'][i]===name);
  });
  document.querySelectorAll('.bs-section').forEach(s=>s.classList.remove('active'));
  document.getElementById('bs-'+name).classList.add('active');
}

// Sync index grid en el sheet móvil
function buildIndexGridMobile(){
  const grid = document.getElementById('indexGridMobile');
  if(!grid) return;
  grid.innerHTML='';
  Object.keys(INDICES).forEach(k=>{
    const idx = INDICES[k];
    const d = document.createElement('div');
    d.className='idx-pill'+(k===currentIndex?' active':'');
    d.innerHTML=`<div class="iname">${idx.name}</div><div class="idesc">${idx.desc}</div>`;
    d.onclick=()=>{
      selectIndex(k);
      document.querySelectorAll('#indexGridMobile .idx-pill').forEach((el,i)=>{
        el.classList.toggle('active', Object.keys(INDICES)[i]===k);
      });
      document.getElementById('idxInfoMobile').textContent = INDICES[k].info;
    };
    grid.appendChild(d);
  });
}

function setLayerMobile(type){
  setLayer(type);
  ['indice','rgb','false'].forEach(t=>{
    const id = t==='indice'?'btnIndiceMobile':t==='rgb'?'btnRGBMobile':'btnFalseMobile';
    document.getElementById(id).classList.toggle('active', t===type);
  });
}

// Calcular desde móvil — usa inputs del sheet
async function calcularMobile(){
  // Sync valores del sheet a los inputs del desktop (que usa calcular())
  const sat = document.getElementById('sateliteMobile').value;
  const fi  = document.getElementById('fechaInicioMobile').value;
  const ff  = document.getElementById('fechaFinMobile').value;
  const nb  = document.getElementById('nubesMobile').value;

  document.getElementById('satelite').value = sat;
  document.getElementById('fechaInicio').value = fi;
  document.getElementById('fechaFin').value = ff;
  document.getElementById('nubes').value = nb;

  // Cerrar sheet y mostrar status en FAB
  const fab = document.getElementById('fabBtn');
  fab.innerHTML = '<div class="spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;width:22px;height:22px"></div>';
  fab.disabled = true;

  try {
    await calcular();
    // Sync stats al sheet
    document.getElementById('statsContainerMobile').innerHTML =
      document.getElementById('statsContainer').innerHTML;
    document.getElementById('chartContainerMobile').innerHTML =
      document.getElementById('chartContainer').innerHTML;
    // Abrir stats
    toggleSheet();
    setTimeout(()=>bsTab('stats'), 100);
  } finally {
    fab.innerHTML = '▶';
    fab.disabled = false;
  }
}

// setStatus ahora maneja desktop y mobile

// Init mobile
(function initMobile(){
  const isMobile = window.innerWidth <= 768;
  if(isMobile){
    buildIndexGridMobile();
    document.getElementById('idxInfoMobile').textContent = INDICES[currentIndex].info;
  }
})();

// Cerrar dropdown de paletas al clic fuera
document.addEventListener('click', function(e){
  if(!e.target.closest('.pal-select-wrap')){
    const dd=document.getElementById('palDropdown');
    if(dd) dd.classList.remove('open');
  }
});



// ════════════════════════════════════════════════════════════
//  BIBLIOTECA ESPECTRAL
// ════════════════════════════════════════════════════════════
let bibRendered = false;

function renderBiblioteca(){
  if(bibRendered) return;
  bibRendered = true;

  const root = document.getElementById('biblioteca-root');

  const INDICE_CARDS = [
    {
      key:'NDVI', color:'#1a9850', bg:'linear-gradient(135deg,#1a9850,#3ab85a)',
      fullname:'Normalized Difference Vegetation Index',
      subtitle:'Índice de Vegetación de Diferencia Normalizada',
      desc:'El NDVI es el índice espectral más utilizado en teledetección agrícola. Mide la cantidad y salud de la vegetación verde activa, aprovechando la diferencia entre la absorción de luz roja (clorofila) y la alta reflexión en el infrarrojo cercano (estructura celular). Un cultivo sano absorbe rojo para fotosíntesis y refleja fuertemente el NIR; un cultivo estresado o seco invierte este comportamiento.',
      formula:'NDVI = (NIR − Rojo) / (NIR + Rojo)',
      formulaDetalle:'B08 = NIR (842nm) · B04 = Rojo (665nm)',
      bands:[{n:'B04',c:'#e53935',t:'Rojo 665nm'},{n:'B08',c:'#5c6bc0',t:'NIR 842nm'}],
      palette:'linear-gradient(to right,#d73027,#fc8d59,#fee08b,#d9ef8b,#91cf60,#1a9850,#006837)',
      ranges:[
        {val:'< 0',desc:'Agua, nieve, suelo desnudo o nubes',color:'#d73027',bg:'#fff5f5'},
        {val:'0 – 0.2',desc:'Vegetación muy escasa o suelo con residuos',color:'#e8a83a',bg:'#fffbf0'},
        {val:'0.2 – 0.4',desc:'Vegetación moderada, praderas o cultivos jóvenes',color:'#91cf60',bg:'#f5fff0'},
        {val:'0.4 – 0.6',desc:'Vegetación densa, cultivos en pleno desarrollo',color:'#1a9850',bg:'#f0fff5'},
        {val:'> 0.6',desc:'Vegetación muy densa y vigorosa, selvas o cultivos óptimos',color:'#006837',bg:'#e8fff0'},
      ],
      usos:'Monitoreo de vigor vegetativo · Detección de estrés hídrico o nutricional · Estimación de rendimiento · Seguimiento fenológico · Delimitación de zonas de manejo diferenciado (ZMD)',
      cuando:'Útil durante todo el ciclo del cultivo. Más informativo en pleno desarrollo foliar (cobertura >70%). Menos sensible en estadíos tempranos o zonas con mucho suelo expuesto.',
      sensor:'Sentinel-2 B08+B04 · Landsat B5+B4'
    },
    {
      key:'NDWI', color:'#0288d1', bg:'linear-gradient(135deg,#0277bd,#29b6f6)',
      fullname:'Normalized Difference Water Index',
      subtitle:'Índice de Contenido Hídrico en Vegetación',
      desc:'El NDWI cuantifica el contenido de agua líquida en la vegetación. Utiliza la banda verde (sensible al agua) y el infrarrojo cercano (NIR). A diferencia del NDVI que mide biomasa, el NDWI captura directamente el estado hídrico de los tejidos foliares. Es fundamental para detectar estrés hídrico antes de que sea visible a simple vista, permitiendo una intervención de riego oportuna.',
      formula:'NDWI = (Verde − NIR) / (Verde + NIR)',
      formulaDetalle:'B03 = Verde (560nm) · B08 = NIR (842nm)',
      bands:[{n:'B03',c:'#43a047',t:'Verde 560nm'},{n:'B08',c:'#5c6bc0',t:'NIR 842nm'}],
      palette:'linear-gradient(to right,#8c510a,#d8b365,#f6e8c3,#c7eae5,#5ab4ac,#01665e)',
      ranges:[
        {val:'< -0.3',desc:'Estrés hídrico severo, tejidos muy deshidratados',color:'#8c510a',bg:'#fff8f0'},
        {val:'-0.3 – -0.1',desc:'Estrés hídrico leve a moderado',color:'#e8a83a',bg:'#fffbf0'},
        {val:'-0.1 – 0.1',desc:'Contenido hídrico normal o zona de transición',color:'#91cf60',bg:'#f5fff0'},
        {val:'> 0.1',desc:'Buena hidratación foliar, riego adecuado',color:'#0288d1',bg:'#f0faff'},
      ],
      usos:'Detección temprana de estrés hídrico · Programación de riego · Monitoreo de sequías · Evaluación de eficiencia del sistema de riego · Comparación entre temporadas',
      cuando:'Ideal entre cuajado de fruto y cosecha cuando el riego es crítico. Debe combinarse con NDVI para separar efecto de biomasa del contenido hídrico real.',
      sensor:'Sentinel-2 B03+B08'
    },
    {
      key:'EVI', color:'#2e7d32', bg:'linear-gradient(135deg,#1b5e20,#4caf50)',
      fullname:'Enhanced Vegetation Index',
      subtitle:'Índice de Vegetación Mejorado',
      desc:'El EVI fue desarrollado por la NASA para superar las limitaciones del NDVI en zonas de alta biomasa (donde NDVI se satura) y en áreas con influencia atmosférica o de suelo. Incorpora la banda azul para corregir efectos atmosféricos y un factor de corrección del suelo (L=1). Es más sensible en el rango de 0.5–0.9 donde el NDVI ya no distingue diferencias. Ideal para cultivos densos como cerezos, vides o frutales con alta cobertura.',
      formula:'EVI = 2.5 × (NIR − Rojo) / (NIR + 6×Rojo − 7.5×Azul + 1)',
      formulaDetalle:'B02=Azul · B04=Rojo · B08=NIR',
      bands:[{n:'B02',c:'#1e88e5',t:'Azul 490nm'},{n:'B04',c:'#e53935',t:'Rojo 665nm'},{n:'B08',c:'#5c6bc0',t:'NIR 842nm'}],
      palette:'linear-gradient(to right,#d73027,#fc8d59,#fee08b,#d9ef8b,#1a9850,#003f20)',
      ranges:[
        {val:'< 0.1',desc:'Suelo desnudo, zonas urbanas o vegetación mínima',color:'#d73027',bg:'#fff5f5'},
        {val:'0.1 – 0.3',desc:'Vegetación escasa o cultivo en estadío inicial',color:'#e8a83a',bg:'#fffbf0'},
        {val:'0.3 – 0.5',desc:'Vegetación moderada, cultivos en desarrollo',color:'#91cf60',bg:'#f5fff0'},
        {val:'> 0.5',desc:'Vegetación densa, cultivos de alta cobertura',color:'#1a9850',bg:'#f0fff5'},
      ],
      usos:'Cultivos de alta densidad foliar · Corrección de efectos de aerosoles · Comparación entre zonas con distintas condiciones atmosféricas · Complemento del NDVI',
      cuando:'Especialmente útil en verano con alta biomasa o en zonas con neblina/aerosoles frecuentes. Reemplaza al NDVI cuando este se satura (NDVI > 0.8).',
      sensor:'Sentinel-2 B02+B04+B08'
    },
    {
      key:'SAVI', color:'#f57f17', bg:'linear-gradient(135deg,#e65100,#ffa000)',
      fullname:'Soil Adjusted Vegetation Index',
      subtitle:'Índice de Vegetación Ajustado al Suelo',
      desc:'El SAVI incorpora un factor de corrección (L) que minimiza el efecto del suelo en zonas con baja cobertura vegetal (<30%). El factor L=0.5 es el estándar general. En estadíos tempranos del cultivo el suelo domina la señal espectral y el NDVI sobreestima el estrés; el SAVI compensa este efecto. Muy recomendado para monitorear emergencia, trasplante y estados juveniles de cualquier cultivo.',
      formula:'SAVI = 1.5 × (NIR − Rojo) / (NIR + Rojo + 0.5)',
      formulaDetalle:'B04=Rojo · B08=NIR · L=0.5 (factor suelo)',
      bands:[{n:'B04',c:'#e53935',t:'Rojo 665nm'},{n:'B08',c:'#5c6bc0',t:'NIR 842nm'}],
      palette:'linear-gradient(to right,#d73027,#fc8d59,#fee08b,#d9ef8b,#91cf60,#1a9850)',
      ranges:[
        {val:'< 0.1',desc:'Suelo desnudo dominante, sin cobertura vegetal',color:'#d73027',bg:'#fff5f5'},
        {val:'0.1 – 0.3',desc:'Cobertura muy baja, estadío de emergencia',color:'#e8a83a',bg:'#fffbf0'},
        {val:'0.3 – 0.5',desc:'Cobertura moderada, cultivo en desarrollo inicial',color:'#91cf60',bg:'#f5fff0'},
        {val:'> 0.5',desc:'Buena cobertura vegetal establecida',color:'#1a9850',bg:'#f0fff5'},
      ],
      usos:'Monitoreo de emergencia y trasplante · Estadíos tempranos del cultivo · Zonas áridas o semiáridas · Cultivos en formación o recién plantados',
      cuando:'Óptimo en los primeros estadíos del cultivo o en huertos jóvenes. Sustituir por NDVI una vez que la cobertura supere el 50%.',
      sensor:'Sentinel-2 B04+B08'
    },
    {
      key:'NBR', color:'#b71c1c', bg:'linear-gradient(135deg,#7f0000,#c62828)',
      fullname:'Normalized Burn Ratio',
      subtitle:'Índice de Quemas y Estrés Severo',
      desc:'El NBR compara el NIR (alta reflectancia en vegetación sana) con el SWIR (alta reflexión en zonas quemadas, secas o con estrés severo). Es el índice estándar de la USGS y la NASA para mapeo de incendios forestales. En agricultura, resulta muy útil para detectar daño por heladas, sequías extremas, enfermedades foliares severas o cualquier evento que destruya la estructura celular. El dNBR (diferencia entre pre y post evento) cuantifica la severidad del daño.',
      formula:'NBR = (NIR − SWIR) / (NIR + SWIR)',
      formulaDetalle:'B08=NIR (842nm) · B12=SWIR (2190nm)',
      bands:[{n:'B08',c:'#5c6bc0',t:'NIR 842nm'},{n:'B12',c:'#8d6e63',t:'SWIR 2190nm'}],
      palette:'linear-gradient(to right,#7f0000,#d73027,#fc8d59,#fee08b,#d9ef8b,#1a9850)',
      ranges:[
        {val:'< -0.25',desc:'Quema activa o daño severo reciente',color:'#7f0000',bg:'#fff0f0'},
        {val:'-0.25 – 0',desc:'Estrés severo, daño por helada o enfermedad grave',color:'#d73027',bg:'#fff5f5'},
        {val:'0 – 0.2',desc:'Vegetación con estrés moderado o en recuperación',color:'#e8a83a',bg:'#fffbf0'},
        {val:'> 0.4',desc:'Vegetación sana, sin daño aparente',color:'#1a9850',bg:'#f0fff5'},
      ],
      usos:'Diagnóstico post-helada · Detección de incendios · Evaluación de daño por sequía severa · Monitoreo de enfermedades foliares · Seguro agrícola (evidencia satelital)',
      cuando:'Usar ante eventos de estrés severo: heladas, incendios, sequías. Comparar imágenes antes y después del evento para cuantificar el daño (dNBR).',
      sensor:'Sentinel-2 B08+B12'
    },
    {
      key:'NDRE', color:'#6a1b9a', bg:'linear-gradient(135deg,#4a148c,#8e24aa)',
      fullname:'Normalized Difference Red Edge',
      subtitle:'Índice de Borde Rojo — Clorofila y Nitrógeno',
      desc:'El NDRE utiliza la banda Red Edge (borde rojo, ~705-740nm), una zona del espectro particularmente sensible al contenido de clorofila y nitrógeno foliar. A diferencia del NDVI que usa rojo puro (donde la absorción por clorofila está saturada), el Red Edge opera en la zona de transición y detecta diferencias sutiles de pigmentación. Es el índice más preciso para diagnóstico nutricional satelital, especialmente deficiencias de N, Mg y Fe.',
      formula:'NDRE = (NIR − Red Edge) / (NIR + Red Edge)',
      formulaDetalle:'B05=Red Edge (705nm) · B08=NIR (842nm)',
      bands:[{n:'B05',c:'#e91e63',t:'Red Edge 705nm'},{n:'B08',c:'#5c6bc0',t:'NIR 842nm'}],
      palette:'linear-gradient(to right,#ffffcc,#c2e699,#78c679,#31a354,#006837)',
      ranges:[
        {val:'< 0.1',desc:'Déficit severo de clorofila/nitrógeno, clorosis notable',color:'#e8a83a',bg:'#fffbf0'},
        {val:'0.1 – 0.2',desc:'Déficit leve a moderado de N, revisar fertilización',color:'#c2e699',bg:'#f5fff0'},
        {val:'0.2 – 0.35',desc:'Contenido nutricional adecuado para el estadío',color:'#31a354',bg:'#f0fff5'},
        {val:'> 0.35',desc:'Excelente contenido de clorofila, N óptimo',color:'#006837',bg:'#e8fff0'},
      ],
      usos:'Diagnóstico de deficiencias de Nitrógeno · Guía de fertirrigación variable · Detección de clorosis · Evaluación de respuesta a aplicaciones foliares · Zonificación de fertilización diferenciada',
      cuando:'Ideal entre brotación y envero (en frutales) o entre emergencia y floración (en cultivos anuales). Comparar con análisis foliares para calibrar interpretación.',
      sensor:'Sentinel-2 B05+B08 (exclusivo Sentinel-2, no disponible en Landsat)'
    },
    {
      key:'MNDWI', color:'#01579b', bg:'linear-gradient(135deg,#01579b,#0288d1)',
      fullname:'Modified Normalized Difference Water Index',
      subtitle:'Índice de Agua Superficial Modificado',
      desc:'El MNDWI es una versión mejorada del NDWI original, que reemplaza la banda NIR por el SWIR (infrarrojo de onda corta). El SWIR suprime eficazmente la señal de la vegetación y el suelo, dejando casi exclusivamente la respuesta del agua superficial. Es el índice más preciso para detectar canales de riego, acequias, lagunas, embalses y zonas inundadas. El agua tiene MNDWI positivo; suelo y vegetación son negativos.',
      formula:'MNDWI = (Verde − SWIR) / (Verde + SWIR)',
      formulaDetalle:'B03=Verde (560nm) · B11=SWIR (1610nm)',
      bands:[{n:'B03',c:'#43a047',t:'Verde 560nm'},{n:'B11',c:'#795548',t:'SWIR 1610nm'}],
      palette:'linear-gradient(to right,#8c510a,#d8b365,#f5f5f5,#74add1,#313695)',
      ranges:[
        {val:'< -0.3',desc:'Suelo seco, sin humedad superficial',color:'#8c510a',bg:'#fff8f0'},
        {val:'-0.3 – 0',desc:'Suelo con humedad o vegetación baja',color:'#d8b365',bg:'#fffdf0'},
        {val:'0 – 0.2',desc:'Zona de transición, humedad superficial',color:'#74add1',bg:'#f0f8ff'},
        {val:'> 0.2',desc:'Agua superficial clara o inundación',color:'#313695',bg:'#f0f0ff'},
      ],
      usos:'Cartografía de canales y acequias · Detección de inundaciones · Monitoreo de embalses y lagunas · Evaluación de distribución del riego · Identificación de zonas anegadas',
      cuando:'Usar en cualquier momento del año para monitoreo hídrico. Especialmente útil post-lluvia o en temporada de riego para verificar distribución del agua.',
      sensor:'Sentinel-2 B03+B11'
    },
    {
      key:'MSAVI', color:'#33691e', bg:'linear-gradient(135deg,#1b5e20,#558b2f)',
      fullname:'Modified Soil Adjusted Vegetation Index',
      subtitle:'Índice de Vegetación Ajustado al Suelo Modificado',
      desc:'El MSAVI es la evolución del SAVI, eliminando la necesidad de definir manualmente el factor L. Utiliza un cálculo interno que adapta automáticamente la corrección del suelo según la densidad de vegetación presente. Esto lo hace más robusto y preciso que el SAVI original en zonas con cobertura variable. Ideal para análisis en huertos con diferentes densidades de plantación o en cultivos con brechas entre hileras.',
      formula:'MSAVI = (2×NIR + 1 − √((2×NIR+1)² − 8×(NIR−Rojo))) / 2',
      formulaDetalle:'B04=Rojo · B08=NIR · Factor L adaptativo',
      bands:[{n:'B04',c:'#e53935',t:'Rojo 665nm'},{n:'B08',c:'#5c6bc0',t:'NIR 842nm'}],
      palette:'linear-gradient(to right,#d73027,#fc8d59,#fee08b,#91cf60,#1a9850)',
      ranges:[
        {val:'< 0.1',desc:'Suelo desnudo o cobertura mínima',color:'#d73027',bg:'#fff5f5'},
        {val:'0.1 – 0.3',desc:'Vegetación muy escasa',color:'#e8a83a',bg:'#fffbf0'},
        {val:'0.3 – 0.5',desc:'Cobertura moderada, desarrollo intermedio',color:'#91cf60',bg:'#f5fff0'},
        {val:'> 0.5',desc:'Cobertura alta, cultivo establecido',color:'#1a9850',bg:'#f0fff5'},
      ],
      usos:'Análisis de cobertura vegetal variable · Huertos con distintas densidades · Monitoreo de vegetación en zonas áridas · Alternativa robusta al SAVI sin parámetros manuales',
      cuando:'Recomendado cuando la cobertura vegetal es heterogénea dentro de la misma zona de análisis o cuando se desconoce el factor L óptimo.',
      sensor:'Sentinel-2 B04+B08'
    }
  ];

  const PLANT_RESPONSES = [
    {emoji:'🌿',title:'Reflexión Verde (520–580nm)',color:'#2e7d32',border:'#a5d6a7',bg:'#f1f8e9',
     text:'La clorofila absorbe fuertemente en rojo y azul, pero refleja en verde. Por eso las plantas se ven verdes. Un aumento de la reflexión verde en plantas puede indicar menor contenido de clorofila (clorosis).'},
    {emoji:'🔴',title:'Absorción Roja (630–690nm)',color:'#c62828',border:'#ef9a9a',bg:'#fff5f5',
     text:'La clorofila a y b absorben máximamente en esta banda. Una planta sana absorbe >85% de la luz roja para fotosíntesis. El NDVI y EVI usan esta banda como denominador del estrés.'},
    {emoji:'🔆',title:'Red Edge (700–740nm)',color:'#8e24aa',border:'#ce93d8',bg:'#fce4ec',
     text:'Zona de transición crítica entre la absorción roja y la reflexión NIR. Muy sensible al contenido de clorofila. Usada por NDRE para diagnosticar nitrógeno y micronutrientes con alta precisión.'},
    {emoji:'🌡️',title:'Reflexión NIR (750–900nm)',color:'#1565c0',border:'#90caf9',bg:'#e3f2fd',
     text:'Las células del mesófilo esponjoso reflejan fuertemente el NIR. Una planta sana refleja 40–60% del NIR. La deshidratación o daño celular colapsa esta reflexión, base del NDVI, EVI y NBR.'},
    {emoji:'💧',title:'Absorción SWIR (1400–2500nm)',color:'#00695c',border:'#80cbc4',bg:'#e0f2f1',
     text:'El agua líquida en los tejidos absorbe fuertemente el SWIR. El NBR y MNDWI usan esta banda para detectar estrés hídrico severo, quemas y agua superficial respectivamente.'},
    {emoji:'☀️',title:'UV / Azul (400–490nm)',color:'#f57f17',border:'#ffe082',bg:'#fffde7',
     text:'Los carotenoides absorben en azul/verde. El EVI usa la banda azul para corregir efectos atmosféricos. Zonas muy afectadas por aerosoles o neblina muestran alta reflectancia azul.'},
  ];

  const html = `
<div class="bib-wrap">

  <!-- HERO -->
  <div class="bib-hero">
    <div class="bh-badge">🛰️ AgroVision · Biblioteca Espectral</div>
    <h1>Guía de Índices Espectrales<br>en Agricultura de Precisión</h1>
    <p>Fundamentos científicos, fórmulas, interpretación agronómica y uso práctico de los principales índices derivados de imágenes satelitales Sentinel-2. Una referencia técnica para el monitoreo inteligente de cultivos.</p>
  </div>

  <!-- ESPECTRO DE LUZ -->
  <div class="bib-section-title"><span>🌈</span> El Espectro Electromagnético y la Agricultura</div>
  <div class="spectrum-card">
    <p style="font-size:12px;color:var(--g600);line-height:1.7;margin-bottom:16px">Los satélites como Sentinel-2 capturan energía en distintas longitudes de onda del espectro electromagnético. Cada banda revela información diferente sobre el cultivo: desde la actividad fotosintética hasta el contenido de agua o el daño por estrés. El ojo humano solo percibe entre 380–700nm (luz visible); los índices espectrales explotan todo el rango disponible.</p>
    <div class="spectrum-bar-wrap">
      <svg width="100%" height="60" viewBox="0 0 800 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="specGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#7B00FF"/>
            <stop offset="10%" style="stop-color:#4400FF"/>
            <stop offset="20%" style="stop-color:#0000FF"/>
            <stop offset="30%" style="stop-color:#0080FF"/>
            <stop offset="40%" style="stop-color:#00BFFF"/>
            <stop offset="50%" style="stop-color:#00FF80"/>
            <stop offset="60%" style="stop-color:#ADFF2F"/>
            <stop offset="70%" style="stop-color:#FFFF00"/>
            <stop offset="78%" style="stop-color:#FF8C00"/>
            <stop offset="85%" style="stop-color:#FF0000"/>
            <stop offset="92%" style="stop-color:#8B0000"/>
            <stop offset="100%" style="stop-color:#3d0000"/>
          </linearGradient>
        </defs>
        <rect x="0" y="8" width="800" height="44" rx="8" fill="url(#specGrad)"/>
        <!-- Bandas Sentinel-2 -->
        <rect x="192" y="4" width="4" height="52" fill="rgba(255,255,255,0.5)" rx="1"/>
        <text x="190" y="3" fill="white" font-size="9" text-anchor="middle" font-family="monospace">B02</text>
        <rect x="240" y="4" width="4" height="52" fill="rgba(255,255,255,0.5)" rx="1"/>
        <text x="238" y="3" fill="white" font-size="9" text-anchor="middle" font-family="monospace">B03</text>
        <rect x="296" y="4" width="4" height="52" fill="rgba(255,255,255,0.5)" rx="1"/>
        <text x="294" y="3" fill="white" font-size="9" text-anchor="middle" font-family="monospace">B04</text>
        <rect x="330" y="4" width="4" height="52" fill="rgba(255,255,255,0.6)" rx="1"/>
        <text x="328" y="3" fill="white" font-size="9" text-anchor="middle" font-family="monospace">B05</text>
        <rect x="400" y="4" width="5" height="52" fill="rgba(255,255,255,0.5)" rx="1"/>
        <text x="398" y="3" fill="white" font-size="9" text-anchor="middle" font-family="monospace">B08</text>
        <!-- Zona visible -->
        <rect x="192" y="52" width="310" height="6" fill="rgba(255,255,100,0.4)" rx="2"/>
        <text x="347" y="60" fill="rgba(255,255,255,0.7)" font-size="8" text-anchor="middle" font-family="monospace">← Visible →</text>
        <!-- NIR -->
        <rect x="380" y="52" width="100" height="6" fill="rgba(100,150,255,0.4)" rx="2"/>
        <text x="430" y="60" fill="rgba(255,255,255,0.7)" font-size="8" text-anchor="middle" font-family="monospace">NIR</text>
      </svg>
    </div>
    <div class="spec-label">
      <span>400nm</span><span>500nm</span><span>600nm</span><span>700nm</span><span>800nm</span><span>900nm+</span>
    </div>
    <div class="spec-zones" style="margin-top:18px">
      <div class="spec-zone" style="background:#f3e5f5;border:1.5px solid #ce93d8">
        <div class="sz-wave" style="color:#8e24aa">400–490nm</div>
        <div class="sz-name" style="color:#6a1b9a">Azul / UV</div>
        <div class="sz-desc" style="color:#6a1b9a">Carotenoides, corrección atmosférica (B02)</div>
      </div>
      <div class="spec-zone" style="background:#e8f5e9;border:1.5px solid #a5d6a7">
        <div class="sz-wave" style="color:#2e7d32">520–580nm</div>
        <div class="sz-name" style="color:#1b5e20">Verde</div>
        <div class="sz-desc" style="color:#1b5e20">Reflexión clorofila, NDWI, MNDWI (B03)</div>
      </div>
      <div class="spec-zone" style="background:#ffebee;border:1.5px solid #ef9a9a">
        <div class="sz-wave" style="color:#c62828">630–690nm</div>
        <div class="sz-name" style="color:#b71c1c">Rojo</div>
        <div class="sz-desc" style="color:#b71c1c">Absorción clorofila, NDVI, EVI, SAVI (B04)</div>
      </div>
      <div class="spec-zone" style="background:#fce4ec;border:1.5px solid #f48fb1">
        <div class="sz-wave" style="color:#880e4f">700–740nm</div>
        <div class="sz-name" style="color:#880e4f">Red Edge</div>
        <div class="sz-desc" style="color:#880e4f">Clorofila/Nitrógeno, NDRE exclusivo S2 (B05)</div>
      </div>
      <div class="spec-zone" style="background:#e3f2fd;border:1.5px solid #90caf9">
        <div class="sz-wave" style="color:#1565c0">750–900nm</div>
        <div class="sz-name" style="color:#0d47a1">NIR</div>
        <div class="sz-desc" style="color:#0d47a1">Estructura celular, todos los índices (B08)</div>
      </div>
      <div class="spec-zone" style="background:#e0f2f1;border:1.5px solid #80cbc4">
        <div class="sz-wave" style="color:#00695c">1400–2500nm</div>
        <div class="sz-name" style="color:#004d40">SWIR</div>
        <div class="sz-desc" style="color:#004d40">Agua en tejidos, NBR, MNDWI (B11,B12)</div>
      </div>
    </div>
  </div>

  <!-- RESPUESTA ESPECTRAL DE LA PLANTA -->
  <div class="bib-section-title"><span>🌱</span> Cómo Responde una Planta al Espectro de Luz</div>
  <div class="plant-card">
    <!-- SVG curva reflectancia -->
    <div style="background:var(--off-white);border-radius:10px;padding:16px;margin-bottom:18px">
      <p style="font-size:11px;color:#7a9e8a;margin-bottom:10px;font-weight:600">CURVA DE REFLECTANCIA ESPECTRAL — Planta Sana vs. Planta Estresada</p>
      <svg width="100%" height="160" viewBox="0 0 700 160" preserveAspectRatio="xMidYMid meet">
        <!-- Fondo y ejes -->
        <rect width="700" height="160" fill="#f7faf8" rx="8"/>
        <line x1="60" y1="10" x2="60" y2="140" stroke="#cce0d4" stroke-width="1.5"/>
        <line x1="60" y1="140" x2="690" y2="140" stroke="#cce0d4" stroke-width="1.5"/>
        <!-- Etiquetas eje Y -->
        <text x="55" y="145" fill="#7a9e8a" font-size="9" text-anchor="end">0%</text>
        <text x="55" y="110" fill="#7a9e8a" font-size="9" text-anchor="end">20%</text>
        <text x="55" y="75" fill="#7a9e8a" font-size="9" text-anchor="end">40%</text>
        <text x="55" y="40" fill="#7a9e8a" font-size="9" text-anchor="end">60%</text>
        <!-- Líneas guía -->
        <line x1="60" y1="110" x2="690" y2="110" stroke="#dde8e2" stroke-width="0.7" stroke-dasharray="4"/>
        <line x1="60" y1="75" x2="690" y2="75" stroke="#dde8e2" stroke-width="0.7" stroke-dasharray="4"/>
        <line x1="60" y1="40" x2="690" y2="40" stroke="#dde8e2" stroke-width="0.7" stroke-dasharray="4"/>
        <!-- Etiquetas eje X (longitudes de onda) -->
        <text x="100" y="155" fill="#7a9e8a" font-size="8" text-anchor="middle">400</text>
        <text x="190" y="155" fill="#7a9e8a" font-size="8" text-anchor="middle">490</text>
        <text x="270" y="155" fill="#7a9e8a" font-size="8" text-anchor="middle">560</text>
        <text x="340" y="155" fill="#7a9e8a" font-size="8" text-anchor="middle">665</text>
        <text x="390" y="155" fill="#7a9e8a" font-size="8" text-anchor="middle">705</text>
        <text x="460" y="155" fill="#7a9e8a" font-size="8" text-anchor="middle">842</text>
        <text x="580" y="155" fill="#7a9e8a" font-size="8" text-anchor="middle">1610</text>
        <text x="660" y="155" fill="#7a9e8a" font-size="8" text-anchor="middle">2190</text>
        <!-- Zonas de color de fondo -->
        <rect x="60" y="10" width="130" height="130" fill="rgba(123,0,255,0.04)"/>
        <rect x="190" y="10" width="150" height="130" fill="rgba(0,180,80,0.04)"/>
        <rect x="340" y="10" width="50" height="130" fill="rgba(232,90,58,0.06)"/>
        <rect x="390" y="10" width="50" height="130" fill="rgba(180,0,200,0.06)"/>
        <rect x="440" y="10" width="100" height="130" fill="rgba(30,100,255,0.06)"/>
        <rect x="540" y="10" width="150" height="130" fill="rgba(0,100,150,0.06)"/>
        <!-- Curva planta sana -->
        <polyline points="60,128 100,120 150,112 190,108 230,92 270,96 300,110 340,122 370,100 390,65 410,38 440,32 460,30 500,32 540,50 560,80 580,98 620,112 660,118 690,120"
          fill="none" stroke="#1a9850" stroke-width="2.5" stroke-linejoin="round"/>
        <!-- Curva planta estresada -->
        <polyline points="60,130 100,125 150,118 190,115 230,105 270,108 300,118 340,128 370,115 390,90 410,70 440,65 460,62 500,65 540,80 560,100 580,112 620,122 660,128 690,130"
          fill="none" stroke="#e85a3a" stroke-width="2" stroke-linejoin="round" stroke-dasharray="6,3"/>
        <!-- Leyenda -->
        <line x1="70" y1="22" x2="100" y2="22" stroke="#1a9850" stroke-width="2.5"/>
        <text x="105" y="26" fill="#1a9850" font-size="10" font-weight="bold">Planta sana</text>
        <line x1="200" y1="22" x2="230" y2="22" stroke="#e85a3a" stroke-width="2" stroke-dasharray="6,3"/>
        <text x="235" y="26" fill="#e85a3a" font-size="10" font-weight="bold">Planta estresada</text>
        <!-- Marcadores de bandas -->
        <line x1="340" y1="10" x2="340" y2="140" stroke="#e53935" stroke-width="1" stroke-dasharray="3"/>
        <text x="340" y="8" fill="#e53935" font-size="8" text-anchor="middle">B04</text>
        <line x1="390" y1="10" x2="390" y2="140" stroke="#8e24aa" stroke-width="1" stroke-dasharray="3"/>
        <text x="390" y="8" fill="#8e24aa" font-size="8" text-anchor="middle">B05</text>
        <line x1="460" y1="10" x2="460" y2="140" stroke="#1565c0" stroke-width="1" stroke-dasharray="3"/>
        <text x="460" y="8" fill="#1565c0" font-size="8" text-anchor="middle">B08</text>
      </svg>
      <p style="font-size:10px;color:#9ab8a8;margin-top:8px;text-align:center">Reflexión espectral normalizada. La planta sana muestra mayor diferencia NIR–Rojo (base del NDVI) y mayor reflexión NIR absoluta.</p>
    </div>
    <div class="plant-grid">
      ${PLANT_RESPONSES.map(pr=>`
      <div class="plant-response" style="background:${pr.bg};border-color:${pr.border}">
        <h4 style="color:${pr.color}">${pr.emoji} ${pr.title}</h4>
        <p style="color:${pr.color}">${pr.text}</p>
      </div>`).join('')}
    </div>
  </div>

  <!-- ÍNDICES CARDS -->
  <div class="bib-section-title"><span>📐</span> Índices Espectrales — Referencia Técnica Completa</div>
  ${INDICE_CARDS.map(idx=>`
  <div class="idx-card" style="border-left-color:${idx.color}">
    <div class="idx-card-header">
      <div class="idx-badge-big" style="background:${idx.bg}">
        <div class="ibn">${idx.key}</div>
        <div class="ibs">Índice</div>
      </div>
      <div style="flex:1">
        <h3>${idx.fullname}</h3>
        <div class="idx-subtitle">${idx.subtitle}</div>
        <div class="idx-bands-row">
          ${idx.bands.map(b=>`<span class="idx-band" style="background:${b.c}22;color:${b.c};border:1px solid ${b.c}44">${b.n} · ${b.t}</span>`).join('')}
        </div>
      </div>
    </div>
    <p class="idx-desc">${idx.desc}</p>
    <div class="idx-formula-box">
      <span class="lbl">FÓRMULA:</span>
      <span>${idx.formula}</span>
    </div>
    <div style="font-size:10px;color:#7a9e8a;margin-bottom:10px;font-family:'JetBrains Mono'">${idx.formulaDetalle}</div>
    <div class="idx-palette-strip" style="background:${idx.palette}"></div>
    <div class="idx-ranges">
      ${idx.ranges.map(r=>`
      <div class="idx-range" style="background:${r.bg};border-color:${r.color}33">
        <div class="ir-val" style="color:${r.color}">${r.val}</div>
        <div class="ir-desc" style="color:${r.color}">${r.desc}</div>
      </div>`).join('')}
    </div>
    <div class="idx-use">
      <strong style="color:var(--g500);font-size:11px">🎯 Usos agronómicos:</strong><br>${idx.usos}<br><br>
      <strong style="color:var(--g500);font-size:11px">📅 ¿Cuándo usarlo?</strong><br>${idx.cuando}<br><br>
      <strong style="color:var(--g500);font-size:11px">🛰️ Sensor:</strong> ${idx.sensor}
    </div>
  </div>`).join('')}

  <!-- TABLA COMPARATIVA -->
  <div class="bib-section-title"><span>📊</span> Tabla Comparativa de Índices</div>
  <div class="spectrum-card" style="overflow-x:auto">
    <table class="compare-table">
      <thead>
        <tr>
          <th>Índice</th><th>Qué mide</th><th>Bandas S2</th><th>Escala</th><th>Ideal para</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><span class="tag" style="background:#1a985020;color:#1a9850">NDVI</span></td><td>Vigor vegetativo general</td><td>B04 + B08</td><td>-1 a 1</td><td>Todo el ciclo del cultivo</td></tr>
        <tr><td><span class="tag" style="background:#0288d120;color:#0288d1">NDWI</span></td><td>Agua en tejidos foliares</td><td>B03 + B08</td><td>-1 a 1</td><td>Gestión del riego</td></tr>
        <tr><td><span class="tag" style="background:#2e7d3220;color:#2e7d32">EVI</span></td><td>Vigor corregido (atmósfera+suelo)</td><td>B02+B04+B08</td><td>-1 a 1</td><td>Alta biomasa, zonas con aerosoles</td></tr>
        <tr><td><span class="tag" style="background:#f57f1720;color:#f57f17">SAVI</span></td><td>Vigor con corrección de suelo</td><td>B04 + B08</td><td>-1 a 1</td><td>Estadíos tempranos</td></tr>
        <tr><td><span class="tag" style="background:#b71c1c20;color:#b71c1c">NBR</span></td><td>Daño severo / quemas</td><td>B08 + B12</td><td>-1 a 1</td><td>Post-helada, post-incendio</td></tr>
        <tr><td><span class="tag" style="background:#6a1b9a20;color:#6a1b9a">NDRE</span></td><td>Clorofila y Nitrógeno foliar</td><td>B05 + B08</td><td>0 a 0.6</td><td>Diagnóstico nutricional N</td></tr>
        <tr><td><span class="tag" style="background:#01579b20;color:#01579b">MNDWI</span></td><td>Agua superficial</td><td>B03 + B11</td><td>-1 a 1</td><td>Canales, lagunas, inundaciones</td></tr>
        <tr><td><span class="tag" style="background:#33691e20;color:#33691e">MSAVI</span></td><td>Vigor ajustado (L adaptativo)</td><td>B04 + B08</td><td>-1 a 1</td><td>Cobertura vegetal heterogénea</td></tr>
      </tbody>
    </table>
  </div>

  <!-- CRÉDITOS -->
  <div class="bib-credits">
    <div style="font-size:28px;margin-bottom:10px">🛰️</div>
    <h3>AgroVision · Agricultura Basada en Datos</h3>
    <p>Plataforma de monitoreo satelital agrícola con índices espectrales derivados de Sentinel-2<br>a través de la API de Copernicus Data Space · Agencia Espacial Europea (ESA)</p>
    <div class="author">Ing. Agr. Matías Meza Paredes</div>
    <p style="margin-top:6px;font-size:10px;color:var(--g300)">Exportadora Los Olmos · Departamento Técnico · Chile</p>
    <p style="margin-top:12px;font-size:10px;color:var(--g400)">Referencias: ESA Sentinel-2 User Guide · USGS Landsat Science · NASA EOS · Tucker (1979) · Huete et al. (2002)</p>
  </div>

</div>`;

  root.innerHTML = html;
}
