(function () {
    /* global L */
    'use strict';
    L.GeoJSON.MSI = L.GeoJSON.extend({
        options: {
            soap: {
                url: 'http://api.fcoo.dk/msi/ws/warning',
                method: 'mes:getActiveWarningCountry',
                appendMethodToURL: false,
                soap12: false,
                SOAPAction: "",
                noPrefix: true,
                data: {
                    arg0: 'DK'
                },
                namespaceQualifier: 'mes',
                namespaceURL: 'http://message.webservice.core.msiedit.frv.dk/', 
            }
        },

        initialize: function (options) {
            L.setOptions(this, options);
            this._layers = {};
        },

        onAdd: function (map) {
            var that = this;
            var success = function (soapResponse) {
                var jsonResponse = soapResponse.toJSON();
                var activeWarnings = jsonResponse.Body.getActiveWarningCountryResponse.return.item;
                var geojson = {};
                geojson.type = 'FeatureCollection';
                geojson.features = [];
                for (var k in activeWarnings) {
                    var item = activeWarnings[k];
                    var newFeature = {
                        "type": "Feature",
                        "geometry": {
                            "type": item.locationType,
                            "coordinates": [parseFloat(item.points.point.longitude),
                                            parseFloat(item.points.point.latitude)]
                        },
                        "properties": {
                            "areaEnglish": item.areaEnglish,
                            "created": item.created,
                            "encText": item.encText,
                            "id": item.id,
                            "messageId": item.messageId,
                            "navWarning": item.navWarning,
                            "organisation": item.organisation,
                            "subarea": item.subarea,
                            "updated": item.updated,
                            "validFrom": item.validFrom
                        }
                    };
                    geojson.features.push(newFeature);
                }
                var popup_template = '<div class="msi"><h4>{title}</h4><p>{body}</p><hr/><p>Created: {created}</p><p>Updated: {updated}</p><p>Valid from: {validFrom}</p><hr/><p>Main area: {areaEnglish}</p><p>Subarea: {subarea}</p><hr/><p>Longitude: {longitude}</p><p>Latitude: {latitude}</p></div>';
                var lgeojson = L.geoJson(geojson, {
                    onEachFeature: function (feature, layer) {
                        var innerhtml = popup_template.replace('{title}', feature.properties.encText);
                        innerhtml = innerhtml.replace('{body}', feature.properties.navWarning);
                        innerhtml = innerhtml.replace('{created}', feature.properties.created);
                        innerhtml = innerhtml.replace('{updated}', feature.properties.updated);
                        innerhtml = innerhtml.replace('{validFrom}', feature.properties.validFrom);
                        innerhtml = innerhtml.replace('{areaEnglish}', feature.properties.areaEnglish);
                        innerhtml = innerhtml.replace('{subarea}', feature.properties.subarea);
                        innerhtml = innerhtml.replace('{longitude}', feature.geometry.coordinates[0]);
                        innerhtml = innerhtml.replace('{latitude}', feature.geometry.coordinates[1]);
                        layer.bindPopup(innerhtml, {maxWidth: 350, maxHeight: 600});
                    },
                    /*jshint unused: true*/
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, {
                                   radius: 8,
                                   fillColor: "red",
                                   color: "#111",
                                   weight: 1,
                                   opacity: 1,
                                   fillOpacity: 0.8
                        });
                    }
                    /*jshint unused: false*/
                });
                that.addLayer(lgeojson);
                L.GeoJSON.prototype.onAdd.call(that, map);
            };

            // Make SOAP request
            var soapOptions = this.options.soap;
            soapOptions.success = success;
            soapOptions.error = function (soapResponse) {
                // show error
                console.log(soapResponse.toJSON());
            };
            $.soap(soapOptions);

        },

  });

  return L.GeoJSON.MSI;

}());

