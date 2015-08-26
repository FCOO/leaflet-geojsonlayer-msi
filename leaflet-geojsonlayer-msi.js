(function () {
    /* global L */
    'use strict';
    L.GeoJSON.MSI = L.GeoJSON.extend({
        options: {
            language: 'en',
            baseurl: location.protocol + '//app.fcoo.dk/warnings/msi/msi_{language}.json',
            onEachFeature: function (feature, layer) {
                if (feature.properties.language == 'da') {
                    var popup_template = '<div class="msi"><h4>Aktuelle advarsler</h4><p>{body}</p><hr/><p>Lavet: {created}</p><p>Opdateret: {updated}</p><hr/><p>Hovedområde: {mainarea}</p><p>Underområde: {subarea}</p><hr/>{points}</div>';
                    var point_template = '<p>Længdegrad: {longitude}</p><p>Breddegrad: {latitude}</p>';
                } else {
                    var popup_template = '<div class="msi"><h4>Maritime Safety Information</h4><p>{body}</p><hr/><p>Created: {created}</p><p>Updated: {updated}</p><p>Valid from: {validFrom}</p><hr/><p>Main area: {mainarea}</p><p>Subarea: {subarea}</p><hr/>{points}</div>';
                    var point_template = '<p>Longitude: {longitude}</p><p>Latitude: {latitude}</p>';
                }
                var innerhtml = popup_template.replace('{title}', feature.properties.encText);
                innerhtml = innerhtml.replace('{body}', feature.properties.navWarning);
                innerhtml = innerhtml.replace('{created}', feature.properties.created);
                innerhtml = innerhtml.replace('{updated}', feature.properties.updated);
                innerhtml = innerhtml.replace('{validFrom}', feature.properties.validFrom);
                innerhtml = innerhtml.replace('{mainarea}', feature.properties.mainarea);
                innerhtml = innerhtml.replace('{subarea}', feature.properties.subarea);
                var points = '';
                if (feature.geometry.type !== 'Point') {
                    for (var kk in feature.geometry.coordinates) {
                        var point = feature.geometry.coordinates[kk];
                        points += point_template;
                        points = points.replace('{longitude}', point[0]);
                        points = points.replace('{latitude}', point[1]);
                    }
                } else {
                    points = point_template.replace('{longitude}', feature.geometry.coordinates[0]);
                    points = points.replace('{latitude}', feature.geometry.coordinates[1]);
                };
                innerhtml = innerhtml.replace('{points}', points);
                layer.bindPopup(innerhtml, {maxWidth: 300, maxHeight: 400});
            },
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, {
                           radius: 8,
                           weight: 2,
                           color: "#e2007a",
                           opacity: 1,
                           fillColor: "#e2007a",
                           fillOpacity: 0.2
                });
            },
            style: function (feature) {
                return {
                    weight: 2,
                    color: "#e2007a",
                    opacity: 1,
                    fillColor: "#e2007a",
                    fillOpacity: 0.2
                };
            }
        },

        initialize: function (options) {
            var that = this;
            L.setOptions(this, options);
            this._layers = {};
            this.options.url = this.options.baseurl.replace('{language}', this.options.language);
        },

        onAdd: function (map) {
            var that = this;
            $.getJSON(this.options.url, function (data) {
                that.addData(data);
                L.GeoJSON.prototype.onAdd.call(that, map);
            });
        },
  });

  return L.GeoJSON.MSI;

}());

