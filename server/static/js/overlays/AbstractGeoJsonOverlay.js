'use strict';

var AbstractGeoJsonOverlay = L.LayerGroup.extend({
  initialize: function(wsChannel, layerMgr, type) {
    L.LayerGroup.prototype.initialize.call(this);

    this.layerMgr = layerMgr;
    this.wsChannel = wsChannel;
    this.type = type;

    this.onLayerChange = this.onLayerChange.bind(this);
    this.onMapMove = debounce(this.onMapMove.bind(this), 50);
  },

  onLayerChange: function(layer){
    this.reDraw();
  },

  onMapMove: function(){
    this.reDraw();
  },

  createGeoJson: function(objects){
    var self = this;

    var geoJsonLayer = L.geoJSON([], {
        onEachFeature: function(feature, layer){
            if (feature.properties && feature.properties.popupContent) {
                layer.bindPopup(feature.properties.popupContent);
            }
        }
    });

    objects.forEach(function(obj){
      geoJsonLayer.addData(self.createFeature(obj));
    });

    return geoJsonLayer;
  },

  reDraw: function(){
    var self = this;

    if (this.map.getZoom() < 10) {
      this.clearLayers();
      return;
    }

    var mapLayer = this.layerMgr.getCurrentLayer();
    var min = this._map.getBounds().getSouthWest();
    var max = this._map.getBounds().getNorthEast();

    var y1 = parseInt(mapLayer.from/16);
    var y2 = parseInt(mapLayer.to/16);
    var x1 = parseInt(min.lng);
    var x2 = parseInt(max.lng);
    var z1 = parseInt(min.lat);
    var z2 = parseInt(max.lat);

    api.getMapObjects(
      x1, y1, y1,
      x2, y2, z2,
      this.type)
    .then(function(objects){
      self.clearLayers();

      var geoJsonLayer = createGeoJson(objects);
      geoJsonLayer.addTo(self);
    })

  },

  onAdd: function(map) {
    this.map = map;
    map.on("zoomend", this.onMapMove);
    map.on("moveend", this.onMapMove);
    this.layerMgr.addListener(this.onLayerChange);
    this.reDraw(true)
  },

  onRemove: function(map) {
    this.clearLayers();
    map.off("zoomend", this.onMapMove);
    map.off("moveend", this.onMapMove);
    this.layerMgr.removeListener(this.onLayerChange);
  }

});
