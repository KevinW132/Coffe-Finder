// Inicializar el Mapa Enfocado en Guatemala

const defaultLocation = [14.6349, -90.5069];
const map = L.map("map").setView(defaultLocation, 15);
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("togle-btn");

// Agregar los Titulos al mapa
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
}).addTo(map);

// Agregar markadores
let userMaker = null;
let coffeMaker = [];

//Obtener la distancia en kilometros entre dos coordenadas (Formula Haversine leer que pedo es)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // radio de la tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

//Usar Overpass API para obtener los cafes a la redonda
function FindCoffes(lat, lon) {
    coffeMaker.forEach((marker) => map.removeLayer(marker));
    coffeMaker = [];
    const coffeList = document.getElementById("coffeList");
    coffeList.innerHTML = "Buscando...";

    const radius = 2000;
    const overpassApiUrl = `https://overpass-api.de/api/interpreter?data=[out:json];
        node[amenity=cafe](around:${radius},${lat},${lon});
        out;`;

    fetch(overpassApiUrl)
        .then((res) => res.json())
        .then((data) => {
            if (data.elements.length == 0) {
                coffeList.innerHTML = "No se encontraron cafes cercanos.";
                return;
            }
            let listCoffes = "";

            data.elements.forEach((cafe) => {
                console.log(cafe); // ver datos del cafe
                if (cafe.lat && cafe.lon) {
                    const dist = getDistance(
                        lat,
                        lon,
                        cafe.lat,
                        cafe.lon
                    ).toFixed(2);
                    const nombre = cafe.tags.name || "Cafe sin Nombre";
                    const maker = L.marker([cafe.lat, cafe.lon])
                        .addTo(map)
                        .bindPopup(
                            `<b>${nombre}</b><br>A ${dist} km de distancia`
                        );
                    coffeMaker.push(maker);

                    listCoffes += `<div class="cafe-item" data-index="${
                        coffeMaker.length - 1
                    }"><strong>${nombre}</strong><br>A ${dist} km de distancia</div>`;
                }
            });
            coffeList.innerHTML = listCoffes;

            document.querySelectorAll(".cafe-item").forEach((item, index) => {
                item.addEventListener("click", (e) => {
                    const idx = e.currentTarget.getAtrribute("data-index");
                    const cafe = coffeMaker[idx];
                    map.setView([cafe.lat, cafe.lon], 18);
                    cafe.marker.openPopup();
                });
            });
        })
        .catch((err) => console.error("overpass API error:", err));
    coffeList.innerHTML = "Error loading cafes.";
}

// Obtener la ubicacion del usuario
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;

            // Se centra el mapa en la ubicacion del usuario
            map.setView([latitude, longitude], 15);

            // Se agrega un marcador al usuario
            userMaker = L.marker([latitude, longitude], {
                icon: L.icon({
                    iconUrl:
                        "https://cdn-icons-png.flaticon.com/512/64/64113.png",
                    iconSize: [32, 32],
                }),
            })
                .addTo(map)
                .bindPopup("Aqui estas");

            // Se buscan los cofes cercanos
            FindCoffes(latitude, longitude);
        },
        () => {
            alert("No se pudo obtener tu ubicación.");
            FindCoffes(defaultLocation[0], defaultLocation[1]);
        }
    );
}
map.on("click", function (e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    // Move map center
    map.setView([lat, lon], 15);

    // Add/Update red marker for search center
    if (userMaker) {
        map.removeLayer(userMaker);
    }
    userMaker = L.marker([lat, lon], {
        icon: L.icon({
            iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            iconSize: [32, 32],
        }),
    })
        .addTo(map)
        .bindPopup("Search center");

    // Search cafes again
    FindCoffes(lat, lon);
});

toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    toggleBtn.innerHTML = sidebar.classList.contains("collapsed")
        ? "⮞ Show"
        : "⮜ Hide";
    setTimeout(() => {
        map.invalidateSize();
    }, 310);
});
