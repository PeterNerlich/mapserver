'use strict';

var RealtimeTileLayer = L.TileLayer.extend({

  initialize: function(wsChannel, layerId) {
    var self = this;
    this.layerId = layerId;

    wsChannel.addListener("rendered-tile", function(tc){
      if (tc.layerid != self.layerId){
        //ignore other layers
        return;
      }

      var id = self.getImageId(tc.layerid, tc.x, tc.y, tc.zoom);
      var el = document.getElementById(id);

      if (el){
          //Update src attribute if img found
          el.src = self.getTileSource(tc.layerid, tc.x, tc.y, tc.zoom, true);
      }
    });
  },

  getTileSource: function(x,y,zoom,cacheBust){
      return "api/tile/" + this.layerId + "/" + x + "/" + y + "/" + zoom + "?_=" + Date.now();
  },

  getImageId: function(x, y, zoom){
      return "tile-" + this.layerId + "/" + x + "/" + y + "/" + zoom;
  },

  createTile: function(coords){
    var tile = document.createElement('img');
    tile.src = this.getTileSource(coords.x, coords.y, coords.z);
    tile.id = this.getImageId(coords.x, coords.y, coords.z);
    return tile;
  }
});