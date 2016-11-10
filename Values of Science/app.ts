// Leaflet.js
declare var L: any;
// jQuery
declare var $: any;
// Moment.js
declare var moment: any;
// Alertify
declare var alertify: any;

interface GeoPos {
    coordinates: number[];
    zoom: number;
}
interface Dialog {
    trigger: string;
    title?: string;
    text: string;
    timing?: number;
}

let londonStart: GeoPos = {
    coordinates: [51.508571, -0.125868],
    zoom: 11
};
let cascadiaStart: GeoPos = {
    coordinates: [45.729191061299936, -121.66259765625001],
    zoom: 7
};

let londonMap, cascadiaMap;

function londonInit() {
    // London initialization
    londonMap = L.map("london-map").setView(londonStart.coordinates, londonStart.zoom);
    L.tileLayer('https://api.mapbox.com/styles/v1/petschekr/civ4sq5nv000l2js73mhhhhhv/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicGV0c2NoZWtyIiwiYSI6ImNpdjRseXM3NTAwcmwydG4wZnd5cDMxMjQifQ.18bn19zBdqHqSArGaNrMwA', {
        attribution: `Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>`,
        maxZoom: 16,
        minZoom: 9
    }).addTo(londonMap);
    londonMap.attributionControl.setPosition("topright");

    // Control that shows info on hover
    var info = L.control();
    info.onAdd = function (map) {
        this._div = L.DomUtil.create("div", "info");
        this.update();
        return this._div;
    };
    info.update = function (props = null, selected = false) {
        if (!props) {
            this._div.innerHTML =
            `
            <h4>London Crossrail</h4>
            <em>Hover over a proposed stop for more info</em>
            `;
        }
        else if (!selected) {
            this._div.innerHTML =
            `
            <h4>London Crossrail</h4>
            <b>${props.name}</b>
            <br />
            <em>Click to view actions</em>
            `;
        }
        else {
            this._div.innerHTML =
            `
            <h4>London Crossrail</h4>
            <b>${props.name}</b>
            `;
        }
    };
    info.addTo(londonMap);

    function showDetails(e) {
        var layer = e.target;
        info.update(layer.feature.properties);
    }
    function hideDetails(e) {
        info.update();
    }
    function selected(e) {
        var layer = e.target;
        info.update(layer.feature.properties, true);
    }
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: showDetails,
            mouseout: hideDetails,
            click: selected
        });
    }

    // Boroughs
    function getColor(d) {
		return  d > 360000 ? '#800026' :
				d > 325000 ? '#BD0026' :
				d > 293000 ? '#E31A1C' :
				d > 262000 ? '#FC4E2A' :
				d > 232000 ? '#FD8D3C' :
				d > 201000 ? '#FEB24C' :
				d > 170000 ? '#FED976' :
						     '#FFEDA0';
	}
	function style(feature) {
		return {
			weight: 2,
			opacity: 1,
			color: "white",
			fillOpacity: 0.5,
			fillColor: getColor(feature.properties.population)
		};
    }
    function onEachBorough(feature, layer) {
        layer.bindPopup(`<b>${feature.properties.name}</b><br />Population: ${feature.properties.population.toLocaleString()}`);
    }

    let subwayStop = L.icon({
        iconUrl: "data/stop.png",
        iconSize: [32, 32], // size of the icon
        iconAnchor: [16, 16], // point of the icon which will correspond to marker's location
        popupAnchor: [16, 32] // point from which the popup should open relative to the iconAnchor
    });
    $.getJSON("data/crossrail.json", function (json) {
        L.geoJSON(json, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: subwayStop });
            },
            onEachFeature: onEachFeature
        }).addTo(londonMap);
    });
    $.getJSON("data/london-boroughs.json", function (json) {
        L.geoJSON(json, {
            style: style,
            onEachFeature: onEachBorough
        }).addTo(londonMap);
    });
}
function cascadiaInit() {
    // Cascadia initialization
    cascadiaMap = L.map("cascadia-map").setView(cascadiaStart.coordinates, cascadiaStart.zoom);
    L.tileLayer('https://api.mapbox.com/styles/v1/petschekr/civ4sq5nv000l2js73mhhhhhv/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicGV0c2NoZWtyIiwiYSI6ImNpdjRseXM3NTAwcmwydG4wZnd5cDMxMjQifQ.18bn19zBdqHqSArGaNrMwA', {
        attribution: `Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>`,
        maxZoom: 14,
        minZoom: 6
    }).addTo(cascadiaMap);
    cascadiaMap.attributionControl.setPosition("topright");

    // Control that shows info on hover
    var info = L.control();
    info.onAdd = function (map) {
        this._div = L.DomUtil.create("div", "info");
        this.update();
        return this._div;
    };
    info.update = function (props = null, selected = false) {
        if (!props) {
            this._div.innerHTML =
            `
            <h4>FEMA Cascadia Rising</h4>
            <em>Hover over a city for more info</em>
            `;
        }
        else if (!selected) {
            this._div.innerHTML =
                `
            <h4>FEMA Cascadia Rising</h4>
            <b>${props.name}</b>
            <br />
            Population: ${props.population2015.toLocaleString()} (2015 est.)
            <br />
            <em>Click to view actions</em>
            `;
        }
        else {
            this._div.innerHTML =
            `
            <h4>FEMA Cascadia Rising</h4>
            <b>${props.name}</b>
            <br />
            Population: ${props.population2015.toLocaleString()} (2015 est.)
            `;
        }
    };
    info.addTo(cascadiaMap);

    function showDetails(e) {
        var layer = e.target;
        info.update(layer.feature.properties);
    }
    function hideDetails(e) {
        info.update();
    }
    function selected(e) {
        var layer = e.target;
        info.update(layer.feature.properties, true);
    }
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: showDetails,
            mouseout: hideDetails,
            click: selected
        });
    }

    let marker = L.icon({
        iconUrl: "data/marker.png",
        iconSize: [30, 70], // size of the icon
        iconAnchor: [15, 36], // point of the icon which will correspond to marker's location
        popupAnchor: [15, 15] // point from which the popup should open relative to the iconAnchor
    });
    let earthquakeMarker = L.icon({
        iconUrl: "data/marker_red.png",
        iconSize: [30, 70], // size of the icon
        iconAnchor: [15, 36], // point of the icon which will correspond to marker's location
        popupAnchor: [15, 15] // point from which the popup should open relative to the iconAnchor
    });
    $.getJSON("data/washington.json", function (json) {
        L.geoJSON(json, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: marker });
            },
            onEachFeature: onEachFeature
        }).addTo(cascadiaMap);
    });
    $.getJSON("data/oregon.json", function (json) {
        L.geoJSON(json, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: marker });
            },
            onEachFeature: onEachFeature
        }).addTo(cascadiaMap);
    });
    $.getJSON("data/earthquakes.json", function (json) {
        L.geoJSON(json, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: earthquakeMarker });
            }
        }).addTo(cascadiaMap);
    });
}

