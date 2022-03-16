
function makeAPIcallToDataSF(urlEndpoint) {
    return $.ajax({
        url: urlEndpoint,
        type: "GET",
        data: {
            "$limit": 5000,
            "$$app_token": ""
        }
    })
}

function change( el ) {
    if ( el.value === "Show Description" )
        el.value = "Hide Description";
    else
        el.value = "Show Description";
    $(".description").toggle();
}


var MapCtrl = function () {
    var map = L.map('map').setView([37.7749, -122.4194], 13);
    L.esri.basemapLayer('Topographic').addTo(map);

    var geojsonMarkerOptions = {
        radius: 7,
        fillColor: "#0747ad",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    var netUnitsReport = 0;
    var netAffUnitsReport = 0;
    var netRetailSqFtReport = 0;
    var netOfficeSqFtReport = 0;
    var netInstiutionalSqFtReport = 0;
    var netPdrSqReport = 0;
    var netMedSqFtReport = 0;
    var netHotelSqReport = 0;

    var housingPipelinePoints = undefined;
    var housingPipelinePointsLayer = undefined;
    var currPipelinePointsSelection = undefined;

    var nHoodAnalysisDataLayer = undefined;
    var supervisorDisDataLayer = undefined;
    var currPlanningQuadDataLayer = undefined;
    var priorityDevDataLayer = undefined;
    var planningAreaDataLayer = undefined;

    var uniqueProjectStatusArr = [];

    var pointLayerGroup = new L.LayerGroup();
    var areaLayerGroup = new L.LayerGroup();
    function getRadius() {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            if (map.getZoom()) {
                radius = Math.pow(map.getZoom(), 0.9);
            } else { radius = Math.pow(initialZoomLevel, 0.9); } //if it's the initial startup, use initial zoom level
            return radius;
        } else {
            if (map.getZoom()) { radius = Math.pow(map.getZoom(), 0.8); } //if map already exists, get current zoom level
            else { radius = Math.pow(initialZoomLevel, 0.8); } //if it's the initial startup, use initial zoom level
            return radius;
        }
    };

    function highlightFeature(e) {
        var target = e.target;
        target.setStyle({
            radius: getRadius() * 1.2, weight: 2,
        }); //make radius 20% bigger when hovering, plus make outline thicker
        target.bringToFront();
    }

    //on mouseout, reset highlighted feature's style
    function resetHighlight(e) {
        var target = e.target;
        target.setStyle({ 
            radius: getRadius() / 1.2,
            weight: 1,
            color: '#ffffff' 
        }); //reset to default settings
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: clickFeature
        })
    }

    function clickFeature(e) {
        var target = e.target;
        var latlng = target._latlng;
        var props = target.feature.properties;
        var popupContent = '<span class="popup-label"><b>' + props.address + '</b></span>' +
            '<br /><span class="popup-label">Net Units: ' + props.netUnits + '</span>' +
            '<br /><span class="popup-label">Net Affordable Units: ' + props.netAffordableUnits + '</span>' +
            '<br /><span class="popup-label">Net Non-Res SqFt: ' + props.netNonResSqFt.toLocaleString() + '</span>' +
            '<br /><span class="popup-label">Status: ' + props.recordStatus + '</span>' +
            '<br/><input type="button" value="Show Description" onclick="change(this);" id = "descbutton"/>' +
            '<br style="line-height:3.5vh"/><span class="description">' + props.description + '<br></span>' +
            '<span class="description">' + '<a  target="_blank" href = "https://sfplanninggis.org/pim/?search=' + props.address + '">' + 'More Information' + '</a></span>'

        var popup = L.popup({ closeOnClick: false }).setContent(popupContent).setLatLng(latlng);
        target.bindPopup(popup).openPopup();
    }

    function popuplateProjStatsDropdown() {
        for (var i = 0; i < uniqueProjectStatusArr.length; i++) {
            $("#proj-status-selection").append("<option value=" + uniqueProjectStatusArr[i] + ">" + uniqueProjectStatusArr[i]  + "</option>")
        }
    }

    function populateSummaryTable(pipelineSummary) {
        $("#netUnitTotal").text(pipelineSummary.netUnitsReport.toLocaleString());
        $("#netAffUnits").text(pipelineSummary.netAffUnitsReport.toLocaleString());
        $("#netRetailSpace").text(pipelineSummary.netRetailSqFtReport.toLocaleString());
        $("#netOfficeSpace").text(pipelineSummary.netOfficeSqFtReport.toLocaleString());
        $("#netInstitutionalSpace").text(pipelineSummary.netInstiutionalSqFtReport.toLocaleString());
        $("#netPdrSpace").text(pipelineSummary.netPdrSqReport.toLocaleString());
        $("#netMedSpace").text(pipelineSummary.netMedSqFtReport.toLocaleString());
        $("#netHotelSpace").text(pipelineSummary.netHotelSqReport.toLocaleString());
    }

    function summarizePipelinePoints(pipelinePoints) {


        var netUnitsReport = 0;
        var netAffUnitsReport = 0;
        var netAffUnitsReport = 0;
        var netAffUnitsReport = 0;
        var netAffUnitsReport = 0;
        var netAffUnitsReport = 0;
        var netRetailSqFtReport = 0;
        var netOfficeSqFtReport = 0;
        var netMedSqFtReport = 0;
        var netInstiutionalSqFtReport = 0;
        var netHotelSqReport = 0;
        var netPdrSqReport = 0; 
        pipelinePoints.forEach(function(point) {
            var pointProperties = point.properties;
            var institutionalSpace = parseInt(pointProperties.institutionalSpace) || 0;
            var medicalSpace = parseInt(pointProperties.medicalSpace || 0) ;
            var retailSpace = parseInt(pointProperties.retailSpace || 0);
            var officeSpace = parseInt(pointProperties.officeSpace || 0);
            var hotelSpace = parseInt(pointProperties.hotelSpace || 0);
            var industrialSpace = parseInt(pointProperties.industrialSpace || 0);
            var pipelineUnit = parseInt(pointProperties.pipelineUnits || 0);
            var netAffordableUnits = parseInt(pointProperties.netAffordableUnits || 0);

            netUnitsReport += pipelineUnit;
            netAffUnitsReport += netAffordableUnits;
            netRetailSqFtReport += retailSpace;
            netOfficeSqFtReport += officeSpace;
            netMedSqFtReport += medicalSpace;
            netInstiutionalSqFtReport += institutionalSpace;
            netHotelSqReport += hotelSpace;
            netPdrSqReport += industrialSpace;           
        });

        pipelineSummary = {
            "netUnitsReport": netUnitsReport,
            "netAffUnitsReport": netAffUnitsReport,
            "netRetailSqFtReport": netRetailSqFtReport,
            "netOfficeSqFtReport": netOfficeSqFtReport,
            "netMedSqFtReport": netMedSqFtReport,
            "netInstiutionalSqFtReport": netInstiutionalSqFtReport,
            "netHotelSqReport": netHotelSqReport,
            "netPdrSqReport": netPdrSqReport
        }
        populateSummaryTable(pipelineSummary);
    }

    

    function fetchHousingPipelineData() {
        var pipelineDataEndPoint = "https://data.sfgov.org/resource/nrtx-srqj.json";
        makeAPIcallToDataSF(pipelineDataEndPoint)
            .then(function (data) {
                var pipelineSummary = undefined;
                housingPipelinePoints = data.map(function (point) {

                    var coordinates = point.location.coordinates;
                    var pipelineUnit = parseInt(point.pipeline_units || 0);
                    var netAffordableUnits = parseInt(point.affordablenet || 0);
                    var netNonResSqFt = parseInt(point.net_gsf || 0);
                    var recordStatus = point.beststat.toLowerCase();

                    var institutionalSpace = parseInt(point.cienet) || 0;
                    var medicalSpace = parseInt(point.mednet || 0) ;
                    var retailSpace = parseInt(point.retnet || 0);
                    var officeSpace = parseInt(point.mipsnet || 0);
                    var hotelSpace = parseInt(point.visitnet || 0);
                    var industrialSpace = parseInt(point.pdrnet || 0);
                    var normalizedRecordStatus = undefined;

                    var pipelineDescription = point.dbidesc;

                    netUnitsReport += pipelineUnit;
                    netAffUnitsReport += netAffordableUnits;
                    netRetailSqFtReport += retailSpace;
                    netOfficeSqFtReport += officeSpace;
                    netMedSqFtReport += medicalSpace;
                    netInstiutionalSqFtReport += institutionalSpace;
                    netHotelSqReport += hotelSpace;
                    netPdrSqReport += industrialSpace;     
                    

                    if (recordStatus == "construction") {
                        normalizedRecordStatus = "Under Construction";
                    } else if (recordStatus == "bp approved" || recordStatus == "bp issued" || recordStatus == "issued" || recordStatus == "bp reinstated") {
                        normalizedRecordStatus = "Building Permit Approved"
                    } else if (recordStatus == "pl approved" || recordStatus == "bp filed") {
                        normalizedRecordStatus = "Planning Entitled";
                    } else {
                        normalizedRecordStatus = "Proposed"
                    }

                    if (uniqueProjectStatusArr.indexOf(normalizedRecordStatus) == -1) {
                        uniqueProjectStatusArr.push(normalizedRecordStatus);
                    }

                    
                    var address = point.nameaddr
                    var coordinates = point.location.coordinates;
                    return turf.point(coordinates, {
                        "netUnits": pipelineUnit,
                        "netAffordableUnits": netAffordableUnits,
                        "netNonResSqFt": netNonResSqFt,
                        "recordStatus": normalizedRecordStatus,
                        "address": address,

                        "pipelineUnits": pipelineUnit,
                        "retailSpace": retailSpace,
                        "officeSpace": officeSpace,
                        "medicalSpace": medicalSpace,
                        "institutionalSpace": institutionalSpace,
                        "hotelSpace": hotelSpace,
                        "industrialSpace": industrialSpace,
                        "description": pipelineDescription
                    });
                });

                currPipelinePointsSelection = housingPipelinePoints.slice();
                pipelineSummary = {
                    "netUnitsReport": netUnitsReport,
                    "netAffUnitsReport": netAffUnitsReport,
                    "netRetailSqFtReport": netRetailSqFtReport,
                    "netOfficeSqFtReport": netOfficeSqFtReport,
                    "netMedSqFtReport": netMedSqFtReport,
                    "netInstiutionalSqFtReport": netInstiutionalSqFtReport,
                    "netHotelSqReport": netHotelSqReport,
                    "netPdrSqReport": netPdrSqReport
                }
                populateSummaryTable(pipelineSummary);

                popuplateProjStatsDropdown();

                housingPipelinePointsLayer = L.geoJSON(housingPipelinePoints, {
                    onEachFeature: onEachFeature,
                    pointToLayer: function (feature, latlng) {
                        return L.circleMarker(latlng, geojsonMarkerOptions);
                    }
                })

                pointLayerGroup.addLayer(housingPipelinePointsLayer);
                pointLayerGroup.addTo(map);
                map.fitBounds(housingPipelinePointsLayer.getBounds());
            });
        return;
    }

    function fetchPlanningQudrantData() {
        var planningQuadEndPoint = "https://data.sfgov.org/resource/6dn4-si7z.json";
        makeAPIcallToDataSF(planningQuadEndPoint)
        .then(function (data) {
            currPlanningQuadDataLayer = data.map(function (polygon) {
                var coordinates = polygon.the_geom.coordinates;
                var quadName = polygon.quad;
                $(".planning-quad-dropdown").append('<li> <input type="checkbox" />&nbsp;' + quadName + '</li>');

                return {
                    "type": "Feature",
                    "properties": {
                        "quadName": quadName
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": coordinates[0]
                    }
                }
            });
        });
    }

    function fetchNHoodAnalysisData() {
        var nHoodAnalysisDataEndPoint = "https://data.sfgov.org/resource/xfcw-9evu.json";
        makeAPIcallToDataSF(nHoodAnalysisDataEndPoint)
            .then(function (data) {

                nHoodAnalysisDataLayer = data.map(function (polygon) {
                    var coordinates = polygon.the_geom.coordinates;
                    var combinedCoord = [];

                    for (var i = 0; i < coordinates.length; i++) {
                        combinedCoord.push(...coordinates[i])
                    }

                    var nhoodName = polygon.nhood;
                    var properties = {
                        "neighborhood": nhoodName
                    }
                    $(".neighborhood-dropdown").append('<li> <input type="checkbox" />&nbsp;' + nhoodName + '</li>');
                    return  turf.multiPolygon(coordinates, properties);

                });
        });
    }

    function fetchSupervisorData() {
        var supervisorDisDataEndPoint = "https://data.sfgov.org/resource/keex-zmn4.json";
        makeAPIcallToDataSF(supervisorDisDataEndPoint)
            .then(function (data) {
                supervisorDisDataLayer = data.map(function (polygon) {
                    var coordinates = polygon.the_geom.coordinates;
                    var supervisorDisName = polygon.supdist;
                    $(".supervisor-dropdown").append('<li> <input type="checkbox" />&nbsp;' + supervisorDisName + '</li>');

                    return {
                        "type": "Feature",
                        "properties": {
                            supervisorName: supervisorDisName
                        },
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": coordinates[0]
                        }
                    }
                });
        });
    }

    function fetchPriorityDevData() {
        var priorityDevAreaDataEndPoint = "https://data.sfgov.org/resource/k5ee-yrip.json";
        makeAPIcallToDataSF(priorityDevAreaDataEndPoint)
            .then(function(data) {
                priorityDevDataLayer = data.map(function(polygon) {
                    var coordinates = polygon.the_geom.coordinates;
                    var priorityDevAreaName = polygon.name;
                    $(".priority-dev-area-dropdown").append('<li> <input type="checkbox" />&nbsp;' + priorityDevAreaName + '</li>');

                    return {
                        "type": "Feature",
                        "properties": {
                            priorityDevAreaName: priorityDevAreaName
                        },
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": coordinates[0]
                        }
                    }
                })
            });
    }

    function fetchPlanningAreaData() {
        var planningAreaEndPoint = "https://data.sfgov.org/resource/bkzf-eahq.json";
        makeAPIcallToDataSF(planningAreaEndPoint)
            .then(function(data) {
                planningAreaDataLayer = data.map(function(polygon) {
                    var coordinates = polygon.the_geom.coordinates;
                    var combinedCoord = [];
                    var planningArea = polygon.planarea;
                    $(".area-plan-dropdown").append('<li> <input type="checkbox" />&nbsp;' + planningArea + '</li>');

                    var properties = {
                        "planningArea": planningArea
                    }
                    for (var i = 0; i < coordinates.length; i++) {
                        combinedCoord.push(...coordinates[i])
                    }
                    return  turf.multiPolygon(coordinates, properties);
                });
            });
    }

    function getAreaFilterData() {
        /*
            Data to get
            - neighborhood analysis
            - priority development areas
            - area plans
            - supervisor districts
            - current planning quandrants
            - aggregate transportaion analysis zones
            - other: wtf is this
        */
 
        fetchSupervisorData();
        fetchNHoodAnalysisData();
        fetchPlanningQudrantData();
        fetchPriorityDevData();
        fetchPlanningAreaData();
    }


    function getFilter(lowBound, upBound, currVal) {
        if (lowBound != "" && upBound != "") {
            return lowBound <= currVal && upBound >= currVal;
        } else if (lowBound != "" && upBound == "") {
            return lowBound <= currVal;
        } else if (lowBound == "" && upBound != "") {
            return upBound >= currVal;
        } else {
            return 1 == 1;
        }
    }

    function getFilteredPoints(filterProperties) {
        var netUnitLowBound = filterProperties["netUnitLowBound"];
        var netUnitUpBound = filterProperties["netUnitUpBound"];
        var netAffUnitLowBound = filterProperties["netAffUnitLowBound"];
        var netAffUnitUpBound = filterProperties["netAffUnitUpBound"];
        var nonResSqFtLowBound = filterProperties["nonResSqFtLowBound"];
        var nonResSqFtUpBound = filterProperties["nonResSqFtUpBound"];
        var projStatusFilter = filterProperties["projStatus"];

        var filteredPoints = housingPipelinePoints.filter(function(point) {
            var pointProperties = point.properties;
            var currNetUnits = pointProperties.netUnits;
            var currNetAffUnits = pointProperties.netAffordableUnits;
            var currNetNonResSqft = pointProperties.netNonResSqFt;
            var currProjStatus = pointProperties.recordStatus;
            var netUnitFilter = getFilter(netUnitLowBound, netUnitUpBound, currNetUnits);
            var netAffUnitFilter = getFilter(netAffUnitLowBound, netAffUnitUpBound, currNetAffUnits);
            var netResSqFtFilter = getFilter(nonResSqFtLowBound, nonResSqFtUpBound, currNetNonResSqft);
            var currProjStatusFilter = 1 == 1;
            if (projStatusFilter != "All") {
                currProjStatusFilter = currProjStatus == projStatusFilter
            }
            return netUnitFilter && netAffUnitFilter && netResSqFtFilter && currProjStatusFilter;

        });

        return filteredPoints
    }

    function getAverageLatLongPair(polygonCoordinates){
        var averageLongtitude;
        var averageLatitude;

        var largestLong = polygonCoordinates[0][0];
        var smallestLong = polygonCoordinates[0][0];

        var largestLat = polygonCoordinates[0][1];
        var smallestLat = polygonCoordinates[0][1];

        for(var i = 1; i < polygonCoordinates.length; i++){
          var currLong = polygonCoordinates[i][0];
          var currLat = polygonCoordinates[i][1];

          if (currLong > largestLong) largestLong = currLong;
          if (currLong < smallestLong) smallestLong = currLong;

          if(currLat > largestLat) largestLat = currLat;
          if(currLat < smallestLat) smallestLat = currLat;
        }
        averageLongtitude = (smallestLong + largestLong) / 2;
        averageLatitude = (smallestLat + largestLat) / 2;
        return [averageLongtitude, averageLatitude];
    }

    return {
        initializeMap: function () {
            fetchHousingPipelineData();
            // fetchHousingInventoryData();
            getAreaFilterData();
        },

        getSupervisorDisLayerData: function () {
            return supervisorDisDataLayer;
        },

        getPlanningQuadLayerData: function() {
            return currPlanningQuadDataLayer;
        },

        getPipelinePointsData: function () {
            return housingPipelinePoints;
        },

        getNHoodLayerData: function() {
            return nHoodAnalysisDataLayer;
        },

        getPlanningAreaLayerData: function() {
            return planningAreaDataLayer;
        },

        getPriorityDevData: function() {
            return priorityDevDataLayer;
        },

        getLeafLeafLetMap: function() {
            return map;
        },

        addPointLayerToMap: function(layer) {
            var layerToAdd = L.geoJSON(layer, {
                onEachFeature: onEachFeature,
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                }
            });
            pointLayerGroup.addLayer(layerToAdd)
            pointLayerGroup.addTo(map);
        },
        
        clearMap: function() {
            pointLayerGroup.clearLayers();
            areaLayerGroup.clearLayers();
        },

        zoomIntoLayerBounds: function(layer) {
            if (layer.features.length === 0) {
                alert("There are no developments with the entered criteria.")
            } else {
                var layerToAdd = L.geoJSON(layer);
                map.fitBounds(layerToAdd.getBounds())
            }

        },

        displayPipelinePointsInArea: function(ulClassName, layerToSearch, propToCheck, queryConditions) {
            var polygonsToIntersect = [];
            var dropdownListElements = $(ulClassName);
            var allPointFeaturesInside = [];
            for (var i = 0; i < dropdownListElements.length; i++) {
                var inputElement = dropdownListElements[i].getElementsByTagName("input");
                if (inputElement[0].checked) {
                    var searchVal = dropdownListElements[i].textContent.trim();
                    var polygonToIntersect = layerToSearch.filter(function (layer) {
                        return layer.properties[propToCheck] == searchVal;
                    });
                    polygonsToIntersect.push(polygonToIntersect)
                }
            }

            var filteredPipelinepoints = getFilteredPoints(queryConditions);
            var callAddPointLayerToMap = this.addPointLayerToMap;
            polygonsToIntersect.forEach(function(polygon) {
                // add area of interest to map
                var areaLayer = L.geoJson(polygon);
                areaLayerGroup.addLayer(areaLayer);
                areaLayerGroup.addTo(map);

                var points = turf.featureCollection(filteredPipelinepoints);
                var ptsWithin = turf.pointsWithinPolygon(points, polygon[0]);
                allPointFeaturesInside.push(...ptsWithin.features);
                callAddPointLayerToMap(ptsWithin);
            });
            currPipelinePointsSelection = allPointFeaturesInside.slice();
            var allPointsInside = {
                "type": "FeatureCollection",
                "features": allPointFeaturesInside
            }
            summarizePipelinePoints(allPointFeaturesInside);
            this.zoomIntoLayerBounds(allPointsInside);
        },

        displayPipelinePointsByProjStatus: function(queryConditions) {
            var filteredPipelinepoints = getFilteredPoints(queryConditions);

            currPipelinePointsSelection = filteredPipelinepoints.slice();
            var pointLayer = turf.featureCollection(filteredPipelinepoints);
            this.addPointLayerToMap(pointLayer);
            summarizePipelinePoints(filteredPipelinepoints);
        },

        displayPipelinePointsByAddressSearch: function(addressStr, radius, queryConditions) {
            var callAddPointLayerToMap = this.addPointLayerToMap;
            var zoomIntoLayer = this.zoomIntoLayerBounds;
            var geocoderSearchUrl = "https://sfplanninggis.org/cpc_geocode/?search=" + addressStr;
            $.get(geocoderSearchUrl)
            .then(function(res) {
                var jsonData = JSON.parse(res);
                console.log(jsonData)
                if (jsonData.features.length !== 0) {
    
                    var polygonCoordinates = jsonData.features[0].geometry.rings[0];
                    var coordPair = getAverageLatLongPair(polygonCoordinates);
    
                    var lat = JSON.stringify(coordPair[1]);
                    var lon = JSON.stringify(coordPair[0]);
                    var center = [lon, lat];
                    var options = {
                        units: "miles"
                    }
                    var filteredPipelinepoints = getFilteredPoints(queryConditions);
                    var boundingCircle = turf.circle(center, radius, options);
                    var points = turf.featureCollection(filteredPipelinepoints);
                    var ptsWithin = turf.pointsWithinPolygon(points, boundingCircle);
                    currPipelinePointsSelection = ptsWithin.features;
                    
                    summarizePipelinePoints(ptsWithin.features);

                    callAddPointLayerToMap(ptsWithin);
                    zoomIntoLayer(ptsWithin);
                } else {
                    alert("Sorry, there are no results for that address");
                }
            });
        },

        getCurrPipelinePointSelection: function() {
            return currPipelinePointsSelection;
        },

        resetMap: function() {
            // Display original pipeline points
            currPipelinePointsSelection = housingPipelinePoints
            this.clearMap();
            pointLayerGroup.addLayer(housingPipelinePointsLayer);
            pointLayerGroup.addTo(map);
            map.fitBounds(housingPipelinePointsLayer.getBounds());
            $(".warning-message").addClass("clear");
            summarizePipelinePoints(housingPipelinePoints);

        }
    };
}();

