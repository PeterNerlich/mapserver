import AbstractGeoJsonOverlay from './AbstractGeoJsonOverlay.js';
import { getMapObjects } from '../../api.js';

export default AbstractGeoJsonOverlay.extend({
  initialize: function() {
    AbstractGeoJsonOverlay.prototype.initialize.call(this, "train");
    this.cache = {
      lines: {}, // { "A1":[] }
      lineColors: {}, // { "A1": "red" }
      lineFeat: []
    };
    this.pendingQueries = [];
    this.lastLayer = L.geoJSON([], {
      onEachFeature: function(feature, layer){
        if (feature.properties && feature.properties.popupContent) {
          layer.bindPopup(feature.properties.popupContent);
        }
      },
      pointToLayer: function (feature, latlng) {
        var geojsonMarkerOptions = {
          radius: 8,
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        };

        return L.circleMarker(latlng, geojsonMarkerOptions);
      },
      style: function(feature) {
        if (feature.properties && feature.properties.color){
          return { color: feature.properties.color };
        }
      }
    });
  },
  
  createGeoJson: function(objects){
    var self = this;

    // which unique lines do objects belong to?
    var lines = [];
    objects.forEach(function(obj){
      if (obj.attributes.line && lines.indexOf(obj.attributes.line) == -1) {
        lines.push(obj.attributes.line);
      }
    });

    // query for each line, add to cache
    lines.forEach(function(linename){
      if (!self.cache.lines[linename]){
        // only request if not in cache.
        // if someone changed the train lines, the user has to reload. sorry.
        self.pendingQueries.push(linename);
        getMapObjects({
          type: self.type,
          attributelike: {
            key: "line",
            value: linename
          }
        })
        .then(function(objects){
          objects.sort(function(a,b){
            return parseInt(a.attributes.index) - parseInt(b.attributes.index);
          });

          self.cache.lines[linename] = objects;
          // already sorted, determine color
          self.cache.lineColors[linename] = "#ff7800";
          for (var i = objects.length-1; i >= 0; i--) {
            // find the last element specifying a color
            // as was previous behaviour, but be more efficient
            if (objects[i].attributes.color){
              self.cache.lineColors[linename] = objects[i].attributes.color;
              break;
            }
          }

          var feat = {
            coords: [],
            stations: [],
            feature: null
          };
          //Add stations
          objects.forEach(function(entry){
            feat.coords.push([entry.x, entry.z]);

            if (entry.attributes.station) {
              feat.stations.push({
                "type": "Feature",
                "properties": {
                  "name": entry.attributes.station,
                  "color": self.cache.lineColors[linename],
                  "popupContent": "<b>Train-station (Line " + entry.attributes.line + ")</b><hr>" +
                    entry.attributes.station
                },
                "geometry": {
                  "type": "Point",
                  "coordinates": [entry.x, entry.z]
                }
              });
            }
          });

          feat.feature = {
            "type":"Feature",
            "geometry": {
              "type":"LineString",
              "coordinates": feat.coords
            },
            "properties":{
                "name": linename,
                "color": self.cache.lineColors[linename],
                "popupContent": "<b>Train-line (" + linename + ")</b>"
            }
          };

          self.cache.lineFeat[linename] = feat;

          //line-points
          self.lastLayer.addData(feat.feature);

          //stations
          feat.stations.forEach(function(stationfeature){
            self.lastLayer.addData(stationfeature);
          });
        });
      }
    });

    return self.lastLayer;
  },
});
