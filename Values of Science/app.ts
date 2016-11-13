﻿// Leaflet.js
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
interface CityObject {
    name: string;
    population2010: number;
    population2015: number;
    // User actions
    magnitudeProtection: number;
}
class City implements CityObject {
    public name: string;
    public population2010: number;    
    public population2015: number;
    public magnitudeProtection: number;

    public magnitudeUpgradeProgress = 0;
    public magnitudeUpgradeTicks = 300;
    public magnitudeUpgradeAmount = 1.5;
    public earlyWarningProgress = 0;
    public earlyWarningTicks = 365 * 2; // 2 years

    get magnitudeUpgradeCost(): number {
        return this.magnitudeUpgradeCost = this.population2015 / 4 * 10000 * (5 / this.magnitudeProtection); // Home-brewed formula that pretends that every 4 people lives in a decent sized house together
    }
    get earlyWarningCost(): number {
        return this.population2015 * 1.3899; // http://pubs.usgs.gov/of/2014/1097/pdf/ofr2014-1097.pdf
    }

    constructor(cityProps: City) {
        this.name = cityProps.name;
        this.population2010 = cityProps.population2010;
        this.population2015 = cityProps.population2015;

        this.magnitudeProtection = 5; // https://earthquake.usgs.gov/learn/topics/mag_vs_int.php
    }
    upgradeMagnitudeProtection(): void {
        if (this.magnitudeUpgradeProgress > 0) {
            alertify.error(`${this.name} is being upgraded`);
            return;
        }
        alertify.confirm(
            "Are you sure?",
            `<b>${this.name}</b> will have its buildings upgraded to magnitude <b>${(this.magnitudeProtection + this.magnitudeUpgradeAmount).toFixed(1)}</b> at a cost of <b>$${this.magnitudeUpgradeCost.toLocaleString()}</b>. This will take <b>${this.magnitudeUpgradeTicks.toLocaleString()}</b> days to complete.`,
            (function () {
                if (cascadiaFunds - this.magnitudeUpgradeCost < 0) {
                    alertify.error("Insufficient funds");
                    return;
                }
                alertify.success(`Upgrading ${this.name}`);
                cascadiaFunds -= this.magnitudeUpgradeCost;
                this.magnitudeUpgradeProgress += 1;

                removeActions();
                currentlySelectedCityIndex = null;
                cascadiaInfo.update();
            }).bind(this),
            function () { }
        );
    }
    installEarlyWarning(): void {

    }
    update(): void {
        if (this.magnitudeUpgradeProgress > 0) {
            this.magnitudeUpgradeProgress++;
            if (this.magnitudeUpgradeProgress >= this.magnitudeUpgradeTicks) {
                this.magnitudeUpgradeProgress = 0;
                this.magnitudeProtection += this.magnitudeUpgradeAmount;
                alertify.success(`Finished upgrading ${this.name}`);
            }
        }
    }
}
interface Earthquake {
    mag: number; // 4.8,
    place: string; // "Off the coast of Oregon",
    time: number; // 1476040127540,
    updated: number; // 1476198964000,
    tz: number; // -540,
    url: string; // "http://earthquake.usgs.gov/earthquakes/eventpage/us20007cz9",
    detail: string; // "http://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us20007cz9&format=geojson",
    felt: number // 5,
    cdi: number; // 2.7,
    mmi: any; // null,
    alert: any; // null,
    status: string; // "reviewed",
    tsunami: number; // 0,
    sig: number; // 356,
    net: string; // "us",
    code: string; // "20007cz9",
    ids: string; // ",us20007cz9,",
    sources: string; // ",us,",
    types: string; // ",cap,dyfi,general-link,geoserve,moment-tensor,origin,phase-data,",
    nst: any; // null,
    dmin: number; // 3.868,
    rms: number; // 0.94,
    gap: number; // 166,
    magType: string; // "mb",
    type: string; // "earthquake",
    title: string; // "M 4.8 - Off the coast of Oregon"
}
interface Borough {
    population: number;
    name: string;
}
interface Station {
    name: string;
    // User actions
    hasTBM?: boolean;
    isBuilt?: boolean;
    hasSubsidenceMonitoring?: boolean;
    demand?: number;
    capacity?: number;
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

// Moved outside so that other scopes can deselect cities/stations
let currentlySelectedStationIndex: number = null;
let currentlySelectedCityIndex: number = null;
let londonInfo, cascadiaInfo;

let stations: Station[] = [];
let boroughs: Borough[] = [];
function londonInit() {
    // London initialization

    londonMap = L.map("london-map").setView(londonStart.coordinates, londonStart.zoom);
    londonMap.addEventListener("click", mapDeselect);
    L.tileLayer('https://api.mapbox.com/styles/v1/petschekr/civ4sq5nv000l2js73mhhhhhv/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicGV0c2NoZWtyIiwiYSI6ImNpdjRseXM3NTAwcmwydG4wZnd5cDMxMjQifQ.18bn19zBdqHqSArGaNrMwA', {
        attribution: `Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>`,
        maxZoom: 16,
        minZoom: 9
    }).addTo(londonMap);
    londonMap.attributionControl.setPosition("topright");

    // Control that shows info on hover
    londonInfo = L.control();
    londonInfo.onAdd = function (map) {
        this._div = L.DomUtil.create("div", "info");
        this.update();
        return this._div;
    };
    londonInfo.update = function (props: Station = null, clicked = false) {
        if (!clicked && currentlySelectedStationIndex) {
            return;
        }
        if (!props) {
            this._div.innerHTML =
            `
            <h4>London Crossrail</h4>
            <em>Hover over a proposed stop for more info</em>
            `;
        }
        else if (!clicked) {
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
    londonInfo.addTo(londonMap);

    function showDetails(e) {
        var layer = e.target;
        londonInfo.update(layer.feature.properties);
    }
    function hideDetails(e) {
        londonInfo.update();
    }
    function selected(e) {
        var layer = e.target;
        londonInfo.update(layer.feature.properties, true);
        currentlySelectedCityIndex = null;
        cascadiaInfo.update();
        currentlySelectedStationIndex = stations.indexOf(layer.feature.properties);
        displayActions(layer.feature.properties.name || "N/A", [{
            buttonText: "Button text",
            buttonEnabled: true,
            statusText: "Status text",
            callback: function (e) {
                console.log("Button clicked");
            }
        }]);
    }
    function mapDeselect(e) {
        // Only fired when clicking on a part of the map that isn't marked
        removeActions();
        currentlySelectedStationIndex = null;
        londonInfo.update();
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
        layer.addEventListener("click", mapDeselect);
        layer.bindPopup(`
            <b>${feature.properties.name}</b>
            <br />
            Population: ${feature.properties.population.toLocaleString()} (2013 est.)
        `);
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
        stations = stations.concat(json.features.map(function (feature) {
            return feature.properties;
        }));
    });
    $.getJSON("data/london-boroughs.json", function (json) {
        L.geoJSON(json, {
            style: style,
            onEachFeature: onEachBorough
        }).addTo(londonMap);
        boroughs = boroughs.concat(json.features.map(function (feature) {
            return feature.properties;
        }));
    });
}
let cities: City[] = [];
let earthquakes: Earthquake[] = [];
function cascadiaInit() {
    // Cascadia initialization

    cascadiaMap = L.map("cascadia-map").setView(cascadiaStart.coordinates, cascadiaStart.zoom);
    cascadiaMap.addEventListener("click", mapDeselect);
    L.tileLayer('https://api.mapbox.com/styles/v1/petschekr/civ4sq5nv000l2js73mhhhhhv/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicGV0c2NoZWtyIiwiYSI6ImNpdjRseXM3NTAwcmwydG4wZnd5cDMxMjQifQ.18bn19zBdqHqSArGaNrMwA', {
        attribution: `Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>`,
        maxZoom: 14,
        minZoom: 6
    }).addTo(cascadiaMap);
    cascadiaMap.attributionControl.setPosition("topright");

    // Control that shows info on hover
    cascadiaInfo = L.control();
    cascadiaInfo.onAdd = function (map) {
        this._div = L.DomUtil.create("div", "info");
        this.update();
        return this._div;
    };
    cascadiaInfo.update = function (props: City = null, clicked = false) {
        if (!clicked && currentlySelectedCityIndex) {
            return;
        }
        if (!props) {
            this._div.innerHTML = `
            <h4>FEMA Cascadia Rising</h4>
            <em>Hover over a city for more info</em>`;
        }
        else if (!clicked) {
            this._div.innerHTML = `
            <h4>FEMA Cascadia Rising</h4>
            <b>${props.name}</b>
            <br />
            Population: ${props.population2015.toLocaleString()} (2015 est.)
            <br />
            <em>Click to view actions</em>`;
        }
        else {
            this._div.innerHTML = `
            <h4>FEMA Cascadia Rising</h4>
            <b>${props.name}</b>
            <br />
            Population: ${props.population2015.toLocaleString()} (2015 est.)`;
        }
    };
    cascadiaInfo.addTo(cascadiaMap);

    function showDetails(e) {
        var layer = e.target;
        cascadiaInfo.update(layer.feature.properties);
    }
    function hideDetails(e) {
        cascadiaInfo.update();
    }
    function selected(e) {
        let layer = e.target;
        let city: CityObject = layer.feature.properties;
        cascadiaInfo.update(city, true);
        currentlySelectedStationIndex = null;
        londonInfo.update();
        for (let i = 0; i < cities.length; i++) {
            if (cities[i].name === city.name) {
                currentlySelectedCityIndex = i;
                break;
            }
        }
        let currentCity: City = cities[currentlySelectedCityIndex];

        displayActions(city.name || "N/A", [
            {
                buttonText: `Protect structures to ${(currentCity.magnitudeUpgradeAmount + currentCity.magnitudeProtection).toFixed(1)}`,
                buttonEnabled: currentCity.magnitudeUpgradeProgress === 0,
                statusText: currentCity.magnitudeUpgradeProgress === 0 ? `Current protection: ${currentCity.magnitudeProtection.toFixed(1)}` : `Upgrade ${(currentCity.magnitudeUpgradeProgress / currentCity.magnitudeUpgradeTicks * 100).toFixed(0)}% complete`,
                callback: function (e) {
                    let button: HTMLButtonElement = e.target as HTMLButtonElement;
                    let p: HTMLParagraphElement = this;
                    currentCity.upgradeMagnitudeProtection();
                }
            },
            {
                buttonText: "Install early warning",
                buttonEnabled: true,
                statusText: "Not installed",
                callback: function (e) {
                    console.log("Button clicked");
                }
            }
        ]);
    }
    function mapDeselect(e) {
        // Only fired when clicking on a part of the map that isn't marked
        removeActions();
        currentlySelectedCityIndex = null;
        cascadiaInfo.update();
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
        cities = cities.concat(json.features.map(function (feature) {
            return new City(feature.properties);
        }));
    });
    $.getJSON("data/oregon.json", function (json) {
        L.geoJSON(json, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: marker });
            },
            onEachFeature: onEachFeature
        }).addTo(cascadiaMap);
        cities = cities.concat(json.features.map(function (feature) {
            return new City(feature.properties);
        }));
    });
    $.getJSON("data/earthquakes.json", function (json) {
        /*L.geoJSON(json, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: earthquakeMarker });
            }
        }).addTo(cascadiaMap);*/
        earthquakes = earthquakes.concat(json.features.map(function (feature) {
            return feature.properties;
        }));
    });
}