let internalDate = moment();
enum GameState {
    Running, Paused
}
let gameState: GameState = GameState.Paused;
let dialogs: Dialog[];
let dialogContent = document.createElement("div");
dialogContent.classList.add("dialog-content");

window.onload = () => {
    $.getJSON("data/dialogs.json", function (json) {
        dialogs = json.dialogs;

        // Intro full screen dialogs before the game begins
        let introDialogs = dialogs.filter(function (dialog) {
            return dialog.trigger === "intro";
        });
        const transitionDelay = 500; // milliseconds as defined in the CSS
        const inBetweenDelayMult = 3;
        // Queue up the transitions
        let currentDelay: number = 0;
        let coverText = document.getElementById("cover-text");
        let cover = document.getElementById("cover");
        for (let dialog of introDialogs) {
            setTimeout(function () {
                coverText.style.opacity = "0";
                setTimeout(function () {
                    coverText.textContent = dialog.text;
                    coverText.style.opacity = "1";
                    if (dialog.text === introDialogs[introDialogs.length - 1].text) {
                        // Last element
                        setTimeout(function () {
                            cover.style.opacity = "0";
                            setTimeout(function () {
                                cover.style.display = "none";
                            }, 1000);
                        }, dialog.timing);
                    }
                }, transitionDelay * inBetweenDelayMult);
            }, currentDelay);
            currentDelay += (1 + inBetweenDelayMult) * transitionDelay + dialog.timing;
        }
        // Gameplay dialogs
        dialogs.filter(function (dialog) {
            return dialog.trigger === "start";
        }).forEach(function (dialog) {
            for (let paragraph of dialog.text.split("\n")) {
                let paragraphElement = document.createElement("p");
                paragraphElement.textContent = paragraph;
                dialogContent.appendChild(paragraphElement);
            }
            alertify.alert(dialog.title, dialogContent).set({ transition: "fade" });
        });
    });
    document.querySelector("#cover > button").addEventListener("click", function () {
        document.getElementById("cover").style.display = "none";
    });

    londonInit();
    cascadiaInit();
    let dateElement = document.getElementById("date");
    setInterval(function () {
        dateElement.textContent = internalDate.format("MMMM Do, Y");
        if (gameState === GameState.Running) {
            internalDate = internalDate.add(1, "days");
        }
    }, 500);
    let startButton = document.getElementById("start");
    startButton.onclick = function () {
        if (gameState === GameState.Running) {
            gameState = GameState.Paused;
            startButton.textContent = "Start";
        }
        else if (gameState === GameState.Paused) {
            gameState = GameState.Running;
            startButton.textContent = "Pause";
        }
    };
    let resetButton = document.getElementById("reset");
    resetButton.onclick = function () {
        gameState = GameState.Paused;
        startButton.textContent = "Start";
        internalDate = moment();
        dateElement.textContent = internalDate.format("MMMM Do, Y");
    };
};