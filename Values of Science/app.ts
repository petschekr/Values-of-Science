// Leaflet.js library
declare var L: any;
declare var $: any;

interface GeoPos {
    coordinates: number[];
    zoom: number;
}

let cascadiaStart: GeoPos = {
    coordinates: [45.848586, -122.796695],
    zoom: 2
};
let londonStart: GeoPos = {
    coordinates: [51.508571, -0.125868],
    zoom: 12
};

let mymap;
window.onload = () => {
    mymap = L.map("london-map").setView(londonStart.coordinates, londonStart.zoom);
    L.tileLayer('https://api.mapbox.com/styles/v1/petschekr/civ4sq5nv000l2js73mhhhhhv/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicGV0c2NoZWtyIiwiYSI6ImNpdjRseXM3NTAwcmwydG4wZnd5cDMxMjQifQ.18bn19zBdqHqSArGaNrMwA', {
        attribution: `Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>`,
        maxZoom: 16,
        minZoom: 9
    }).addTo(mymap);
    mymap.attributionControl.setPosition("topright");
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
            }
        }).addTo(mymap);
    });
};