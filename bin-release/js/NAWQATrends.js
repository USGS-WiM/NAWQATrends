//Copyright 2013 USGS Wisconsin Internet Mapping(WiM)
//Author: WiM JS Dev Team
//Created: May 17th, 2013	

//This template has been commented heavily for development purposes. Please delete comments before publishing live mapper code.
//Below are all the dojo.require statements needed for this template mapper. These statements import esri and dijit out-of-box functionality. At bottom are custom wimjits being included.
//This list will vary as features are added to mappers and different Dojo, Esri, or WiM tools are used. 

//04.03.2014 - NE - Added new allLayers object with all map layer info. new functions to automate adding of layers and building of available map layers box and explanation. 
//07.16.2013 - NE - Add functionality for adding icon and execute zoom to scale.
//06.19.2013 - NE - Updated to create lat/lng scale bar programmatically after map is created and ready.
//06.18.2013 - TR - Added dojo.Color style to USGSLinks <a> tags
//06.03.2013 - ESM - Adds function to build and display usgs links on user logo click

dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Popup");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.dijit.InfoWindow");
dojo.require("esri.geometry.ScreenPoint");
dojo.require("esri.geometry.webMercatorUtils")
dojo.require("esri.graphic");
dojo.require("esri.layers.graphics");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.map");
dojo.require("esri.renderers.UniqueValueRenderer");
dojo.require("esri.symbol");
dojo.require("esri.tasks.IdentifyParameters");
dojo.require("esri.tasks.IdentifyTask");
dojo.require("esri.tasks.LegendLayer");
dojo.require("esri.tasks.locator");
dojo.require("esri.tasks.PrintParameters");
dojo.require("esri.tasks.PrintTask");
dojo.require("esri.tasks.query");

dojo.require("dijit.form.CheckBox");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.TitlePane");
dojo.require("dijit.Tooltip");

dojo.require("wim.CollapsingContainer-min");
dojo.require("wim.Disclaimer-min");
dojo.require("wim.ExtentNav-min");
dojo.require("wim.LatLngScale-min");
dojo.require("wim.LoadingScreen-min");
dojo.require("wim.RefreshScreen-min");


//various global variables are set here (Declare here, instantiate below)     
var map, legendLayers = [];
var layersObject = [];
var layerArray = [];
var radioGroupArray = [];
var staticLegendImage;
var identifyTask, identifyParams;
var navToolbar;
var locator;

var renderer;
var renderer2;
var orangeBigSymbol;
var greenBigSymbol;
var orangeSmallSymbol;
var greenSmallSymbol;
var blankSymbol;
var noDataSymbol;

var latestHover;

var previousConst = "Chloride";
var OID = "";
var oldValue = "";
var attFieldSpecial = "";

var z = 0;

var legend;

var orgSel;
var inorgSel;

var constObj;

var sucode4FeatureLinkZoom;
     
