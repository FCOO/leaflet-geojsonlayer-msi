(function () {
    /* global L */
    'use strict';

    var msiDivIcon = L.divIcon({className: 'msi-marker', iconSize:[20,20], iconAnchor:[11,11]});

    var latlngFormat = new LatLngFormat( 1 ); //1=Degrees Decimal minutes: N65°30.258'

    var dateAsHTML = function( date, language, tz ){
      var dateFormat = 'DD-MMM-YY HH:mm',
          m = moment.utc(date),
          localTxt = language == 'da' ? 'lokal' : 'local',
          result;
      if (tz == 'local') {
          result = m.local().format(dateFormat)+ '&nbsp;('+localTxt+')';
      } else {
          result = m.utc().format(dateFormat) + '&nbsp;(UTC)';
      }
      return result;
    };


    L.GeoJSON.MSI = L.GeoJSON.extend({
        options: {
            language: 'en',
            timezone: 'local',
            protocol: location.protocol,
            baseurl : '//app.fcoo.dk/warnings/msi/msi_{language}.json',
            pointToLayer: function (feature, latlng) {  
                 var result = L.marker(latlng, {icon: msiDivIcon});
                 result.on('add', function(){ this._icon.title = 'MSI: ' + feature.properties.encText + '\n' + feature.properties.mainarea + ' - ' + feature.properties.subarea; }, result);
                 return result;
            },
            style: function (feature) { 
                return {
                    weight: 2,
                    color: "#e2007a",
                    opacity: 1,
                    fillColor: "#e2007a",
                    fillOpacity: 0.2,
                };
            }

        },

        initialize: function (options) {
            var that = this;
            L.setOptions(this, options);
            this._layers = {};
            this.options.url = this.options.protocol  + this.options.baseurl.replace('{language}', this.options.language);

            // jqxhr is a jQuery promise to get the requested JSON data
            this.jqxhr = $.getJSON(this.options.url);
            this.jqxhr.done(function (data) {
                that.addData(data);
            });

            // Set method to perform on each feature
            this.options.onEachFeature = function (feature, layer) { 
                // Use click handler for substituting timezone information
                layer.on({
                    click: function (evt) {
                        var point_template = '<p>Position: {latitude}&nbsp;&nbsp;{longitude}</p>';
                        if (feature.properties.language == 'da') {
                            var popup_template = '<div class="msi"><h4>Aktuelle advarsler</h4><p>{body}</p><hr/><p>Tid: {updated}</p><hr/><p>Hovedområde: {mainarea}</p><p>Underområde: {subarea}</p><hr/>{points}<hr/><p>Kilde: <a target="_new" href="http://www.soefartsstyrelsen.dk">Søfartsstyrelsen</a></p></div>';
                        } else {
                            var popup_template = '<div class="msi"><h4>Maritime Safety Information</h4><p>{body}</p><hr/><p>Time: {updated}</p><hr/><p>Main area: {mainarea}</p><p>Subarea: {subarea}</p><hr/>{points}<hr/><p>Source: <a target="_new" href="http://dma.dk">Danish Maritime Authority</a></p></div>';
                        }
                        var innerhtml = popup_template.replace('{title}', feature.properties.encText);
                        innerhtml = innerhtml.replace('{body}', feature.properties.navWarning);
                        innerhtml = innerhtml.replace('{updated}', dateAsHTML(feature.properties.updated, feature.properties.language, that.options.timezone));
                        innerhtml = innerhtml.replace('{mainarea}', feature.properties.mainarea);
                        innerhtml = innerhtml.replace('{subarea}', feature.properties.subarea);
                        var points = '';
                        if (feature.geometry.type !== 'Point') {
                            for (var kk in feature.geometry.geometries[0].coordinates) {
                                var point = feature.geometry.geometries[0].coordinates[kk];
                                points += point_template;
                                points = points.replace('{longitude}', latlngFormat.asTextLng(point[0]));
                                points = points.replace('{latitude}', latlngFormat.asTextLat(point[1]));
                            }
                        } else {
                            points = point_template.replace('{longitude}', latlngFormat.asTextLng( feature.geometry.coordinates[0] )) ;
                            points = points.replace('{latitude}', latlngFormat.asTextLat(feature.geometry.coordinates[1] ));
                        };
                        innerhtml = innerhtml.replace('{points}', points);
                        layer._map.openPopup(innerhtml, evt.latlng, {maxWidth: 300, maxHeight: 400});
                    }
                });
            };
        },

        onAdd: function (map) {
            var that = this;
            this.jqxhr.done(function (data) {
                L.GeoJSON.prototype.onAdd.call(that, map);
            });

            // Whenever the timezone is changed we will change the internal timezone
            map.on("timezonechange", function(data) {
                that.options.timezone = data.timezone;
            });
        },

  });

  return L.GeoJSON.MSI;

}());

