(function () {
    /* global L */
    'use strict';

		var msiDivIcon = L.divIcon({className: 'msi-marker', iconSize:[20,20], iconAnchor:[11,11]});

		var latlngFormat = new LatLngFormat( 1 ); //1=Degrees Decimal minutes: N65°30.258'

		//
		var dateFormats = [
			['ddd, DD. MMM YYYY'	, 'ddd, MMM DD, YYYY'	, 'ddd, YYYY MMM DD'],	//Mon, 24. Dec 2014	| Mon Dec 24, 2014	| Mon 2014 Dec 24
			['ddd, DD. MMM YY'		, 'ddd, MMM DD, YY'		, 'ddd, YY MMM DD'	],	//Mon, 24. Dec 14		| Mon Dec 24, 14		| Mon 14 Dec 24
			['DD. MMM YYYY'				, 'MMM DD, YYYY'			, 'YYYY MMM DD'			],	//24. Dec 2014			| Dec 24, 2014			| 2014 Dec 24
			['DD. MMM \'YY'					, 'MMM DD, YY'				, 'YY MMM DD'		  ],	//24. Dec '14				| Dec 24, 14				| 14 Dec 24
			['DD/MM/YYYY'					, 'MM/DD/YYYY'				, 'YYYY/MM/DD'			],	//24/12/2014				| 12/24/2014				| 2014/12/24
			['DD/MM/YY'						, 'MM/DD/YY'					, 'YY/MM/DD'				]		//24/12/14					| 12/24/14					| 14/12/24
		];
		var dateAsHTML = function( date, localTxt ){
			var dateFormat = 'DD-MMM-YY HH:mm';//dateFormats[3][0]+' HH:mm';
			var m = moment.utc(date);
			return m.local().format(dateFormat)+ '&nbsp;('+localTxt+')&nbsp;&nbsp;'	+'<em>'+m.utc().format(dateFormat) + '&nbsp;(UTC)</em>';	
		};


		L.GeoJSON.MSI = L.GeoJSON.extend({
        options: {
            language: 'en',
						protocol: location.protocol,
            baseurl	: '//app.fcoo.dk/warnings/msi/msi_{language}.json',
            onEachFeature: function (feature, layer) { 
                var point_template = '<p>Position: {latitude}&nbsp;&nbsp;{longitude}</p>';
                if (feature.properties.language == 'da') {
                    var popup_template = '<div class="msi"><h4>Aktuelle advarsler</h4><p>{body}</p><hr/><p>Tid: {updated}</p><hr/><p>Hovedområde: {mainarea}</p><p>Underområde: {subarea}</p><hr/>{points}<hr/><p>Kilde: <a target="_new" href="http://www.soefartsstyrelsen.dk">Søfartsstyrelsen</a></p></div>';
                    //OLD format: var point_template = '<p>Længdegrad: {longitude}</p><p>Breddegrad: {latitude}</p>';
                } else {
                    var popup_template = '<div class="msi"><h4>Maritime Safety Information</h4><p>{body}</p><hr/><p>Time: {updated}</p><hr/><p>Main area: {mainarea}</p><p>Subarea: {subarea}</p><hr/>{points}<hr/><p>Source: <a target="_new" href="http://dma.dk">Danish Maritime Authority</a></p></div>';
                    //OLD format: var point_template = '<p>Longitude: {longitude}</p><p>Latitude: {latitude}</p>';
                }
                var innerhtml = popup_template.replace('{title}', feature.properties.encText);
                innerhtml = innerhtml.replace('{body}', feature.properties.navWarning);
                innerhtml = innerhtml.replace('{updated}', dateAsHTML(feature.properties.updated, feature.properties.language == 'da' ? 'lokal' : 'local'));
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
                layer.bindPopup(innerhtml, {maxWidth: 300, maxHeight: 400});
            },
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