function init() {
	//sets up the onClick listeners for the USGS logo and help text
	//dojo.connect(dojo.byId("usgsLogo"), "onclick", showUSGSLinks);
	//dojo.connect(dojo.byId("moreInfoButton"), "onclick", showHelpText);
	dojo.connect(dojo.byId('moreInfoButton'), 'onmouseover', dataDocOptions);
	//dojo.connect(dojo.byId("arrowSizeRelative"), "onclick", showConstituentExp);

	// Added for handling of ajaxTransport in IE
    if (!jQuery.support.cors && window.XDomainRequest) {
    var httpRegEx = /^https?:\/\//i;
    var getOrPostRegEx = /^get|post$/i;
    var sameSchemeRegEx = new RegExp('^'+location.protocol, 'i');
    var xmlRegEx = /\/xml/i;

    esri.addProxyRule({
    	urlPrefix: "https://commons.wim.usgs.gov/arcgis/rest/services/Utilities/PrintingTools",
    	proxyUrl: "https://commons.wim.usgs.gov/resource-proxy/proxy.ashx"
    });

    // ajaxTransport exists in jQuery 1.5+
    jQuery.ajaxTransport('text html xml json', function(options, userOptions, jqXHR){
        // XDomainRequests must be: asynchronous, GET or POST methods, HTTP or HTTPS protocol, and same scheme as calling page
        if (options.crossDomain && options.async && getOrPostRegEx.test(options.type) && httpRegEx.test(userOptions.url) && sameSchemeRegEx.test(userOptions.url)) {
            var xdr = null;
            var userType = (userOptions.dataType||'').toLowerCase();
            return {
                send: function(headers, complete){
                    xdr = new XDomainRequest();
                    if (/^\d+$/.test(userOptions.timeout)) {
                        xdr.timeout = userOptions.timeout;
                    }
                    xdr.ontimeout = function(){
                        complete(500, 'timeout');
                    };
                    xdr.onload = function(){
                        var allResponseHeaders = 'Content-Length: ' + xdr.responseText.length + '\r\nContent-Type: ' + xdr.contentType;
                        var status = {
                            code: 200,
                            message: 'success'
                        };
                        var responses = {
                            text: xdr.responseText
                        };

                                try {
                                    if (userType === 'json') {
                                        try {
                                            responses.json = JSON.parse(xdr.responseText);
                                        } catch(e) {
                                            status.code = 500;
                                            status.message = 'parseerror';
                                            //throw 'Invalid JSON: ' + xdr.responseText;
                                        }
                                    } else if ((userType === 'xml') || ((userType !== 'text') && xmlRegEx.test(xdr.contentType))) {
                                        var doc = new ActiveXObject('Microsoft.XMLDOM');
                                        doc.async = true;
                                        try {
                                            doc.loadXML(xdr.responseText);
                                        } catch(e) {
                                            doc = undefined;
                                        }
                                        if (!doc || !doc.documentElement || doc.getElementsByTagName('parsererror').length) {
                                            status.code = 500;
                                            status.message = 'parseerror';
                                            throw 'Invalid XML: ' + xdr.responseText;
                                        }
                                        responses.xml = doc;
                                    }
                                } catch(parseMessage) {
                                    throw parseMessage;
                                } finally {
                                    complete(status.code, status.message, responses, allResponseHeaders);
                                }
                            };
                            xdr.onerror = function(){
                                complete(500, 'error', {
                                    text: xdr.responseText
                                });
                            };
                            xdr.open(options.type, options.url);
                            //xdr.send(userOptions.data);
                            xdr.send();
                        },
                        abort: function(){
                            if (xdr) {
                                xdr.abort();
                            }
                        }
                    };
                }
            });
    };

	jQuery.support.cors = true;

	$.ajax({
        dataType: 'json',
        type: 'GET',
        url: 'https://gis.wim.usgs.gov/arcgis/rest/services/NAWQA/tablesTest/MapServer/4/query?where=OBJECTID+%3E+0&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=ConstituentType,DisplayName&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&f=json',
        headers: {'Accept': '*/*'},
        success: function (data) {
        	constObj = data; 
            $.each(data.features, function(key, value) {
            	if (value.attributes.Constituent != null) {
            		if (value.attributes.ConstituentType == 'inorganic' && value.attributes.Tableorder == "Mappable") {
						$('#inorganicConstituentSelect')
		         			.append($("<option></option>")
		         			.attr(value.attributes)
		         			.text(value.attributes.DisplayName));
		         			//.attr({"value": value.attributes.Constituent, "description": value.attributes.Description})
		         		//$('#constitExp').html("Inorganic text<br/>*For " + value.attributes.DisplayName + ", " + value.attributes.Description);
		         		if (value.attributes.DisplayName == "Chloride") {
		         			$('#constitExp').html("<p>" + value.attributes.GenDescSmallChg + "</p>" +
								"<p>" + value.attributes.GenDescLargeChg + "</p>" +
								"<p>" + value.attributes.GenDescBenchmark + "</p>");
		         		}
            		} else if (value.attributes.ConstituentType == 'organic' && value.attributes.Tableorder == "Mappable") {
            		  	$('#organicConstituentSelect')
		         			.append($("<option></option>")
		         			.attr(value.attributes)
		         			.text(value.attributes.DisplayName));
		         			//.attr({"value": value.attributes.Constituent, "description": value.attributes.Description})
		         	}
	            	/*$('#constituentSelect')
	         			.append($("<option></option>")
	         			.attr(value.attributes)
	         			.text(value.attributes.DisplayName));
	         			//.attr({"value": value.attributes.Constituent, "description": value.attributes.Description})
	         		$('#constitExp').html("*"+value.attributes.Description);*/
	         	}
			});
			orgSel = $("#organicConstituentSelect");
			inorgSel = $("#inorganicConstituentSelect");
			inorgSel.val("Chloride");
			orgSel.hide();

		},
        error: function (error) {
            console.log("Error processing the JSON. The error is:" + error);
        }
    });

	// a popup is constructed below from the dijit.Popup class, which extends some addtional capability to the InfoWindowBase class.
	var popup = new esri.dijit.Popup({},dojo.create("div"));

	
	//IMPORANT: map object declared below. Basic parameters listed here. 
	//String referencing container id for the map is required (in this case, "map", in the parens immediately following constructor declaration).
	//Default basemap is set using "basemap" parameter. See API reference page, esri.map Constructor Detail section for parameter info. 
	//For template's sake, extent parameter has been set to contiguous US.
	//sliderStyle parameter has been commented out. Remove comments to get a large slider type zoom tool (be sure to fix CSS to prevent overlap with other UI elements)
	//infoWindow parameter sets what will be used as an infoWindow for a map click. 
	//If using FeatureLayer,an infoTemplate can be set in the parameters of the FeatureLayer constructor, which will automagically generate an infoWindow.	 
	map = new esri.Map("map", {
    	basemap: "topo",
		wrapAround180: true,
		extent: new esri.geometry.Extent({xmin:-14580516.019450117,ymin:2072972.2070934423,xmax:-5618427.327072154,ymax:7527518.54552217,spatialReference:{wkid:102100}}), 
		slider: true,
		sliderStyle: "small", //use "small" for compact version, "large" for long slider version
		logo:false,
		infoWindow: popup,
		lods: [
		 	{"level" : 4, "resolution" : 9783.93962049996, "scale" : 36978595.474472},
		 	{"level" : 5, "resolution" : 4891.96981024998, "scale" : 18489297.737236},
		 	{"level" : 6, "resolution" : 2445.98490512499, "scale" : 9244648.868618},
			{"level" : 7, "resolution" : 1222.99245256249, "scale" : 4622324.434309},
			{"level" : 8, "resolution" : 611.49622628138, "scale" : 2311162.217155},
			{"level" : 9, "resolution" : 305.748113140558, "scale" : 1155581.108577},
			{"level" : 10, "resolution" : 152.874056570411, "scale" : 577790.554289},
			{"level" : 11, "resolution" : 76.4370282850732, "scale" : 288895.277144}
		]
	});

	$("#dataDocWrap").hide();
	$("#moreInfoButton").hoverIntent(function(){ $("#dataDocWrap").slideDown(300); }, function() { $("#dataDocWrap").slideUp(30); });

	$("#userGuideWrap").hide();
	$("#userGuideButton").hoverIntent(function(){ $("#userGuideWrap").slideDown(300); }, function() { $("#userGuideWrap").slideUp(300); });

	//navToolbar constructor declared, which serves the extent navigator tool.
    navToolbar = new esri.toolbars.Navigation(map);
	
	//dojo.connect method (a common Dojo framework construction) used to call mapReady function. Fires when the first or base layer has been successfully added to the map.
    dojo.connect(map, "onLoad", mapReady);
	dojo.connect(map, "onExtentChange", function() {
		//map level check for limiting zoom on geocodes
		console.log(map.getLevel());
		console.log(map.getScale());
		var level = map.getLevel();
		if (level > 11) {
			map.setLevel(11);
		}
	});

	showIntro();
	
	//basemapGallery constructor which serves the basemap selector tool. List of available basemaps can be customized. Here,default ArcGIS online basemaps are set to be available.
	var basemapGallery = new esri.dijit.BasemapGallery({
		showArcGISBasemaps: true,
		map: map
	}, "basemapGallery"); 
	basemapGallery.startup();
	
	dojo.connect(basemapGallery, "onLoad", function() {
		console.log('loaded basemapGallery')
		var basemapUpdate = dojo.connect(basemapGallery, "onSelectionChange", function() {
			if (basemapGallery.getSelected().id == "basemap_3") {
				$(".headerTab").show();
				dojo.disconnect(basemapGallery, basemapUpdate);
				$("#loadingScreen").hide();

				//new function to close gallery when basemap clicked
				dojo.connect(basemapGallery, "onSelectionChange", function() {
					$("#basemapSelector .dijitTitlePaneTitle").click();
				});
			}
		});
		basemapGallery.select("basemap_3");
	});

	var infoWindowClose = dojo.connect(map.infoWindow, "onHide", function(evt) {
		map.graphics.clear();
		map.getLayer("trendSites").setVisibility(false);
		dojo.disconnect(map.infoWindow, infoWindowClose);
	});

	$(window).resize(function () {
        maxLegendHeight =  $('#map').height() - $('#availableLayers').height() - 227;
        //$('#legend').css('height', maxLegendHeight);
        $('#legend').css('max-height', maxLegendHeight);

        var maxHeaderWidth = $(window).width() - $("#usgsLogoDiv").width() - 50;
        $("#title").css('max-width', maxHeaderWidth);
        $("#subTitle").css('max-width', maxHeaderWidth);
    });

	//basemapGallery error catcher
	dojo.connect(basemapGallery, "onError", function() {console.log("Basemap gallery failed")});
	
	//calls the executeSiteIdentifyTask function from a click on the map. 
	dojo.connect(map, "onClick", executeSiteIdentifyTask);

	dojo.connect(dojo.byId("printButton"), "onclick", printMap);

	var defaultSymbol = null;

	var count = 2;

	renderer = new esri.renderer.UniqueValueRenderer(defaultSymbol, "network_centroids.P00940_Chloride");
	renderer2 = new esri.renderer.UniqueValueRenderer(defaultSymbol);

	orangeBigSymbol = new esri.symbol.PictureMarkerSymbol("https://nawqatrends.wim.usgs.gov/nawqaimages/orange_large.png", 45, 45);
	greenBigSymbol = new esri.symbol.PictureMarkerSymbol("https://nawqatrends.wim.usgs.gov/nawqaimages/green_large.png", 45, 45);
	noChangeSymbolSmall = new esri.symbol.PictureMarkerSymbol("https://nawqatrends.wim.usgs.gov/nawqaimages/no_change.png", 45, 25);
	noChangeSymbolLarge = new esri.symbol.PictureMarkerSymbol("https://nawqatrends.wim.usgs.gov/nawqaimages/no_change.png", 75, 40);
	orangeSmallSymbol = new esri.symbol.PictureMarkerSymbol("https://nawqatrends.wim.usgs.gov/nawqaimages/orange_small.png", 45, 25);
	greenSmallSymbol = new esri.symbol.PictureMarkerSymbol("https://nawqatrends.wim.usgs.gov/nawqaimages/green_small.png", 45, 25);
	blankSymbol = new esri.symbol.PictureMarkerSymbol("https://nawqatrends.wim.usgs.gov/nawqaimages/blank.png", 45, 25);
	noDataSymbol = new esri.symbol.PictureMarkerSymbol("https://nawqatrends.wim.usgs.gov/nawqaimages/no_data.png", 45, 25);

	renderer.addValue({
		value: "2", 
		symbol: orangeBigSymbol,
		label: "Large increase"
	});
    renderer.addValue({
		value: "1", 
		symbol: orangeSmallSymbol,
		label: "Small increase"
	});
    /*renderer.addValue({
    	value: "0", 
    	symbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 9,
							new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
							new dojo.Color([155,155,155,0]), 0),
							new dojo.Color([0,0,0,1])),
    	label: "No change"
    });*/
	renderer.addValue({
		value: "0",
		symbol: noChangeSymbolSmall,
		label: "No significant change"
	});
    renderer.addValue({
		value: "-1", 
		symbol: greenSmallSymbol,
		label: "Small decrease"
	});
    renderer.addValue({
		value: "-2", 
		symbol: greenBigSymbol,
		label: "Large decrease"
	});
	renderer.addValue({
		value: "-999", 
		symbol: noDataSymbol,
		label: "Trend data not available"
	});
	
	renderer2.addValue({
		value: "1", 
		symbol: orangeSmallSymbol,
		label: "Increase"
	});
    /*renderer2.addValue({
    	value: "0", 
    	symbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 9,
							new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
							new dojo.Color([0,0,0]), 1),
							new dojo.Color([0,0,0,1])),
    	label: "No change"
    });*/
	renderer2.addValue({
		value: "0",
		symbol: noChangeSymbolSmall,
		label: "No significant change"
	});
    renderer2.addValue({
		value: "-1", 
		symbol: greenSmallSymbol,
		label: "Decrease"
	});
	renderer2.addValue({
		value: "-999", 
		symbol: noDataSymbol,
		label: "Trend data not available"
	});

	//This object contains all layer and their ArcGIS and Wim specific mapper properties (can do feature, wms and dynamic map layers)
	allLayers = {
			"Magnitude of change" : {
				"url": "https://gis.wim.usgs.gov/arcgis/rest/services/NAWQA/tablesTest/MapServer/0",
				"arcOptions": {
					"opacity": 1,
					"visible": true,
					"outFields": "*",
					"mode": esri.layers.FeatureLayer.MODE_ONDEMAND,
					"orderByFields": [ "network_centroids.P00940_Chloride DESC" ],
					"id": "networkLocations"
				},
				"wimOptions": {
					"type": "layer",
					"layerType": "agisFeature",
					"includeInLayerList": true,
					"hasMoreInfo": true,
					"moreInfoText": "Click on network arrow or dot for more information",
					"renderer": renderer
				}
			}, "": {
				"wimOptions": {
					"type": "heading",
					"includeInLayerList": true
				}
			}, "____________________________________": {
				"wimOptions": {
					"type": "heading",
					"includeInLayerList": true
				}
			}, "Land use 2001" : {
				"url": "https://www.mrlc.gov/arcgis/rest/services/LandCover/USGS_EROS_LandCover_NLCD/MapServer",
				"visibleLayers": [24],
				"arcOptions": {
					"opacity": 0.75,
					"visible": false,
					"id": "nlcd"
				},
				"wimOptions": {
					"type": "layer",
					"includeInLayerList": true,
					"includeLegend": true,
					"hasMoreInfo": false
				}
			}, "Network Boundaries" : {
				"url": "https://gis.wim.usgs.gov/arcgis/rest/services/NetworkBoundaries/MapServer",
				"visibleLayers": [0],
				"arcOptions": {
					"opacity": 0.75,
					"visible": true,
					"id": "networks"
				},
				"wimOptions": {
					"type": "layer",
					"includeInLayerList": true,
					"includeLegend": false,
					"hasMoreInfo": true,
					"moreInfoText": "A network is a set of 20 to 30 wells selected to represent water-quality conditions in a given geographical area, aquifer, and in some cases, a specific land use. A network resampled at approximately 10-year intervals is a decadal trend network"
				}
			}, /*"Principal Aquifers" : {
				"url": "https://nawqatrends.wim.usgs.gov/arcgis/rest/services/NAWQA/DecadalMap/MapServer",
				"visibleLayers": [1],
				"arcOptions": {
					"opacity": 0.7,
					"visible": true
				},
				"wimOptions": {
					"type": "layer",
					"includeInLayerList": true,
					"esriLegendLabel": false
				}
			}, */"Trend sites" : {
				"url": "https://gis.wim.usgs.gov/arcgis/rest/services/NAWQA/trendSites/MapServer",
				"arcOptions": {
					"opacity": 1.0,
					"visible": false,
					"id": "trendSites"
				},
				"wimOptions": {
					"type": "layer",
					"includeInLayerList": false,
					"includeLegend": false,
					"hasMoreInfo": false,
					"moreInfoText": "place holder text"
				}
			}, "Principal Aquifers" : {
				"url": "https://nwismapper.s3.amazonaws.com/pr_aq/${level}/${row}/${col}.png",
				"arcOptions": {
					"id": "principalAquifers",
					"visible": false,
					"opacity": 0.5
				},
				"wimOptions": {
					"type": "layer",
					"layerType": "webTiledLayer",
					"includeInLayerList": true,
					"includeLegend": false,
					"hasMoreInfo": true,
					"moreInfoText": "Click on a principal aquifer to get more info",
					"otherLayer": "glacialAquifer"
				}
			}, "Glacial Aquifer" : {
				"url": "https://gis.wim.usgs.gov/arcgis/rest/services/NAWQA/tablesTest/MapServer",
				"visibleLayers": [2],
				"arcOptions": {
					"opacity": 0.4,
					"visible": false,
					"id": "glacialAquifer"
				},
				"wimOptions": {
					"type": "layer",
					"includeInLayerList": false,
					"includeLegend": false 
				}
			}
		};


	//this function fires after all layers have been added to map with the map.addLayers method above.
	//this function creates the legend element based on the legendLayers array which contains the relevant data for each layer. 
	dojo.connect(map,'onLayersAddResult',function(results){
		$("#legendDiv").hide();

		legendLayers[0].title = "Magnitude of change";

		legend = new esri.dijit.Legend({
			map:map,
			autoUpdate: true,
			layerInfos:legendLayers
		},"legendDiv");
		legend.startup();
		
		$(".esriSimpleSliderIncrementButton").attr("title", "zoom in");
		$(".esriSimpleSliderDecrementButton").attr("title", "zoom out");

		//this is to keep the select symbol from blocking clicks on the trend arrows
		map.reorderLayer(map.getLayer("moLayer"), 0);
	
		//this counter to track first and last of items in legendLayers
		var i = 0;
		var lastItem = layersObject.length;
		//this forEach loop generates the checkbox toggles for each layer by looping through the legendLayers array (same way the legend element is generated). 
		dojo.forEach (layersObject, function(layer){
			
			var layerName = layer.title;
				
			if (layer.layer != "heading") {
				
				if (layer.toggleType == "radioParent"){
						
					var radioParentCheck = new dijit.form.CheckBox({
						name: "radioParentCheck" + layer.group,
						id: "radioParentCheck_" + layer.group,
						params: {group: layer.group},
						onChange: function(evt){
							var radChildLayers = [];
							var grp = this.params.group;
							dojo.forEach (layersObject, function (layer){
								if (grp == layer.group && layer.toggleType != "radioParent"  ){
									radChildLayers.push(layer.layer);
								}
							});
							if (!this.checked){
								dojo.forEach (radChildLayers, function (layer){
									layer.setVisibility(false);
								});	
								var divs = dojo.query("." + grp);
								for(var i = 0; i < divs.length; i++) {
									divs[i].style.display= "none";  
								}
							} 
							if (this.checked){
								var divs = dojo.query("." + grp);
								for(var i = 0; i < divs.length; i++) {
								    divs[i].style.display= "block"; 
								}
								dojo.forEach (radChildLayers, function (layer){
									if (dojo.byId("radioButton"+layer.id).checked) {
										layer.setVisibility(true);
									}
								});
							}
							//Check radio buttons in this group to see what's visible
							//jquery selector to get based on group name and then loop through
							/*var checkLayer = map.getLayer(this.value);
							checkLayer.setVisibility(!checkLayer.visible);
							this.checked = checkLayer.visible;	*/
						}
					});
					var toggleDiv = dojo.doc.createElement("div");			
					dojo.place(toggleDiv,dojo.byId("toggle"), "after" );
					dojo.place(radioParentCheck.domNode,toggleDiv,"first");
					dojo.setStyle(toggleDiv, "paddingLeft", "15px");
					if (i == 0) {
						dojo.setStyle(toggleDiv, "paddingBottom", "10px");
					} else if (i == lastItem) {
						dojo.setStyle(toggleDiv, "paddingTop", "10px");
					}
					var radioParentCheckLabel = dojo.create('label',{'for':radioParentCheck.name,innerHTML:layerName},radioParentCheck.domNode,"after");
					dojo.place("<br/>",radioParentCheckLabel,"after");

				} else if (layer.toggleType == "radio") {
						
					var radioButton = new dijit.form.RadioButton({
						name: layer.group,
						id: "radioButton" + layer.layer.id,
						value:layer.layer.id,
						checked:layer.layer.visible,
						params: {group: layer.group},
						onChange:function(evt){
							var radioLayer = map.getLayer(this.value);
							var parentID = "radioParentCheck_" + layer.group;
							(this.checked && dijit.byId(parentID).checked) ? radioLayer.setVisibility(true) : radioLayer.setVisibility(false);						
						}
					});
					var toggleDiv = dojo.doc.createElement("div");
					dojo.place(toggleDiv,dojo.byId("toggle"), "after" );
					dojo.place(radioButton.domNode,toggleDiv,"first");
					dojo.setAttr(toggleDiv, "class", radioButton.params.group);
					dojo.setStyle(toggleDiv, "paddingLeft", "15px");
					dojo.setStyle(toggleDiv, "display", "none");
					if (i == 0) {
						dojo.setStyle(toggleDiv, "paddingBottom", "10px");
					} else if (i == lastItem) {
						dojo.setStyle(toggleDiv, "paddingTop", "10px");
					}
					var radioLabel = dojo.create('label',{'for':radioButton.name,innerHTML:layerName},radioButton.domNode,"after");
					dojo.place("<br/>",radioLabel,"after");
					
				} else {

					var checkBox = new dijit.form.CheckBox({
						id:"checkBox" + layer.layer.id,
						name:"checkBox" + layer.layer.id,
						value:layer.layer.id,
						text:layerName,
						checked:layer.layer.visible,
						onChange:function(evt){
							var checkLayer = map.getLayer(this.value);
							checkLayer.setVisibility(!checkLayer.visible);
							this.checked = checkLayer.visible;
							if (allLayers[layerName].wimOptions.otherLayer) {
								var otherLayer = map.getLayer(allLayers[layerName].wimOptions.otherLayer);
								otherLayer.setVisibility(checkLayer.visible);
							}
							if (allLayers[layerName].wimOptions.includeLegend == true && allLayers[layerName].wimOptions.staticLegendOptions.hasStaticLegend == true) {
								if (checkLayer.visible) {
									$("#" + layer.layer.id + "Legend").show();
								} else {
									$("#" + layer.layer.id + "Legend").hide();
								}
								
							}				
						}
					});

					if (allLayers[layerName].wimOptions.zoomScale) {
						//create the holder for the checkbox and zoom icon
						var toggleDiv = dojo.doc.createElement("div");
						dojo.place(toggleDiv,dojo.byId("toggle"),"after");
						dojo.place(checkBox.domNode,toggleDiv,"first");

						var checkLabel = dojo.create('label',{'for':checkBox.name,innerHTML:layerName},checkBox.domNode,"after");
						var scale = allLayers[layerName].wimOptions.zoomScale;
						var zoomImage = dojo.doc.createElement("div");
						zoomImage.id = 'zoom' + layer.layer.id;
						zoomImage.innerHTML = '<img id="zoomImage" style="height: 18px;width: 18px" src="images/zoom.gif" />';
						dojo.connect(zoomImage, "click", function() {
							if (map.getScale() > scale) {
								map.setScale(scale);;
							}
						});
						dojo.place(zoomImage,toggleDiv,"last");
						dojo.setStyle(checkBox.domNode, "float", "left");
						dojo.setStyle(toggleDiv, "paddingLeft", "15px");
						dojo.setStyle(checkLabel, "float", "left");
						dojo.setStyle(toggleDiv, "paddingTop", "5px");
						dojo.setStyle(dojo.byId("zoomImage"), "paddingLeft", "10px");
						dojo.setStyle(toggleDiv, "height", "25px");
						if (i == 0) {
							dojo.setStyle(toggleDiv, "paddingBottom", "10px");
						} else if (i == lastItem) {
							dojo.setStyle(toggleDiv, "paddingTop", "10px");
						}
						dojo.place("<br/>",zoomImage,"after");
					} else {
						var toggleDiv = dojo.doc.createElement("div");
						dojo.addClass(toggleDiv, "toggleDiv");
						dojo.setStyle(toggleDiv, "verticalAlign", "middle");
						dojo.place(toggleDiv,dojo.byId("toggle"),"after");
						//dojo.place(checkBox.domNode,toggleDiv,"first");

						//testing with table
						var table = dojo.doc.createElement("table");
						$(table).addClass('layerTable');
						if (allLayers[layerName].wimOptions.hasMoreInfo == false) {
							$(table).addClass('noInfo');
						}
						var rowOne = dojo.doc.createElement("tr");
						
						var colOne = dojo.doc.createElement("td");
						dojo.place(checkBox.domNode,colOne);
						dojo.place(colOne,rowOne);

						//var checkLabel = $("<label>").text(layerName);
						var checkboxLabel = layerName;
						if (layerName == "Magnitude of change") {
							checkboxLabel = "Change in Network Concentrations";
						}
						var checkLabel = dojo.doc.createElement("label");
						checkLabel.innerHTML = checkboxLabel;
						var colTwo = dojo.doc.createElement("td");
						dojo.place(checkLabel,colTwo);
						dojo.place(colTwo,rowOne);

						dojo.place(rowOne,table);

						dojo.place(table,dojo.byId("toggle"),"first");
						//end testing

						if (allLayers[layerName].wimOptions.hasMoreInfo == true) {
							//var infoIcon = $('<i class="fa fa-info-circle"></i>');
							var infoIcon = dojo.doc.createElement("i");
							$(infoIcon).addClass('fa');
							$(infoIcon).addClass('fa-info-circle');
							$(infoIcon).addClass('infoClick');
							$(infoIcon).attr("title", "click for more info");
							$(checkLabel).addClass('infoClick');
							//var infoIcon = dojo.doc.createElement("img");
							//infoImage.src = "./images/help_tip.png";
							var toolTip = allLayers[layerName].wimOptions.moreInfoText;
							//infoIcon.title = allLayers[layerName].wimOptions.moreInfoText;
							/*$(rowOne).click(function (evt) {
								showToolTip(evt, toolTip);
							});*/
							/*$(infoIcon).mouseover(function (evt) {
								window.setTimeout(function() {
									showToolTip(evt);
								}, 1000);
							});*/
							var colThree = dojo.doc.createElement("td");
							dojo.place(infoIcon,colThree);
							dojo.place(colThree,rowOne);

							$(colTwo).click(function (evt) {
								showToolTip(evt, toolTip);
							});

							$(colThree).click(function (evt) {
								showToolTip(evt, toolTip);
							});
						}

						function showToolTip(evt, toolTip) {
							if (!dojo.byId('iconToolTip')){
								var toolTipDiv = dojo.doc.createElement("div");
								toolTipDiv.id = 'iconToolTip';
								//LINKS BOX HEADER TITLE HERE
								toolTipDiv.innerHTML = '<div class="toolTip"><b>' + toolTip + '</b></div>';

								//place the new div at the click point minus 5px so the mouse cursor is within the div
								toolTipDiv.style.top =  evt.clientY-5 + 'px';
								toolTipDiv.style.right = $("#map").width() - evt.clientX - 5 + 'px';

								//add the div to the document
								dojo.byId('map').appendChild(toolTipDiv);

								dojo.connect(dojo.byId("iconToolTip"), "onmouseleave", removeToolTip);
							}
						}

					}
					
				}
			} else {
				var headingDiv = dojo.doc.createElement("div");
				headingDiv.innerHTML = layer.title;
				//dojo.place(headingDiv,dojo.byId("toggle"),"after");
				dojo.place(headingDiv,dojo.byId("toggle"),"first");
				dojo.setStyle(headingDiv, "paddingTop", "10px");
				dojo.setStyle(headingDiv, "dojo.Color", "#D3CFBA");
				if (i == 0) {
					dojo.setStyle(headingDiv, "paddingBottom", "10px");
				} else if (i == lastItem) {
					dojo.setStyle(headingDiv, "paddingTop", "10px");
				}
			}
			i++;
		});
		
		//function to handle styling adjustments to the esri legend dijit
		setTimeout(function(){
			$.each($('div[id^="legendDiv_"]'), function (index, item) {
				for (layer in allLayers) {
					if (layer == $('#'+item.id+' span').html()) {
						if (allLayers[layer].wimOptions.esriLegendLabel !== undefined && allLayers[layer].wimOptions.esriLegendLabel == false) {
							$('#'+item.id+' table.esriLegendLayerLabel').remove();
						}
					}
				}
			});
			$("#legendDiv").show();

			maxLegendHeight =  $('#map').height() - $('#availableLayers').height() - 227;
    		$('#legend').css('max-height', maxLegendHeight);

    	
		}, 1000);
		
	});
	
	addAllLayers();
	
	//OPTIONAL: the below remaining lines within the init function are for performing an identify task on a layer in the mapper. 
	// the following 7 lines establish an IdentifyParameters object(which is an argument for an identifyTask.execute method)and specifies the criteria used to identify features. 
	// the constructor of the identifyTask is especially important. the service URL there should match that of the layer from which you'd like to identify.
	identifyParams = new esri.tasks.IdentifyParameters();
    identifyParams.tolerance = 10;
    identifyParams.returnGeometry = true;
    identifyParams.maxAllowableOffset = 1000;
    identifyParams.layerOption = "LAYER_OPTION_ALL";
    identifyParams.width  = map.width;
    identifyParams.height = map.height;
    //identifyTask = new esri.tasks.IdentifyTask("http://nawqatrends.wim.usgs.gov/arcgis/rest/services/NAWQA/DecadalMap/MapServer");
    identifyTask = new esri.tasks.IdentifyTask(map.getLayer("networks").url);

    dojo.connect(map.getLayer("networkLocations"), "onClick", function(evt) {
    	
    	map.getLayer("moLayer").clear();

    	console.log('clicked a feature');	
    	var feature = evt.graphic;
		var attr = feature.attributes;
		//alert('hovered');

		if (dojo.byId("organicButton").checked) {
			select = dojo.byId("organicConstituentSelect");
		} else if (dojo.byId("inorganicButton").checked) {
			select = dojo.byId("inorganicConstituentSelect");
		}

		var trendSitesLayer = map.getLayer("trendSites");

		trendSitesLayer.setVisibility(true);
		var tsLayerDefs = [];
		tsLayerDefs[0] = "SuCode = '" + attr["network_centroids.SUCode"] + "'";
		trendSitesLayer.setLayerDefinitions(tsLayerDefs);
		trendSitesLayer.refresh();
		
		//var currentConst = organicConstituentSelect.selectedOptions[0].attributes.constituent.value;
		var currentConst = select[select.selectedIndex].attributes.constituent.value;
		//var displayConst = organicConstituentSelect.selectedOptions[0].attributes.displayname.value;
		var displayConst = select[select.selectedIndex].attributes.displayname.value;

		sucode4FeatureLinkZoom = attr["network_centroids.SUCode"];

		var attField;
		var mapFields = map.getLayer("networkLocations").fields;
		$.each(mapFields, function(index, value) {
			if (mapFields[index].name.toLowerCase().indexOf(select[select.selectedIndex].attributes.constituent.value.toLowerCase()) != -1) {
				attField = mapFields[index].name;
			}
		});

		var depth25 = attr["tbl_Networks.Depth25thpercentile"];
		var depth75 = attr["tbl_Networks.Depth75thpercentile"];

    	var template = new esri.InfoTemplate("<span class='infoTitle'>*click and drag this area to reposition table</span>",
			"<table class='infoTable'><tr><td><b>" + displayConst + "</b></td><td><span class='" + camelize(getValue(attr[attField])) + "'>" + getValue(attr[attField]) + "</span></td></tr>" +
			
			"<tr><td><div class='tableSpacer'></div></td><td></td></tr>" +
			
			"<tr><td><b>Network type</b></td><td>" + networkTypeFind(attr["network_centroids.NETWORK_TYPE"]) + "</td></tr>" +
			"<tr><td><b>Types of wells</b></td><td>${tbl_Networks.WellTypeDesc}</td></tr>" +
			"<tr><td><b>Typical depth range</b></td><td>" + checkSigFigs(depth25) + " to " + checkSigFigs(depth75) + " feet</td></tr>" +

			"<tr><td><div class='tableSpacer'></div></td><td></td></tr>" +
			
			"<tr><td><b>Principal aquifer</b></td><td>${tbl_Networks.PrincipleAquifer}</td></tr>" +
			"<tr><td><b>Regional aquifer</b></td><td>${tbl_Networks.RegionalAquifer}</td></tr>" +
			"<tr><td><b>Aquifer material</b></td><td>${tbl_Networks.AquiferMaterial}</td></tr>" +

			"<tr><td><div class='tableSpacer'></div></td><td></td></tr>" +
			
			"<tr><td><b>Additional information</b></td><td>${tbl_Networks.AdditionalInfo}</td></tr>" +
			"<tr><td><b>NAWQA network code</b></td><td>${tbl_Networks.SUCode}</td></tr>" +
			"<tr><td><b>Sample dates (1<sup>st</sup>, 2<sup>nd</sup>)</b></td><td>${tbl_NetworkDates.FirstDecadalSample}, ${tbl_NetworkDates.SecondDecadalSample}</td></tr>" +
			
			"<tr><td><div class='tableSpacer'></div></td><td></td></tr>" +
			
			"<tr><td colspan='2' align='center'><b><a id='infoWindowLink' href='javascript:linkClick()'>ZOOM TO NETWORK</a></b></td></tr>" + 
			"<tr><td colspan='2' align='center'><a href='javascript:showTermExp()'>For explanation of table entries click here</a></td></tr></table>");

    	//var template = new esri.InfoTemplate("Trends Info","<p><a id='infoWindowLink' href='javascript:void(0)'>Zoom to Network</a></p>");
			
		//ties the above defined InfoTemplate to the feature result returned from a click event	
        
        feature.setInfoTemplate(template);

        map.infoWindow.setFeatures([feature]);

        map.infoWindow.show(evt.mapPoint);
        map.infoWindow.resize(400,400);

        OID = feature.attributes["network_centroids.OBJECTID"];
        oldValue = getValue(attr[attField]);

        require([
	    'esri/arcgis/utils',
	    'dojo/dnd/Moveable',
	    'dojo/query',
	    'dojo/on',
	    'dojo/dom-class'
		], function (
		    arcgisUtils,
		    Moveable,
		    query,
		    on,
		    domClass
		) {
		    var arrowNode =  query(".outerPointer", map.infoWindow.domNode)[0];
	        domClass.add(arrowNode, "hidden");
	            
	        var arrowNode =  query(".pointer", map.infoWindow.domNode)[0];
	        domClass.add(arrowNode, "hidden");
		});

        setCursorByID("mainDiv", "default");
        map.setCursor("default");

        function checkSigFigs(value) {
        	var outVal;

        	var splitVal = value.toString().split('.');

        	if ((splitVal[1] != null || splitVal[1] != undefined) && splitVal[1].length > 2) {
        		outVal = value.toFixed(2);
        	} else {
        		outVal = value;
        	}

        	return outVal;
        }

	});

	var mouseoverHighlight = dojo.connect(map.getLayer("networkLocations"), "onMouseOver", function(evt) {
    	
    	console.log('hovered over a feature');

    	if (map.infoWindow.isShowing == false) {
	    	//map.graphics.clear();
	    	console.log(map.infoWindow.count);
	    	map.getLayer("moLayer").clear();

	    	var path = "M 749,412 795,412 795,458 749,458 749,412 M 742,435 749,435 M 772,405 772,412 M 802,435 795,435 M 772,465 772,458";

	    	var markerSymbol = new esri.symbol.SimpleMarkerSymbol();
	        markerSymbol.setPath(path);
	       
	        //markerSymbol.setColor(new Color(color));
	        markerSymbol.setOutline(null);
	        markerSymbol.setSize("32");
	        markerSymbol.setColor(new dojo.Color([0,0,0,0.0]));
	        markerSymbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
	  								new dojo.Color([0,255,255]), 
	  								2));

	        var highlight = new esri.Graphic();
	        latestHover = evt;
	        highlight.geometry = evt.graphic.geometry;
	        highlight.setSymbol(markerSymbol);

	        map.getLayer("moLayer").add(highlight);
	        //map.graphics.add(highlight);
	    }

	});

	function networkTypeFind(networkType) {
    	var networkText;

    	if (networkType == "URB") {
    		networkText = "Urban land use network";
    	} else if (networkType == "SUS") {
    		networkText = "Major aquifer study";
    	} else if (networkType == "AG") {
    		networkText = "Agricultural land use network";
    	}

    	return networkText;
    }

	function setCursorByID(id,cursorStyle) {
	 	var elem;
		 if (document.getElementById &&
		    (elem=document.getElementById(id)) ) {
		  	if (elem.style) elem.style.cursor=cursorStyle;
		 }
	}

	//OPTIONAL: the following function carries out an identify task query on a layer and returns attributes for the feature in an info window according to the 
	//InfoTemplate defined below. It is also possible to set a default info window on the layer declaration which will automatically display all the attributes 
	//for the layer in the order they come from the table schema. This code below creates custom labels for each field and substitutes in the value using the notation ${[FIELD NAME]}. 
    function executeSiteIdentifyTask(evt) {

    	map.graphics.clear();

    	identifyParams.geometry = evt.mapPoint;
        identifyParams.mapExtent = map.extent;
       
	    // the deferred variable is set to the parameters defined above and will be used later to build the contents of the infoWindow.
	    
        var deferredResult = identifyTask.execute(identifyParams);

        setCursorByID("mainDiv", "wait");
        map.setCursor("wait");

        //getAquifer(evt.mapPoint);

        deferredResult.addCallback(function(response) {     
            
            if (response.length > 0 && map.getLayer("networks").visible) {

            	var feature = response[0].feature;
            	var networkFeature = response[0].feature;
		        var attr = feature.attributes;

				var featureLayer = map.getLayer("networkLocations");
				var sucode = attr.SUCODE;

				// Code for adding network highlight
				var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
				    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
				    new dojo.Color([98,194,204]), 2), new dojo.Color([98,194,204,0.5])
				);
				feature.geometry.spatialReference = map.spatialReference;
				var graphic = feature;
				graphic.setSymbol(symbol);

				map.graphics.add(graphic);

				// Begin query on networks centroid to get attributes for network popup
				var featureQuery = new esri.tasks.Query();
				featureQuery.returnGeometry = true;

				featureQuery.outFields = ["*"];
				featureQuery.where = "network_centroids.SUCode = '" + sucode + "'";

				featureLayer.queryFeatures(featureQuery, function(featureSet) {
					//set the customized template for displaying content in the info window. HTML tags can be used for styling.
					// The string before the comma within the parens immediately following the constructor sets the title of the info window.
		        	var attr = featureSet.features[0].attributes;

	        		//var currentConst = organicConstituentSelect.selectedOptions[0].attributes.constituent.value;
	        		//var displayConst = organicConstituentSelect.selectedOptions[0].attributes.displayname.value;

		        	/*var template = new esri.InfoTemplate("Trends Info: " + attr["tbl_Networks.SUCode"],
						"<b>Network type:</b> " + networkTypeFind(attr["network_centroids.NETWORK_TYPE"]) + "<br/>"+
						"<p><b>Description:</b> " + attr["tbl_Networks.NetDescMedium"] + "<br/><br/>" +
						"<b>Well type:</b></p>" +
						"<br/><p><a id='infoWindowLink' href='javascript:void(0)'>Zoom to Network</a></p>");*/

					var depth25 = attr["tbl_Networks.Depth25thpercentile"];
					var depth75 = attr["tbl_Networks.Depth75thpercentile"];

		        	var template = new esri.InfoTemplate("<span class='infoTitle'>*click and drag this area to reposition table</span>",
						"<table class='infoTable'><tr><td><b>Network type</b></td><td>" + networkTypeFind(attr["network_centroids.NETWORK_TYPE"]) + "</td></tr>" +
						"<tr><td><b>Types of wells</b></td><td>" + attr["tbl_Networks.WellTypeDesc"] + "</td></tr>" +
						"<tr><td><b>Typical depth range</b></td><td>" + checkSigFigs(depth25) + " to " + checkSigFigs(depth75) + " feet</td></tr>" +

						"<tr><td><div class='tableSpacer'></div></td><td></td></tr>" +

						"<tr><td><b>Principal aquifer</b></td><td>" + attr["tbl_Networks.PrincipleAquifer"] + "</td></tr>" +
						"<tr><td><b>Regional aquifer</b></td><td>" + attr["tbl_Networks.RegionalAquifer"] + "</td></tr>" +
						"<tr><td><b>Aquifer material</b></td><td>" + attr["tbl_Networks.AquiferMaterial"] + "</td></tr>" +

						"<tr><td><div class='tableSpacer'></div></td><td></td></tr>" +

						"<tr><td><b>Additional information</b></td><td>" + attr["tbl_Networks.AdditionalInfo"] + "</td></tr>" +
						"<tr><td><b>NAWQA network code</b></td><td>" + attr["tbl_Networks.SUCode"] + "</td></tr>" +

						"<tr><td><div class='tableSpacer'></div></td><td></td></tr>" +

						"<tr><td colspan='2' align='center'><b><a id='infoWindowLink' href='javascript:void(0)'>ZOOM TO NETWORK</a></b></td></tr>" +
						"<tr><td colspan='2' align='center'><a href='javascript:showTermExp()'>For explanation of table entries click here</a></td></tr></table>");


					//ties the above defined InfoTemplate to the feature result returned from a click event

		            feature.setInfoTemplate(template);

		            map.infoWindow.setFeatures([feature]);
		            map.infoWindow.resize(400,400);
		            map.infoWindow.show(evt.mapPoint);

		            var infoWindowClose = dojo.connect(map.infoWindow, "onHide", function(evt) {
		            	map.graphics.clear();
						map.getLayer("trendSites").setVisibility(false);
		            	dojo.disconnect(map.infoWindow, infoWindowClose);
		            });

		            setCursorByID("mainDiv", "default");
		            map.setCursor("default");

		            $("#infoWindowLink").click(function(feature) {
		            	var convertedGeom = esri.geometry.webMercatorToGeographic(networkFeature.geometry);

						var featExtent = convertedGeom.getExtent();

		            	map.setExtent(featExtent, true);
		            });

					//map.infoWindow.show(evt.mapPoint);

				}, function(error) {
					alert('error');
				});

				function checkSigFigs(value) {
		        	var outVal;

		        	var splitVal = value.toString().split('.');

		        	if ((splitVal[1] != null || splitVal[1] != undefined) && splitVal[1].length > 2) {
		        		outVal = value.toFixed(2);
		        	} else {
		        		outVal = value;
		        	}

		        	return outVal;
		        }
				//var feature = featureSet.features[0];
        	} else {
        		
        		var query = new esri.tasks.Query(); 
				query.returnGeometry = false;
				query.geometry = evt.mapPoint;
				var queryTask = new esri.tasks.QueryTask(map.getLayer("glacialAquifer").url+"/2");
				
				queryTask.execute(query, function(results) {

					var popInfo = "";
				            	
					if (results.features.length > 0) {
						popInfo += "<b>Aquifer:</b> Glacial aquifer<br/>";
					}

					var identifyParams2 = new esri.tasks.IdentifyParameters();
				    identifyParams2.tolerance = 0;
				    identifyParams2.returnGeometry = false;
					identifyParams2.mapExtent = map.extent;
				    identifyParams2.layerIds = [1];
				    identifyParams2.width  = map.width;
				    identifyParams2.height = map.height;
				    
				    var identifyTask2 = new esri.tasks.IdentifyTask("https://gis.wim.usgs.gov/arcgis/rest/services/NAWQA/DecadalMap/MapServer");

				    if (map.getLayer("principalAquifers").visible) {
				    	var deferredResult2 = identifyTask2.execute(identifyParams);

		        		deferredResult2.addCallback(function(response) {     

							if (response.length > 0) {
								var feature = response[0].feature;
				            	var attr = feature.attributes;
				            	console.log(attr["AQ_NAME"]);
				            	var features;

				            	var aqNameArray = [];

				            	for (var i = 0; i < response.length; i++) {
				            		//features.push(response[i].feature);
				            		var feature = response[i].feature;
					            	var attr = feature.attributes;
					            	if (aqNameArray.indexOf(attr["AQ_NAME"]) == -1) {
					            		aqNameArray.push(attr["AQ_NAME"]);
					            		popInfo += "<b>Aquifer:</b> " + attr["AQ_NAME"] +"<br/>";
					            	}	            	
					            }

								var template = new esri.InfoTemplate("Principal Aquifers",
									popInfo);
								
								//ties the above defined InfoTemplate to the feature result returned from a click event	
					            
					            feature.setInfoTemplate(template);

					            map.infoWindow.setFeatures([feature]);
					            map.infoWindow.show(evt.mapPoint);

					            var infoWindowClose = dojo.connect(map.infoWindow, "onHide", function(evt) {
					            	map.graphics.clear();
									map.getLayer("trendSites").setVisibility(false);
									dojo.disconnect(map.infoWindow, infoWindowClose);
					            });

					            setCursorByID("mainDiv", "default");
					            map.setCursor("default");
							}

						});
					} else {
						setCursorByID("mainDiv", "default");
					    map.setCursor("default");
					}

				});

				setCursorByID("mainDiv", "default");
				map.setCursor("default");
			    
			}

	    });

		//sets the content that informs the info window to the previously established "deferredResult" variable.
	    //map.infoWindow.setFeatures([ deferredResult ]);
		//tells the info window to render at the point where the user clicked. 
        //map.infoWindow.show(evt.mapPoint);
    }
	//end executeSiteIdentifyTask method

	
	  
	//Geocoder reference to geocoding services
    locator = new esri.tasks.Locator("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
	//calls the function that does the goeocoding logic (found in geocoder.js, an associated JS module)*
    dojo.connect(locator, "onAddressToLocationsComplete", showResults);
	
}
//end of init function	

