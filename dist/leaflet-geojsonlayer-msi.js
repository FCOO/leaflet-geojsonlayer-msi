/****************************************************************************
	leaflet-geojsonlayer-msi.js,

	(c) 2016, FCOO

	https://github.com/FCOO/leaflet-geojsonlayer-msi
	https://github.com/FCOO

****************************************************************************/
;(function ($, L, window, document, undefined) {
	"use strict";

  var msiDivIcon = L.divIcon({className: 'msi-marker', iconSize:[20,20], iconAnchor:[11,11]});

  //var latlngFormat = new window.LatLngFormat( 1 ); //1=Degrees Decimal minutes: N65°30.258'

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


var Feature = L.Class.extend({
    initialize: function (feature, geoJSON_MSI) {
			this.feature = feature;
      this.geoJSON_MSI = geoJSON_MSI;
    },

		updatePopup: function () {
			var options				= this.geoJSON_MSI.options,
					content				= options.popup_template,
					text					= options.text[ options.language ] || options.text['da'],
					positionList	= [],
					i, coor,
					positionContents = '';

			function insertInContents( text ){
				for (var id in text)
					content = content.replace('{'+id+'}', text[id]);
			}

			//Create list of position(s)
			if (this.feature.geometry.type !== 'Point')
				for (coor in this.feature.geometry.geometries[0].coordinates)
					positionList.push( L.latLng( this.feature.geometry.geometries[0].coordinates[coor]  ) );
      else
				positionList.push( L.latLng( this.feature.geometry.coordinates ) ) ;

			//Set header for position-section
			text['header_position'] = positionList.length == 1 ? text['header_position'] : text['header_positions'];

			//Insert headers
			insertInContents( text );

			//Insert data
			insertInContents( {
				'title'		: this.feature.properties.encText,
				'body'		: this.feature.properties.navWarning,
				'updated'	: dateAsHTML( this.feature.properties.updated, options.language, options.timezone ),
				'mainarea': this.feature.properties.mainarea,
				'subarea'	: this.feature.properties.subarea
			});

			//Positions
			for (i=0; i<positionList.length; i++ )
				positionContents += (i ? '<br>' : '') + positionList[i].asFormat().join('&nbsp;&nbsp;&nbsp;');
			insertInContents( { 'points': positionContents });
	    return content;
    }

	});


  L.GeoJSON.MSI = L.GeoJSON.extend({
		options: {
			language: 'en',
	    timezone: 'local',
		  protocol: window.location.protocol,
			baseurl : '//app.fcoo.dk/warnings/msi/msi_{language}.json',
	    pointToLayer: function (feature, latlng) {
		  var result = L.marker(latlng, {icon: msiDivIcon});
	    result.on('add', function(){
				this._icon.title = 'MSI: ' + feature.properties.encText + '\n' + feature.properties.mainarea + ' - ' + feature.properties.subarea; }, result);
				return result;
			},
			style: function (/*feature*/) {
				return {
		      weight: 2,
				  color: "#e2007a",
		      opacity: 1,
				  fillColor: "#e2007a",
		      fillOpacity: 0.2,
				};
			},
			popup_template:
				'<div class="msi">'+
					'<h3>{header}</h3>'+
					'<p>{body}</p><hr/>'+

					'<h4>{header_time}</h4>'+
					'<p>{updated}</p><hr/>'+

					'<h4>{header_area}</h4>'+
					'<p>{mainarea}&nbsp;-&nbsp;{subarea}</p><hr/>'+

					'<h4>{header_position}</h4>'+
					'{points}<hr/>'+

					'<h4>{header_source}</h4>'+
					'<p>{source_link}</p>'+
				'</div>',

			text: {
				da: {
					'header'					: 'Aktuelle advarsler',
					'header_time'			: 'Tid',
					'header_area'			: 'Område',
					'header_main_area': 'Hovedområde',
					'header_subarea'	: 'Underområde',
					'header_position'	: 'Position',
					'header_positions': 'Positioner',
					'header_source'		: 'Kilde',
					'source_link'			: '<a target="_new" href="http://www.soefartsstyrelsen.dk">Søfartsstyrelsen</a>'
				},
				en: {
					'header'					: 'Maritime Safety Information',
					'header_time'			: 'Time',
					'header_area'			:	'Area',
					'header_main_area':	'Main area',
					'header_subarea'	: 'Subarea',
					'header_position'	: 'Position',
					'header_positions': 'Positions',
					'header_source'		: 'Source',
					'source_link'			: '<a target="_new" href="http://dma.dk">Danish Maritime Authority</a>'
				}
			}
	  },

	  initialize: function (options) {
		  var _this = this;
			L.setOptions(this, options);
	    this._layers = {};
      this.options.url = this.options.protocol  + this.options.baseurl.replace('{language}', this.options.language);

      // jqxhr is a jQuery promise to get the requested JSON data
      this.jqxhr = $.getJSON(this.options.url);
      this.jqxhr.done(function (data) {
        _this.addData(data);
      });

      // Set method to perform on each feature
      this.options.onEachFeature = function (feature, layer) {
				var featureObj = new Feature( feature, _this );
				layer.bindPopup('', {
					maxWidth		: 300,
					maxHeight		: 400,

					getContent: featureObj.updatePopup,
					context		: featureObj,

					updateOnMapEvents	: 'latlngformatchange'
				});
      };
    },

    onAdd: function (map) {
      var _this = this;
      this.jqxhr.done(function (/*data*/) {
        L.GeoJSON.prototype.onAdd.call(_this, map);
      });

      // Whenever the timezone is changed we will change the internal timezone
      map.on("timezonechange", function(data) {
        _this.options.timezone = data.timezone;
      });
    },

  });

  return L.GeoJSON.MSI;



}(jQuery, L, this, document));



