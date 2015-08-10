(function () {
    /* global L */
    'use strict';
    L.GeoJSON.MSI = L.GeoJSON.extend({
        options: {
            language: 'en',
            soap: {
                url: 'http://api.fcoo.dk/msi/ws/warning',
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
                var method = 'getActiveWarningCountryResponse';
                if (that.options.language == 'da') {
                    method = 'getActiveWarningResponse';
                }
                var activeWarnings = jsonResponse.Body[method].return.item;
                if (! activeWarnings.constructor === Array) {
                    activeWarnings = [activeWarnings];
                }
                var geojson = {};
                geojson.type = 'FeatureCollection';
                geojson.features = [];
                for (var k in activeWarnings) {
                    var item = activeWarnings[k];
                    if (that.options.language == 'da') {
                        var lat = parseFloat(item.latitude);
                        var lng = parseFloat(item.longitude);
                        var coords = [lng, lat];
                        var locationType = 'Point';
                        var mainArea = item.mainArea;
                        var subArea = item.subArea;
                        var encText = item.ENCtext;
                        var validFrom = item.created;
                        var navWarning = item.text.join('');
                    } else {
                        var coords;
                        var locationType;
                        if (item.points.point.constructor === Array) {
                            coords = [];
                            locationType = 'LineString';
                            for (var kk in item.points.point) {
                                var lat = item.points.point[kk].latitude;
                                var lng = item.points.point[kk].longitude;
                                var coord = [parseFloat(lng), parseFloat(lat)]
                                coords.push(coord);
                            }
                        } else {
                            var lat = item.points.point.latitude;
                            var lng = item.points.point.longitude;
                            coords = [parseFloat(lng), parseFloat(lat)]
                            locationType = item.locationType;
                        }
                        var mainArea = item.areaEnglish;
                        var subArea = item.subarea;
                        var encText = item.encText;
                        var validFrom = item.validFrom;
                        var navWarning = item.navWarning;
                    }
                    var newFeature = {
                        "type": "Feature",
                        "geometry": {
                            "type": locationType,
                            "coordinates": coords
                        },
                        "properties": {
                            "mainarea": mainArea,
                            "created": item.created,
                            "encText": encText,
                            "navWarning": navWarning,
                            "subarea": subArea,
                            "updated": item.updated,
                            "validFrom": validFrom
                        }
                    };
                    geojson.features.push(newFeature);
                }
                if (that.options.language == 'da') {
                    var popup_template = '<div class="msi"><h4>Aktuelle advarsler</h4><p>{body}</p><hr/><p>Lavet: {created}</p><p>Opdateret: {updated}</p><p>Gyldig fra: {validFrom}</p><hr/><p>Hovedområde: {mainarea}</p><p>Underområde: {subarea}</p><hr/>{points}</div>';
                    var point_template = '<p>Længdegrad: {longitude}</p><p>Breddegrad: {latitude}</p>';
                } else {
                    var popup_template = '<div class="msi"><h4>Maritime Safety Information</h4><p>{body}</p><hr/><p>Created: {created}</p><p>Updated: {updated}</p><p>Valid from: {validFrom}</p><hr/><p>Main area: {mainarea}</p><p>Subarea: {subarea}</p><hr/>{points}</div>';
                    var point_template = '<p>Longitude: {longitude}</p><p>Latitude: {latitude}</p>';
                }
                var lgeojson = L.geoJson(geojson, {
                    onEachFeature: function (feature, layer) {
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
                        layer.bindPopup(innerhtml, {maxWidth: 350, maxHeight: 600});
                    },
                    /*jshint unused: true*/
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, {
                                   radius: 7,
                                   weight: 2,
                                   color: "#e2007a",
                                   opacity: 1,
                                   fillColor: "#e2007a",
                                   fillOpacity: 0.2
                        });
                    },
                    /*jshint unused: false*/
                    style: function (feature) {
                        var weight = 2;
                        if (feature.geometry.type == 'LineString') {
                            var weight = 4;
                        };
                        return {
                            weight: weight,
                            color: "#e2007a",
                            opacity: 1,
                            fillColor: "#e2007a",
                            fillOpacity: 0.2
                        };
                    }
                });
                that.addLayer(lgeojson);
                L.GeoJSON.prototype.onAdd.call(that, map);
            };

            // Make SOAP request
            var soapOptions = this.options.soap;
            if (this.options.language == 'da') {
                soapOptions.method = 'mes:getActiveWarning';
            } else {
                soapOptions.method =  'mes:getActiveWarningCountry';
            }
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