//mapReady function that fires when the first or base layer has been successfully added to the map. Very useful in many situations. called above by this line: dojo.connect(map, "onLoad", mapReady)
function mapReady(map){
	//Sets the globe button on the extent nav tool to reset extent to the initial extent.
	dijit.byId("extentSelector").set("initExtent", map.extent);

	//var mapLods = map.lods;

	//map.infoWindow.setFixedAnchor(esri.dijit.InfoWindow.ANCHOR_LOWERRIGHT);

	//code for adding draggability to infoWindow. https://www.gavinr.com/2015/04/13/arcgis-javascript-draggable-infowindow/
    require([
	    'esri/arcgis/utils',
	    'dojo/dnd/Moveable',
	    'dojo/query',
	    'dojo/on',
	    'dojo/dom-class'
	], function (
	    arcgisUtils,
	    Moveable,
	    query,
	    on,
	    domClass
	) {
	    var handle = query(".title", map.infoWindow.domNode)[0];
        var dnd = new Moveable(map.infoWindow.domNode, {
            handle: handle
        });
        
        // when the infoWindow is moved, hide the arrow:
        on(dnd, 'FirstMove', function() {
            // hide pointer and outerpointer (used depending on where the pointer is shown)
            var arrowNode =  query(".outerPointer", map.infoWindow.domNode)[0];
            domClass.add(arrowNode, "hidden");
            
            var arrowNode =  query(".pointer", map.infoWindow.domNode)[0];
            domClass.add(arrowNode, "hidden");
        }.bind(this));
	});
	//end code for adding draggability to infoWindow

	/*if (dojo.byId('disclaimer').children[1] != null) {
		dojo.byId('disclaimer').children[1].innerHTML = "<b>Mapper Intro</b>";
		//if (configOptions.showDisclaimer == true) {
			var disclaimerNode = dojo.byId('disclaimer');
			
			var horCenter = dojo.style(document.body, "width") / 2;
			var vertCenter = dojo.style(document.body, "height") / 2;
			var disclaimerWidth = dojo.style(disclaimerNode, "width") / 2;
			var disclaimerHeight = dojo.style(disclaimerNode, "height") / 2;
			dojo.style(disclaimerNode, 'left', horCenter - disclaimerWidth + "px");
			dojo.style(disclaimerNode, 'top', vertCenter - disclaimerHeight + "px");
			dojo.style(disclaimerNode, 'visibility', 'visible');
		//}
	}*/
	
	//Create scale bar programmatically because there are some event listeners that can't be set until the map is created.
	//Just uses a simple div with id "latLngScaleBar" to contain it
	//var latLngBar = new wim.LatLngScale({map: map}, 'latLngScaleBar');
}

//function to iterate through allLayers array and build array for legend as well as array for adding services based on esri and wim specific options
function addAllLayers() {
		
	for (layer in allLayers) {
		if (allLayers[layer].wimOptions.type == "layer") {
			console.log(layer);
			var newLayer;
			if (allLayers[layer].wimOptions.layerType == "agisFeature") {
				newLayer = new esri.layers.FeatureLayer(allLayers[layer].url, allLayers[layer].arcOptions);
				if (allLayers[layer].wimOptions.renderer !== undefined) {
					newLayer.setRenderer(allLayers[layer].wimOptions.renderer);
				}
			} else if (allLayers[layer].wimOptions.layerType == "agisWMS") {
				newLayer = new esri.layers.WMSLayer(allLayers[layer].url, allLayers[layer].arcOptions);
				if (allLayers[layer].wimOptions.includeLegend == true && allLayers[layer].wimOptions.staticLegendOptions.hasStaticLegend == true) {
					var staticLegendImage = dojo.doc.createElement("div");
					staticLegendImage.id = allLayers[layer].arcOptions.id + 'Legend';
					staticLegendImage.innerHTML = '<b style="">' + allLayers[layer].wimOptions.staticLegendOptions.legendTitle + '</b><br/><img style="padding-top: 10px; width: ' + (parseInt($("#explanation").width())-25).toString() + 'px" src="' + allLayers[layer].wimOptions.staticLegendOptions.legendUrl + '" />';
					dojo.place(staticLegendImage,dojo.byId("legendDiv"),"after");
					if (allLayers[layer].arcOptions.visible == false) {
						$("#" + staticLegendImage.id).hide();
					}
				}
			} else if (allLayers[layer].wimOptions.layerType == "webTiledLayer") {
				newLayer = new esri.layers.WebTiledLayer(allLayers[layer].url, allLayers[layer].arcOptions);
			}  else {
				newLayer = new esri.layers.ArcGISDynamicMapServiceLayer(allLayers[layer].url, allLayers[layer].arcOptions);
				if (allLayers[layer].visibleLayers) {
					newLayer.setVisibleLayers(allLayers[layer].visibleLayers);
				}
			}
			
			//set wim options
			if (allLayers[layer].wimOptions) {
				if (allLayers[layer].wimOptions.includeInLayerList == true) {
					if (allLayers[layer].wimOptions.layerOptions && allLayers[layer].wimOptions.layerOptions.selectorType == "radio" ) {

						radioGroup = allLayers[layer].wimOptions.layerOptions.radioGroup;
						radioGroupArray.push({group: radioGroup, layer:newLayer});

						addToObjects({layer: newLayer, type:"layer", title: layer, toggleType: "radio", group: radioGroup}, allLayers[layer].wimOptions)
						
					} else {
						addToObjects({layer: newLayer, type:"layer", title: layer, toggleType: "checkbox", group: ""}, allLayers[layer].wimOptions)
					}
				} else if (allLayers[layer].wimOptions.includeInLayerList == false) {
					addToObjects({layer: newLayer, type:"layer", title: layer, toggleType: "checkbox", group: ""}, allLayers[layer].wimOptions)
				}
			} else {
				addToObjects({layer: newLayer, title: layer}, allLayers[layer].wimOptions)
			}
			layerArray.push(newLayer);
		} else if (allLayers[layer].wimOptions.type == "radioParent") {
			
			radioGroup = allLayers[layer].wimOptions.layerOptions.radioGroup;
			radioGroupArray.push({group: radioGroup, layer: null});
			
			layersObject.push({layer:null, type: "radioParent", title: layer, toggleType: "radioParent", group: radioGroup});
			
		} else {
			
			layersObject.push({layer: "heading", title: layer});
			
		}
	}
	
	map.addLayers(layerArray);

	var moLayer = new esri.layers.GraphicsLayer();
	moLayer.id = "moLayer";
	map.addLayer(moLayer);
	
	function addToObjects(fullObject, wimOptions) {
		if (wimOptions.includeInLayerList != false) {
			layersObject.push(fullObject); 
		}
		if (wimOptions.includeLegend != false) {
			legendLayers.push(fullObject);
		}
	}
	
}