interface Action {
    statusText: string;
    buttonText: string;
    buttonEnabled: boolean;
    callback: (event: MouseEvent) => void;
}
function removeActions(): void {
    document.getElementById("selection").textContent = "N/A";
    let toolbox = document.getElementById("toolbox");
    let previousActions = document.querySelectorAll("#toolbox > .action, .divider.auto");
    for (let i = 0; i < previousActions.length; i++) {
        toolbox.removeChild(previousActions[i]);
    }
}
function displayActions(selection: string, actions: Action[]): void {
    let toolbox = document.getElementById("toolbox");
    // Remove previous actions and dividers
    removeActions();
    // Insert new actions and dividers
    document.getElementById("selection").textContent = selection;
    let divider = document.createElement("span");
    divider.classList.add("divider");
    divider.classList.add("auto");
    for (let action of actions) {
        let actionDiv = document.createElement("div");
        actionDiv.classList.add("action");
        let button = document.createElement("button");
        button.classList.add("flat-button");
        button.textContent = action.buttonText;
        button.disabled = !action.buttonEnabled;
        let text = document.createElement("p");
        text.textContent = action.statusText;
        actionDiv.appendChild(button);
        actionDiv.appendChild(text);
        button.addEventListener("click", action.callback.bind(text));

        toolbox.appendChild(divider.cloneNode(false));
        toolbox.appendChild(actionDiv);
    }
}

