/****************************************************************************
    leaflet-geojsonlayer-msi.js,

    (c) 2016, FCOO

    https://github.com/FCOO/leaflet-geojsonlayer-msi
    https://github.com/FCOO

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";

    /********************************************
    getContent( contentArray, language )
    contentArray = [] of { lang:STRING, id:content }
    Returns {id#1: content, id#2: content} 

    ********************************************/
    function getContent( contentArray, language ){
        var result = {};
        language = language || 'da';
        $.each( contentArray, function( index, langContent ){
            if (langContent.lang == language)
                $.each( langContent, function( id, value ){                              
                    result[id] = value;
                });
        });
        return result;
    }
    
    function getPart( message, type ){
        var parts = message ? message.parts : null,
            result = null;
        if (parts && $.isArray(parts))
            $.each( parts, function(index, part){
                if (part.type == type){
                    result = part;
                    return false;
                }
            });
        return result;                
    }

    function getAreaList( message, language ){ 
        function getAreaName( object, language ){
            return getContent( object.descs || [], language ).name;
        }

        var result = [],
            vicinity = getContent( message.descs, language ).vicinity;
        if (vicinity)
          result.push( vicinity );

        result.push(getAreaName(message.areas[0]));

        var parent = message.areas[0].parent;
        while (parent){
            result.push( getAreaName(parent));
            parent = parent.parent;
        }

        return result;
    }
        
    
    
    var msiDivIcon = L.divIcon({className: 'msi-marker', iconSize:null, iconAnchor:null});

    function dateAsHTML( date ){
        return moment(date).format('DD MMMM YYYY');
    }

    //***************************************
    //MsiFeature
    //***************************************
    var MsiFeature = L.Class.extend({
        initialize: function (feature, geoJSON_MSI) {
            this.feature = feature;
            this.geoJSON_MSI = geoJSON_MSI;
        },

        //***************************************
        //updatePopup 
        //***************************************
        updatePopup: function ( /*popup*/) {
            var options      = this.geoJSON_MSI.options,
                content      = options.template.popup,
                text         = options.text,
                language     = options.language || 'da',
                positionList = [],
                positionContent = '';


            //translate
            function translate( text ){
                var result = {};
                for (var id in text)
                    result[id] = text[id][language];
                return result;
            }
            
            //insertInContent
            function insertInContent( text ){
                for (var id in text)
                    content = content.replace(new RegExp('{'+id+'}', 'g'), text[id]);
            }

            //Insert headers
            insertInContent( translate(text) );

            //Get list of areas
            var areaList = getAreaList(this.feature.message),
                areaListStr = '',
                i = areaList.length-1;
            while (i >= 0){
                areaListStr = areaList[i] + (areaListStr?'.&nbsp;':'') + areaListStr;
                i--;
            }

            //Get part[DETAILS]
            var detailsPart = getPart( this.feature.message, "DETAILS" );

            //Insert data
            insertInContent( {
                'subject': getContent( detailsPart.descs, options.language ).subject,
                'details': getContent( detailsPart.descs, options.language ).details,
                'area'   : areaListStr,
                'updated': dateAsHTML( this.feature.message.publishDateFrom, options.language, options.timezone ),
            });

            //Positions
            for (i=0; i<positionList.length; i++ )
                positionContent += (i ? '<br>' : '') + positionList[i].format().join('&nbsp;&nbsp;&nbsp;');
            insertInContent( { 'points': positionContent });
            return content;
        }
    });


    //***************************************
    //L.GeoJSON.MSI
    //***************************************
    L.GeoJSON.MSI = L.GeoJSON.extend({
        options: {
            language: 'en',
            timezone: 'local',
            protocol: 'https:', 
//            baseurl : '//niord.dma.dk/rest/public/v1/messages?dateFormat=UNIX_EPOCH&domain=niord-nw&domain=niord-fe',//MSI AND F_WARN
            baseurl : '//niord.dma.dk/rest/public/v1/messages?dateFormat=UNIX_EPOCH&domain=niord-nw',//Only MSI

            coordsToLatLng: function (coords) { // (Array[, Boolean]) -> LatLng
                return new L.LatLng(coords[1], coords[0], coords[2]);
            },



            //***************************************
            //pointToLayer: function (feature, latlng) {
            //***************************************
            pointToLayer: function (feature, latlng) {
                var result = L.marker(latlng, {icon: msiDivIcon}),
                    title = getContent( feature.message.descs, feature.msiOptions.language ).title;

                result.on('add', function(){
                    this._icon.title = title; 
                }, result);
                return result;
            },

            style: function (/*feature*/) {
                return {
                    weight     : 2,
                    color      : "#e2007a",
                    opacity    : 1,
                    fillColor  : "#e2007a",
                    fillOpacity: 0.2,
                };
            },
            template: {
                popup:
                    '<div class="msi">'+
                        '<h4>{subject}</h4><hr/>'+

                        '<h4>{header_area}</h4>'+
                        '<p>{area}</p><hr/>'+

                        '<h4>{header_details}</h4>'+
                        '{details}<hr/>'+

                        '<h4>{header_time}</h4>'+
                        '<p>{updated}</p><hr/>'+

                        '<h4>{header_source}</h4>'+
                        '<p>{source_link}</p>'+
                    '</div>'
            },

            text: {
                'header'          : { da:'Aktuelle advarsler',   en:'Maritime Safety Information'},
                'header_time'     : { da:'Publiceret',           en:'Publicized'},
                'header_area'     : { da:'Område',               en:'Area'},
                'header_position' : { da:'Position',             en:'Position'},
                'header_positions': { da:'Positioner',           en:'Positions'},
                'header_details'  : { da:'Detaljer',             en:'Details'},
                'header_source'   : { da:'Kilde',                en:'Source'},
                'source_link'     : { da:'<a target="_new" href="http://www.soefartsstyrelsen.dk">Søfartsstyrelsen</a>',
                                      en:'<a target="_new" href="http://dma.dk">Danish Maritime Authority</a>'
                                    }
            }
        },

        //***************************************
        //initialize: function (options)
        //***************************************
        initialize: function (options) {
            var _this = this;
            L.setOptions(this, options);

            this._layers = {};
            this.options.url = this.options.protocol  + this.options.baseurl;

            // jqxhr is a jQuery promise to get the requested JSON data
            this.jqxhr = $.getJSON(this.options.url);


            this.jqxhr.done(function (data) { 

                var jsonData = {
                          "type"    : "FeatureCollection", 
                          "features": []
                    };
                $.each( data, function( index, message ){
                    var detailsPart = getPart( message, 'DETAILS' );


                    if (detailsPart && detailsPart.geometry){

                        var centerPointFeature = null;

                        //Save the message togheter with each feature
                        $.each( detailsPart.geometry.features, function(index, feature){

                            //For LineString: add center point
                            if (feature.geometry.type == "LineString"){
                                var coordinates = feature.geometry.coordinates,
                                    centerCoordinates = [(coordinates[0][0] + coordinates[1][0])/2, (coordinates[0][1] + coordinates[1][1])/2];

                                centerPointFeature = {
                                    type    : "Feature",
                                    geometry: { 
                                        type       : "Point",
                                        coordinates: centerCoordinates 
                                    },
                                    message   : message,
                                    msiOptions: _this.options
                                };
                            }


                            feature.message = message;
                            feature.msiOptions = _this.options;
                        });

                        if (centerPointFeature)
                            detailsPart.geometry.features.push( centerPointFeature );

                        jsonData.features.push(detailsPart.geometry);
                    }
                });

                _this.addData(jsonData);
            });

            // Set method to perform on each feature
            var header = this.options.text['header'][this.options.language];

            this.options.onEachFeature = function (feature, layer) { 
                var msiFeature = new MsiFeature( feature, _this );

                layer.bindPopup('', {
                    header           :  header,
                    maxWidth         : 260, //300,
                    maxHeight        : 260, //400,
                    getContent       : msiFeature.updatePopup,
                    context          : msiFeature,
                    updateOnMapEvents: 'latlngformatchange'
                });
            };
        },

        //***************************************
        //onAdd: function (map)
        //***************************************
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