// USGS Logo click handler function
function showUSGSLinks(evt) {
	//check to see if there is already an existing linksDiv so that it is not build additional linksDiv. Unlikely to occur since the usgsLinks div is being destroyed on mouseleave.
	if (!dojo.byId('usgsLinks')){
		//create linksDiv
		var linksDiv = dojo.doc.createElement("div");
		linksDiv.id = 'usgsLinks';
		//LINKS BOX HEADER TITLE HERE
		linksDiv.innerHTML = '<div class="usgsLinksHeader"><b>USGS Links</b></div>';
		//USGS LINKS GO HERE
		linksDiv.innerHTML += '<p>';
		linksDiv.innerHTML += '<a style="dojo.Color:white" target="_blank" href="http://www.usgs.gov/">USGS Home</a><br />';
		linksDiv.innerHTML += '<a style="dojo.Color:white" target="_blank" href="http://www.usgs.gov/ask/">Contact USGS</a><br />';
		linksDiv.innerHTML += '<a style="dojo.Color:white" target="_blank" href="http://search.usgs.gov/">Search USGS</a><br />';
		linksDiv.innerHTML += '<a style="dojo.Color:white" target="_blank" href="http://www.usgs.gov/laws/accessibility.html">Accessibility</a><br />';
		linksDiv.innerHTML += '<a style="dojo.Color:white" target="_blank" href="http://www.usgs.gov/foia/">FOIA</a><br />';
		linksDiv.innerHTML += '<a style="dojo.Color:white" target="_blank" href="http://www.usgs.gov/laws/privacy.html">Privacy</a><br />';
		linksDiv.innerHTML += '<a style="dojo.Color:white" target="_blank" href="http://www.usgs.gov/laws/policies_notices.html">Policies and Notices</a></p>';
		
		//place the new div at the click point minus 5px so the mouse cursor is within the div
		linksDiv.style.top =  evt.clientY-5 + 'px';
		linksDiv.style.left = evt.clientX-5 + 'px';
		
		//add the div to the document
		dojo.byId('map').appendChild(linksDiv);
		//on mouse leave, call the removeLinks function
		dojo.connect(dojo.byId("usgsLinks"), "onmouseleave", removeLinks);
	}
}

function showTermExp(evt) {
	if (!dojo.byId('termExp')){

		var termExpDiv = dojo.doc.createElement("div");
		termExpDiv.id = 'termExp';
		$("#termExp").addClass("ui-widget-content");
		termExpDiv.innerHTML = "<div id='helpTextInner'>" +
			'<div id="termExpHeaderClose">close</div>' +
		  	'<div id="termExpHeader" class="usgsLinksHeader">Explanation of Terms</div>' +
		  	'<div id="termExpContent"><table class="infoTable"><tr><td><b>Constituent</b></td><td>Statistically significant finding of increase, decrease, or no change in concentration for this network. Details of statistical analysis are available in the <a  href="javascript:void()">documentation</a>. Small and large changes are defined in the explanation.</td></tr>' +

			"<tr><td><b>Network type</b></td><td>Major aquifer studies target drinking water wells in a selected aquifer. Land use studies target wells that underlie areas of urban or agricultural land use in a selected aquifer, and are typically shallower than wells sampled in major aquifer studies.</td></tr>" +
			"<tr><td><b>Types of wells</b></td><td>If no qualifier is listed, network is entirely of one well type. ‘Predominantly’ indicates that 80 percent of the wells in the network are of that type. Mixed networks list those well types making up at least 75 percent of the wells in the network. Possible well types include commercial, domestic, industrial, irrigation, monitoring, public-supply, stock, recreational, and other.</td></tr>" +
			"<tr><td><b>Typical depth range</b></td><td>Range of well depths listed are first and third quartile for the network.</td></tr>" +
			"<tr><td><b>Principal aquifer</b></td><td>Aquifer names are from the map of the principal aquifers of the United States (U.S. Geological Survey, 2003, <a target='_blank' href='http://water.usgs.gov/ogw/aquifer/map.html'>http://water.usgs.gov/ogw/aquifer/map.html</a>).</td></tr>" +
			"<tr><td><b>Regional aquifer</b></td><td>The local or regional name for the aquifer sampled.</td></tr>" +
			"<tr><td><b>Aquifer material</b></td><td>Aquifer materials are from the map of the principal aquifers of the United States (U.S. Geological Survey, 2003, <a target='_blank' href='http://water.usgs.gov/ogw/aquifer/map.html'>http://water.usgs.gov/ogw/aquifer/map.html</a>).</td></tr>" +
			"<tr><td><b>Additional information</b></td><td>Lists the specific land use activity, if available.</td></tr>" +
			"<tr><td><b>NAWQA network code</b></td><td>The network name acronym used by the USGS NAWQA project.</td></tr>" +
			"<tr><td><b>Sample dates (1<sup>st</sup>, 2<sup>nd</sup>)</b></td><td>The year of the first and second sampling event.</td></tr></table></div>";


		var percentOfScreenHeight = 0.8;
	    var percentOfScreenWidth = 0.8;

	    var top = (dojo.byId('map').style.height.replace(/\D/g,''))*((1.0-percentOfScreenHeight)/2) + "px";
	    var left = (dojo.byId('map').style.width.replace(/\D/g,''))*((1.0-percentOfScreenWidth)/2) + "px";
		
		termExpDiv.style.top = top; //evt.clientY-5 + 'px';
		termExpDiv.style.left = left; //evt.clientX-5 + 'px';
		
		//termExpDiv.style.height = (dojo.byId('map').style.height.replace(/\D/g,'')*percentOfScreenHeight) + "px";
		//termExpDiv.style.width = (dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";

		dojo.byId('map').appendChild(termExpDiv);

		dojo.connect(dojo.byId("termExpHeaderClose"), "onclick", removeTermExp);

		$('#termExp').draggable({
		    start: function() {
		        // if we're scrolling, don't start and cancel drag
		        if ($(this).data("scrolled")) {
		            $(this).data("scrolled", false).trigger("mouseup");
		            return false;
		        }
		    }
		}).find("*").andSelf().scroll(function() {               
		    // bind to the scroll event on current elements, and all children.
		    //  we have to bind to all of them, because scroll doesn't propagate.

		    //set a scrolled data variable for any parents that are draggable, so they don't drag on scroll.
		    $(this).parents(".ui-draggable").data("scrolled", true);
		});
	}
}

function dataDocOptions(evt) {
	console.log('hovered');
}

function dataDocClick(option,faqNumber) {
	console.log(option);
	showHelpText(option,faqNumber);
}

function showIntro() {
	//create linksDiv
	var introDiv = dojo.doc.createElement("div");
	introDiv.id = 'intro';
	$("#intro").addClass("ui-widget-content");

	introDiv.innerHTML = '<div id="introInner">' +
			              '<div id="introContent">' +
				'<h1 id="introTitle" class="introHeaders">A Decadal Look at Groundwater Quality</h1>' +
				'<h4 id="introSubtitle" class="introHeaders"><i>A first of its kind, national assessment of an unseen, valuable resource</i></h4>' +
				'<img id="mapScreenshot" src="./images/map-screenshot.png"/>' +
				'<p>About 140 million people—almost one-half of the Nation’s population—rely on groundwater for drinking water, and the demand for groundwater for irrigation and agriculture continues to increase.</p>' +
				'<p>This mapper shows how concentrations of pesticides, nutrients, metals, and organic contaminants in groundwater are changing during decadal periods across the Nation.</p>' +
				'<p>Tracking changes in groundwater quality and investigating the reasons for these changes is crucial for informing management decisions to protect and sustain our valuable groundwater resources.</p>' +
				'<div id="buttonDiv">' +
					'<button class="learnButton" onclick="dataDocClick(\'learnMore\');">Learn more ' +
						'<span id="rec">(recommended for first time users)</span>' +
					'</button>' +
					'<button id="introButton" onclick="removeIntro()" class="introButton"><span id="enter">Enter the mapper</span>' +
					'</button>' +
				'</div>' +
			'</div>' +
		'</div>';

	var viewportWidth = $(window).width();
	var viewportHeight = $(window).height();
	
	//var top = (dojo.byId('map').style.height.replace(/\D/g,''))*((1.0-percentOfScreenHeight)/2) + "px";
	//var left = (dojo.byId('map').style.width.replace(/\D/g,''))*((1.0-percentOfScreenWidth)/2) + "px";

	var top = (viewportHeight/2 - 263) + "px";
	var left = (viewportWidth/2 - 350) + "px";

	introDiv.style.top = top; //evt.clientY-5 + 'px';
	introDiv.style.left = left;//(Number(left.split("px")[0]) + 180) + "px"; //evt.clientX-5 + 'px';

	//introDiv.style.height = "300px"; //(dojo.byId('map').style.height.replace(/\D/g,'')*percentOfScreenHeight) + "px";
	//introDiv.style.width = "420px"; //(dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";

	dojo.byId('introHolder').appendChild(introDiv);

	var ht = $("#intro").height() - $("#introHeader").height() - 20;
	$("#introContent").height(ht + "px");
}