let dialogs: Dialog[];
let dialogContent = document.createElement("div");
dialogContent.classList.add("dialog-content");

function dialogInit() {
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
            alertify.alert(dialog.title, dialogContent, function () {
                gameState = GameState.Running;
            }).set({ transition: "fade" });
        });
    });
    document.querySelector("#cover > button").addEventListener("click", function () {
        document.getElementById("cover").style.display = "none";
    });
}

let internalDate = moment();
enum GameState {
    Running, Paused
}
let gameState: GameState = GameState.Paused;
let cascadiaFunds: number = 5000000000;
let londonFunds: number = 15900000000;

window.onload = () => {
    dialogInit();
    londonInit();
    cascadiaInit();

    let dateElement = document.getElementById("date");
    let cascadiaFundsElement = document.querySelector("#cascadia .funds");
    let londonFundsElement = document.querySelector("#london .funds");
    let lastDateUpdate: number = Date.now();

    (function updateLoop() {
        // Update status
        dateElement.textContent = internalDate.format("MMMM Do, Y");
        cascadiaFundsElement.textContent = cascadiaFunds.toLocaleString();
        londonFundsElement.textContent = londonFunds.toLocaleString();

        if (gameState === GameState.Running) {
            if (Date.now() - lastDateUpdate > 500) {
                internalDate = internalDate.add(1, "days");
                lastDateUpdate = Date.now();
                for (let city of cities) {
                    city.update();
                }
            }
        }
        window.requestAnimationFrame(updateLoop);
    })();

    // Button and other event handlers
    /*let startButton = document.getElementById("start");
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
    };*/
};