var AppCtrl = function () {
    var disableSubmit = false;

    function uncheckedInputlists(inputList) {
        for (var i = 0; i < inputList.length; i++) {
            inputList[i].checked = false;
        }
      
    }

    function clearFormInputs() {
        $("#netUnitLowerBound").val("");
        $("#netUnitUpperBound").val("");
        $("#netAffUnitLowerBound").val("");
        $("#netAffUnitUpperBound").val("");
        $("#nonResSqFtLowerBound").val("");
        $("#netNonResSqFtUpperBound").val("");
        $("#address-input").val("");
        $("#buffer-distance").val("");

        $(".form-select").val("All")

        var supvisorChoicesInput = $(".supervisor-dropdown li input");
        var neighborhoodChoicesInput = $(".neighborhood-dropdown li input");
        var priorityDevAreaChoicesInput = $(".priority-dev-area-dropdown li input");
        var areaPlanChoicesInput = $(".area-plan-dropdown li input");
        var planningQuadChoicesInput = $(".planning-quad-dropdown li input");

        uncheckedInputlists(supvisorChoicesInput);
        uncheckedInputlists(neighborhoodChoicesInput);
        uncheckedInputlists(priorityDevAreaChoicesInput);
        uncheckedInputlists(areaPlanChoicesInput);
        uncheckedInputlists(planningQuadChoicesInput);
    }

    return {
        initialize: function () {
            MapCtrl.initializeMap();

            $("#pipeline-form").submit(function (e) {
                e.preventDefault();
                if (disableSubmit) {
                    console.log("submit disalbed");
                    return;
                }
                MapCtrl.clearMap();
                var dropDownClassNameToSearch = "";
                var layerToSearch = undefined;
                var propertyToCheck = undefined;
                var searchByArea = false;
                var searchByAddress = false;

                var supDisDropDownInputsIsChecked = $(".supervisor-dropdown li input:checked");
                var nHoodDropDownInputsIsChecked = $(".neighborhood-dropdown li input:checked");
                var priorityDevAreaDropDownInputsIsChecked = $(".priority-dev-area-dropdown li input:checked");
                var areaPlanDropDownInputsIsChecked = $(".area-plan-dropdown li input:checked");
                var planningQuadDropDownInputsIsChecked = $(".planning-quad-dropdown li input:checked");

                var totalAreaCategorySelected = 0;

                var projStatusSelected = $("#proj-status-selection option:selected").text();

                if (supDisDropDownInputsIsChecked.length > 0) {
                    searchByArea = true;
                    dropDownClassNameToSearch = ".supervisor-dropdown li"
                    layerToSearch = MapCtrl.getSupervisorDisLayerData();
                    propertyToCheck = "supervisorName";
                    totalAreaCategorySelected++;
                } else if (nHoodDropDownInputsIsChecked.length > 0) {
                    searchByArea = true;
                    dropDownClassNameToSearch = ".neighborhood-dropdown li";
                    layerToSearch = MapCtrl.getNHoodLayerData();
                    propertyToCheck = "neighborhood";
                    totalAreaCategorySelected++;
                } else if (priorityDevAreaDropDownInputsIsChecked.length > 0) {
                    searchByArea = true;
                    dropDownClassNameToSearch = ".priority-dev-area-dropdown li";
                    layerToSearch = MapCtrl.getPriorityDevData();
                    propertyToCheck = "priorityDevAreaName";
                    totalAreaCategorySelected++;
                } else if (areaPlanDropDownInputsIsChecked.length > 0) {
                    searchByArea = true;
                    dropDownClassNameToSearch = ".area-plan-dropdown li";
                    totalAreaCategorySelected++;
                    layerToSearch = MapCtrl.getPlanningAreaLayerData();
                    propertyToCheck = "planningArea"
                } else if (planningQuadDropDownInputsIsChecked.length > 0) {
                    searchByArea = true;
                    dropDownClassNameToSearch = ".planning-quad-dropdown li";
                    layerToSearch = MapCtrl.getPlanningQuadLayerData();
                    propertyToCheck = "quadName";
                    totalAreaCategorySelected++;
                }

                var netUnitLowBound = $("#netUnitLowerBound").val();
                var netUnitUpBound = $("#netUnitUpperBound").val();
                var netAffUnitLowBound = $("#netAffUnitLowerBound").val();
                var netAffUnitUpBound = $("#netAffUnitUpperBound").val();
                var nonResSqFtLowBound = $("#nonResSqFtLowerBound").val();
                var nonResSqFtUpBound = $("#netNonResSqFtUpperBound").val();

                var addressVal = $("#address-input").val();
                var bufferDistVal = $("#buffer-distance").val();

                if (addressVal != "" && bufferDistVal != "") {
                    searchByAddress = true;
                }

                var queryProperties = {
                    "netUnitLowBound": netUnitLowBound,
                    "netUnitUpBound": netUnitUpBound,
                    "netAffUnitLowBound": netAffUnitLowBound,
                    "netAffUnitUpBound": netAffUnitUpBound,
                    "nonResSqFtLowBound": nonResSqFtLowBound,
                    "nonResSqFtUpBound": nonResSqFtUpBound,
                    "projStatus": projStatusSelected
                }

                try {
                    if (totalAreaCategorySelected > 1) {

                    } else if (searchByArea && searchByAddress) {
                        alert("Cannot search by area and address");
                    } else if (searchByArea) {
                        MapCtrl.displayPipelinePointsInArea(dropDownClassNameToSearch, layerToSearch, propertyToCheck, queryProperties);
                    } else if (searchByAddress) {
                        MapCtrl.displayPipelinePointsByAddressSearch(addressVal, bufferDistVal, queryProperties);
                    } else if (!searchByAddress && !searchByAddress) {
                        MapCtrl.displayPipelinePointsByProjStatus(queryProperties);
                    }  
                      
                } 
                catch(err) {
                    alert("An error occured. If this persists, please contact CPC.GIS@sfgov.org")
                }


            });

            $("#clear-button").click(function(e) {
                MapCtrl.resetMap();
                clearFormInputs();
                $(".submit-button").prop("disabled", false);

            })

            $("#download-csv").click(function(e) {
                require(['https://cdn.jsdelivr.net/npm/json2csv@4.2.1'], function(json2csv) {
                    var parser = new json2csv.Parser();
                    var currSelectedPoints = MapCtrl.getCurrPipelinePointSelection();
                    if (currSelectedPoints.length > 1) {
                        var csvDataArr = currSelectedPoints.map(function(point) {
                            var pointProperties = point.properties;
                            var address = pointProperties.address;
                            var status = pointProperties.recordStatus;
                            var netUnits = pointProperties.netUnits;
                            var netAffUnits = pointProperties.netAffordableUnits;
                            var netRetail = pointProperties.retailSpace;
                            var netOffice = pointProperties.officeSpace;
                            var netInstitutional = pointProperties.institutionalSpace;
                            var netIndustrial = pointProperties.industrialSpace;
                            var netMedical = pointProperties.medicalSpace;
                            var netHotel = pointProperties.hotelSpace;
    
                            return {
                                "Address": address,
                                "Status": status,
                                "Net Units": netUnits,
                                "Net Affordable Units": netAffUnits,
                                "Net Retail": netRetail,
                                "Net Office": netOffice,
                                "Net Institutional": netInstitutional,
                                "Net Industrial": netIndustrial,
                                "Net Medical": netMedical,
                                "Net Hotel": netHotel
                            }
                        });
                        var csv = parser.parse(csvDataArr);
                        var hiddenElement = document.createElement('a');
                        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
                        hiddenElement.target = '_blank';
                        
                        //provide the name for the CSV file to be downloaded
                        hiddenElement.download = 'data.csv';
                        hiddenElement.click();
                    }
                });
            })
    

            $(".dropdown-menu").change(function(e) {
                var categoryChecked  = 0;
                var supvisorChoicesInput = $(".supervisor-dropdown li input:checked");
                var neighborhoodChoicesInput = $(".neighborhood-dropdown li input:checked");
                var priorityDevAreaChoicesInput = $(".priority-dev-area-dropdown li input:checked");
                var areaPlanChoicesInput = $(".area-plan-dropdown li input:checked");
                var planningQuadChoicesInput = $(".planning-quad-dropdown li input:checked");

                if (supvisorChoicesInput.length > 0) {
                    categoryChecked++;
                }
                if (neighborhoodChoicesInput.length > 0) {
                    categoryChecked++;
                }
                if (priorityDevAreaChoicesInput.length > 0) {
                    categoryChecked++;
                }
                if (areaPlanChoicesInput.length > 0) {
                    categoryChecked++;
                }
                if (planningQuadChoicesInput.length > 0) {
                    categoryChecked++;
                }

                if (categoryChecked > 1) {
                    $(".warning-message").removeClass("clear");
                    $(".submit-button").prop("disabled", true);
                    disableSubmit = true;
                } else {
                    $(".warning-message").addClass("clear")
                    $(".submit-button").prop("disabled", false);
                    disableSubmit = false;
                }
            });

            $("#proj-status-selection").change(function(e) {
                var projStatusValue = e.target.value;
                if (projStatusValue == "Completed-Residential") {
                    $("#netAffUnitLowerBound").prop( "disabled", true );
                    $("#netAffUnitUpperBound").prop( "disabled", true );

                    $("#nonResSqFtLowerBound").prop( "disabled", true );
                    $("#netNonResSqFtUpperBound").prop( "disabled", true );

                } else {
                    $("#netAffUnitLowerBound").prop( "disabled", false );
                    $("#netAffUnitUpperBound").prop( "disabled", false );

                    $("#nonResSqFtLowerBound").prop( "disabled", false );
                    $("#netNonResSqFtUpperBound").prop( "disabled", false );
                }
            });

            $("#pdf-download").click(function(e) {
   
                var map = MapCtrl.getLeafLeafLetMap();
                
                var currSelectedPoints = MapCtrl.getCurrPipelinePointSelection();
                if (currSelectedPoints) {
                    var dataForTable = currSelectedPoints.map(function(eachPoint) {
                        var pointProperties = eachPoint.properties;
                        return [
                            pointProperties.address,
                            pointProperties.netUnits,
                            pointProperties.netAffordableUnits,
                            pointProperties.retailSpace,
                            pointProperties.officeSpace,
                            pointProperties.institutionalSpace,
                            pointProperties.industrialSpace,
                            pointProperties.hotelSpace,
    
                        ]
                    })
                    leafletImage(map, function(err, canvas) {    
                        var pdf = new jsPDF('p', 'pt', 'letter');
                        var right = 292; //this seems aligned with the right edge of the table
                        var dimensions = {'x': 600, 'y': 600}

                        // pdf.addImage(canvas, 'PNG', right, 40, dimensions.x * 0.5, dimensions.y * 0.5);

                        pdf.autoTable({
                                head: [["Adress", "Total Units", "Affordable Units", "Retail", 
                                        "Office", "Institutional", "PDR", "Medical", "Hotel"]],
                                body: dataForTable,
                              })
                        pdf.save("download.pdf")
                    });
                }
            });
        }
    }
}();


AppCtrl.initialize();