function showHelpText(option, faqNumber) {

	$('#helpTextHeaderClose').click();

	if (!dojo.byId('helpText')) {

		map.infoWindow.hide();

		//create linksDiv
		var helpTextDiv = dojo.doc.createElement("div");
		helpTextDiv.id = 'helpText';
		$("#helpText").addClass("ui-widget-content");
		//LINKS BOX HEADER TITLE HERE

		if (option == 'Criteria for Mapping Constituents') {
			helpTextDiv.innerHTML = '<div id="helpTextInner">' +
				'<div id="helpTextHeaderClose">close</div>' +
				'<div id="helpTextHeader" class="usgsLinksHeader">Criteria for mapping constituents</div>' +
				'<div id="helpTextContent">' +
				'<p><a target="_blank" href="files/Constituent_table.pdf">Create a printable PDF of this table</a></p>' +
				'<p style="line-height: 22px">Table 1 lists the chemical constituents that met the criteria for a statistical analysis of decadal-scale changes in concentrations in groundwater between Cycle 1 (1988–2001) and Cycle 2 (2002–2012) of the National Water-Quality Assessment (NAWQA) Project. Mapped constituents met one of the four following criteria:<br/>' +
				'(1) Constituents that exceeded a Maximum Contaminant Level or other human-health benchmark in more than 1 percent of domestic- or public-supply wells <sup>(1,2,3)</sup>; or<br/>' +
				'(2) Constituents that exceeded a Secondary Maximum Contaminant Level in more than 1 percent of domestic- or public-supply wells <sup>(1,2,3)</sup>; or <br/>' +
				'(3) The five most frequently detected pesticide compounds and volatile organic compounds (VOCs) in groundwater <sup>(4,5)</sup>; or <br/>' +
				'(4) Constituents of special or regional interest.<br/><br/>' +

				'<p><label class="tableTitle">Table 1: Constituents meeting analysis criteria, results mapped</label>' +
				'<table id="constTable" class="constTable">' +
				'<tr><th>Constituent name</th>' +
				'<th>Constituent class</th>' +
				'<th>Benchmark</th>' +
				'<th>Units</th>' +
				'<th>Why study?</th></tr>' +
				'</table></p><br/>' +

				/*'<p><label class="tableTitle">Not mapped, no decadal change in any network</label>' +
				 '<table id="constTableNoChange" class="constTable">' +
				 '<tr><th>Constituent Name</th>' +
				 '<th>Constituent Class</th>' +
				 '<th>Benchmark</th>' +
				 '<th>Units</th>' +
				 '<th>Why Study?</th></tr>' +
				 '</table></p><br/>' +*/

				'<p><label class="tableTitle">Table 2: Constituents met criteria, not mapped due to insufficient data</label>' +
				'<table id="constTableInsuffData" class="constTable">' +
				'<tr><th>Constituent name</th>' +
				'<th>Constituent class</th>' +
				'<th>Benchmark</th>' +
				'<th>Units</th>' +
				'<th>Why study?</th></tr>' +
				'</table></p>' +

				'<p>Abbreviations: [µg/L, micrograms per liter; mg/L, milligrams per liter; SMCL, Secondary Maximum Contaminant Level]</p><br/>' +

				'<p id="footnotes"><label class="tableTitle">References Cited: </label><br/>1.  DeSimone, L.A., Hamilton, P.A., and Gilliom, R.J., 2009, Quality of water from ' +
				'domestic wells in principal aquifers of the United States, 1991–2004—Overview of major findings: U.S. Geological Survey Circular 1332, 48 p. [Also available online at ' +
				'<a target="_blank" href="http://pubs.usgs.gov/circ/circ1332/">http://pubs.usgs.gov/circ/circ1332/</a>]' +
				'<br/>2.  Toccalino, P.L., and Hopple, J.A., 2010, The quality of our Nation’s waters—Quality of water from public supply wells in the United States, ' +
				'1993–2007—Overview of major findings: U.S. Geological Survey Circular 1346, 58 p. [Also available at ' +
				'<a target="_blank" href="http://pubs.usgs.gov/circ/1346/">http://pubs.usgs.gov/circ/1346/</a>]' +
				'<br/>3.  Ayotte, J.D., Gronberg, J.M., and Apodaca, L.E., 2011, Trace elements and radon in groundwater across the United States: U.S. Geological Survey ' +
				'Scientific Investigations Report 2011–5059, 115 p. [Also available at ' +
				'<a target="_blank" href="http://water.usgs.gov/nawqa/trace/pubs/sir2011-5059/">http://water.usgs.gov/nawqa/trace/pubs/sir2011-5059/</a>]' +
				'<br/>4.  Zogorski, J.S., Carter, J.M., Ivahnenko, Tamara, Lapham, W.W., Moran, M.J., Rowe, B.L., Squillace, P.J., and Toccalino, P.L., 2006, The quality of our ' +
				'Nation’s waters—Volatile organic compounds in the Nation’s ground water and drinking-water supply wells: U.S. Geological Survey Circular 1292, 101 p. [Also available at ' +
				'<a target="_blank" href="http://pubs.usgs.gov/circ/circ1292/">http://pubs.usgs.gov/circ/circ1292/</a>]' +
				'<br/>5.  Gilliom, R.J., Barbash, J.E., Crawford, C.G., Hamilton, P.A., Martin, J.D., Nakagaki, Naomi, Nowell, L.H., Scott, J.C., Stackelberg, P.E., Thelin, G.P., and ' +
				'Wolock, D.M., 2006, The quality of our Nation\'s waters—Pesticides in the Nation\'s streams and ground water, 1992–2001: U.S. Geological Survey Circular 1291, 172 p. [Also available at ' +
				'<a target="_blank" href="http://pubs.usgs.gov/circ/2005/1291/">http://pubs.usgs.gov/circ/2005/1291/</a>]' +
				'</div>' +
				'</div>';

			var percentOfScreenHeight = 0.8;
			var percentOfScreenWidth = 0.8;

			var top = (dojo.byId('map').style.height.replace(/\D/g, '')) * ((1.0 - percentOfScreenHeight) / 2) + "px";
			var left = (dojo.byId('map').style.width.replace(/\D/g, '')) * ((1.0 - percentOfScreenWidth) / 2) + "px";

			helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
			helpTextDiv.style.left = left; //evt.clientX-5 + 'px';

			helpTextDiv.style.height = (dojo.byId('map').style.height.replace(/\D/g, '') * percentOfScreenHeight) + "px";
			helpTextDiv.style.width = (dojo.byId('map').style.width.replace(/\D/g, '') * percentOfScreenWidth) + "px";

		} else if (option == 'About') {
			helpTextDiv.innerHTML = '<div id="helpTextInner">' +
				'<div id="helpTextHeaderClose">close</div>' +
				'<div id="helpTextHeader" class="usgsLinksHeader">About</div>' +
				'<div id="helpTextContent">' +
				'<p id="about">The groundwater decadal change dataset consists of 1,511 wells in 67 networks in various principal ' +
				'aquifers across the country from the U.S. Geological Survey (USGS) National Water-Quality Assessment (NAWQA) ' +
				'project. Each network has been sampled once during the period of 1988–2001 and again during 2002–12. Network ' +
				'size varies from 11 to 30 wells. Major aquifer studies are networks designed to give a broad overview of groundwater ' +
				'quality in an aquifer used as a source of drinking-water supply. Land-use studies are networks designed to examine ' +
				'natural and human factors that affect the quality of shallow groundwater that underlies key types of land use in a ' +
				'specific aquifer and are usually not wells used as a source of drinking-water supply. The primary objective of ' +
				'resampling these networks is to determine changes in concentrations of constituents during a decadal period. Select an ' +
				'arrow or dot for additional information about a network. See the documentation for additional background and details.</p>' +
				'</div>' +
				'</div>';

			var percentOfScreenHeight = 0.8;
			var percentOfScreenWidth = 0.8;

			var top = (dojo.byId('map').style.height.replace(/\D/g, '')) * ((1.0 - percentOfScreenHeight) / 2) + "px";
			var left = (dojo.byId('map').style.width.replace(/\D/g, '')) * ((1.0 - percentOfScreenWidth) / 2) + "px";

			helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
			helpTextDiv.style.left = left; //evt.clientX-5 + 'px';

			helpTextDiv.style.height = "470px"; //(dojo.byId('map').style.height.replace(/\D/g,'')*percentOfScreenHeight) + "px";
			helpTextDiv.style.width = "700px"; //(dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";

		} else if (option == 'Documentation') {
			helpTextDiv.innerHTML = '<div id="helpTextInner">' +
				'<div id="helpTextHeaderClose">close</div>' +
				'<div id="helpTextHeader" class="usgsLinksHeader">Documentation</div>' +
				'<div id="helpTextContent">' +
				'<h2>Background</h2>' +
				'<p>The U.S. Geological Survey (USGS) implemented the National Water-Quality Assessment (NAWQA) Project in 1991 to develop long-term consistent and comparable ' +
				'information on streams, rivers, groundwater, and aquatic systems in support of national, regional, state, and local information needs related to water-quality management ' +
				'and policy. A central goal of the NAWQA Project is to determine whether groundwater-quality conditions are getting better or worse with time. One of the ways this goal ' +
				'is addressed for groundwater is by comparing water-quality changes that happen during a decadal period in selected well networks across the Nation. Networks were chosen for ' +
				'decadal-scale water-quality sampling based on geographic distribution across the Nation and to represent the most important aquifers and specific land use types. A network ' +
				'typically is a group of 20–30 wells representing an aquifer (major aquifer study), or a specific depth and (or) land use (land use study) (Lapham and others, 1995). The ' +
				'same wells from each of the selected networks are sampled on a decadal-scale interval (Rosen and Lapham, 2008). Samples are collected according to nationally consistent ' +
				'protocols (U.S. Geological Survey, variously dated).</p>' +
				'<p>As of 2012, a total of 1,502 wells in 67 networks had been sampled twice, providing an opportunity to evaluate changes in groundwater quality. Selected results ' +
				'from the first sampling event, completed from 1993 to 2000, were compared statistically to the second sampling event, completed from 2001 to 2012, using a matched pair approach ' +
				'(Lindsey and Rupert, 2012). Although Lindsey and Rupert (2012) and Toccalino and others (2014a) summarized results for some constituents, many other constituents were not ' +
				'included in these evaluations. The NAWQA Project developed an interactive mapping tool that could display changes in concentrations for several constituents that were judged ' +
				'to be of particular interest based on certain criteria. From among the more than 300 constituents sampled during the two decades, constituents were prioritized for analysis of ' +
				'decadal change if they met the following criteria: (1) they exceeded a human health benchmark in at least 1 percent of the wells used as a source of drinking-water public supply ' +
				'wells (Toccalino and Hopple, 2010) or domestic supply wells (Desimone, 2009), (2) they exceeded a U.S. Environmental Protection Agency (EPA) secondary maximum contaminant level ' +
				'(SMCL) in at least 1 percent of the wells used as a source of drinking water, (3) they were among the five most frequently detected volatile organic compounds (VOCs) in the Nation ' +
				'(Zogorski and others, 2006), or (4) they were among the five most frequently detected pesticides in the Nation (Gilliom and others, 2006). Other constituents were added to this ' +
				'list based on regional importance. Radium, radon, and gross alpha (α) activity met the criteria for analysis, but do not have sufficient data for analysis; thus, they are not ' +
				'included in the mapping tool. In all, 24 constituents were selected for analysis of decadal change and inclusion in the mapping tool. Benchmark types considered in prioritizing ' +
				'constituents are: EPA maximum contaminant levels (MCLs) (U.S. Environmental Protection Agency, 2012), EPA Human-Health Benchmarks for Pesticides (HHBPs) (U.S. Environmental Protection ' +
				'Agency, 2013), Health-Based Screening Levels (HBSLs) (Toccalino and others, 2014b), and nonregulatory SMCLs (U.S. Environmental Protection Agency, 2012). Of these, only MCLs are ' +
				'enforceable (regulatory) standards; all but SMCLs are human-health benchmarks.</p>' +
				'<h2>Data Retrieval and Preparation for Statistical Analysis</h2>' +
				'<p>In preparation for statistical analysis, environmental water-quality data for selected sites are retrieved from the USGS National Water Information System database. ' +
				'Ancillary data are appended to the water-quality data, including NAWQA sampling cycle (first or second decade), principal aquifer, network type, and network name. Laboratory reporting ' +
				'levels are summarized for each constituent. A maximum common reporting level (CRLMAX) is chosen for the data analysis, usually the lowest reporting level that still retains the maximum ' +
				'amount of data for analysis. The CRLMAX and the value used for recoding nondetections are reported for each constituent in the “readme” tab of the data files and details are provided ' +
				'at the end of this documentation. Analysis is completed for networks with at least 10 pairs of samples. The final data used for statistical analysis are available in the data archive ' +
				'files (Data_archive_inorganic.xlsx, Data_archive_VOC.xlsx, and Data_archive_pesticides.xlsx). </p>' +
				'<h2>Statistical Analysis</h2>' +
				'<p>For each constituent, data are analyzed for statistically significant changes between the decadal samples within a network using the Wilcoxon-Pratt signed-rank test ' +
				'(Pratt, 1959) using the R-statistical software. Details of this method are described in Lindsey and Rupert (2012). Briefly, the method first calculates changes in concentrations ' +
				'at individual wells and then uses the pattern of those changes to determine whether or not there has been a statistically significant change for a well network as a whole. For ' +
				'these tests, a 90-percent confidence level, or a p-value of less than 0.10, is used to signify a statistically significant change. Because the R-statistical program cannot analyze ' +
				'networks if all the data are tied (no differences in any pair), networks with all ties are assumed to have no significant change.</p>' +
				'<h2>Mapping of Results</h3>' +
				'<p>Results of the statistical analysis for each well network were classified as indicating a statistically significant increase, a statistically significant decrease, or no ' +
				'significant change. Results were further classified as being “relatively large” or “relatively small” changes to provide context for the results. A statistically significant change for ' +
				'an individual network is displayed on the mapping tool by an arrow pointing up or down. One point on the map represents a network of multiple wells. The size of the arrow indicates ' +
				'the magnitude of change. To provide this context, the median change between the first and second sampling events was calculated for each well network with a statistically significant ' +
				'change, and the median was compared to the benchmark (MCL, SMCL, or HBSL). For inorganic constituents, if the median change was greater than 5 percent of the benchmark, the change was ' +
				'considered relatively large. If the change was less than or equal to 5 percent of the benchmark, then the change was considered to be relatively small. For organic compounds, if the ' +
				'median change was greater than 1 percent of the benchmark, the change was considered relatively large, and if the change was less than or equal to 1 percent of the benchmark, then the ' +
				'change was considered to be relatively small. This approach provides a way to distinguish very small but statistically significant changes from changes that are of a larger magnitude. ' +
				'Organic constituents are treated differently than inorganic constituents because the organic constituents are generally introduced to the environment as a result of human activity, ' +
				'whereas most of the inorganic constituents are found naturally at some level. In some cases, networks had statistically significant changes, but the median change between sampling events ' +
				'was zero. In those cases, the data were analyzed graphically to determine whether the change was a decrease or an increase, and the change was considered to be relatively small. ' +
				'Networks without any statistically significant change are displayed as a solid circle in the mapping tool. Networks with insufficient data to analyze are displayed with a similarly ' +
				'sized open circle; this could be because fewer than 10 pairs were available or because a constituent was sampled in one sampling period but not in the other. </p>' +
				'<h2>Mapping Selections</h2>' +
				'<p>The mapping tool has a number of options for display. The “Map Layers” box allows principal aquifers, network boundaries, and land use to be displayed as background layers. ' +
				'The “Change in Network Concentrations” part of this box allows the user to choose inorganic or organic constituents and select a specific constituent within either category. After making ' +
				'a selection, the statistical results will display on the map. Clicking on an information “i” icon provides descriptions of terms. The map layers box may be collapsed to display more of ' +
				'the mapped area. The “Explanation” box explains the arrows and dots that appear at the network centroid, displaying the statistical results. Hollow dots indicate that decadal change data ' +
				'are not available. Within this box, clicking the text “Arrow size relative to benchmark” opens a dialog describing what a relatively large and relatively small change is for each constituent, ' +
				'both as a percentage of a benchmark or as a concentration. The “Explanation” box can also be collapsed to display more of the mapped area.</p>' +
				'<p>Tabs along the top of the map include a table explaining the criteria for selecting which constituents to map, a tool that allows printing of the selected map, and a variety ' +
				'of base maps that can be used as background layers. The search option allows the user to search for a location such as a city, state, zip code, or general place name. In the upper left ' +
				'area of the tool are “+” and “–” icons to zoom in and out, respectively, along with icons to zoom to the previous extent or the entire extent of the map. The user can also zoom using the ' +
				'scroll wheel on a mouse and can pan by clicking on the map and holding while moving the mouse. </p>' +
				'<p>Clicking on an arrow or circle (plotted at the center of the well network) will bring up a table with details about the network, along with an option to zoom to the network, ' +
				'and an explanation about the items on the table. With the principal aquifer or network boundaries selected, the user can click on the map and a popup will display the name of the selected ' +
				'principal aquifer or network. </p>' +
				'<h2>Details on data preparation</h2>' +
				'<p>Once a CRLMAX is selected for a given constituent, all nondetections with a reporting level greater than the CRLMAX are deleted from the dataset. All nondetections and ' +
				'reported values less than the CRLMAX are recoded to a unique value selected to specifically represent values below the CRLMAX. The value used for recoding is typically slightly less than ' +
				'the CLRMAX, but its exact value does not affect the statistical analysis, which calculates results using the ranking of values relative to each other rather than using the actual values ' +
				'themselves. The selection of a CRLMAX and the recoding are done to make correct comparisons among nondetections and between nondetections and low-level detections; for example, if a ' +
				'CRLMAX of 0.2 is selected, reported results of < 0.1 and < 0.2 are recoded as 0.19 before statistical analysis so that the statistical program does not interpret these two nondetections ' +
				'as different values and also to distinguish both from a reported value of 0.2. Reported results of 0.17 (a detection) and < 0.2 (a nondetection) are also recoded as 0.19 before statistical ' +
				'analysis because it is not possible to determine if the two values differ. The CRLMAX and the value used for recoding nondetections are reported for each constituent in the “readme” tab ' +
				'of the data files. Data for the pesticide compounds atrazine, prometon, metolachlor, simazine, dieldrin and deethylatrazine (a degradate of atrazine) are prepared using a different method, ' +
				'as described in Toccalino and others (2014a). Differences in data preparation for pesticide compounds and degradates include that concentrations were adjusted for recovery and that ' +
				'nondetections were replaced with a single value less than the lowest detection (rather than a value less than the CRLMAX). For methyl tert-butyl ether, the CRLMAX was determined for each ' +
				'pair rather than for the entire data set.</p>' +
				'<p id="footnotes"><label class="tableTitle">References Cited: </label>' +
				'<br/><br/>DeSimone, L.A., 2009, Quality of water from domestic wells in principal aquifers of the United States, 1991–2004: U.S. Geological Survey Scientific Investigations Report 2008–5227, 139 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/sir/2008/5227/">http://pubs.usgs.gov/sir/2008/5227/</a>.]' +
				'<br/><br/>Gilliom, R.J., Barbash, J.E., Crawford, C.G., Hamilton, P.A., Martin, J.D., Nakagaki, Naomi, Nowell, L.H., Scott, J.C., Stackelberg, P.E., Thelin, G.P., and Wolock, D.M., 2006, The quality of our Nation’s waters—Pesticides in the Nation’s streams and ground water, 1992–2001: U.S. Geological Survey Circular 1291, 172 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/circ/2005/1291/">http://pubs.usgs.gov/circ/2005/1291/</a>.]' +
				'<br/><br/>Lapham, W.W., Wilde, F.D., and Koterba, M.T., 1995, Ground-water data-collection protocols and procedures for the National Water-Quality Assessment Program—Selection, installation, and documentation of wells, and collection of related data: U.S. Geological Survey Open-File Report 95–398, 71 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/of/1995/ofr-95-398/">http://pubs.usgs.gov/of/1995/ofr-95-398/</a>.]' +
				'<br/><br/>Lindsey, B.D., and Rupert, M.G., 2012, Methods for evaluating temporal groundwater quality data and results of decadal-scale changes in chloride, dissolved solids, and nitrate concentrations in groundwater in the United States, 1988–2010: U.S. Geological Survey Scientific Investigations Report 2012–5049, 46 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/sir/2012/5049/">http://pubs.usgs.gov/sir/2012/5049/</a>.]' +
				'<br/><br/>Pratt, J.W., 1959, Remarks on zeros and ties in the Wilcoxon signed rank procedures: American Statistical Association Journal, v. 54, no. 287, p. 655–667. [Also available at <a target="_blank" href="http://www.jstor.org/stable/2282543">http://www.jstor.org/stable/2282543</a>.]' +
				'<br/><br/>Rosen, M.R., and Lapham, W.W., 2008, Introduction to the U.S. Geological Survey National Water-Quality Assessment (NAWQA) of ground-water quality trends and comparison to other national programs: the Journal of Environmental Quality, v. 37, no. 5, Supplement, p. S–190–S–198. [Also available at <a target="_blank" href="http://dx.doi.org/10.2134/jeq2008.0049">http://dx.doi.org/10.2134/jeq2008.0049</a>.]' +
				'<br/><br/>Toccalino, P.L., and Hopple, J.A., 2010, The quality of our Nation’s waters—Quality of water from public supply wells in the United States, 1993–2007—Overview of major findings: U.S. Geological Survey Circular 1346, 58 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/circ/1346/">http://pubs.usgs.gov/circ/1346/</a>.]' +
				'<br/><br/>Toccalino, P.L., Gilliom, R.J., Lindsey, B.D., and Rupert, M.G., 2014a, Pesticides in groundwater of the United States—Decadal-scale changes, 1993–2011: Groundwater, v. 52, Supplement S1, p. 112–125. [Also available at <a target="_blank" href="http://dx.doi.org/10.1111/gwat.12176">http://dx.doi.org/10.1111/gwat.12176</a>.]' +
				'<br/><br/>Toccalino, P.L., Norman, J.E., and Schoephoester, K.M., 2014b, Health-based screening levels for evaluating water-quality data: U.S. Geological Survey, Health-Based Screening Levels (HBSL) Web site, accessed July 13, 2015, at <a target="_blank" href="http://dx.doi.org/10.5066/F71C1TWP">http://dx.doi.org/10.5066/F71C1TWP</a>.' +
				'<br/><br/>U.S. Environmental Protection Agency, 2012, 2012 edition of the drinking water standards and health advisories: U.S. Environmental Protection Agency, Office of Water, EPA 822–S–12–001, 20 p. [Also available at <a target="_blank" href="http://nepis.epa.gov/Exe/ZyPDF.cgi/P100N01H.PDF?Dockey=P100N01H.PDF">http://nepis.epa.gov/Exe/ZyPDF.cgi/P100N01H.PDF?Dockey=P100N01H.PDF</a>.]' +
				'<br/><br/>U.S. Environmental Protection Agency, 2013, Human health benchmarks for pesticides—2013 update: U.S. Environmental Protection Agency, Office of Water, EPA–820–F–13–019, 2 p. [Also available at <a target="_blank" href="http://www.epa.gov/sites/production/files/2015-10/documents/hh-benchmarks-factsheet.pdf">http://www.epa.gov/sites/production/files/2015-10/documents/hh-benchmarks-factsheet.pdf</a>.]' +
				'<br/><br/>U.S. Geological Survey, variously dated, National field manual for the collection of water-quality data: U.S. Geological Survey Techniques of Water-Resources Investigations, book 9, chaps. A1–A10, accessed July 31, 2009, at <a target="_blank" href="http://water.usgs.gov/owq/FieldManual/">http://water.usgs.gov/owq/FieldManual/</a>.' +
				'<br/><br/>Zogorski, J.S., Carter, J.M., Ivahnenko, Tamara, Lapham, W.W., Moran, M.J., Rowe, B.L., Squillace, P.J., and Toccalino, P.L., 2006, The quality of our Nation’s waters—Volatile organic compounds in the Nation’s ground water and drinking-water supply wells: U.S. Geological Survey Circular 1292, 101 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/circ/circ1292/">http://pubs.usgs.gov/circ/circ1292/</a>.]' +
				'</div>' +
				'</div>';

			var percentOfScreenHeight = 0.8;
			var percentOfScreenWidth = 0.8;

			var top = (dojo.byId('map').style.height.replace(/\D/g, '')) * ((1.0 - percentOfScreenHeight) / 2) + "px";
			var left = (dojo.byId('map').style.width.replace(/\D/g, '')) * ((1.0 - percentOfScreenWidth) / 2) + "px";

			helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
			helpTextDiv.style.left = left; //evt.clientX-5 + 'px';

			helpTextDiv.style.height = (dojo.byId('map').style.height.replace(/\D/g, '') * percentOfScreenHeight) + "px";
			helpTextDiv.style.width = "700px"; //(dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";

		} else if (option == 'Criteria') {
			helpTextDiv.innerHTML = '<div id="helpTextInner">' +
				'<div id="helpTextHeaderClose">close</div>' +
				'<div id="helpTextHeader" class="usgsLinksHeader">Mapping criteria and benchmarks</div>' +
				'<div id="helpTextContent" class="criteria">' +
				'<p>The NAWQA Project has developed an interactive mapping tool that displays decadal changes in concentrations. From among the more than 300 constituents sampled during the two decades, 24 constituents were prioritized for analysis for decadal change based on the following criteria:</p>' +
				'<div class="criteriaItems"><p>(1) they exceeded a human-health benchmark in at least 1 percent of the wells used as a source of drinking water from public-supply wells (Toccalino and Hopple, 2010) or domestic-supply wells (Desimone, 2009),</p>' +
				'<p>(2) they exceeded a U.S. Environmental Protection Agency (EPA) secondary maximum contaminant level (SMCL) in at least 1 percent of the wells used as a source of drinking water,</p>' +
				'<p>(3) they were among the five most frequently detected volatile organic compounds (VOCs) in the Nation (Zogorski and others, 2006), or</p>' +
				'<p>(4) they were among the five most frequently detected pesticides in the Nation (Gilliom and others, 2006).</p></div>' +
				'<p>Other constituents were added to this list based on regional importance. Radium, radon, and gross alpha (α) activity met the criteria for analysis but do not have sufficient data for analysis; thus, they are not included in the mapping tool.</p>' +
				'<p>Benchmarks used to prioritize the constituents were the following: EPA maximum contaminant levels (MCLs) (U.S. Environmental Protection Agency, 2012), USGS Health-Based Screening Levels (HBSLs) (Toccalino and others, 2014b), and nonregulatory SMCLs (U.S. Environmental ' +
				'Protection Agency, 2012). Of these benchmarks, only MCLs are legally enforceable (regulatory) drinking-water standards; all but SMCLs are human-health benchmarks. For more ' +
				'information about these benchmarks, <a target="_blank" href="javascript:dataDocClick(\'FAQ\',14)">click here</a>. For a listing of the 24 constituents selected for analysis and the reason they were selected, ' +
				'<a target="_blank" href="./files/Constituent_table.pdf">click here</a>.</p>' +
				'</div>' +
				'</div>';

			var percentOfScreenHeight = 0.8;

			var percentOfScreenWidth = 0.8;

			var top = (dojo.byId('map').style.height.replace(/\D/g, '')) * ((1.0 - percentOfScreenHeight) / 2) + "px";
			var left = (dojo.byId('map').style.width.replace(/\D/g, '')) * ((1.0 - percentOfScreenWidth) / 2) + "px";

			helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
			helpTextDiv.style.left = left; //evt.clientX-5 + 'px';

			helpTextDiv.style.maxHeight = "750px";
			helpTextDiv.style.height = (dojo.byId('map').style.height.replace(/\D/g, '') * percentOfScreenHeight) + "px";
			helpTextDiv.style.width = "600px"; //(dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";

		} else if (option == 'DataPrep') {
			helpTextDiv.innerHTML = '<div id="helpTextInner">' +
				'<div id="helpTextHeaderClose">close</div>' +
				'<div id="helpTextHeader" class="usgsLinksHeader">Data preparation steps</div>' +
				'<div id="helpTextContent">' +
				'<p>In preparation for statistical analysis, environmental water-quality data for selected sites are retrieved from the ' +
				'USGS National Water Information System database. A maximum common reporting level (CRLMAX) is chosen for the data analysis, ' +
				'usually the lowest reporting level that still retains the maximum amount of data for analysis. Analysis is completed for networks with at least 10 pairs of samples. Once a ' +
				'CRLMAX is selected for a given constituent, all nondetections with a reporting level greater than the CRLMAX are deleted ' +
				'from the dataset. All nondetections and reported values less than the CRLMAX are recoded to a unique value selected to ' +
				'specifically represent values below the CRLMAX. The value used for recoding is typically slightly less than the CLRMAX, ' +
				'but its exact value does not affect the statistical analysis, which calculates results using the ranking of values relative ' +
				'to each other rather than using the actual values themselves. The selection of a CRLMAX and the recoding are done to make ' +
				'correct comparisons among nondetections and between nondetections and low-level detections; for example, if a CRLMAX of ' +
				'0.2 is selected, reported results of <0.1 and <0.2 are recoded as 0.19 before statistical analysis so that the statistical ' +
				'program does not interpret these two nondetections as different values and also to distinguish both from a reported value ' +
				'of 0.2. Reported results of 0.17 (a detection) and <0.2 (a nondetection) are also recoded as 0.19 before statistical ' +
				'analysis because it is not possible to determine if the two values differ. The CRLMAX and the value used for recoding ' +
				'nondetections are reported for each constituent in the “readme” tab of the data files. Data for the pesticide compounds ' +
				'atrazine, prometon, metolachlor, simazine, dieldrin and deethylatrazine (a degradate of atrazine) are prepared using a ' +
				'different method, as described in Toccalino and others (2014a). Differences in data preparation for pesticide compounds ' +
				'and degradates include that concentrations were adjusted for recovery and that nondetections were replaced with a single ' +
				'value less than the lowest detection (rather than a value less than the CRLMAX). For methyl <i>tert</i>-butyl ether, the CRLMAX ' +
				'was determined for each pair rather than for the entire dataset.</p>' +
				'</div>' +
				'</div>';

			var percentOfScreenHeight = 0.8;
			var percentOfScreenWidth = 0.8;

			var top = (dojo.byId('map').style.height.replace(/\D/g, '')) * ((1.0 - percentOfScreenHeight) / 2) + "px";
			var left = (dojo.byId('map').style.width.replace(/\D/g, '')) * ((1.0 - percentOfScreenWidth) / 2) + "px";

			helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
			helpTextDiv.style.left = left; //evt.clientX-5 + 'px';

			helpTextDiv.style.height = (dojo.byId('map').style.height.replace(/\D/g, '') * percentOfScreenHeight) + "px";
			helpTextDiv.style.width = "600px"; //(dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";

		} else if (option == 'Stats') {
			helpTextDiv.innerHTML = '<div id="helpTextInner">' +
				'<div id="helpTextHeaderClose">close</div>' +
				'<div id="helpTextHeader" class="usgsLinksHeader">Statistical Analysis</div>' +
				'<div id="helpTextContent">' +
				'<p>For each constituent, data are analyzed for statistically significant changes between the decadal ' +
				'samples within a network using the Wilcoxon-Pratt signed-rank test (Pratt, 1959) using the R-statistical ' +
				'software. Details of this method are described in Lindsey and Rupert (2012). Briefly, the method first ' +
				'calculates changes in concentrations at individual wells and then uses the pattern of those changes to ' +
				'determine whether or not there has been a statistically significant change for a well network as a whole. ' +
				'For these tests, a 90-percent confidence level, or a <i>p</i>-value of less than 0.10, is used to signify a ' +
				'statistically significant change. Because the R-statistical program cannot analyze networks if all the ' +
				'data are tied (no differences in any pair), networks with all ties are assumed to have no significant change.</p>' +
				'</div>' +
				'</div>';

			var percentOfScreenHeight = 0.8;
			var percentOfScreenWidth = 0.8;

			var top = (dojo.byId('map').style.height.replace(/\D/g, '')) * ((1.0 - percentOfScreenHeight) / 2) + "px";
			var left = (dojo.byId('map').style.width.replace(/\D/g, '')) * ((1.0 - percentOfScreenWidth) / 2) + "px";

			helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
			helpTextDiv.style.left = left; //evt.clientX-5 + 'px';

			helpTextDiv.style.height = "450px";
			helpTextDiv.style.width = "500px"; //(dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";

		} else if (option == 'References') {
			helpTextDiv.innerHTML = '<div id="helpTextInner">' +
				'<div id="helpTextHeaderClose">close</div>' +
				'<div id="helpTextHeader" class="usgsLinksHeader">References cited</div>' +
				'<div id="helpTextContent">' +
				'<p id="footnotes">' +
				'<br/><br/>DeSimone, L.A., 2009, Quality of water from domestic wells in principal aquifers of the United States, 1991–2004: U.S. Geological Survey Scientific Investigations Report 2008–5227, 139 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/sir/2008/5227/">http://pubs.usgs.gov/sir/2008/5227/</a>.]' +
				'<br/><br/>DeSimone, L.A., McMahon, P.B., and Rosen, M.R., 2014, The quality of our Nation’s waters—Water quality in Principal Aquifers of the United States, 1991–2010: U.S. Geological Survey Circular 1360, 151 p., [Also available at <a target="_blank" href="http://dx.doi.org/10.3133/cir1360">http://dx.doi.org/10.3133/cir1360</a>.]' +
				'<br/><br/>Eberts, S.M., Thomas, M.A., and Jagucki, M.L., 2013, The quality of our Nation’s waters—Factors affecting public-supply-well vulnerability to contamination—Understanding observed water quality and anticipating future water quality: U.S. Geological Survey Circular 1385, 120 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/circ/1385/">http://pubs.usgs.gov/circ/1385/</a>.]' +
				'<br/><br/>Gilliom, R.J., Barbash, J.E., Crawford, C.G., Hamilton, P.A., Martin, J.D., Nakagaki, Naomi, Nowell, L.H., Scott, J.C., Stackelberg, P.E., Thelin, G.P., and Wolock, D.M., 2006, The quality of our Nation’s waters—Pesticides in the Nation’s streams and ground water, 1992–2001: U.S. Geological Survey Circular 1291, 172 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/circ/2005/1291/">http://pubs.usgs.gov/circ/2005/1291/</a>.]' +
				'<br/><br/>Lapham, W.W., Wilde, F.D., and Koterba, M.T., 1995, Ground-water data-collection protocols and procedures for the National Water-Quality Assessment Program—Selection, installation, and documentation of wells, and collection of related data: U.S. Geological Survey Open-File Report 95–398, 71 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/of/1995/ofr-95-398/">http://pubs.usgs.gov/of/1995/ofr-95-398/</a>.]' +
				'<br/><br/>Lindsey, B.D., and Rupert, M.G., 2012, Methods for evaluating temporal groundwater quality data and results of decadal-scale changes in chloride, dissolved solids, and nitrate concentrations in groundwater in the United States, 1988–2010: U.S. Geological Survey Scientific Investigations Report 2012–5049, 46 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/sir/2012/5049/">http://pubs.usgs.gov/sir/2012/5049/</a>.]' +
				'<br/><br/>Maupin, M.A., Kenny, J.F., Hutson, S.S., Lovelace, J.K., Barber, N.L., and Linsey, K.S., 2014, Estimated use of water in the United States in 2010: U.S. Geological Survey Circular 1405, 56 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/circ/1405/">http://pubs.usgs.gov/circ/1405/</a>.]' +
				'<br/><br/>Pratt, J.W., 1959, Remarks on zeros and ties in the Wilcoxon signed rank procedures: American Statistical Association Journal, v. 54, no. 287, p. 655–667. [Also available at <a target="_blank" href="http://www.jstor.org/stable/2282543">http://www.jstor.org/stable/2282543</a>.]' +
				'<br/><br/>Rosen, M.R., and Lapham, W.W., 2008, Introduction to the U.S. Geological Survey National Water-Quality Assessment (NAWQA) of ground-water quality trends and comparison to other national programs: the Journal of Environmental Quality, v. 37, no. 5, Supplement, p. S–190–S–198. [Also available at <a target="_blank" href="http://dx.doi.org/10.2134/jeq2008.0049">http://dx.doi.org/10.2134/jeq2008.0049</a>.]' +
				'<br/><br/>Toccalino, P.L., and Hopple, J.A., 2010, The quality of our Nation’s waters—Quality of water from public supply wells in the United States, 1993–2007—Overview of major findings: U.S. Geological Survey Circular 1346, 58 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/circ/1346/">http://pubs.usgs.gov/circ/1346/</a>.]' +
				'<br/><br/>Toccalino, P.L., Gilliom, R.J., Lindsey, B.D., and Rupert, M.G., 2014a, Pesticides in groundwater of the United States—Decadal-scale changes, 1993–2011: Groundwater, v. 52, Supplement S1, p. 112–125. [Also available at <a target="_blank" href="http://dx.doi.org/10.1111/gwat.12176">http://dx.doi.org/10.1111/gwat.12176</a>.]' +
				'<br/><br/>Toccalino, P.L., Norman, J.E., and Schoephoester, K.M., 2014b, Health-based screening levels for evaluating water-quality data: U.S. Geological Survey, Health-Based Screening Levels (HBSL) Web site, accessed July 13, 2015, at <a target="_blank" href="http://dx.doi.org/10.5066/F71C1TWP">http://dx.doi.org/10.5066/F71C1TWP</a>.' +
				'<br/><br/>U.S. Environmental Protection Agency, 2012, 2012 edition of the drinking water standards and health advisories: U.S. Environmental Protection Agency, Office of Water, EPA 822–S–12–001, 20 p. [Also available at <a target="_blank" href="http://nepis.epa.gov/Exe/ZyPDF.cgi/P100N01H.PDF?Dockey=P100N01H.PDF">http://nepis.epa.gov/Exe/ZyPDF.cgi/P100N01H.PDF?Dockey=P100N01H.PDF</a>.]' +
				'<br/><br/>U.S. Environmental Protection Agency, 2013, Human health benchmarks for pesticides—2013 update: U.S. Environmental Protection Agency, Office of Water, EPA–820–F–13–019, 2 p. [Also available at <a target="_blank" href="http://www.epa.gov/sites/production/files/2015-10/documents/hh-benchmarks-factsheet.pdf">http://www.epa.gov/sites/production/files/2015-10/documents/hh-benchmarks-factsheet.pdf</a>.]' +
				'<br/><br/>U.S. Geological Survey, variously dated, National field manual for the collection of water-quality data: U.S. Geological Survey Techniques of Water-Resources Investigations, book 9, chaps. A1–A10, accessed July 31, 2009, at <a target="_blank" href="http://water.usgs.gov/owq/FieldManual/">http://water.usgs.gov/owq/FieldManual/</a>.' +
				'<br/><br/>Zogorski, J.S., Carter, J.M., Ivahnenko, Tamara, Lapham, W.W., Moran, M.J., Rowe, B.L., Squillace, P.J., and Toccalino, P.L., 2006, The quality of our Nation’s waters—Volatile organic compounds in the Nation’s ground water and drinking-water supply wells: U.S. Geological Survey Circular 1292, 101 p. [Also available at <a target="_blank" href="http://pubs.usgs.gov/circ/circ1292/">http://pubs.usgs.gov/circ/circ1292/</a>.]' +
				'</div>' +
				'</div>';

			var percentOfScreenHeight = 0.8;
			var percentOfScreenWidth = 0.8;

			var top = (dojo.byId('map').style.height.replace(/\D/g, '')) * ((1.0 - percentOfScreenHeight) / 2) + "px";
			var left = (dojo.byId('map').style.width.replace(/\D/g, '')) * ((1.0 - percentOfScreenWidth) / 2) + "px";

			helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
			helpTextDiv.style.left = left; //evt.clientX-5 + 'px';

			helpTextDiv.style.height = (dojo.byId('map').style.height.replace(/\D/g, '') * percentOfScreenHeight) + "px";
			helpTextDiv.style.width = "700px"; //(dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";

		} else if (option == 'Data') {
			helpTextDiv.innerHTML = '<div id="helpTextInner">' +
				'<div id="helpTextHeaderClose">close</div>' +
				'<div id="helpTextHeader" class="usgsLinksHeader">Data</div>' +
				'<div id="helpTextContent">' +
				'<p>Click <a target="_blank" href="files/Data_archive_inorganic.xlsx">here</a> to download the data used to analyze for decadal change in inorganic constituents</p>' +
				'<p>Click <a target="_blank" href="files/Data_archive_VOC.xlsx">here</a> to download the data used to analyze for decadal change in volatile organic compounds</p>' +
				'<p>Click <a target="_blank" href="files/Data_archive_pesticide.xlsx">here</a> to download the data used to analyze for decadal changes in pesticides</p>' +
				'</div>' +
				'</div>';

			var percentOfScreenHeight = 0.8;
			var percentOfScreenWidth = 0.8;

			var top = (dojo.byId('map').style.height.replace(/\D/g, '')) * ((1.0 - percentOfScreenHeight) / 2) + "px";
			var left = (dojo.byId('map').style.width.replace(/\D/g, '')) * ((1.0 - percentOfScreenWidth) / 2) + "px";

			helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
			helpTextDiv.style.left = (Number(left.split("px")[0]) + 180) + "px"; //evt.clientX-5 + 'px';

			helpTextDiv.style.height = "300px"; //(dojo.byId('map').style.height.replace(/\D/g,'')*percentOfScreenHeight) + "px";
			helpTextDiv.style.width = "420px"; //(dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";

		} else if (option == 'FAQ') {
			helpTextDiv.innerHTML = '<div id="helpTextInner">' +
				'<div id="helpTextHeaderClose">close</div>' +
				'<div id="helpTextHeader" class="usgsLinksHeader">Frequently Asked Questions</div>' +
				'<div id="helpTextContent">' +
				'<h2>Study scope</h2>' +
				'<a href="#faq1">1. What is the purpose of this study?</a><br/>' +
				'<a href="#faq2">2. Who completed this study?</a><br/>' +
				'<a href="#faq3">3. Why evaluate changes in water quality?</a><br/>' +
				'<a href="#faq4">4. Does this map represent all changes in groundwater resources across the country?</a><br/>' +
				'<a href="#faq5">5. What percentage of the population of the United States relies upon groundwater for their drinking water?</a><br/>' +
				'<a href="#faq6">6. How many wells were sampled for this study, and what time period is represented?</a><br/>' +
				'<a href="#faq7">7. How did you determine which constituents to display on the map?</a><br/>' +
				'<h2>Features of the web site</h2>' +
				'<a href="#faq8">8. Where can I find help navigating this web page?</a><br/>' +
				'<a href="#faq9">9. Are the data available for download?</a><br/>' +
				'<h2>Study design and methods</h2>' +
				'<a href="#faq10">10. What are groundwater networks and what do they represent?</a><br/>' +
				'<a href="#faq11">11. Why are you sampling only once every decade?</a><br/>' +
				'<a href="#faq12">12. How do you determine whether changes in concentrations over time are statistically significant?</a><br/>' +
				'<a href="#faq13">13. How do you calculate statistics when reporting levels changed over time?</a><br/>' +
				'<h2>Study results</h2>' +
				'<a href="#faq14">14. Which benchmarks were used to provide context for the results?</a><br/>' +
				'<a href="#faq15">15. Do the findings indicate whether water from the wells is safe to drink?</a><br/>' +
				'<a href="#faq16">16. What does it mean when large decadal increases in concentrations were identified on these maps with upwardly facing red arrows, and why do the concentration ranges for large and small arrows vary by constituent?</a><br/>' +
				'<a href="#faq17">17. Where can I learn more about contaminants in public-supply wells and domestic wells?</a><br/>' +
				'<a href="#faq18">18. What are the causes of these changes in groundwater quality?</a><br/>' +
				'<a href="#faq19">19. What human factors are contributing to changes in groundwater quality?</a><br/>' +
				'<a href="#faq20">20. What natural features influence water quality?</a><br/>' +
				'<h2>Next steps</h2>' +
				'<a href="#faq21">21. Will other constituents be added to this tool?</a><br/>' +
				'<a href="#faq22">22. The data show results through 2012. Are data still being collected and will those results be displayed?</a><br/>' +
				'<a href="#faq23">23. Are some areas likely to see faster changes in groundwater quality than others?  Why?</a><br/>' +
				'<a href="#faq24">24. What can we do to improve groundwater quality?  How long will it take?</a><br/>' +
				'<h2>For more information on groundwater quality</h2>' +
				'<a href="#faq25">25. Where is more information available about water-quality testing guidelines for domestic wells?</a><br/>' +
				'<a href="#faq26">26. Where can I learn more information about other NAWQA water-quality assessments?</a><br/>' +
				'<h2>Citation and Contacts</h2>' +
				'<a href="#faq27">27. How should these Web pages be cited?</a><br/>' +
				'<a href="#faq28">28. Who can I contact for more information on this study of decadal changes in the quality of water?</a><br/>' +

				'<h2 class="faqHeader">Study scope</h2>' +
				'<div id="faq1" class="faqQuestion">1. What is the purpose of this study?</div>' +
				'<div class="faqAnswer">The purpose of this study is to determine if the quality of the Nation’s groundwater has become better, worse, or stayed the same during 1988-2012. Evaluating changes in groundwater quality at the decadal scale is one component of a larger effort to understand the quality of the Nation’s water resources and how water quality conditions are changing with time.</div>' +
				'<div id="faq2" class="faqQuestion">2.	Who completed this study?</div>' +
				'<div class="faqAnswer">The U.S. Geological Survey’s (USGS) National Water-Quality Assessment (NAWQA) Project completed this study. Sampling teams in USGS Water Science Centers across the country collected the samples and project staff analyzed the data.</div>' +
				'<div id="faq3" class="faqQuestion">3. Why evaluate changes in water quality?</div>' +
				'<div class="faqAnswer">Groundwater is the source of drinking water for about one-half of the population of the United States and has many other important uses, such as for irrigation. It is important to document how the quality of this vital resource is changing in order to understand how management practices and ongoing environmental stresses may be affecting groundwater quality. Degradation of this resource can happen during a long time period, and recovery from historic contamination can also take a long time.</div>' +
				'<div id="faq4" class="faqQuestion">4. Does this map represent all changes in groundwater resources across the country?</div>' +
				'<div class="faqAnswer">The samples used to create this map come from 27 principal aquifers that account for more than 90 percent of the groundwater used for public water supply in the United States; however, the wells that were sampled are from selected geographic parts of each aquifer and, in some cases, also represent a specific land-use type. In addition, most of the samples are from monitoring wells and domestic-supply wells, which represent the shallower parts of the aquifer. As such, these results apply to the depth zone and setting where the samples were collected but also provide insight on possible future changes in water quality in the deeper zones of these aquifers that is used for public supply.</div>' +
				'<div id="faq5" class="faqQuestion">5. What percentage of the population of the United States relies upon groundwater for their drinking water?</div>' +
				'<div class="faqAnswer">Groundwater is the source of drinking-water supply for 140 million people—nearly one-half of the Nation’s population (Maupin and others, 2014).</div>' +
				'<div id="faq6" class="faqQuestion">6. How many wells were sampled for this study, and what time period is represented?</div>' +
				'<div class="faqAnswer">The dataset consists of 1,511 wells in 67 groups of wells called networks in various principal aquifers across the country from the U.S. Geological Survey National Water-Quality Assessment project. A network typically is a group of 20–30 wells representing an aquifer (major aquifer study), or a specific depth and (or) land use (land-use study) (Lapham and others, 1995). Each network has been sampled once during 1988–2001 and again during 2002–12.</div>' +
				'<div id="faq7" class="faqQuestion">7. How did you determine which constituents to display on the map?</div>' +
				'<div class="faqAnswer">More than 300 constituents were sampled at most of the wells during the two decades. Constituents were prioritized for analysis of decadal change if they met the following criteria: (1) they exceeded a human health benchmark in at least 1 percent of the wells used as a source of drinking water from public-supply wells (Toccalino and Hopple, 2010) or domestic-supply wells (Desimone, 2009), (2) they exceeded a U.S. Environmental Protection Agency (EPA) secondary maximum contaminant level (SMCL) in at least 1 percent of the wells used as a source of drinking water, (3) they were among the five most frequently detected volatile organic compounds (VOCs) in the Nation (Zogorski and others, 2006), or (4) they were among the five most frequently detected pesticides in the Nation (Gilliom and others, 2006). Other constituents were added to this list based on regional importance. Radium, radon, and gross alpha (α) activity met the criteria for analysis but do not have sufficient data for analysis; thus, they are not included in the mapping tool. In all, 24 constituents were selected for analysis of decadal change and inclusion in the mapping tool. <a target="_blank" href="javascript:dataDocClick(\'Criteria\');">More on constituent selection</a></div>' +

				'<h2 class="faqHeader">Features of the web site</h2>' +
				'<div id="faq8" class="faqQuestion">8. Where can I find help navigating this web page?</div>' +
				'<div class="faqAnswer">An explanation of the arrows and icons on the map and what they mean is <a target="_blank" href="./files/Map_icons1.pdf">here</a>. A description of how to activate map layers is <a target="_blank" href="./files/Map_layers.pdf">here</a>. A description of the search, zoom, and print capabilities is <a target="_blank" href="./files/Map_searchzoom.pdf" >here</a>.</div>' +
				'<div id="faq9" class="faqQuestion">9. Are the data available for download?</div>' +
				'<div class="faqAnswer">The data used to make these maps are available for download on the data tab.</div>' +

				'<h2 class="faqHeader">Study design and methods</h2>' +
				'<div id="faq10" class="faqQuestion">10. What are groundwater networks and what do they represent?</div>' +
				'<div class="faqAnswer">Networks are groups of wells with similar characteristics.  Some are designed to give a broad overview of groundwater quality in an aquifer used as a source of drinking-water supply and others are designed to examine the factors that affect the quality of shallow groundwater underlying key types of land use. Networks were chosen for decadal-scale water-quality sampling based on geographic distribution across the Nation and to represent the most important aquifers and specific land-use types. A network typically is a group of 20–30 wells representing an aquifer (major aquifer study), or a specific depth and (or) land use (land-use study) (Lapham and others, 1995). The same wells from each of the selected networks are sampled on a decadal-scale interval (Rosen and Lapham, 2008).</div>' +
				'<div id="faq11" class="faqQuestion">11. Why are you sampling only once every decade?</div>' +
				'<div class="faqAnswer">Sampling one time per decade allows the project to collect repeated samples in all of the well networks across the Nation. If we sampled more frequently, we would have to sample fewer wells. Because changes in groundwater quality typically happen relatively slowly, sampling once per decade can be sufficient to capture these slow changes. Other ongoing USGS studies evaluate changes in groundwater quality at time intervals greater than and less than a decadal scale.</div>' +
				'<div id="faq12" class="faqQuestion">12. How do you determine whether or not changes in concentrations with time are statistically significant?</div>' +
				'<div class="faqAnswer">Significant changes for each constituent are determined by a statistical test called the Wilcoxon-Pratt signed rank test (Pratt, 1959) as described in Lindsey and Rupert (2012) using the R-statistical software. The method calculates changes in concentrations at individual wells and then uses the pattern of those changes to determine whether or not there has been a statistically significant change for a well network as a whole. For these tests, a 90-percent confidence level, or a p-value of less than 0.10, is used to signify a statistically significant change. <a target="_blank" href="javascript:dataDocClick(\'Stats\');" >More on statistics</a>.</div>' +
				'<div id="faq13" class="faqQuestion">13. How do you calculate statistics when reporting levels changed with time?</div>' +
				'<div class="faqAnswer">Because reporting levels vary with time, a maximum common reporting level (CRLMAX) is chosen for each constituent prior to the statistical analysis. Data for the pesticide compounds atrazine, prometon, metolachlor, simazine, dieldrin, and deethylatrazine are prepared using the method described in Toccalino and others (2014a). <a target="_blank" href="javascript:dataDocClick(\'DataPrep\');" >More on data preparation</a>.</div>' +

				'<h2 class="faqHeader">Study results</h2>' +
				'<div id="faq14" class="faqQuestion">14. Which benchmarks were used to provide context for the results?</div>' +
				'<div class="faqAnswer">Two human-health benchmarks and one other water-quality benchmark were used in this study. The human-health benchmarks were Maximum Contaminant Levels (MCLs) developed by EPA’s Office of Water for compounds that are regulated in drinking water under the Safe Drinking Water Act and nonenforceable Health-Based Screening Levels (HBSLs ) developed by the USGS for unregulated compounds without MCLs. These benchmarks are concentrations below which contaminants are not anticipated to cause adverse human-health effects from a lifetime of exposure. Secondary Maximum Contaminant Levels (SMCLs ) are nonenforceable guidelines regarding cosmetic effects such as tooth or skin discoloration or aesthetic effects such as taste, odor, or color of drinking water.</div>' +
				'<div id="faq15" class="faqQuestion">15. Do the findings indicate if water from the wells is safe to drink?</div>' +
				'<div class="faqAnswer">No. The NAWQA Project did not assess the safety of drinking water. The quality of finished drinking water is regulated by the EPA under the Safe Drinking Water Act. All of the samples included in this study, however, were collected prior to any treatment or blending that potentially could alter contaminant concentrations.  As a result, the sampled groundwater represents the quality of the source water and not necessarily the quality of finished water ingested by the people served by these domestic and public wells. In addition, the sampling included some monitoring wells and other types of wells, which are not used as a source of drinking water.</div>' +
				'<div id="faq16" class="faqQuestion">16. What does it mean when large decadal increases in concentrations were identified on these maps with upwardly facing red arrows, and why do the concentration ranges for large and small arrows vary by constituent?</div>' +
				'<div class="faqAnswer">When there was a statistically significant change in the concentration of a constituent with time, the magnitude of the change was classified as being “large” or “small” as compared to a benchmark to provide context for the results. “large” changes in concentrations over time mean that the magnitude of the change was more than 1 percent or 5 percent of the benchmark concentration, depending on the type of constituent, meaning that concentrations in the overall group of wells are approaching a benchmark more quickly than areas having “small” changes. It does not mean that concentrations exceed a benchmark. Each assessment is for a group of 10-30 individual wells in a similar setting. Individual wells within a network may or may not have concentrations that exceed a benchmark. Within each group some concentrations are likely to be decreasing and others increasing, regardless of the direction of change for the overall group. Files that include concentrations for individual wells are available for download.</div>' +
				'<div id="faq17" class="faqQuestion">17. Where can I learn more about contaminants in public-supply wells and domestic wells?</div>' +
				'<div class="faqAnswer">For more information on contaminants in domestic wells see <a target="_blank" href="http://pubs.usgs.gov/sir/2008/5227/">Desimone (2009)</a> and <a target="_blank" href="http://water.usgs.gov/nawqa/pubs/prin_aq/">Desimone and others (2015)</a> and for more information on public-supply wells see <a target="_blank" href="http://pubs.usgs.gov/circ/1346/">Toccalino and Hopple (2010)</a> and <a target="_blank" href="http://pubs.usgs.gov/circ/1385/">Eberts and others (2013)</a>.</div>' +
				'<div id="faq18" class="faqQuestion">18. What are the causes of these changes in groundwater quality?</div>' +
				'<div class="faqAnswer">The exact causes of changes in groundwater quality are not evaluated for every constituent and every network. Some nationwide changes, such as the banning of a chemical or introduction of a new chemical, can be documented on a large scale. Changes at the level of an individual network, however, require a focused evaluation of hydrologic conditions, groundwater age, and history of use of the contaminant. Some of these studies are <a target="_blank" href="http://water.usgs.gov/nawqa/studies/gwtrends/publications.php">here</a>.</div>' +
				'<div id="faq19" class="faqQuestion">19. What human factors are contributing to changes in groundwater quality?</div>' +
				'<div class="faqAnswer">See more information on <a target="_blank" href="http://pubs.usgs.gov/circ/1385/">factors affecting vulnerability to contamination</a>.</div>' +
				'<div id="faq20" class="faqQuestion">20. What natural features influence water quality?</div>' +
				'<div class="faqAnswer">See more information on <a target="_blank" href="http://pubs.usgs.gov/circ/1385/">factors affecting vulnerability to contamination</a>.</div>' +

				'<h2 class="faqHeader">Next steps</h2>' +
				'<div id="faq21" class="faqQuestion">21. Will other constituents be added to this tool?</div>' +
				'<div class="faqAnswer">The 24 constituents displayed were selected as the most important for statistical analysis as described in the ‘Criteria for analyzing constituents’ table. Constituents that meet those criteria in future sampling events will be added to the map.</div>' +
				'<div id="faq22" class="faqQuestion">22. The data show results through 2012. Are data still being collected and will those results be displayed?</div>' +
				'<div class="faqAnswer">A third decade of data collection is underway, and these results will be compared to results from the previous two decades. Data collected after 2012 will be analyzed and the results will be added to this map on an annual basis after quality checks on the data. About 80 networks are scheduled to have decadal sampling by 2022.</div>' +
				'<div id="faq23" class="faqQuestion">23. Are some areas likely to see faster changes in groundwater quality than others?  Why?</div>' +
				'<div class="faqAnswer">Wells in areas where groundwater arrives at a well shortly after entering the aquifer will likely see concentrations change more rapidly than wells in areas where groundwater travels more slowly. Factors such as well depth and the type of aquifer material control these rates.  See more information on <a target="_blank" href="http://pubs.usgs.gov/circ/1385/">factors affecting vulnerability to contamination</a>.</div>' +
				'<div id="faq24" class="faqQuestion">24. What can we do to improve groundwater quality?  How long will it take?</div>' +
				'<div class="faqAnswer">The EPA has resources on source water protection. <a target="_blank" href="http://www.epa.gov/sourcewaterprotection">Source water protection</a> strategies that rely on changes in human activities and practices at the land surface to achieve water-quality objectives can take many decades to affect the quality of water in some deeper wells.</div>' +

				'<h2 class="faqHeader">For more information on groundwater quality</h2>' +
				'<div id="faq25" class="faqQuestion">25. Where is more information available about water-quality testing guidelines for domestic wells?</div>' +
				'<div class="faqAnswer">(From Desimone and others, 2009)<br/>' +
				'There are many sources of information about water-quality testing of domestic wells. Many state environmental or public-health agencies provide information and recommendations for homeowners about testing and water-quality of domestic wells. The EPA also provides such information, and provides links to many state agency Web sites on private wells. The U.S. Centers for Disease Control and Prevention provides information on water-quality testing and the health effects of selected contaminants in private wells. The U.S. Department of Agriculture, in cooperation with EPA, provides information and resources for domestic-well owners through its Farm*A*Syst/Home*A*Syst and Cooperative State Research, Education, and Extension (CREES) Program. Local health departments, in many cases, are a source of information about private wells. Recommendations for water-quality testing and other information about domestic wells also are provided by several nongovernmental organizations. Sources of information available on the internet from some of these agencies and organizations are listed below:' +
				'<br/><br/>U.S. Environmental Protection Agency, Private Drinking Water Wells<br/>' +
				'<a target="_blank" href="http://www.epa.gov/safewater/privatewells/index2.html">http://www.epa.gov/safewater/privatewells/index2.html</a> and<br/>' +
				'<a target="_blank" href="http://www.epa.gov/safewater/privatewells/whereyoulive_state.html">http://www.epa.gov/safewater/privatewells/whereyoulive_state.html</a>.<br/>' +
				'<br/>U.S. Center for Disease Control and Prevention, Division of Parasitic Diseases, Drinking Water, Private Well Resources<br/>' +
				'<a target="_blank" href="http://www.cdc.gov/ncidod/dpd/healthywater/privatewell.htm">http://www.cdc.gov/ncidod/dpd/healthywater/privatewell.htm</a><br/>' +
				'<br/>U.S. Department of Agriculture and U.S. Environmental Protection Agency<br/>' +
				'<br/>National Farm*A*Syst/Home*A*Syst Program<br/>' +
				'<a target="_blank" href="http://www.uwex.edu/homeasyst/index.html">http://www.uwex.edu/homeasyst/index.html</a><br/>' +
				'<br/>U. S. Department of Agriculture, Cooperative State Research, Education, and Extension Service (CREES) National Water Program, Drinking Water & Human Health<br/>' +
				'<a target="_blank" href="http://www.usawaterquality.org/themes/health/default.html">http://www.usawaterquality.org/themes/health/default.html</a><br/>' +
				'<br/>American Ground Water Trust<br/>' +
				'<a target="_blank" href="http://www.agwt.org">http://www.agwt.org</a><br/>' +
				'<br/>Ground Water Protection Council<br/>' +
				'<a target="_blank" href="http://www.gwpc.org">http://www.gwpc.org</a><br/>' +
				'<br/>National Ground Water Association<br/>' +
				'<a target="_blank" href="http://www.ngwa.org">http://www.ngwa.org</a> and <a target="_blank" href="http://www.wellowner.org">http://www.wellowner.org</a><br/>' +
				'<br/>National Rural Water Association<br/>' +
				'<a target="_blank" href="http://www.nrwa.org">http://www.nrwa.org</a><br/>' +
				'<br/>Water Systems Council<br/>' +
				'<a target="_blank" href="http://www.watersystemscouncil.org">http://www.watersystemscouncil.org</a>' +
				'</div>' +
				'<div id="faq26" class="faqQuestion">26. Where can I learn more information about other NAWQA water-quality assessments?</div>' +
				'<div class="faqAnswer">Access <a target="_blank" href="http://water.usgs.gov/nawqa">http://water.usgs.gov/nawqa</a> for information about the USGS NAWQA Project and other assessments in the Project about the water resources of the Nation.</div>' +

				'<h2 class="faqHeader">Citation and Contacts</h2>' +
				'<div id="faq27" class="faqQuestion">27. How should these Web pages be cited?</div>' +
				'<div class="faqAnswer">Lindsey, B.D., Johnson, T.D., and Belitz, Kenneth, 2016, Decadal changes in groundwater quality: U.S. Geological Survey Web page, http://nawqatrends.wim.usgs.gov/Decadal/</div>' +
				'<div id="faq28" class="faqQuestion">28. Who can I contact for more information on this study of decadal changes in the quality of water?</div>' +
				'<div class="faqAnswer">Bruce Lindsey, USGS Hydrologist<br/>' +
				'Email: <a target="_blank" href="mailto:blindsey@usgs.gov">blindsey@usgs.gov</a><br/>' +
				'Phone: (717) 730-6964</div>' +

				'</div>' +
				'</div>';

			var percentOfScreenHeight = 0.8;
			var percentOfScreenWidth = 0.8;

			var top = (dojo.byId('map').style.height.replace(/\D/g, '')) * ((1.0 - percentOfScreenHeight) / 2) + "px";
			var left = (dojo.byId('map').style.width.replace(/\D/g, '')) * ((1.0 - percentOfScreenWidth) / 2) + "px";

			helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
			helpTextDiv.style.left = (Number(left.split("px")[0]) + 180) + "px"; //evt.clientX-5 + 'px';

			helpTextDiv.style.height = "500px"; //(dojo.byId('map').style.height.replace(/\D/g,'')*percentOfScreenHeight) + "px";
			helpTextDiv.style.width = "650px"; //(dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";
		} else if (option == 'learnMore') {
			helpTextDiv.innerHTML = '<div id="helpTextInner" class="learnMore">' +
				'<div id="helpTextHeaderClose">close</div>' +
				'<div id="helpTextHeader" class="usgsLinksHeader"></div>' +
				'<div id="helpTextContent">' +
				'<div id="usgscolorband">' +
				'<div id="usgsbanner">' +

				'<div class="max_wrap">' +

				'<div id="usgsidentifier"><a href="http://www.usgs.gov/"><img src="assets/usgslogo.png" alt="USGS - science for a changing world" title="U.S. Geological Survey Home Page" width="178" height="72" /></a></div>' +

				'</div>' +

				'</div>' +
				'</div>' +


				'<nav>' +
				'<h1>' +
				'Evaluating Decadal Changes in Groundwater Quality' +
				'</h1>' +
				'</nav>' +
				'<div class="naqwa-body">' +
				'<div class="sixtysix">' +
				'<div class="fifty">' +
				'<p>' +
				'Groundwater quality data were collected in 5,000 wells between 1988 and 2001 by the National Water-Quality Assessment Project. About 1,500 of these wells were sampled again between 2002 and 2012 to evaluate decadal changes in groundwater quality. Monitoring wells, domestic-supply wells, and some public-supply wells were included in this study. All water was collected before treatment.' +
				'</p>' +
				'<p>' +
				'Groundwater samples used to evaluate decadal change were collected from networks of wells with similar characteristics. Some networks, consisting of domestic or public-supply wells, were used to assess changes in the quality of groundwater used for drinking-water supply. Other networks, consisting of monitoring wells, assessed changes in the quality of shallow groundwater underlying key land-use types such as agricultural or urban lands. Networks were chosen based on geographic distribution across the Nation and to represent the most important water-supply aquifers and specific land-use types.' +
				'</p>' +
				'</div>' +
				'<div class="fifty">' +
				'<p>' +
				'<b>' +
				'Decadal changes in groundwater quality were assessed for these constituents:' +
				'</b>' +
				'</p>' +
				'<ul>' +
				'<li><b>Inorganics</b></li>' +
				'<li>Arsenic</li>' +
				'<li>Boron</li>' +
				'<li>Chloride</li>' +
				'<li>Fluoride</li>' +
				'<li>Iron</li>' +
				'<li>Manganese</li>' +
				'<li>Molybdenum</li>' +
				'<li>Nitrate</li>' +
				'<li>Orthophosphate</li>' +
				'<li>Strontium</li>' +
				'<li>Sulfate</li>' +
				'<li>Total Dissolved Solids</li>' +
				'<li>Uranium</li>' +
				'</ul>' +
				'<ul>' +
				'<li><b>Organics</b></li>' +
				'<li>Atrazine</li>' +
				'<li>Chloroform</li>' +
				'<li>Deethylatrazine</li>' +
				'<li>Dieldrin</li>' +
				'<li>Methyl tert-butyl ether</li>' +
				'<li>Metolachlor</li>' +
				'<li>Prometon</li>' +
				'<li>Simazine</li>' +
				'<li>Tetrachloroethene</li>' +
				'<li>Toluene</li>' +
				'<li>Trichloroethene</li>' +
				'</ul>' +

				'</div>' +
				'<div class="full">' +
				'<h3>' +
				'Decadal Groundwater Quality Networks' +
				'</h3>' +
				'<div class="smallfifty">' +
				'<i>1988 &ndash; 2001</i>' +
				'<img src="assets/Pilot_cy1networks.jpg">' +
				'<small>' +
				'230 networks were sampled from 1998 to 2001 to assess the status of the Nation’s groundwater quality. Each dot represents a network of about 20 to 30 wells.' +
				'</small>' +
				'</div>' +
				'<div class="smallfifty">' +
				'<i>2000 &ndash; 2012</i>' +
				'<img src="assets/Trend_nets.jpg">' +
				'<small>' +
				'67 networks were resampled from 2002 to 2012 to assess decadal changes in groundwater quality.' +
				'</small>' +
				'</div>' +
				'</div>' +
				'</div>' +
				'<div class="thirtythree">' +
				'<h2>Online Mapper Showing Decadal Changes in Groundwater Quality</h2>' +
				'<img src="assets/Popup2.jpg">' +
				'<p>' +
				'Decadal changes in concentrations of pesticides, nutrients, metals, and organic contaminants in groundwater were evaluated in 67 networks across the Nation and displayed on an interactive web mapping tool.' +
				'</p>' +
				'<p>' +
				'Decadal changes in median concentrations for a network are classified as large, small, or no change in comparison to a benchmark concentration (such as a Maximum Contaminant Level); for example, a large change in chloride concentrations indicates that the median of all differences in concentrations in a network is greater than 5 percent of the chloride benchmark. For chloride, this would mean the change in concentration exceeded 12.5 milligrams per liter.' +
				'</p>' +
				'</div>' +

				'</div>' +
				'</div>' +
				'</div>';

			var percentOfScreenHeight = 0.95;
			var percentOfScreenWidth = 0.95;

			var top = (dojo.byId('map').style.height.replace(/\D/g, '')) * ((1.0 - percentOfScreenHeight) / 2) + "px";
			var left = (dojo.byId('map').style.width.replace(/\D/g, '')) * ((1.0 - percentOfScreenWidth) / 2) + "px";

			helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
			helpTextDiv.style.left = left; //(Number(left.split("px")[0]) + 180) + "px"; //evt.clientX-5 + 'px';

			helpTextDiv.style.height = "95%"; //(dojo.byId('map').style.height.replace(/\D/g,'')*percentOfScreenHeight) + "px";
			helpTextDiv.style.width = "95%"; //(dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";
		}

		/*var percentOfScreenHeight = 0.8;
		 var percentOfScreenWidth = 0.8;

		 var top = (dojo.byId('map').style.height.replace(/\D/g,''))*((1.0-percentOfScreenHeight)/2) + "px";
		 var left = (dojo.byId('map').style.width.replace(/\D/g,''))*((1.0-percentOfScreenWidth)/2) + "px";

		 helpTextDiv.style.top = top; //evt.clientY-5 + 'px';
		 helpTextDiv.style.left = left; //evt.clientX-5 + 'px';

		 helpTextDiv.style.height = (dojo.byId('map').style.height.replace(/\D/g,'')*percentOfScreenHeight) + "px";
		 helpTextDiv.style.width = (dojo.byId('map').style.width.replace(/\D/g,'')*percentOfScreenWidth) + "px";*/

		//add the div to the document
		if (option == 'learnMore') {
			dojo.byId('introHolder').appendChild(helpTextDiv);
		} else {
			dojo.byId('map').appendChild(helpTextDiv);
		}

		$("#constTable").append("<tr id='tableHeader'></tr>");
		var fields = ["DisplayName","ConstituentType","Benchmark","Units","WhyStudy"];

		$.each(constObj.features, function(key, value) {
	    	//alert("key: " + key + ", value: " + value);
	    	var id="const" + key;
	    	var tableType = constObj.features[key].attributes["Tableorder"];
	    	var table;
	    	if (tableType == "Mappable") {
	    		table = $("#constTable");
	    	} else if (tableType == "Not mapped, no decadal change") {
				table = $("#constTableNoChange");
	    	} else if (tableType == "Not mapped, not enough data") {
	    		table = $("#constTableInsuffData");
	    	}
	    	table.append("<tr id='" + id + "'></tr>");
	    	var feature = value;
	    	$.each(fields, function(key, field) {
	    		if (field == "Constituent") {
	    			$("#"+id).append("<td>"+feature.attributes[field].split('_')[0]+"</td>");
	    		} else if (field == "Benchmark") {
					$("#"+id).append("<td class='benchmarkTable'>"+feature.attributes[field]+"</td>");
				} else {
					$("#"+id).append("<td>"+feature.attributes[field]+"</td>");
				}
	    	});
	    });

		var ht = $("#helpText").height() - $("#helpTextHeader").height() - 20;
	    $("#helpTextContent").height(ht + "px");

	    dojo.connect(dojo.byId("helpTextHeaderClose"), "onclick", removeHelpText);

	    $('#helpText').draggable({
		    start: function() {
		        // if we're scrolling, don't start and cancel drag
		        if ($(this).data("scrolled")) {
		            $(this).data("scrolled", false).trigger("mouseup");
		            return false;
		        }
		    }
		}).find("*").andSelf().scroll(function() {
		    // bind to the scroll event on current elements, and all children.
		    //  we have to bind to all of them, because scroll doesn't propagate.

		    //set a scrolled data variable for any parents that are draggable, so they don't drag on scroll.
		    $(this).parents(".ui-draggable").data("scrolled", true);

		});
	    $('#helpText').resizable({
	    	resize: function(e, ui) {
         		var ht = $("#helpText").height() - $("#helpTextHeader").height() - 20;
	    		$("#helpTextContent").height(ht + "px");
        	}
	    });

		if (option == 'FAQ' && isNaN(faqNumber) == false) {
			var faqTarget = document.getElementById('faq'+faqNumber);
			var topPos = faqTarget.offsetTop;

			document.getElementById('helpTextContent').scrollTop = topPos-50;
		}
		
	}
}

