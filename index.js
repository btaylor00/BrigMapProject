let map;
const kmlLayers = {};
const imageOverlays = {};

function initMap() {
  console.log("Initializing map...");
  const brigantineNJ = { lat: 39.4106, lng: -74.3646 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: brigantineNJ,
    zoom: 14,
    mapTypeId: "satellite",
  });
  
  loadCSVAndCreateUI();
}

window.initMap = initMap;

async function loadCSVAndCreateUI() {
  const url = "https://raw.githubusercontent.com/btaylor00/BrigMapProject/refs/heads/main/data/Tree.csv";
  console.log("Fetching CSV data from:", url);
  const response = await fetch(url);
  const data = await response.text();
  console.log("CSV data loaded.");
  const rows = data.split("\n").slice(1);
  
  const treeData = {};
  
  rows.forEach(row => {
    console.log("Processing row:", row);
    const [id, type, url, name, parent, north, east, west, south] = row.split(",").map(item => item.trim());
    if (!id || !url || !name || !parent || !type) {
      console.warn("Skipping invalid row:", row);
      return;
    }
    
    if (!treeData[parent]) {
      treeData[parent] = [];
    }
    treeData[parent].push({ id, type, url, name, parent, north, east, west, south });
  });
  
  console.log("CSV parsed into hierarchical structure:", treeData);
  createCheckboxTree(treeData);
}

function createCheckboxTree(treeData) {
  console.log("Creating checkbox tree UI...");
  let container = document.getElementById("checkbox-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "checkbox-container";
    container.style.position = "absolute";
    container.style.top = "10px";
    container.style.left = "10px";
    container.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    container.style.padding = "10px";
    container.style.borderRadius = "5px";
    container.style.zIndex = "1000";
    document.body.appendChild(container);
  }
  container.innerHTML = "";
  
  Object.keys(treeData).forEach(parent => {
    console.log("Adding parent category:", parent);
    const parentDiv = document.createElement("div");
    parentDiv.innerHTML = `<strong>${parent}</strong>`;
    container.appendChild(parentDiv);
    
    treeData[parent].forEach(item => {
      console.log("Adding child item:", item.name);
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `chk-${item.id}`;
      checkbox.dataset.info = JSON.stringify(item);
      checkbox.onchange = toggleLayer;
      
      const label = document.createElement("label");
      label.htmlFor = `chk-${item.id}`;
      label.innerText = ` ${item.name}`;
      
      const div = document.createElement("div");
      div.appendChild(checkbox);
      div.appendChild(label);
      parentDiv.appendChild(div);
    });
  });
}

function toggleLayer(event) {
  const checkbox = event.target;
  const item = JSON.parse(checkbox.dataset.info);
  console.log("Toggling layer for:", item.name, "Type:", item.type);
  
  if (checkbox.checked) {
    if (item.type === "kml") {
      console.log("Adding KML layer:", item.url);
      const kmlLayer = new google.maps.KmlLayer({
        url: item.url,
        map: map,
        preserveViewport: true,
        screenOverlays: true,
        suppressInfoWindows: false,
      });
      kmlLayers[item.url] = kmlLayer;
    } else if (item.type === "Overlay") {
      console.log("Adding Image Overlay:", item.url);
      const imageBounds = {
        north: parseFloat(item.north),
        south: parseFloat(item.south),
        east: parseFloat(item.east),
        west: parseFloat(item.west),
      };
      console.log("Image bounds:", imageBounds);
      const overlay = new google.maps.GroundOverlay(item.url, imageBounds);
      overlay.setMap(map);
      imageOverlays[item.url] = overlay;
    }
  } else {
    if (kmlLayers[item.url]) {
      console.log("Removing KML layer:", item.url);
      kmlLayers[item.url].setMap(null);
      delete kmlLayers[item.url];
    }
    if (imageOverlays[item.url]) {
      console.log("Removing Image Overlay:", item.url);
      imageOverlays[item.url].setMap(null);
      delete imageOverlays[item.url];
    }
  }
}
