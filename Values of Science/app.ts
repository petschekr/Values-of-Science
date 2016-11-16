// Leaflet.js
declare var L: any;
// Point-in-polygon
declare var leafletPip: any;
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
    lat: number;
    long: number;
    // User actions
    magnitudeProtection: number;
}
class City implements CityObject {
    public name: string;
    public population2010: number;    
    public population2015: number;
    public lat: number;
    public long: number;
    public magnitudeProtection: number;
    public earlyWarningInstalled: boolean;

    public magnitudeUpgradeProgress = 0;
    public magnitudeUpgradeTicks = 300;
    public magnitudeUpgradeAmount = 1.5;
    public earlyWarningProgress = 0;
    public earlyWarningTicks = 0; // Set depending on population in constructor

    get magnitudeUpgradeCost(): number {
        return Math.round(this.population2015 / 4 * 10000 * (5 / this.magnitudeProtection)); // Home-brewed formula that pretends that every 4 people lives in a decent sized house together
    }
    get earlyWarningCost(): number {
        return Math.round(this.population2015 * 1.3899 * 1000); // http://pubs.usgs.gov/of/2014/1097/pdf/ofr2014-1097.pdf
    }

    constructor(cityProps: City) {
        this.name = cityProps.name;
        this.population2010 = cityProps.population2010;
        this.population2015 = cityProps.population2015;
        this.lat = cityProps.lat;
        this.long = cityProps.long;

        this.magnitudeProtection = 5; // https://earthquake.usgs.gov/learn/topics/mag_vs_int.php
        this.earlyWarningInstalled = false;
        this.earlyWarningTicks = Math.round(365 + 365 * this.population2015 / 334171); // Max 3 years for largest city (Seattle) with min of 1 year for 0 population
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
        if (this.earlyWarningProgress > 0) {
            alertify.error(`${this.name} is installing an EWS`);
            return;
        }
        alertify.confirm(
            "Are you sure?",
            `An earthquake early warning system will be installed in <b>${this.name}</b> at a cost of <b>$${this.earlyWarningCost.toLocaleString()}</b>. This will take <b>${this.earlyWarningTicks.toLocaleString()}</b> days to complete.`,
            (function () {
                if (cascadiaFunds - this.earlyWarningCost < 0) {
                    alertify.error("Insufficient funds");
                    return;
                }
                alertify.success(`Installing EWS in ${this.name}`);
                cascadiaFunds -= this.earlyWarningCost;
                this.earlyWarningProgress += 1;

                removeActions();
                currentlySelectedCityIndex = null;
                cascadiaInfo.update();
            }).bind(this),
            function () { }
        );
    }
    update(): void {
        if (this.magnitudeUpgradeProgress > 0) {
            this.magnitudeUpgradeProgress++;
            if (this.magnitudeUpgradeProgress >= this.magnitudeUpgradeTicks) {
                this.magnitudeUpgradeProgress = 0;
                this.magnitudeProtection += this.magnitudeUpgradeAmount;
                alertify.success(`Finished upgrading ${this.name}`);

                removeActions();
                currentlySelectedCityIndex = null;
                cascadiaInfo.update();
            }
        }
        if (this.earlyWarningProgress > 0) {
            this.earlyWarningProgress++;
            if (this.earlyWarningProgress >= this.earlyWarningTicks) {
                this.earlyWarningProgress = 0;
                this.earlyWarningInstalled = true;
                alertify.success(`Finished installing EWS in ${this.name}`);

                removeActions();
                currentlySelectedCityIndex = null;
                cascadiaInfo.update();
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
    lat: number;
    long: number;
}
interface Borough {
    population: number;
    name: string;
}
interface StationObject {
    name: string;
    adjacent: string[];
    lat: number;
    long: number;
    // User actions
    hasTBM: boolean;
    isBuilt: boolean;
    hasSubsidenceMonitoring: boolean;
    demand: number;
    capacity: number;
}
class Station implements StationObject {
    public name: string;
    public adjacent: string[];
    public lat: number;
    public long: number;

    public isBuilt: boolean = false;
    public hasTBM: boolean = false;
    public hasSubsidenceMonitoring: boolean = false;
    public capacity: number = 0;

    public tbmDropProgress = 0;
    public tbmDropTicks = 90; // 3 months
    public tunnelProgress = 0;
    public tunnelTicks = 0;
    public tunnelAdjacent: Station[] = [];
    public subsidenceMonitoringProgress = 0;
    public subsidenceMonitoringTicks = 30;

    private initialCapacity: number = 20000000; // 20 million per year seems to be about the average
    private londonCenterDistance: number;

    get demand(): number {
        // Scale demand based on distance from central London
        // 1 million per year extra demand per year
        let daysElapsed: number = internalDate.diff(moment(), "days");
        return Math.round(20000000 / (Math.log(this.londonCenterDistance / 12.7) / Math.LN10) + 1000000 * (daysElapsed / 365));
    }
    get tbmDropCost(): number {
        return 350000000;
    }
    get tunnelCost(): number {
        // Crossrail has about 73 miles of track
        // 250 million per mile means that most but not all of the system can be built
        const costPerMile = 250000000;
        let cost: number = 0;
        for (let nearbyStationName of this.adjacent) {
            for (let station of stations) {
                if (station.name !== nearbyStationName || (!station.isBuilt && !station.hasTBM))
                    continue;
                cost += Math.round(londonMap.distance([this.lat, this.long], [station.lat, station.long]) * 0.000621371192 * costPerMile);
            }
        }
        return cost;
    }
    get subsidenceMonitoringCost(): number {
        return Math.round(this.demand * 5);
    }

    constructor(stationProps: StationObject) {
        this.name = stationProps.name;
        this.adjacent = stationProps.adjacent;
        this.lat = stationProps.lat;
        this.long = stationProps.long;

        let londonCenter = [51.517741, -0.082521];
        this.londonCenterDistance = londonMap.distance([this.lat, this.long], londonCenter); // in meters
    }
    dropTBM(): void {
        if (this.tbmDropProgress > 0) {
            alertify.error(`A TBM is already deploying at ${this.name}`);
            return;
        }
        alertify.confirm(
            "Are you sure?",
            `A tunnel boring machine (TBM) will be deployed at <b>${this.name}</b> to allow tunnel construction to adjacent stations. This will cost <b>£${this.tbmDropCost.toLocaleString()}</b> and take <b>${this.tbmDropTicks.toLocaleString()}</b> days to complete.`,
            (function () {
                if (londonFunds - this.tbmDropCost < 0) {
                    alertify.error("Insufficient funds");
                    return;
                }
                alertify.success(`Deploying TBM at ${this.name}`);
                londonFunds -= this.tbmDropCost;
                this.tbmDropProgress += 1;

                removeActions();
                currentlySelectedStationIndex = null;
                londonInfo.update();
            }).bind(this),
            function () { }
        );
    }
    tunnelTo(): void {
        if (this.tunnelProgress > 0) {
            alertify.error(`Tunneling is currently underway at ${this.name}`);
            return;
        }
        this.tunnelTicks = 0;
        let otherStations: string[] = [];
        for (let nearbyStationName of this.adjacent) {
            for (let station of stations) {
                if (station.name !== nearbyStationName || (!station.isBuilt && !station.hasTBM))
                    continue;
                otherStations.push(station.name);
                this.tunnelAdjacent.push(station);
                // 125 feet per day
                this.tunnelTicks += Math.round((londonMap.distance([this.lat, this.long], [station.lat, station.long]) * 0.000621371192) / (125 / 5280));
            }
        }
        if (otherStations.length === 0) {
            alertify.error(`No open stations nearby ${this.name}`);
            return;
        }
        alertify.confirm(
            "Are you sure?",
            `Tunnels will be constructed to <b>${this.name}</b> from ${otherStations.join(", ")}. This will cost <b>£${this.tunnelCost.toLocaleString()}</b> and take <b>${this.tunnelTicks.toLocaleString()}</b> days to complete.`,
            (function () {
                if (londonFunds - this.tunnelCost < 0) {
                    alertify.error("Insufficient funds");
                    return;
                }
                alertify.success(`Constructing tunnels to ${this.name}`);
                londonFunds -= this.tunnelCost;
                this.tunnelProgress += 1;

                removeActions();
                currentlySelectedStationIndex = null;
                londonInfo.update();
            }).bind(this),
            function () { }
        );
    }
    installSubsidence(): void {
        if (this.subsidenceMonitoringProgress > 0) {
            alertify.error(`Subsidence monitoring is already being installed at ${this.name}`);
            return;
        }
        alertify.confirm(
            "Are you sure?",
            `Subsidence monitoring equipment will be installed at <b>${this.name}</b> to detect and prevent damage to surrounding buildings and infrastructure as construction occurs. This will cost <b>£${this.subsidenceMonitoringCost.toLocaleString()}</b> and take <b>${this.subsidenceMonitoringTicks.toLocaleString()}</b> days to complete.`,
            (function () {
                if (londonFunds - this.tbmDropCost < 0) {
                    alertify.error("Insufficient funds");
                    return;
                }
                alertify.success(`Installing subsidence monitoring at ${this.name}`);
                londonFunds -= this.subsidenceMonitoringCost;
                this.subsidenceMonitoringProgress += 1;

                removeActions();
                currentlySelectedStationIndex = null;
                londonInfo.update();
            }).bind(this),
            function () { }
        );
    }
    update(): void {
        if (this.tbmDropProgress > 0) {
            this.tbmDropProgress++;
            if (this.tbmDropProgress >= this.tbmDropTicks) {
                this.tbmDropProgress = 0;
                this.hasTBM = true;
                alertify.success(`Finished deploying TBM at ${this.name}`);

                removeActions();
                currentlySelectedStationIndex = null;
                londonInfo.update();
            }
        }
        if (this.subsidenceMonitoringProgress > 0) {
            this.subsidenceMonitoringProgress++;
            if (this.subsidenceMonitoringProgress >= this.subsidenceMonitoringTicks) {
                this.subsidenceMonitoringProgress = 0;
                this.hasSubsidenceMonitoring = true;
                alertify.success(`Finished installing subsidence monitoring at ${this.name}`);

                removeActions();
                currentlySelectedStationIndex = null;
                londonInfo.update();
            }
        }
        if (this.tunnelProgress > 0) {
            this.tunnelProgress++;
            // Assess possible damage costs
            if (!this.hasSubsidenceMonitoring && Math.random() < 1 / 150) {
                let penalty = Math.round(Math.random() * 400000000 + 100000000);
                londonFunds -= penalty;
                if (londonFunds < 0)
                    londonFunds = 0;
                alertify.error(`Subsidence occurred at ${this.name}. Penalty of £${penalty.toLocaleString()} assessed.`);
            }

            if (this.tunnelProgress >= this.tunnelTicks) {
                this.tunnelProgress = 0;
                let coords: any[] = this.tunnelAdjacent.map(function (station) {
                    return [station.lat, station.long];
                });
                this.tunnelAdjacent.push(this);
                for (let station of this.tunnelAdjacent) {
                    station.isBuilt = true;
                    station.capacity = station.initialCapacity;
                    coords.push([station.lat, station.long]);
                    for (let markerInfo of markerLayers) {
                        if (markerInfo.name === station.name) {
                            markerInfo.marker.setOpacity(1);
                            break;
                        }
                    }
                }
                this.tunnelAdjacent = [];
                // Add line connecting these stations to the map
                for (let coord of coords) {
                    L.polyline([coord, [this.lat, this.long]], { color: "white", weight: 8 }).addTo(londonMap);
                }

                removeActions();
                currentlySelectedStationIndex = null;
                londonInfo.update();
            }
        }
    }
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
let markerLayers: any[] = [];
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
            this._div.innerHTML = `
            <h4>London Crossrail</h4>
            <em>Hover over a station for more info</em>`;
        }
        else if (!clicked) {
            this._div.innerHTML = `
            <h4>London Crossrail</h4>
            <b>${props.name}</b>${!props.isBuilt ? " - Proposed" : ""}
            <br />
            Capacity: ${props.capacity.toLocaleString()} / yr | Demand: ${props.demand.toLocaleString()} / yr
            <br />
            <em>Click to view actions</em>`;
        }
        else {
            this._div.innerHTML = `
            <h4>London Crossrail</h4>
            <b>${props.name}</b>${!props.isBuilt ? " - Proposed" : ""}
            <br />
            Capacity: ${props.capacity.toLocaleString()} / yr | Demand: ${props.demand.toLocaleString()} / yr`;
        }
    };
    londonInfo.addTo(londonMap);

    function showDetails(e) {
        var layer = e.target;
        let station: Station;
        for (let temp of stations) {
            if (temp.name === layer.feature.properties.name) {
                station = temp;
                break;
            }
        }
        londonInfo.update(station);
    }
    function hideDetails(e) {
        londonInfo.update();
    }
    function selected(e) {
        let layer = e.target;
        let station: StationObject = layer.feature.properties;
        for (let i = 0; i < stations.length; i++) {
            if (stations[i].name === station.name) {
                currentlySelectedStationIndex = i;
                break;
            }
        }
        let currentStation: Station = stations[currentlySelectedStationIndex];
        londonInfo.update(currentStation, true);
        currentlySelectedCityIndex = null;
        cascadiaInfo.update();

        let tbmStatus: string;
        if (currentStation.tbmDropProgress === 0) {
            if (currentStation.isBuilt) {
                tbmStatus = "Station already built";
            }
            else if (currentStation.tunnelProgress > 0) {
                tbmStatus = "Tunneling underway";
            }
            else if (!currentStation.hasTBM) {
                tbmStatus = "Required to start tunneling";
            }
            else {
                tbmStatus = "TBM deployed here";
            }
        }
        else {
            tbmStatus = `${(currentStation.tbmDropProgress / currentStation.tbmDropTicks * 100).toFixed(0)}% complete`;
        }
        let tunnelEnabled: boolean;
        let tunnelStatus: string;
        if (currentStation.isBuilt) {
            tunnelEnabled = false;
            tunnelStatus = "Station already built";
        }
        else {
            if (currentStation.tunnelProgress === 0) {
                if (currentStation.tunnelCost === 0) {
                    tunnelEnabled = false;
                    tunnelStatus = "Adjacent station not yet built";
                }
                else {
                    tunnelEnabled = true;
                    tunnelStatus = "Opens new station";
                }
            }
            else {
                tunnelEnabled = false;
                tunnelStatus = `${(currentStation.tunnelProgress / currentStation.tunnelTicks * 100).toFixed(0)}% complete`;
            }
        }
        let subsidenceEnabled: boolean;
        let subsidenceStatus: string;
        if (currentStation.hasSubsidenceMonitoring) {
            subsidenceEnabled = false;
            subsidenceStatus = "Already installed";
        }
        else if (currentStation.subsidenceMonitoringProgress > 0) {
            subsidenceEnabled = false;
            subsidenceStatus = `${(currentStation.subsidenceMonitoringProgress / currentStation.subsidenceMonitoringTicks * 100).toFixed(0)}% complete`;
        }
        else {
            if (currentStation.isBuilt) {
                subsidenceEnabled = false;
                subsidenceStatus = "Station already built";
            }
            else {
                subsidenceEnabled = true;
                subsidenceStatus = "Prevents damage to surroundings";
            }
        }
        displayActions(station.name || "N/A", [
            {
                buttonText: "Deploy TBM here",
                buttonEnabled: !currentStation.hasTBM && currentStation.tbmDropProgress === 0 && !currentStation.isBuilt && currentStation.tunnelProgress === 0,
                statusText: tbmStatus,
                callback: function (e) {
                    currentStation.dropTBM();
                }
            },
            {
                buttonText: "Tunnel to here",
                buttonEnabled: tunnelEnabled,
                statusText: tunnelStatus,
                callback: function (e) {
                    currentStation.tunnelTo();
                }
            },
            {
                buttonText: "Install subsidence warning",
                buttonEnabled: subsidenceEnabled,
                statusText: subsidenceStatus,
                callback: function (e) {
                    currentStation.installSubsidence();
                }
            }/*,
            {
                buttonText: "Increase capacity",
                buttonEnabled: false,
                statusText: "Station must be built first",
                callback: function (e) {
                    //currentStation.increaseCapacity();
                }
            }*/
        ]);
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
    let boroughLayers: any[] = [];
    function onEachBorough(feature, layer) {
        layer.addEventListener("click", mapDeselect);
        layer.bindPopup(`
            <b>${feature.properties.name}</b>
            <br />
            Population: ${feature.properties.population.toLocaleString()} (2013 est.)
        `);
        boroughLayers.push(layer);
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
                let marker = L.marker(latlng, { icon: subwayStop, opacity: 0.5 });
                markerLayers.push({ "name": feature.properties.name, "marker": marker });
                return marker;
            },
            onEachFeature: onEachFeature
        }).addTo(londonMap);
        stations = stations.concat(json.features.map(function (feature) {
            feature.properties.lat = feature.geometry.coordinates[1];
            feature.properties.long = feature.geometry.coordinates[0];
            return new Station(feature.properties);
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
            <b>${props.name}</b> - ${props.magnitudeProtection.toFixed(1)} protected
            <br />
            Population: ${props.population2015.toLocaleString()} (2015 est.)
            <br />
            EWS installed: ${props.earlyWarningInstalled ? "Yes" : "No"}
            <br />
            <em>Click to view actions</em>`;
        }
        else {
            this._div.innerHTML = `
            <h4>FEMA Cascadia Rising</h4>
            <b>${props.name}</b> - ${props.magnitudeProtection.toFixed(1)} protected
            <br />
            Population: ${props.population2015.toLocaleString()} (2015 est.)
            <br />
            EWS installed: ${props.earlyWarningInstalled ? "Yes" : "No"}`;
        }
    };
    cascadiaInfo.addTo(cascadiaMap);

    function showDetails(e) {
        var layer = e.target;
        let city: City;
        for (let temp of cities) {
            if (temp.name === layer.feature.properties.name) {
                city = temp;
                break;
            }
        }
        cascadiaInfo.update(city);
    }
    function hideDetails(e) {
        cascadiaInfo.update();
    }
    function selected(e) {
        let layer = e.target;
        let city: CityObject = layer.feature.properties;
        for (let i = 0; i < cities.length; i++) {
            if (cities[i].name === city.name) {
                currentlySelectedCityIndex = i;
                break;
            }
        }
        let currentCity: City = cities[currentlySelectedCityIndex];
        cascadiaInfo.update(currentCity, true);
        currentlySelectedStationIndex = null;
        londonInfo.update();

        displayActions(city.name || "N/A", [
            {
                buttonText: `Protect structures to ${(currentCity.magnitudeUpgradeAmount + currentCity.magnitudeProtection).toFixed(1)}`,
                buttonEnabled: currentCity.magnitudeUpgradeProgress === 0,
                statusText: currentCity.magnitudeUpgradeProgress === 0 ? `Current protection: ${currentCity.magnitudeProtection.toFixed(1)}` : `Upgrade ${(currentCity.magnitudeUpgradeProgress / currentCity.magnitudeUpgradeTicks * 100).toFixed(0)}% complete`,
                callback: function (e) {
                    currentCity.upgradeMagnitudeProtection();
                }
            },
            {
                buttonText: "Install early warning",
                buttonEnabled: currentCity.earlyWarningProgress === 0 && !currentCity.earlyWarningInstalled,
                statusText: currentCity.earlyWarningProgress === 0 ? (currentCity.earlyWarningInstalled ? "EWS installed" : "Not installed") : `EWS install ${(currentCity.earlyWarningProgress / currentCity.earlyWarningTicks * 100).toFixed(0)}% complete`,
                callback: function (e) {
                    currentCity.installEarlyWarning();
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
    $.getJSON("data/washington.json", function (json) {
        L.geoJSON(json, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, { icon: marker });
            },
            onEachFeature: onEachFeature
        }).addTo(cascadiaMap);
        cities = cities.concat(json.features.map(function (feature) {
            feature.properties.lat = feature.geometry.coordinates[1];
            feature.properties.long = feature.geometry.coordinates[0];
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
            feature.properties.lat = feature.geometry.coordinates[1];
            feature.properties.long = feature.geometry.coordinates[0];
            return new City(feature.properties);
        }));
    });
    $.getJSON("data/earthquakes.json", function (json) {
        earthquakes = earthquakes.concat(json.features.map(function (feature) {
            feature.properties.lat  = feature.geometry.coordinates[1];
            feature.properties.long = feature.geometry.coordinates[0];
            return feature.properties;
        }));
    });
}
let earthquakeShakeNumber: number = 0;
const earthquakeShakeDelta: number = 50;
let lastShake: number = 0;
function triggerEarthquake() {
    gameState = GameState.Paused;
    if (Date.now() - lastShake > earthquakeShakeDelta) {
        cascadiaMap.panBy(L.point((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20));
        earthquakeShakeNumber++;
        lastShake = Date.now();
    }
    if (earthquakeShakeNumber < 50) {
        window.requestAnimationFrame(triggerEarthquake);
    }
    else {
        // After shaking stops
        const maxDeathRate = 13000 / 4629511;
        const maxInjuryRate = 27000 / 4629511;
        const maxDisplacementRate = 1000000 / 4629511;
        earthquakes = earthquakes.sort(function () { return 0.5 - Math.random() });
        let earthquake = earthquakes[0];
        earthquake.mag = Math.pow(Math.random(), 1 / 2) * 3.5 + 5.8;
        // Plot on map
        let earthquakeMarker = L.icon({
            iconUrl: "data/marker_red.png",
            iconSize: [30, 70], // size of the icon
            iconAnchor: [15, 36], // point of the icon which will correspond to marker's location
            popupAnchor: [15, 15] // point from which the popup should open relative to the iconAnchor
        });
        let earthquakeCoords = [earthquake.lat, earthquake.long];
        L.marker(earthquakeCoords, { icon: earthquakeMarker }).addTo(cascadiaMap);
        cascadiaMap.flyTo(earthquakeCoords, 6);

        let totalPopulation = 0; // 4629511
        let deathToll = 0;
        let displaced = 0;
        let injured = 0;
        for (let city of cities) {
            let distance = cascadiaMap.distance(earthquakeCoords, [city.lat, city.long]); // in meters
            totalPopulation += city.population2015;
            // Only loosely based on reality I think
            deathToll += maxDeathRate * (700000 / distance) * city.population2015 * Math.pow(10, earthquake.mag) / Math.pow(10, 6) * 2 / 1000;
            injured += maxInjuryRate * (700000 / distance) * city.population2015 * Math.pow(10, earthquake.mag) / Math.pow(10, 6) * 2 / 1000;
            displaced += maxDisplacementRate * (700000 / distance) * city.population2015 * Math.pow(10, earthquake.mag) / Math.pow(10, 6) * 2 / 1000;
            // I may or may not have totally made up these constants
            if (city.earlyWarningInstalled) {
                deathToll *= 5 / 6;
                displaced *= 1;
                injured *= 1 / 3;
            }
            if (city.magnitudeProtection >= earthquake.mag) {
                deathToll *= 1 / 4;
                displaced *= 2 / 3
                injured *= 1 / 3;
            }
        }
        deathToll = Math.round(deathToll);
        displaced = Math.round(displaced);
        injured = Math.round(injured);
        let pagerLevel: string;
        let pagerLevelExplanation: string;
        if (deathToll >= 1000) {
            pagerLevel = "RED";
            pagerLevelExplanation = "1,000+";
        }
        else if (deathToll >= 100) {
            pagerLevel = "ORANGE";
            pagerLevelExplanation = "100 – 999";
        }
        else if (deathToll >= 1) {
            pagerLevel = "YELLOW";
            pagerLevelExplanation = "1 – 99";
        }
        else {
            pagerLevel = "GREEN";
            pagerLevelExplanation = "0";
        }

        let dialogContent = document.createElement("div");
        let dialog = dialogs.filter(function (dialog) {
            return dialog.trigger === "earthquake";
        })[0];
        let paragraphElement = document.createElement("p");
        paragraphElement.innerHTML = `
            At ${moment().subtract(3, "hours").format("h:mm A")} PST on ${internalDate.format("MMMM Do, Y")}, a magnitude <b>${earthquake.mag.toFixed(1)}</b> earthquake struck the Cascadia region (population ${totalPopulation.toLocaleString()}) ${earthquake.place}. Extensive damage and heavy loss of life has been reported. Preliminary USGS data estimates <b>${deathToll.toLocaleString()}</b> fatalities, <b>${injured.toLocaleString()}</b> injured, and <b>${displaced.toLocaleString()}</b> displaced, making this a PAGER level ${pagerLevel} (${pagerLevelExplanation} fatalities) event. Several aftershocks are expected to occur for the next several hours. ${earthquake.long < -124.079512 ? "A tsunami warning is currently in effect for the Washington and Oregon coastal region. If you are currently in the affected area, please seek higher ground immediately." : "No tsunami warning is currently in effect."}
        `;
        dialogContent.classList.add("dialog-content");
        dialogContent.appendChild(paragraphElement);
        dialogContent.appendChild(document.createElement("hr"));
        for (let paragraph of dialog.text.split("\n")) {
            paragraphElement = document.createElement("p");
            paragraphElement.textContent = paragraph;
            dialogContent.classList.add("dialog-content");
            dialogContent.appendChild(paragraphElement);
        }
        alertify.alert(dialog.title, dialogContent, function () {
            // Allow the user to show the results again?
            gameState = GameState.Running;
        }).set({ transition: "fade" });
    }
}
function triggerCrossrailDialog() {
    gameState = GameState.Paused;
    let dialogContent = document.createElement("div");
    let dialog = dialogs.filter(function (dialog) {
        return dialog.trigger === "postcrossrail";
    })[0];
    let paragraphElement = document.createElement("p");
    let capacity = 0;
    let demand = 0;
    let openStations = stations.reduce(function (open: number, currentStation: Station): number {
        demand += currentStation.demand;
        if (currentStation.isBuilt) {
            open++;
            capacity += currentStation.capacity;
        }
        return open;
    }, 0);

    paragraphElement.innerHTML = `
            On ${internalDate.format("MMMM Do, Y")} after having spent <b>£${(15900000000 - londonFunds).toLocaleString()}</b>, Transport for London (TfL) has opened <b>${openStations}</b> of the <b>${stations.length}</b> proposed for the Crossrail project, meeting <b>${Math.round(capacity / demand * 100)}%</b> of current demand (<b>${demand.toLocaleString()} passengers per year</b>).
        `;
    dialogContent.classList.add("dialog-content");
    dialogContent.appendChild(paragraphElement);
    dialogContent.appendChild(document.createElement("hr"));
    for (let paragraph of dialog.text.split("\n")) {
        paragraphElement = document.createElement("p");
        paragraphElement.textContent = paragraph;
        dialogContent.classList.add("dialog-content");
        dialogContent.appendChild(paragraphElement);
    }
    alertify.alert(dialog.title, dialogContent, function () {
        // Allow the user to show the results again?
        gameState = GameState.Running;
    }).set({ transition: "fade" });
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
        let dialogContent = document.createElement("div");
        dialogs.filter(function (dialog) {
            return dialog.trigger === "start";
        }).forEach(function (dialog) {
            for (let paragraph of dialog.text.split("\n")) {
                let paragraphElement = document.createElement("p");
                paragraphElement.textContent = paragraph;
                dialogContent.classList.add("dialog-content");
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
let earthquakeTriggered: boolean = false;
let crossrailDialogTriggered: boolean = false;
const updateTick = 500; // Half a second

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
            if (Date.now() - lastDateUpdate > updateTick) {
                internalDate = internalDate.add(1, "days");
                lastDateUpdate = Date.now();

                // Update cities
                for (let city of cities) {
                    city.update();
                }
                // Update stations
                for (let station of stations) {
                    station.update();
                }
                // Trigger earthquake in a bit less than 3 years (could be much sooner or much later)
                if (!earthquakeTriggered && Math.random() < 1 / 1000) {
                    earthquakeTriggered = true;
                    trigger.disabled = true;
                    triggerEarthquake();
                }
                // Trigger Crossrail dialog after 5 years
                if (!crossrailDialogTriggered && internalDate.diff(moment(), "days") >= 500) {
                    crossrailDialogTriggered = true;
                    triggerCrossrailDialog();
                }
            }
        }
        window.requestAnimationFrame(updateLoop);
    })();

    // Button and other event handlers
    let trigger = document.getElementById("trigger") as HTMLButtonElement;
    trigger.onclick = function () {
        earthquakeTriggered = true;
        trigger.disabled = true;
        triggerEarthquake();
    };
    let trigger2 = document.getElementById("trigger2") as HTMLButtonElement;
    trigger2.onclick = function () {
        crossrailDialogTriggered = true;
        triggerCrossrailDialog();
    }
};