function showConstituentExp() {
	if ($("#constitExp").is(':visible') || $("#constitExp").css('display') == 'inline') {
		$("#constitExp").hide();
	} else {
		$("#constitExp").show();
	}
}

function populateConstitExp() {

}

//remove (destroy) the usgs Links div (called on mouseleave event)
function removeLinks(){
	dojo.destroy('usgsLinks');
}

function removeToolTip(){
	dojo.destroy('iconToolTip');
}

function removeHelpText(){
	dojo.destroy('helpText');
}

function removeIntro(){
	dojo.destroy('introHolder');
}

function removeTermExp(){
	dojo.destroy('termExp');
}

function constTypeSelect(event) {
	
	var button = event.currentTarget;

	if (button.id == "organicButton") {
		$("#organicConstituentSelect").show();
		$("#inorganicConstituentSelect").hide();
		$("#organicConstituentSelect").prependTo("#inputs");
		$("#organicConstituentSelect").trigger("change");
	} else if (button.id == "inorganicButton") {
		$("#organicConstituentSelect").hide();		
		$("#inorganicConstituentSelect").show();
		$("#inorganicConstituentSelect").prependTo("#inputs");
		$("#inorganicConstituentSelect").trigger("change");
	}

}

function constituentUpdate(event) {

	z = z + 1;

	/*dojo.setStyle(constStatus.id, "color", "yellow");
	constStatus.innerHTML = "...Updating...";*/

	var select = event.target;

	var astText = "";

	if (select[select.selectedIndex].attributes.hasOwnProperty("GenDescLargeChg") == true) {
		astText = "<p>" + (select[select.selectedIndex].attributes.GenDescSmallChg.value).toString() + "</p><p>" +
			(select[select.selectedIndex].attributes.GenDescLargeChg.value).toString() + "</p>" +
			"<p>" + (select[select.selectedIndex].attributes.GenDescBenchmark.value).toString() + "</p>";
	} else {
		astText = "<p>" + (select[select.selectedIndex].attributes.GenDescSmallChg.value).toString() + "</p><p>" +
			"<p>" + (select[select.selectedIndex].attributes.GenDescBenchmark.value).toString() + "</p>";
	}

	var benchmarkText = (select[select.selectedIndex].attributes.GenDescBenchmark.value).toString();

	if (astText.match("No benchmark available") != null && astText.match("No benchmark available").length > 0) {
		astText = "<p>" + (select[select.selectedIndex].attributes.GenDescSmallChg.value).toString() + "</p>";
	}

	if (select.id == "organicConstituentSelect") {
		$('#constitExp').html(astText);
	} else if (select.id == "inorganicConstituentSelect") {
		$('#constitExp').html(astText);
	}
	
	var featureLayer = map.getLayer("networkLocations");
    
	var layerUpdateEnd = dojo.connect(featureLayer, "onUpdateEnd", function (evt) {
			dojo.disconnect(featureLayer, layerUpdateEnd);
			/*constStatus.innerHTML = "Updated";
			dojo.setStyle(constStatus.id, "color", "green");*/
		});

	var defaultSymbol = null;

	var attField ="";
	var mapFields = map.getLayer("networkLocations").fields;
	$.each(mapFields, function(index, value) {
		if (mapFields[index].name.toLowerCase().indexOf(select[select.selectedIndex].attributes.constituent.value.toLowerCase()) != -1) {
			attField = mapFields[index].name;
		}
	});

	renderer.attributeField = attField;
	renderer2.attributeField = attField;
	
	if (benchmarkText.match("No benchmark available") != null && benchmarkText.match("No benchmark available").length > 0) {
		featureLayer.setRenderer(renderer2);
	} else {
		featureLayer.setRenderer(renderer);
	}

	featureLayer.refresh();
	legend.refresh();

	var info = map.infoWindow._contentPane.innerHTML;
	var info = info.replace(previousConst, event.target.value);

	map.infoWindow._contentPane.innerHTML = info;

	previousConst = event.target.value;
	console.log("after: " + previousConst);

	/*var e = new jQuery.Event("click");
	e.pageX = latestHover.pageX;
	e.pageY = latestHover.pageY;
	jQuery("body").trigger(e);*/

	var query = new esri.tasks.Query();
  	var featureLayer = map.getLayer("networkLocations");
  	query.returnGeometry = false;
  	query.where = "network_centroids.OBJECTID = " + OID;
  	featureLayer.queryFeatures(query, function(event) {
  		
  		for (var i = 0; i < constObj.features.length; i++) {
  			//console.log(i);
  			if (constObj.features[i].attributes["DisplayName"] == previousConst) {
  				attFieldSpecial = "ChemData." + constObj.features[i].attributes["Constituent"];
  				var constSplit = constObj.features[i].attributes["Constituent"].split("_");
  				attFieldSpecialLower = "ChemData." + constSplit[0] + "_" + constSplit[1].toLowerCase();
  			}
  		}

  		var val = getValue(event.features[0].attributes[attFieldSpecial]);
  		if (val == "") {
  			val = getValue(event.features[0].attributes[attFieldSpecialLower])
  			//val = "no data";
  		}
  		console.log("val: " + val + ", oldValue: " + oldValue);
  		var info2 = map.infoWindow._contentPane.innerHTML;
  		info2 = info2.replace(oldValue, val);
  		info2 = info2.replace(camelize(oldValue), camelize(val));

  		map.infoWindow._contentPane.innerHTML = info2;

  		oldValue = val;

  	});

}

function getValue(val) {
	var textValue = "";
	if (val !== undefined) {
		val = val.toString();
		switch (val) {
			case "-2":
				textValue = "large decrease";
				break;
			case "-1":
				textValue = "small decrease";
				break;
			case "0":
				textValue = "no change";
				break;
			case "1":
				textValue = "small increase";
				break;
			case "2":
				textValue = "large increase";
				break;
			default:
				textValue = "trend data not available";
				break;
		}
	}
	return textValue;
}

function camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
        return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
}


function printMap() {

	$("#printStatus").show();

	var select;

	if (dojo.byId("organicButton").checked) {
		select = dojo.byId("organicConstituentSelect");
	} else if (dojo.byId("inorganicButton").checked) {
		select = dojo.byId("inorganicConstituentSelect");
	}

	var currConst = select[select.selectedIndex].attributes.displayname.value;

	var printParams = new esri.tasks.PrintParameters();

	//deal with potential layers that will cause an error in the print task
	var setItBack;

	map.getLayer("moLayer").setVisibility(false);
	map.graphics.setVisibility(false);

	if (map.infoWindow.isShowing == true) {
		setItBack = true;
		map.infoWindow.hide();
	}

	printParams.map = map;

	var template = new esri.tasks.PrintTemplate();
	template.exportOptions = {
	  	width: 500,
		height: 400,
		dpi: 300
	};
	template.format = "PDF";
	template.layout = "Letter ANSI A Landscape 2";
	template.preserveScale = false;
	var legendLayer = new esri.tasks.LegendLayer();
	legendLayer.layerId = "networkLocations";
	var legendLayers = [];
	legendLayers.push(legendLayer);
	//legendLayer.subLayerIds = [*];

	var d = new Date();
	var date = d.getDate();
	var month = d.getMonth() + 1;
	var year = d.getFullYear();

	template.layoutOptions = {
		"titleText": "Decadal Change for " + currConst + " in Groundwater from 1988-2001 to 2002-2012",
		"legendLayers": [legendLayer]
	};
	printParams.template = template;

	var printMap = new esri.tasks.PrintTask("https://gis.wim.usgs.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task");
	printMap.execute(printParams, printDone, printError);

	map.getLayer("moLayer").setVisibility(true);
	map.graphics.setVisibility(true);
	if (setItBack == true) {
		map.infoWindow.show();
	}
	
	map.setCursor("wait");

	function printDone(event) {
		//alert(event.url);
		window.open(event.url, "_blank");
		//window.open(event.url, "test.pdf");
		map.setCursor("default");

		//("#moreInfoText").append("<a id='link' download='test' href='" + event.url + "'></a>");
		//$("#link")[0].click();

		$("#printStatus").hide();
	}

	function printError(event) {
		alert(event.error);
		$("#printStatus").hide();
	}
}

function linkClick() {

	map.setCursor("wait");
	console.log(sucode4FeatureLinkZoom);
	var query = new esri.tasks.Query();
	query.where = "SUCODE = '" + sucode4FeatureLinkZoom + "'";
	query.returnGeometry = true;
	var queryTask = new esri.tasks.QueryTask(map.getLayer("networks").url+"/0");
	queryTask.execute(query, function (results) {
		console.log('returned with result?');
		var feature = results.features[0];
		var featureExtent = feature.geometry.getExtent();
		map.setExtent(featureExtent, true);
		//setCursorByID("mainDiv", "default");
        map.setCursor("default");
	});

}

dojo.ready(init);
//IMPORTANT: while easy to miss, this little line above makes everything work. it fires when the DOM is ready and all dojo.require calls have been resolved. 
//Also when all other JS has been parsed, as it lives here at the bottom of the document. Once all is parsed, the init function is executed*