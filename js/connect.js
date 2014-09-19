var animations = {};
var logic = {};
var mainloopCalculating = false;
var env = {};
var animationsLoading = true;
var loadInProgress = true;

function app() {


    function updateActions(type, action, data) {
        var playerEnv = logic.environments[logic.currentPlayer];

        //playerEnv.actions
    }

    function lg(msg) {
        console.log(msg);
    }

    function drawPlanets() {
        var playerEnv = logic.environments[logic.currentPlayer];
        var planetObj = new Object();
        var items = playerEnv.planets.length;
        var x = 0;
        var y = 0;

        gameScreen.textAlign = 'center';
        gameScreen.lineWidth = 1;
        gameScreen.beginPath();
        gameScreen.font = "Normal 11px sans-serif";
        while (items--) {
            planetObj = playerEnv.planets[items];
            x = planetObj.x + playerEnv.offsetX;
            y = planetObj.y + playerEnv.offsetY + 26;

            if (planetObj.owner === -1) {
                gameScreen.fillStyle = "rgba(0,185,0, 1)";
                if (playerEnv.knownPlanets.indexOf(planetObj.id) === -1) {
                    gameScreen.fillText(("(" + planetObj.displayName + ")"), x, y);
                } else {
                    gameScreen.fillText(planetObj.name, x, y);
                }
            } else if (planetObj.owner !== playerEnv.player) {
                gameScreen.fillStyle = "rgba(170,70,70, 1)";
                if (playerEnv.knownPlanets.indexOf(planetObj.id) === -1) {
                    gameScreen.fillText(("(" + planetObj.displayName + ")"), x, y);
                } else {
                    gameScreen.fillText(planetObj.name, x, y);
                }
            } else {
                gameScreen.fillStyle = "rgba(120,120,245, 1)";
                gameScreen.fillText(planetObj.name, x, y);
            }

            // Old flat rendering
            //gameScreen.fillStyle = 'rgba(255, 255, 255, 0.5)';
            //gameScreen.moveTo(x, y);
            //gameScreen.arc(x, y, 12, 0, 6.3);
        }
        gameScreen.closePath();
    }

    function checkPlanets(evt) {
        var playerEnv = logic.environments[logic.currentPlayer];
        var items = playerEnv.planets.length;

        var x = 0;
        var y = 0;
        var planetObj = new Object();
        gameScreen.beginPath();
        while (items--) {
            planetObj = playerEnv.planets[items];
            x = planetObj.x + playerEnv.offsetX;
            y = planetObj.y + playerEnv.offsetY;
            gameScreen.moveTo(x, y);
            gameScreen.arc(x, y, 14, 0, 6.3);

            if (gameScreen.isPointInPath(evt.layerX, evt.layerY)) {
                gameScreen.closePath();
                return planetObj;
            }
        }
        gameScreen.closePath();

        return false;
    }

    function checkFleets(evt) {
        var playerEnv = logic.environments[logic.currentPlayer];
        var items = playerEnv.fleets.length;
        var x = 0;
        var y = 0;
        var foreignItems = 0;

        gameScreen.beginPath();

        while (items--) {
            fleetObj = playerEnv.fleets[items];
            x = fleetObj.x + playerEnv.offsetX;
            y = fleetObj.y + playerEnv.offsetY;

            gameScreen.moveTo(x, y);
            gameScreen.arc(x, y, 10, 0, 6.3);

            if (gameScreen.isPointInPath(evt.layerX, evt.layerY)) {
                if (fleetObj.location !== 'space') {

                    if (fleetObj.origin.foreignFleets.length === 0) {
                        return fleetObj.origin.stationedFleets[0];
                    } else {
                        foreignItems = fleetObj.origin.foreignFleets.length;
                        while (foreignItems--) {
                            if (fleetObj.origin.foreignFleets[foreignItems].owner === playerEnv.player) {
                                gameScreen.closePath();
                                return playerEnv.fleets[ fleetObj.origin.foreignFleets[foreignItems].idx ];
                            }
                        }
                    }
                }

                gameScreen.closePath();
                return fleetObj;
            }
        }

        gameScreen.closePath();
        return false;
    }

    function checkRoutes(evt) {
        gameScreen.lineWidth = 20;
        var playerEnv = logic.environments[logic.currentPlayer];

        var items = playerEnv.activeRoutes.length;
        var x = playerEnv.offsetX;
        var y = playerEnv.offsetY;
        var route = {};
        gameScreen.beginPath();
        while (items--) {
            route = playerEnv.activeRoutes[items];

            gameScreen.moveTo(route[0].origin.x + x, route[0].origin.y + y);
            gameScreen.lineTo(route[1].x + x, route[1].y + y);

            if (gameScreen.isPointInStroke(evt.layerX, evt.layerY)) {
                createSelection(route[0]);
                gameScreen.closePath();
                return true;
            }
        }

        gameScreen.closePath();
        return false;
    }

    function checkClick(evt) {
        //lg(evt);

        if (document.getElementById("planetName") !== null) {
            return;
        }

        if (evt.target.id !== 'modal' && !env.strg) {
            modal.style.display = 'none';
            modal.innerHTML = '';
        }

        var planetObj = false;
        var fleetObj = false;

        planetObj = checkPlanets(evt);
        if (!planetObj) {
            fleetObj = checkFleets(evt);
        }

        if (!planetObj && !fleetObj) {
            if (checkRoutes(evt)) {
                return;
            }
        }

        var playerEnv = logic.environments[logic.currentPlayer];

        if (fleetObj) {
            // Retrieve fleet info from env.fleet for selection
            if (!fleetObj.hasOwnProperty('name')) {
                fleetObj = playerEnv.fleets[fleetObj.idx];
            }

            if (fleetObj.location !== 'space') {
                createSelection(fleetObj);
                showFleetDialog(fleetObj.origin, env.strg);
            } else {
                createSelection(fleetObj);
            }

        } else if (planetObj) {

            if (playerEnv.activeSelection.type === 'fleet' && playerEnv.activeSelection.location !== 'space') {
                if (playerEnv.activeSelection.origin !== planetObj) {
                    if (!setDestination(playerEnv.activeSelection, planetObj)) {
                        createSelection(playerEnv.activeSelection);
                        return;
                    }
                } else {
                    if (playerEnv.activeSelection.destination) {
                        var x = playerEnv.activeRoutes.length;
                        while (x--) {
                            if (playerEnv.activeRoutes[x][0] === playerEnv.activeSelection) {
                                playerEnv.activeRoutes.splice(x, 1);
                                break;
                            }
                        }
                    }
                    playerEnv.activeSelection.destination = false;
                    playerEnv.activeSelection.needsMove = false;
                    //scrollToLocation(planetObj, showPlanetDialog);
                }
            } else {

                if (playerEnv.ownedPlanets.indexOf(planetObj.id) !== -1 || playerEnv.knownPlanets.indexOf(planetObj.id) !== -1) {
                    //showPlanetDialog(planetObj);
                    //createSelection(planetObj);

                    if (playerEnv.activeSelection !== planetObj) {
                        scrollToLocation(planetObj, showPlanetDialog);
                    } else {
                        scrollToLocation(planetObj, false);
                        playerEnv.activeSelection = false;
                    }

                } else {
                    playerEnv.activeSelection = false;
                }

            }
        } else {

            if (playerEnv.activeSelection.type === "planet" && !playerEnv.strg) {
                scrollToLocation(playerEnv.activeSelection, false);
                playerEnv.activeSelection = false;
                return;
            }


            if (!playerEnv.strg) {
                playerEnv.activeSelection = false;
                statusBar.innerHTML = '';
            }
        }

    }

    // TODO REMOVE get fleet by id
    function getFleetById(fleetObj) {
        var fleetEnv = logic.environments[ parseInt(fleetObj.id.split('_')[0]) ].fleets;
        var items = fleetEnv.length;
        while (items--) {
            if (fleetObj.id === fleetEnv[items].id) {
                return fleetEnv[items];
            }
        }
    }

    // Gather modules of one type, "Colonize" and such, writing this information
    // into the env.moduleEffects variable of fleets, stationend/foreign, on planetId
    function gatherModuleEffects(planetObj, moduleType) {
        var playerEnv = logic.environments[logic.currentPlayer];

        var ships = 0;
        var effect = [];
        var fleetList = [];
        var items = 0;

        var index = 0;

        var fleetIndexes = [];
        var foreignIndexes = [];
        var isForeignFleet = false;


        if (planetObj.foreignFleets.length !== 0) {
            items = planetObj.foreignFleets.length;
            while (items--) {
                if (playerEnv.player === planetObj.foreignFleets[items].owner) {
                    fleetList.push(playerEnv.fleets[ planetObj.foreignFleets[items].idx ]);
                    isForeignFleet = true;
                    fleetIndexes.push(planetObj.foreignFleets[items].idx);
                    foreignIndexes.push(items);
                }
            }

            if (fleetList.length === 0) {
                fleetList = planetObj.stationedFleets;
            }
        } else {
            fleetList = planetObj.stationedFleets;
        }

        playerEnv.moduleEffects.isForeign = isForeignFleet;
        playerEnv.moduleEffects.planetIdx = playerEnv.planets.indexOf(planetObj);

        items = fleetList.length;

        while (items--) {
            index = isForeignFleet ? fleetIndexes[items] : playerEnv.fleets.indexOf(fleetList[items]);
            ships = fleetList[items].ships.length;

            var moduleEffect = {};
            while (ships--) {
                effect = getModule(fleetList[items].ships[ships].design, moduleType);

                if (effect[0]) {
                    moduleEffect = {
                        "type": moduleType,
                        "value": effect[1],
                        "fleet": index,
                        "ship": ships,
                        "foreignId": isForeignFleet ? foreignIndexes[items] : false,
                        "moduleId": playerEnv.moduleEffects.modules.length
                    };

                    playerEnv.moduleEffects.modules.push(moduleEffect);
                }
            }
        }
    }

    // Clear gathered module information of fleets
    function clearModuleEffects() {
        var playerEnv = logic.environments[logic.currentPlayer];
        playerEnv.moduleEffects = {
            "planetIdx": false,
            "isForeign": false,
            "modules": []
        };
    }

    function getBaseOutput(planet) {
        var baseAgriculture = logic.ecologicalLevel[planet.ecologicalLevel][0];
        var baseProduction = logic.mineralLevel[planet.mineralLevel][0];
        var baseResearch = logic.workers[planet.owner].research;

        // Increasing basic planet output by percentage based buildings
        var x = planet.constructions.length;
        var y = 0;
        while (x--) {
            y = logic.buildings.length;
            while (y--) {
                if (planet.constructions[x] === logic.buildings[y][0]) {
                    if (logic.buildings[y][3][1] === '%') {
                        switch (logic.buildings[y][3][0]) {
                            case "Agriculture":
                                baseAgriculture *= logic.buildings[y][3][2];
                                break;
                            case "Construction":
                                baseProduction *= logic.buildings[y][3][2];
                                break;
                            case "Research":
                                baseResearch *= logic.buildings[y][3][2];
                                break;
                        }
                    }
                }
            }
        }

        return [baseAgriculture, baseProduction, baseResearch];
    }

    function getFixedOutput(planet) {
        var planetAgriculture = 0;
        var planetProduction = 0;
        var planetResearch = 0;

        var x = planet.constructions.length;
        var y = 0;
        while (x--) {
            y = logic.buildings.length;
            while (y--) {
                if (planet.constructions[x] === logic.buildings[y][0]) {
                    if (logic.buildings[y][3][1] === '+') {
                        switch (logic.buildings[y][3][0]) {
                            case "Agriculture":
                                planetAgriculture += logic.buildings[y][3][2];
                                break;
                            case "Construction":
                                planetProduction += logic.buildings[y][3][2];
                                break;
                            case "Research":
                                planetResearch += logic.buildings[y][3][2];
                                break;
                        }
                    }
                }
            }
        }

        return [planetAgriculture, planetProduction, planetResearch];
    }

    function getMultiOutput(planet) {
        var planetAgriculture = 0;
        var planetProduction = 0;
        var planetResearch = 0;

        var x = planet.constructions.length;
        var y = 0;
        while (x--) {
            y = logic.buildings.length;
            while (y--) {
                if (planet.constructions[x] === logic.buildings[y][0]) {
                    if (logic.buildings[y][3][1] === '*') {
                        switch (logic.buildings[y][3][0]) {
                            case "Agriculture":
                                planetAgriculture += logic.buildings[y][3][2];
                                break;
                            case "Construction":
                                planetProduction += logic.buildings[y][3][2];
                                break;
                            case "Research":
                                planetResearch += logic.buildings[y][3][2];
                                break;
                        }
                    }
                }
            }
        }

        return [planetAgriculture, planetProduction, planetResearch];
    }

    function calcResearchPoints(planetObj) {
        var playerEnv = logic.environments[planetObj.owner];
        var percentOutput = getBaseOutput(planetObj);
        var fixedOutput = getFixedOutput(planetObj);
        var multiOutput = getMultiOutput(planetObj);

        var researchValue = planetObj.workForce[4] * (percentOutput[2] + multiOutput[2]) + fixedOutput[2];

        var index = playerEnv.ownedPlanets.indexOf(planetObj.id);
        if (index !== -1) {
            playerEnv.research.planets[index] = researchValue;

            var items = playerEnv.ownedPlanets.length;
            var researchValue = 0;
            while (items--) {
                researchValue += playerEnv.research.planets[items];
            }
            playerEnv.research.points = researchValue;
        }
    }

    function showPlanetDialog(planet, openTabItem) {
        var playerEnv = logic.environments[logic.currentPlayer];
        var name = '';

        if (playerEnv.ownedPlanets.indexOf(planet.id) !== -1) {
            name = planet.name;
        } else {
            name = planet.displayName;
        }

        var planetDetailScreen = '<div id="planetInfo" name="' + name + '">';
        planetDetailScreen += '<div>';
        planetDetailScreen += '<h3>' + name + ' (' + planet.type + ')</h3>';
        planetDetailScreen += '<br><h5>Description<h5>';
        planetDetailScreen += '<p>' + name + ' is a ' + logic.terrains[planet.terrain][0] + ' ' + planet.type + '.</p>';

        planetDetailScreen += '<br><h4>Overview</h4>';
        planetDetailScreen += '<p>Location.. ' + planet.x + '/' + planet.y + '</p>';
        planetDetailScreen += '<p>Terrain.. ' + logic.terrains[planet.terrain][0] + '</p>';
        planetDetailScreen += '<p>Mineral richness.. ' + logic.mineralLevel[planet.mineralLevel][1] + '</p>';
        planetDetailScreen += '<p>Ecological diversity.. ' + logic.ecologicalLevel[planet.ecologicalLevel][1] + '</p>';

        if (playerEnv.ownedPlanets.indexOf(planet.id) !== -1) {
            planetDetailScreen += '<br/><p>Current population.. ' + planet.population[0].toFixed(2) + ' of ' + planet.population[1].toFixed(2) + '</p>';
        } else {
            planetDetailScreen += '<br/><p>Planet maximum population.. ' + planet.population[1].toFixed(2) + '</p>';
        }

        planetDetailScreen += '</div>';

        if (planet.owner === -1) {
            clearModuleEffects();
            gatherModuleEffects(planet, 'Colonize');

            var items = playerEnv.moduleEffects.modules.length;
            var hasColonizeModule = false;
            while (items--) {
                if (playerEnv.moduleEffects.modules[items].type === 'Colonize') {
                    hasColonizeModule = true;
                    break;
                }
            }

            if (hasColonizeModule) {
                planetDetailScreen += '<br><button id="btnColonize">Colonize</button><br>';
            }
        }

        if (playerEnv.ownedPlanets.indexOf(planet.id) !== -1) {

            var percentOutput = getBaseOutput(planet);
            var fixedOutput = getFixedOutput(planet);
            var multiOutput = getMultiOutput(planet);

            var turns = 0;

            if (planet.workForce[3] !== 0) {
                turns = Math.ceil((planet.production[2] - planet.production[1]) / ((planet.workForce[3] * (percentOutput[1] + multiOutput[1])) + fixedOutput[1]));
            } else {
                turns = '-';
            }

            var currentProduction = parseFloat(planet.production[1]).toFixed(2);

            var baseMixOutput = [
                percentOutput[0] + multiOutput[0],
                percentOutput[1] + multiOutput[1],
                percentOutput[2] + multiOutput[2]
            ];

            var displayAgriculture = parseFloat((baseMixOutput[0]).toFixed(2));
            var displayProduction = parseFloat((baseMixOutput[1]).toFixed(2));
            var displayResearch = parseFloat((baseMixOutput[2]).toFixed(2));

            var agricultureValue = 0;
            var productionValue = 0;
            var researchValue = 0;

            planetDetailScreen += '<hr><div style="height: 20px;"><a href="#" class="tabregister" name="workForceModal">Workforce</a><a href="#" name="productionModal" class="tabregister">Production</a></div>';
            if (!planet.production[0]) {
                planetDetailScreen += '<div class="planetstats"><p>Current project: <span id="currentProject">No project assigned</span></p>';
            } else {
                planetDetailScreen += '<div class="planetstats"><p>Current project: <span id="currentProject">' + planet.production[0] + ', ' + currentProduction + ' of ' + planet.production[2] + ' units (' + turns + ' turns )</span></p>';
            }
            planetDetailScreen += '<p>Available workforce: <span id="availableWorkforce">' + planet.workForce[1] + '</span></p></div>';

            // Workforce modal
            planetDetailScreen += '<div class="tabcontent" id="workForceModal">';
            planetDetailScreen += '<div style="float: left;"><button id="agriculture">Agriculture</button>';
            planetDetailScreen += '<button id="production">Production</button>';
            planetDetailScreen += '<button id="research">Research</button>';
            planetDetailScreen += '<button id="reset">Reset workforce</button></div>';

            planetDetailScreen += '<div style="float:right; text-align:right; width: 240px;">';
            planetDetailScreen += '<p>Base Agriculture.. ' + displayAgriculture + '</p>';
            planetDetailScreen += '<p>Base Production.. ' + displayProduction + '</p>';
            planetDetailScreen += '<p>Base research.. ' + displayResearch + '</p>';

            if (planet.workForce[2] > 0) {
                agricultureValue = (planet.workForce[2] * baseMixOutput[0]).toFixed(2);
            }

            if (planet.workForce[3] > 0) {
                productionValue = (planet.workForce[3] * baseMixOutput[1]).toFixed(2);
            }

            if (planet.workForce[4] > 0) {
                researchValue = (planet.workForce[4] * baseMixOutput[2]).toFixed(2);
            }

            planetDetailScreen += '<br>';
            planetDetailScreen += '<p>Agriculture value.. ' + agricultureValue + ' + ' + fixedOutput[0] + '</p>';
            planetDetailScreen += '<p>Production value.. ' + productionValue + ' + ' + fixedOutput[1] + '</p>';
            planetDetailScreen += '<p>Research value.. ' + researchValue + ' + ' + fixedOutput[2] + '</p>';
            planetDetailScreen += '</div></div>';

            // Production modal
            planetDetailScreen += '<div class="tabcontent" id="productionModal" style="display: none;">';
            planetDetailScreen += '<div id="productionList">';
            planetDetailScreen += '<ul>';
            planetDetailScreen += '<li style="padding: 5px;">CONSTRUCTIONS</li>';

            if (planet.constructions.length !== 0) {
                var x = playerEnv.availableBuildings.length;
                while (x--) {
                    if (planet.constructions.indexOf(playerEnv.availableBuildings[x]) === -1) {
                        if (planet.production[0] === playerEnv.availableBuildings[x]) {
                            planetDetailScreen += '<li><a href="#" id="activeConstruction" class="constructionItem" name="building">' + playerEnv.availableBuildings[x] + '</a></li>';
                        } else {
                            planetDetailScreen += '<li><a href="#" class="constructionItem" name="building">' + playerEnv.availableBuildings[x] + '</a></li>';
                        }
                    }
                }
            } else {
                var x = playerEnv.availableBuildings.length;
                while (x--) {
                    planetDetailScreen += '<li><a href="#" class="constructionItem" name="building">' + playerEnv.availableBuildings[x] + '</a></li>';
                }
            }

            // TODO: Add a check for a shipyards, distinguish by design size and option to build or not
            planetDetailScreen += '<li style="border-top: 1px dashed #666; padding: 5px;">SHIP DESIGNS</li>';

            var x = playerEnv.designs.length;
            while (x--) {
                if (planet.production[0] === playerEnv.designs[x].name) {
                    planetDetailScreen += '<li><a href="#" id="activeConstruction" class="constructionItem" name="design">' + playerEnv.designs[x].name + '</a></li>';
                } else {
                    planetDetailScreen += '<li><a href="#" class="constructionItem" name="design">' + playerEnv.designs[x].name + '</a></li>';
                }
            }

            planetDetailScreen += '</ul></div>';

            planetDetailScreen += '<div style="float: left; width: 155px; margin-left: 10px;"><h5>DESCRIPTION</h5><div id="itemDescription" style="height: 165px; overflow:auto; font-size:10px; font-weight:normal; text-align:justify"></div></div>';

            planetDetailScreen += '<div style="float: left; margin-left: 10px; width: 155px;"><h5>QUEUED ITEMS</h5><ul id="productionQueue">';

            var x = planet.productionQueue.length;
            while (x--) {
                planetDetailScreen += '<li>' + planet.productionQueue[x][1] + '</li>';
            }
            planetDetailScreen += '</ul></div>';

            planetDetailScreen += '</div>';

        }

        planetDetailScreen += '</div>';
        modal.innerHTML = planetDetailScreen;

        // Check if there is any colonizatio module amongst the ships
        if (playerEnv.knownPlanets.indexOf(planet.id) !== -1) {
            if (hasColonizeModule) {
                document.getElementById('btnColonize').addEventListener('click', colonizePlanet);
            }
        }

        // Set the event handlers for the tabregisters
        if (playerEnv.ownedPlanets.indexOf(planet.id) !== -1) {
            var tabRegisters = document.getElementsByClassName('tabregister');

            var x = tabRegisters.length;
            while (x--) {
                if (openTabItem) {
                    if (openTabItem === x) {
                        tabRegisters[x].className = tabRegisters[x].className += ' activetab';
                        document.getElementById(tabRegisters[x].name).style.display = 'block';
                    } else {
                        document.getElementById(tabRegisters[x].name).style.display = 'none';
                    }
                } else if (x === 0) {
                    tabRegisters[x].className = tabRegisters[x].className += ' activetab';
                    document.getElementById(tabRegisters[x].name).style.display = 'block';
                }

                tabRegisters[x].addEventListener('click', function (evt) {
                    evt.preventDefault();
                    var activeTab = document.getElementsByClassName('activetab');

                    if (activeTab.length !== 0) {
                        document.getElementById(activeTab[0].name).style.display = 'none';
                        activeTab[0].className = activeTab[0].className.replace(' activetab', '');
                    }

                    document.getElementById(evt.target.name).style.display = 'block';
                    evt.target.className += ' activetab';
                });
            }
        }

        //lg(planet)

        // Adding action handlers for owned planets
        if (planet.population[0] !== 0) {
            if (playerEnv.ownedPlanets.indexOf(planet.id) !== -1) {

                var reset = document.getElementById('reset').addEventListener('click', function () {
                    env.research.points -= parseInt(displayResearch);
                    planet.workForce = [planet.workForce[0], planet.workForce[0], 0, 0, 0];
                    calcResearchPoints(planet);

                    showPlanetDialog(planet, 0);
                });

                var agriculture = document.getElementById('agriculture').addEventListener('click', function (evt) {
                    if (planet.workForce[1] !== 0 && !playerEnv.strg) {
                        planet.workForce[1] -= 1;
                        planet.workForce[2] += 1;
                    } else if (planet.workForce[2] !== 0 && playerEnv.strg) {
                        planet.workForce[1] += 1;
                        planet.workForce[2] -= 1;
                    }
                    showPlanetDialog(planet, 0);
                });

                var production = document.getElementById('production').addEventListener('click', function () {
                    if (planet.workForce[1] !== 0 && !playerEnv.strg) {
                        planet.workForce[1] -= 1;
                        planet.workForce[3] += 1;
                    } else if (planet.workForce[3] !== 0 && playerEnv.strg) {
                        planet.workForce[1] += 1;
                        planet.workForce[3] -= 1;
                    }
                    showPlanetDialog(planet, 0);
                });

                var research = document.getElementById('research').addEventListener('click', function () {
                    if (planet.workForce[1] !== 0 && !playerEnv.strg) {
                        planet.workForce[1] -= 1;
                        planet.workForce[4] += 1;
                    } else if (planet.workForce[4] !== 0 && playerEnv.strg) {
                        planet.workForce[1] += 1;
                        planet.workForce[4] -= 1;
                    }
                    calcResearchPoints(planet);
                    showPlanetDialog(planet, 0);
                });


                var constructionOptions = document.getElementsByClassName('constructionItem');

                var x = constructionOptions.length;
                while (x--) {
                    constructionOptions[x].addEventListener('mouseover', function (evt) {
                        if (evt.target.name === 'building') {
                            var desc = document.getElementById('itemDescription');
                            var option = playerEnv.buildings.length;

                            while (option--) {
                                if (playerEnv.buildings[option][0] === evt.target.innerHTML) {
                                    var items = logic.buildings.length;
                                    while (items--) {
                                        if (logic.buildings[items][0] === playerEnv.buildings[option][0]) {
                                            desc.innerHTML = '<p style="text-align:left; font-size:10px;">Construction cost: ' + logic.buildings[items][1] + '</p><br/>';
                                            desc.innerHTML += logic.buildings[items][4];
                                            return;
                                        }
                                    }
                                }
                            }
                        } else if (evt.target.name === 'design') {
                            var desc = document.getElementById('itemDescription');
                            var design = getDesign(playerEnv.player, evt.target.innerHTML);
                            if (design) {
                                var listing = '<ul style="text-align: left; font-size: 10px; text-transform: none;">';
                                listing += '<li>Construction Cost</span>: ' + design.cost + '</li><br/>';
                                listing += '<li>Type..   ' + design.type + '</li>';
                                listing += '<li>Range.. ' + design.range + '</li>';
                                listing += '<li>Speed.. ' + design.speed + '</li>';
                                listing += '<li>Space.. ' + design.space + '</li>';
                                listing += '</ul>';
                                desc.innerHTML = listing;
                                return;
                            }
                        }
                    });

                    constructionOptions[x].addEventListener('click', function (evt) {
                        evt.preventDefault();
                        env.scrollTargetToY = ["productionList", document.getElementById("productionList").children[0].scrollTop];

                        // Planet contruction handling
                        if (evt.target.name === 'building') {

                            var option = playerEnv.buildings.length;
                            while (option--) {
                                if (playerEnv.buildings[option][0] === evt.target.innerHTML) {

                                    if (!playerEnv.strg) {
                                        if (planet.prevProduction[0]) {
                                            for (var queueItem = planet.productionQueue.length - 1; queueItem > -1; queueItem--) {
                                                if (planet.productionQueue[queueItem][1] === playerEnv.buildings[option][0]) {
                                                    planet.productionQueue.splice(queueItem, 1);
                                                    break;
                                                }
                                            }

                                            if (evt.target.innerHTML === planet.prevProduction[0]) {
                                                var tmpProduction = planet.production;
                                                planet.production = planet.prevProduction;
                                                planet.prevProduction = tmpProduction;
                                            } else {
                                                planet.production = [playerEnv.buildings[option][0], 0, playerEnv.buildings[option][1], 'building'];
                                            }
                                        } else {
                                            for (var queueItem = planet.productionQueue.length - 1; queueItem > -1; queueItem--) {
                                                if (planet.productionQueue[queueItem][1] === playerEnv.buildings[option][0]) {
                                                    planet.productionQueue.splice(queueItem, 1);
                                                    break;
                                                }
                                            }

                                            if (planet.production[0] === playerEnv.buildings[option][0]) {
                                                return;
                                            }

                                            planet.prevProduction = planet.production;
                                            planet.production = [playerEnv.buildings[option][0], 0, playerEnv.buildings[option][1], 'building'];
                                        }

                                        showPlanetDialog(planet, 1);
                                    } else {
                                        for (var queueItem = planet.productionQueue.length - 1; queueItem > -1; queueItem--) {
                                            if (planet.productionQueue[queueItem][1] === playerEnv.buildings[option][0]) {
                                                return;
                                            }
                                        }

                                        if (planet.prevProduction[0] === playerEnv.buildings[option][0]) {
                                            planet.prevProduction = [false, 0, 0];
                                        }

                                        if (!planet.production[0]) {
                                            planet.prevProduction = planet.production;
                                            planet.production = [playerEnv.buildings[option][0], 0, playerEnv.buildings[option][1], 'building'];
                                            showPlanetDialog(planet, 1);
                                        } else {
                                            if (planet.production[0] === playerEnv.buildings[option][0]) {
                                                return;
                                            }

                                            planet.productionQueue.push(['building', playerEnv.buildings[option][0]]);
                                            document.getElementById('productionQueue').innerHTML += '<li class="queueItem">' + playerEnv.buildings[option][0] + '</li>';

                                            queueItems = document.getElementById('productionQueue').getElementsByTagName('LI');
                                            for (var queueItem = queueItems.length - 1; queueItem > -1; queueItem--) {
                                                queueItems[queueItem].addEventListener('click', removeQueueItem);
                                            }

                                        }
                                    }

                                    break;
                                }
                            }
                        } else if (evt.target.name === 'design') {

                            var option = playerEnv.designs.length;
                            while (option--) {
                                if (playerEnv.designs[option].name === evt.target.innerHTML) {

                                    if (!playerEnv.strg) {
                                        if (planet.prevProduction[0]) {
                                            if (evt.target.innerHTML === planet.prevProduction[0]) {
                                                var tmpProduction = planet.production;
                                                planet.production = planet.prevProduction;
                                                planet.prevProduction = tmpProduction;
                                            } else {
                                                planet.production = [playerEnv.designs[option].name, 0, playerEnv.designs[option].cost, 'design'];
                                            }
                                        } else {
                                            if (planet.production[0] === playerEnv.designs[option].name) {
                                                return;
                                            }

                                            planet.prevProduction = planet.production;
                                            planet.production = [playerEnv.designs[option].name, 0, playerEnv.designs[option].cost, 'design'];
                                        }

                                        showPlanetDialog(planet, 1);

                                    } else {

                                        if (planet.prevProduction[0] === playerEnv.designs[option].name) {
                                            planet.prevProduction = [false, 0, 0];
                                        }

                                        if (!planet.production[0]) {
                                            planet.prevProduction = planet.production;
                                            planet.production = [playerEnv.designs[option].name, 0, playerEnv.designs[option].cost, 'design'];
                                            showPlanetDialog(planet, 1);
                                        } else {

                                            planet.productionQueue.push(['design', playerEnv.designs[option].name]);
                                            document.getElementById('productionQueue').innerHTML += '<li class="queueItem">' + playerEnv.designs[option].name + '</li>';

                                            var queueItems = document.getElementById('productionQueue').getElementsByTagName('LI');
                                            for (var queueItem = queueItems.length - 1; queueItem > -1; queueItem--) {
                                                queueItems[queueItem].addEventListener('click', removeQueueItem);
                                            }

                                        }
                                    }

                                    break;
                                }
                            }
                        }
                    });


                    function removeQueueItem(evt) {
                        // TODO: Replace active item with selected queue item when strg is pressed or either
                        evt.preventDefault();

                        var queueItemList = document.getElementById('productionQueue').getElementsByTagName('LI');

                        for (var x = queueItemList.length - 1; x > -1; x--) {
                            if (evt.target === queueItemList[x]) {
                                planet.productionQueue.splice(x, 1);
                                evt.target.parentNode.removeChild(evt.target);
                                break;
                            }
                        }
                    }
                }
            }
        }

        modal.style.display = 'inline';

        if (playerEnv.scrollTargetToY[0] !== false) {
            document.getElementById(playerEnv.scrollTargetToY[0]).children[0].scrollTop = playerEnv.scrollTargetToY[1];
            playerEnv.scrollTargetToY = [false, 0];
        }

        gameArea.focus();
    }

    function showFleetDialog(planetObj, forceDisplay) {

        // TODO: Add back the colonize button to the fleet dialog, using
        // clearEffectModules and gatherEffectModules function
        // distinguish between stationed and foreign fleet
        var playerEnv = logic.environments[logic.currentPlayer];

        var shipListing = '';
        var options = '';

        var fleetList = planetObj.stationedFleets;

        if (planetObj.foreignFleets.length !== 0) {
            var hasActive = false;
            var fleetItems = planetObj.stationedFleets.length;

            while (fleetItems--) {
                if (fleetList[fleetItems].owner === logic.currentPlayer) {
                    hasActive = true;
                    fleetList = planetObj.stationedFleets;
                    break;
                }
            }

            if (!hasActive) {
                fleetList = [];
                fleetItems = planetObj.foreignFleets.length;
                while (fleetItems--) {
                    if (planetObj.foreignFleets[fleetItems].owner === logic.currentPlayer) {
                        fleetList.push(playerEnv.fleets[ planetObj.foreignFleets[fleetItems].idx ]);
                    }
                }
            }
        }

        if (fleetList.length > 1 || forceDisplay) {
            shipListing = '<div id="fleetControls">';
            shipListing += '<span id="joinFleets">Join</span>';
            shipListing += '<span id="nameFleet">Rename</span>';
            shipListing += '<span id="splitFleet">Split</span>';
            shipListing += '</div>';

            shipListing += '<ul id="shipListing">';

            var fleetItem = {};
            var targetLocation = '';

            var items = fleetList.length;
            while (items--) {
                fleetItem = fleetList[items];
                if (fleetItem.destination) {
                    targetLocation = '';
                    if (playerEnv.knownPlanets.indexOf(fleetItem.destination.id) === -1) {
                        targetLocation = ' - travelling to planet at ' + fleetItem.destination.x + '-' + fleetItem.destination.y + ' (' + Math.floor(fleetItem.turns) + ' turns)';
                    } else {
                        targetLocation = ' - travelling to ' + fleetItem.destination.name + ' (' + Math.floor(fleetItem.turns) + ' turns)';
                    }
                } else {
                    targetLocation = '';
                }

                shipListing += '<li><a href="#" name="' + fleetItem.name + '|' + fleetItem.id + '" class="">' + fleetItem.name + targetLocation + '</a></li>';

            }

            shipListing += '</ul>';
            shipListing += '<div id="fleetDetails"></div>';
        }

        if (options !== '' || shipListing !== '') {
            modal.innerHTML = shipListing + options;
            modal.style.display = 'inline';
            gameArea.focus();
            activeItem = false;


            function clearFleetSelections() {
                var activeSelections = document.getElementsByClassName('selectedFleet');

                if (activeSelections.length !== 0) {
                    for (var x = activeSelections.length - 1; x > -1; x--) {
                        activeSelections[x].className = '';
                    }

                }
            }


            function selectFleet(evt) {
                // Activate fleet for split mode
                if (activeItem) {
                    if (activeItem.id === 'splitFleet') {
                        if (evt.target.parentNode.parentNode.id === 'shipListing') {
                            clearFleetSelections();
                            evt.target.className = 'selectedFleet';
                            evt.preventDefault();
                            drawFleetDetails(evt);
                            return;
                        }
                    }
                }

                // Activate fleet
                if (!playerEnv.strg) {
                    var item = playerEnv.fleets.length;
                    while (item--) {
                        if (evt.target.id !== ("shipListing")) {
                            if (evt.target.name.split('|')[1] === playerEnv.fleets[item].id) {
                                createSelection(playerEnv.fleets[item]);
                                modal.style.display = 'none';
                                return;
                            }
                        }
                    }
                } else {
                    evt.preventDefault();

                    if (evt.target.className !== '') {
                        evt.target.className = '';
                    } else {
                        evt.target.className = 'selectedFleet';
                    }
                }
            }

            if (document.getElementById('shipListing')) {
                document.getElementById('shipListing').addEventListener('click', selectFleet);
            }

            if (shipListing !== '') {

                // Set variables for current fleet listing and split fleet
                var shipCount = [];
                var shipTypes = [];
                var partedFleetTypes = [];
                var partedFleetCount = [];

                function drawFleetDetails(evt) {
                    var dropSrc = false;
                    var dropTarget = false;
                    var targetFleet = false;

                    shipCount = [];
                    shipTypes = [];
                    partedFleetTypes = [];
                    partedFleetCount = [];

                    if (planetObj.owner === logic.currentPlayer && planetObj.foreignFleets.length === 0) {
                        for (var item = planetObj.stationedFleets.length - 1; item > -1; item--) {
                            if (evt.target.name.split('|')[1] === planetObj.stationedFleets[item].id) {
                                targetFleet = planetObj.stationedFleets[item];
                                createSelection(planetObj.stationedFleets[item]);
                                break;
                            }
                        }
                    } else {
                        var hasActive = false;
                        for (var item = planetObj.stationedFleets.length - 1; item > -1; item--) {
                            if (evt.target.name.split('|')[1] === planetObj.stationedFleets[item].id) {
                                hasActive = true;
                                targetFleet = planetObj.stationedFleets[item];
                                createSelection(planetObj.stationedFleets[item]);
                                break;
                            }
                        }
                        if (!hasActive) {
                            for (var item = planetObj.foreignFleets.length - 1; item > -1; item--) {
                                if (evt.target.name === planetObj.foreignFleets[item].id) {
                                    targetFleet = playerEnv.fleets[ planetObj.foreignFleets[item].idx ];
                                    createSelection(planetObj.foreignFleets[item].idx);
                                    break;
                                }
                            }
                        }
                    }

                    if (!targetFleet) {
                        return;
                    }

                    var detailScreen = document.getElementById('fleetDetails');
                    var details = '';
                    details += '<div><h5>Ship Classes - <input value="' + evt.target.name.split('|')[0] + '" id="nameFleet" class="dynamicInput"/></h5>';

                    details += '<ul id="fleetListing"></ul></div>';
                    details += '<div id="splitFleetModal"><input value="New fleet name" id="partedFleetName" autocomplete="off" /><ul id="partedFleet"><br><span>Drop ships here</span></ul><button id="partFleet" style="float: right;">Split</button></div>';
                    detailScreen.innerHTML = details;

                    if (activeItem) {
                        if (activeItem.id === 'splitFleet') {
                            document.getElementById('splitFleetModal').style.display = 'inline-block';
                        }
                    }


                    // Prepare ship types and designs in fleet
                    for (var ship = targetFleet.ships.length - 1; ship > -1; ship--) {
                        var index = shipTypes.indexOf(targetFleet.ships[ship].type + '_' + targetFleet.ships[ship].design);
                        if (index !== -1) {
                            shipCount[index] += 1;
                        } else {
                            shipCount.push(1);
                            shipTypes.push(targetFleet.ships[ship].type + '_' + targetFleet.ships[ship].design);
                        }
                    }



                    // Helper function to draw fleets contents and bind handlers to items
                    function showFleetInfo() {
                        var listing = document.getElementById('fleetListing');
                        listing.innerHTML = '';
                        for (var ship = shipTypes.length - 1; ship > -1; ship--) {
                            var info = shipTypes[ship].split('_', 3);
                            listing.innerHTML += '<li><a class="fleetShips" href="#" name="' + shipTypes[ship] + '">' + shipCount[ship] + 'x ' + info[0] + ' (' + info[1] + ')</a></li>';
                        }

                        var fleetSelections = document.getElementsByClassName('fleetShips');

                        // Bind handles to the current displayed ships
                        for (var x = fleetSelections.length - 1; x > -1; x--) {
                            fleetSelections[x].addEventListener('click', function (evt) {
                                evt.preventDefault();
                            });

                            fleetSelections[x].addEventListener('dragstart', function (evt) {
                                dropSrc = evt;
                            });

                            fleetSelections[x].addEventListener('dragend', function (evt) {
                                if (dropTarget !== dropSrc) {
                                    var design = dropSrc.target.name;
                                    var partedShips = document.getElementsByClassName('partedShips');

                                    var partedIndex = partedFleetTypes.indexOf(design);
                                    var fleetIndex = shipTypes.indexOf(design);

                                    if (shipCount[fleetIndex] !== -1) {
                                        if (shipCount[fleetIndex] > 0) {

                                            if (partedIndex !== -1) {
                                                partedFleetCount[partedIndex] += 1;
                                            } else {
                                                partedFleetTypes.push(design);
                                                partedFleetCount.push(1);
                                            }

                                            shipCount[fleetIndex] -= 1;
                                            /*
                                             if (shipCount[fleetIndex] ===  0) {
                                             shipTypes.splice(fleetIndex, 1);
                                             shipCount.splice(fleetIndex, 1);
                                             }
                                             */
                                        }
                                    }

                                    showPartedFleetInfo();
                                    showFleetInfo();
                                }
                            });
                        }



                        // Draw split fleet info by parted design and count
                        function showPartedFleetInfo() {
                            var listing = document.getElementById('partedFleet');
                            listing.innerHTML = '';
                            for (var ship = partedFleetTypes.length - 1; ship > -1; ship--) {
                                info = partedFleetTypes[ship].split('_', 3);
                                listing.innerHTML += '<li><a class="partedShips" href="#" name="' + partedFleetTypes[ship] + '">' + partedFleetCount[ship] + 'x ' + info[0] + ' (' + info[1] + ')</a></li>';
                            }

                            if (partedFleetTypes.length === 0) {
                                listing.innerHTML = '<br><span>Drop ships here</span>';
                            }

                            var partedShips = document.getElementsByClassName('partedShips');

                            // Bind handles to the current displayed ships
                            for (var ship = partedShips.length - 1; ship > -1; ship--) {
                                partedShips[ship].addEventListener('click', function (evt) {
                                    evt.preventDefault();
                                });

                                partedShips[ship].addEventListener('dragstart', function (evt) {
                                    dropSrc = evt;

                                });

                                partedShips[ship].addEventListener('dragend', function (evt) {
                                    if (dropTarget !== dropSrc) {
                                        var design = dropSrc.target.name;
                                        partedShips = document.getElementsByClassName('partedShips');

                                        var partedIndex = partedFleetTypes.indexOf(design);
                                        var fleetIndex = shipTypes.indexOf(design);

                                        if (partedFleetCount[partedIndex] !== -1) {
                                            if (partedFleetCount[partedIndex] > 0) {

                                                if (fleetIndex !== -1) {
                                                    shipCount[fleetIndex] += 1;
                                                }/* else {
                                                 shipTypes.push(design);
                                                 shipCount.push(1);
                                                 }
                                                 */
                                                partedFleetCount[partedIndex] -= 1;

                                                if (partedFleetCount[partedIndex] === 0) {
                                                    partedFleetTypes.splice(partedIndex, 1);
                                                    partedFleetCount.splice(partedIndex, 1);
                                                }
                                            }
                                        }

                                        showPartedFleetInfo();
                                        showFleetInfo();
                                    }
                                });
                            }
                        }

                    }

                    // Set the droptarget handlers
                    document.getElementById('fleetListing').addEventListener('dragover', function (evt) {
                        if (dropSrc) {
                            dropTarget = evt;
                        }
                    });


                    document.getElementById('partedFleet').addEventListener('dragover', function (evt) {
                        if (dropSrc) {
                            dropTarget = evt;
                        }
                    });

                    document.getElementById('partFleet').addEventListener('click', function (evt) {
                        evt.preventDefault();

                        if (targetFleet.ships.length === 1) {
                            showFleetDialog(planetObj, true);
                            return;
                        }

                        var newFleetList = [];
                        var removeIndexes = [];

                        // TODO: Create a new fleet from and check with logic.fleets instead of targetFleet

                        var fleetShips = targetFleet.ships.length;
                        var details = '';
                        var ship = 0;
                        for (var item = 0; item < partedFleetTypes.length; item++) {
                            details = partedFleetTypes[item].split('_', 2);
                            for (ship = 0; ship < targetFleet.ships.length; ship++) {
                                if (targetFleet.ships[ship].type === details[0] && targetFleet.ships[ship].design === details[1]) {
                                    if (partedFleetCount[item] > 0) {
                                        newFleetList.push(targetFleet.ships[ship]);
                                        partedFleetCount[item] -= 1;
                                        removeIndexes.push(ship);
                                        fleetShips--;
                                    }
                                }

                                if (fleetShips === 1) {
                                    break;
                                }
                            }

                            if (fleetShips === 1) {
                                break;
                            }

                        }

                        var fleetName = document.getElementById('partedFleetName').value;

                        createFleet(logic.currentPlayer, planetObj, newFleetList, fleetName);

                        for (var x = 0; x < removeIndexes.length; x++) {
                            targetFleet.ships.splice(removeIndexes[x] - x, 1);
                        }

                        showFleetDialog(planetObj, true);

                    });

                    showFleetInfo();
                }


                var joinedFleet = false;
                document.getElementById('joinFleets').addEventListener('click', function (evt) {
                    if (activeItem) {
                        activeItem.className = '';
                    }
                    activeItem = false;

                    var fleetSelection = document.getElementsByClassName('selectedFleet');

                    for (var x = 0; x < fleetSelection.length; x++) {
                        for (var fleetItem = planetObj.stationedFleets.length - 1; fleetItem > -1; fleetItem--) {
                            if (!joinedFleet) {
                                if (planetObj.stationedFleets[fleetItem].id === fleetSelection[x].name.split('|')[1]) {
                                    joinedFleet = planetObj.stationedFleets[fleetItem];
                                }
                            } else if (joinedFleet) {
                                if (planetObj.stationedFleets[fleetItem].id === fleetSelection[x].name.split('|')[1]) {
                                    for (var ship in planetObj.stationedFleets[fleetItem].ships) {
                                        joinedFleet.ships.push(planetObj.stationedFleets[fleetItem].ships[ship]);
                                    }

                                    for (var route = playerEnv.activeRoutes.length - 1; route > -1; route--) {
                                        if (playerEnv.activeRoutes[route][0] === planetObj.stationedFleets[fleetItem]) {
                                            playerEnv.activeRoutes.splice(route, 1);
                                            break;
                                        }
                                    }

                                    playerEnv.fleets.splice(playerEnv.fleets.indexOf(planetObj.stationedFleets[fleetItem]), 1);
                                    planetObj.stationedFleets.splice(fleetItem, 1);
                                }
                            }
                        }
                    }

                    if (joinedFleet) {
                        planetObj.stationedFleets[0].hideDrawing = false;
                        showFleetDialog(planetObj, true);
                    }

                });

                document.getElementById('nameFleet').addEventListener('click', function (evt) {
                    evt.preventDefault();

                    if (activeItem) {
                        activeItem.className = '';
                    }
                    activeItem = evt.target;
                    activeItem.className = 'active';


                    var fleetSelection = document.getElementsByClassName('selectedFleet');

                    if (fleetSelection.length === 0) {
                        return;
                    }

                    var input = document.createElement('input');
                    input.id = 'fleetName';
                    input.value = fleetSelection[0].name.split('|')[0];

                    modal.appendChild(input);

                    fleetName = input.addEventListener('keyup', function (evt) {
                        evt.preventDefault();

                        if (evt.keyCode === 13) {
                            for (var fleetItem = planetObj.stationedFleets.length - 1; fleetItem > -1; fleetItem--) {
                                if (fleetSelection[0].name.split('|')[1] === planetObj.stationedFleets[fleetItem].id) {
                                    planetObj.stationedFleets[fleetItem].name = evt.target.value;
                                    break;
                                }
                            }
                            showFleetDialog(planetObj, true);
                        }

                    });
                    gameArea.focus();
                });

                document.getElementById('splitFleet').addEventListener('click', function (evt) {
                    evt.preventDefault();
                    if (activeItem) {
                        activeItem.className = '';
                    }

                    if (activeItem !== evt.target) {
                        activeItem = evt.target;
                        activeItem.className = 'active';

                        if (document.getElementById('splitFleetModal')) {
                            document.getElementById('splitFleetModal').style.display = 'inline-block';
                        }

                    } else {
                        activeItem = false;
                        document.getElementById('splitFleetModal').style.display = 'none';
                    }

                    clearFleetSelections();

                });


                document.getElementById('shipListing').addEventListener('mouseover', function (evt) {

                    if (evt.target.name) {
                        if (activeItem) {
                            if (activeItem.id === 'splitFleet' && document.getElementsByClassName('selectedFleet').length !== 0) {
                                return;
                            }
                        }

                        drawFleetDetails(evt);
                    }
                });

            }
        }
    }


    function colonizePlanet() {
        var playerEnv = logic.environments[logic.currentPlayer];

        var items = playerEnv.moduleEffects.modules.length;
        var highestColonize = 0;
        var activeModule = false;

        while (items--) {
            if (playerEnv.moduleEffects.modules[items].type === 'Colonize') {
                if (highestColonize < playerEnv.moduleEffects.modules[items].value) {
                    highestColonize = playerEnv.moduleEffects.modules[items].value;
                    activeModule = playerEnv.moduleEffects.modules[items];
                }
            }
        }

        if (activeModule) {
            var planets = playerEnv.planets.length;
            var planetObj = playerEnv.planets[playerEnv.moduleEffects.planetIdx];

            modal.innerHTML = '<h5 style="color: #fff; margin-bottom:5px;">Colony name</h5><input id="planetName" autocomplete="off" maxlength=25 width=25/>';
            modal.style.display = 'inline';

            var nameField = document.getElementById('planetName');
            nameField.focus();

            nameField.addEventListener('keyup', function (evt) {
                if (evt.keyCode === 13) {

                    this.parentNode.removeChild(this);

                    playerEnv.ownedPlanets.push(planetObj.id);
                    playerEnv.knownPlanets.splice(playerEnv.knownPlanets.indexOf(planetObj.id), 1);
                    planetObj.population[0] = activeModule.value;
                    planetObj.workForce = [activeModule.value, activeModule.value, 0, 0, 0];

                    // TODO: If greater then 1, place workforce in agriculture until food lvl is high enough
                    // then place into production, no research
                    /*
                     if (colonizeInfo[0] > 1) {
                     planetObj.workForce[0] = 1;
                     } else {
                     planetObj.workForce[0] = 1;
                     }
                     */
                    var colonizeFleet = playerEnv.fleets[ activeModule.fleet ];

                    // Decrease count of design
                    for (var design = playerEnv.designs.length - 1; design > -1; design--) {
                        if (colonizeFleet.ships[ activeModule.ship ].design === playerEnv.designs[design].name) {
                            playerEnv.designs[design].count -= 1;
                        }
                    }

                    if (colonizeFleet.ships.length === 1) {
                        // Remove fleet from other player screens
                        removeFleetFromPlayerViews(colonizeFleet);

                        // Remove fleet
                        playerEnv.fleets.splice(activeModule.fleet, 1);
                        if (playerEnv.moduleEffects.isForeign) {
                            planetObj.foreignFleets.splice(activeModule.foreignId, 1);
                        }

                        playerEnv.activeSelection = false;

                    } else {
                        // Remove single ship from fleet
                        playerEnv.fleets[ activeModule.fleet ].ships.splice(activeModule.ships, 1);
                    }

                    // If the player enter no value, the random selected name provided on generation is used
                    planetObj.name = nameField.value === "" ? planetObj.displayName : nameField.value;

                    planetObj.owner = playerEnv.player;
                    modal.style.display = 'none';
                    discoverPlanets(planetObj.x, planetObj.y, 150, planetObj);

                    logic.scanAreas[playerEnv.player].push([150, planetObj.x, planetObj.y]);
                    playerEnv.scanAreas.push([150, planetObj.x, planetObj.y]);

                    createSelection(planetObj);
                    scrollToLocation(planetObj, showPlanetDialog);
                    gameArea.focus();
                    clearModuleEffects();
                }
            });
        }
    }


    function checkKeys(evt) {
        var key = evt.keyCode;
        //lg(key);
        if (evt.type === 'keyup') {
            switch (key) {
                case 84:
                    if (modal.style.display === 'none') {
                        makeTurn();
                    }
                    break;
                case 72:
                    env.offsetX = -(logic.planets[logic.knownPlanets[0]].x - gameArea.width / 2);
                    env.offsetY = -(logic.planets[logic.knownPlanets[0]].y - gameArea.height / 2);
                    break;
                case 17:
                    if (env.strg) {
                        env.strg = false;
                    }
                    break;
                case 9:
                    if (modal.style.display === 'none') {
                        if (!env.strg) {
                            logic.currentPlayer++;
                            if (logic.currentPlayer === logic.players) {
                                logic.currentPlayer = 0;
                            }
                        } else {
                            logic.currentPlayer--;
                            if (logic.currentPlayer === -1) {
                                logic.currentPlayer = logic.players - 1;
                            }
                        }

                        env = logic.environments[logic.currentPlayer];
                    }

                    break;
            }
        } else if (evt.type === 'keydown') {
            switch (key) {
                case 17:
                    env.strg = true;
                    break;
            }
        }

    }

    function checkMovement(evt) {
        if (evt.button !== 0) {
            return;
        } else {
            evt.preventDefault();
            if (evt.type === "mousedown" && env.strg) {
                if (!env.movement) {
                    env.movement = [evt.pageX - env.offsetX, evt.pageY - env.offsetY];
                }
            } else if (evt.type === "mouseup") {
                env.movement = false;
            }

            return;
        }
    }

    function realiseMovement(evt) {
        var playerEnv = logic.environments[logic.currentPlayer];
        if (env.movement) {
            env.offsetX = evt.pageX - env.movement[0];
            env.offsetY = evt.pageY - env.movement[1];
        }
    }


    function drawSelection() {
        var playerEnv = logic.environments[logic.currentPlayer];

        gameScreen.beginPath();
        gameScreen.strokeStyle = "rgba(240,240,240, 0.6)";
        gameScreen.arc(playerEnv.activeSelection.x + playerEnv.offsetX, playerEnv.activeSelection.y + playerEnv.offsetY, playerEnv.selectionSize + 5 + playerEnv.selectionIteration, 0, 6.3);
        gameScreen.lineWidth = 1.6;
        gameScreen.stroke();
        gameScreen.closePath();

        playerEnv.selectionIteration += env.stepping;
        if (env.selectionIteration >= 7) {
            playerEnv.stepping = -env.baseStepping;
        } else if (env.selectionIteration <= 0) {
            playerEnv.stepping = +env.baseStepping;
        }
    }


    function drawRoutes() {
        var playerEnv = logic.environments[logic.currentPlayer];
        var routes = playerEnv.activeRoutes.length;
        var x = playerEnv.offsetX;
        var y = playerEnv.offsetY;

        gameScreen.fillStyle = 'rgba( 255, 255, 255, 0.2)';
        gameScreen.lineWidth = 1;

        while (routes--) {
            gameScreen.strokeStyle = "rgba(255,255,255, 0.2)";
            gameScreen.beginPath();
            gameScreen.moveTo(playerEnv.activeRoutes[routes][0].origin.x + x, playerEnv.activeRoutes[routes][0].origin.y + y);
            gameScreen.lineTo(playerEnv.activeRoutes[routes][1].x + x, playerEnv.activeRoutes[routes][1].y + y);
            gameScreen.stroke();
            gameScreen.closePath();

            gameScreen.beginPath();
            gameScreen.arc(playerEnv.activeRoutes[routes][0].origin.x + x, playerEnv.activeRoutes[routes][0].origin.y + y, 3, 0, 6.3);
            gameScreen.arc(playerEnv.activeRoutes[routes][1].x + x, playerEnv.activeRoutes[routes][1].y + y, 3, 0, 6.3);
            gameScreen.fill();
            gameScreen.closePath();
        }

        if (playerEnv.activeSelection) {
            if (playerEnv.activeSelection.type === "fleet") {
                if (playerEnv.activeSelection.needsMove) {
                    var selection = playerEnv.activeSelection;
                    if (selection.origin !== selection.destination) {
                        gameScreen.strokeStyle = "rgba(180,90,20, 1)";
                        gameScreen.lineWidth = 2;

                        gameScreen.beginPath();
                        gameScreen.moveTo(selection.origin.x + x, selection.origin.y + y);
                        gameScreen.lineTo(selection.destination.x + x, selection.destination.y + y);
                        gameScreen.stroke();
                        gameScreen.closePath();

                        gameScreen.beginPath();
                        gameScreen.arc(selection.origin.x + x, selection.origin.y + y, 3, 0, 6.3);
                        gameScreen.arc(selection.destination.x + x, selection.destination.y + y, 3, 0, 6.3);
                        gameScreen.fill();
                        gameScreen.closePath();
                    }
                }
            }
        }

        gameScreen.lineWidth = 1;
    }

    function drawFleets() {

        var playerEnv = logic.environments[logic.currentPlayer];
        var fleet = new Object();
        var x = playerEnv.offsetX;
        var y = playerEnv.offsetY;

        gameScreen.beginPath();
        var items = playerEnv.fleets.length;
        while (items--) {
            fleet = playerEnv.fleets[items];

            // TODO: Position player fleets in different formation
            if (!fleet.hideDrawing) {
                gameScreen.strokeStyle = "rgba(255,255,120, 0.75)";
                gameScreen.moveTo(fleet.x - 5 + x, fleet.y - 3 + y);
                gameScreen.lineTo(fleet.x + 5 + x, fleet.y + y);
                gameScreen.lineTo(fleet.x - 5 + x, fleet.y + 3 + y);
            }
        }
        gameScreen.stroke();
        gameScreen.closePath();

        gameScreen.beginPath();
        var items = playerEnv.foreignFleets.length;
        while (items--) {
            gameScreen.strokeStyle = "rgba(255,0,0, 0.75)";
            fleet = playerEnv.foreignFleets[items];
            if (!fleet.hideDrawing) {
                gameScreen.moveTo(fleet.x - 5 + x, fleet.y - 3 + y);
                gameScreen.lineTo(fleet.x + 5 + x, fleet.y + y);
                gameScreen.lineTo(fleet.x - 5 + x, fleet.y + 3 + y);
            }
        }
        gameScreen.stroke();
        gameScreen.closePath();
    }

    function isInRange(origin, destination, fleetRange) {
        // TODO: Disable return once fleets can be ranged up
        return true;

        var distanceX = Math.abs(origin.x - destination.x);
        var distanceY = Math.abs(origin.y - destination.y);
        var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

        if (distance <= fleetRange) {
            return true;
        }

        return false;
    }

    function setDestination(fleet, destination) {
        var playerEnv = logic.environments[logic.currentPlayer];

        if (fleet.location !== 'planet') {
            return false;
        }

        if (fleet.destination) {
            var routes = playerEnv.activeRoutes.length;
            while (routes--) {
                if (playerEnv.activeRoutes[routes][0] === fleet) {
                    playerEnv.activeRoutes.splice(routes, 1);
                    break;
                }
            }
        }

        fleet.speed = fleet.ships[0].speed;
        fleet.range = fleet.ships[0].range;

        var items = fleet.ships.length;
        while (items--) {
            if (fleet.ships[items].speed < fleet.speed) {
                fleet.speed = fleet.ships[items].speed;
            }

            if (fleet.ships[items].range < fleet.range) {
                fleet.range = fleet.ships[items].range;
            }
        }

        if (!isInRange(fleet.origin, destination, fleet.range)) {
            fleet.destination = false;
            fleet.needsMove = false;
            //createSelection(fleet);
            return false;
        }

        var distanceX = Math.abs(fleet.origin.x - destination.x);
        var distanceY = Math.abs(fleet.origin.y - destination.y);
        var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

        var turns = Math.ceil(distance / fleet.speed);
        fleet.stepX = distanceX / turns;
        fleet.stepY = distanceY / turns;
        fleet.turns = turns;

        if (fleet.origin.x > destination.x) {
            fleet.stepX = -fleet.stepX;
        }

        if (fleet.origin.y > destination.y) {
            fleet.stepY = -fleet.stepY;
        }

        fleet.destination = destination;
        fleet.needsMove = true;

        playerEnv.activeRoutes.push([fleet, destination]);

        return true;

    }


    var scrollInterval = false;
    function scrollToLocation(object, callElement) {
        var playerEnv = logic.environments[logic.currentPlayer];
        if (playerEnv.scrollActive) {
            clearInterval(scrollInterval);
        }
        unbindHandlers();
        playerEnv.scrollActive = true;

        var targetX = 0;
        if (callElement) {
            targetX = -(object.x - 560);
        } else {
            targetX = -(object.x - gameArea.width / 2);
        }

        if (callElement && document.getElementsByName(object.name).length !== 0) {
            targetX = -(object.x - gameArea.width / 2);
            callElement = false;
            modal.innerHTML = '';
        }

        var targetY = -(object.y - gameArea.height / 2);
        var stepX = 0;
        var stepY = 0;

        var distanceX = playerEnv.offsetX - targetX;
        if (distanceX !== 0) {
            stepX = (distanceX / 15);
        }

        var distanceY = playerEnv.offsetY - targetY;
        if (distanceY !== 0) {
            stepY = (distanceY / 15);
        }

        targetX = Math.floor(Math.abs(targetX));
        targetY = Math.floor(Math.abs(targetY));

        createSelection(object);

        function doScroll() {
            if (Math.round(Math.abs(playerEnv.offsetX)) === targetX && Math.round(Math.abs(playerEnv.offsetY)) === targetY) {
                clearInterval(scrollInterval);
                bindHandlers();

                if (callElement) {
                    callElement(object);
                }

                playerEnv.scrollActive = false;

                return;
            }

            playerEnv.offsetX -= stepX;
            playerEnv.offsetY -= stepY;

        }
        unbindHandlers();
        scrollInterval = setInterval(doScroll, 30 + Math.ceil(Math.abs(stepX)) + Math.ceil(Math.abs(stepY)));
    }


    function createSelection(object) {
        var playerEnv = logic.environments[logic.currentPlayer];
        playerEnv.activeSelection = object;
        playerEnv.selectionIteration = 0;
        if (object.type === "fleet") {
            playerEnv.selectionSize = 5;
        } else {
            playerEnv.selectionSize = object.size;
        }
    }


    function updateSelectionInfo(selection) {
        var info = '';
        if (selection.type === 'fleet') {
            info = selection.type + ' ' + selection.name;

            if (selection.destination) {
                if (selection.location !== 'space') {
                    info += ' stationed at ' + selection.origin.name + ', ';
                }
                info += ' reaching ' + selection.destination.name + ' in ' + selection.turns + ' turns';
            }

        } else if (selection.type === 'planet') {
            if (selection.hasAttribute("name")) {
                info = 'Planet ' + selection.name;
            } else {
                info = 'Planet ' + selection.displayName;
            }
        }

        statusBar.innerHTML = '<h5>' + info + '</h5>';
    }



    function report(msg) {
        reports.innerHTML += '<br><span>' + msg + '</span>';
        reports.scrollTop = reports.scrollHeight;
        gameArea.focus();
        bindInfoLinks();
    }

    function bindInfoLinks() {
        var infoLinks = document.getElementsByClassName('infoLink');
        var x = infoLinks.length;
        while (x--) {
            infoLinks[x].addEventListener('click', openInfoItem);
        }
    }

    function createLink(type, linkName, linkMsg) {
        // TODO: Remove this check once logic player seperation is established
        if (logic.currentPlayer === 0) {
            if (linkMsg) {
                return '<a href="#" class="infoLink" name="' + type + '_' + linkName + '">' + linkMsg + '</a>';
            } else {
                return '<a href="#" class="infoLink" name="' + type + '_' + linkName + '">' + linkName + '</a>';
            }
        }
    }


    function openInfoItem(evt) {
        var info = evt.target.name.split('_');
        var playerEnv = logic.environments[logic.currentPlayer];

        evt.preventDefault();
        modal.style.display = 'none';

        if (info[0] === 'planet') {
            var index = parseInt(info[1]);
            var planetObj = false;

            var items = playerEnv.planets.length;
            while (items--) {
                if (playerEnv.planets[items].id === index) {
                    planetObj = playerEnv.planets[items];
                    break;
                }
            }

            if (planetObj) {
                if (playerEnv.ownedPlanets.indexOf(index) !== -1) {
                    var infoScreen = document.getElementById('planetInfo');
                    if (infoScreen) {
                        if (infoScreen.className === planetObj.name || infoScreen.className === planetObj.displayName) {
                            modal.style.display = 'none';
                            infoScreen.className = '';
                            return;
                        }
                    }

                    if (!playerEnv.strg || playerEnv.activeSelection != planetObj) {
                        scrollToLocation(planetObj, showPlanetDialog);
                    } else {
                        scrollToLocation(planetObj);
                    }

                } else if (playerEnv.knownPlanets.indexOf(index) !== -1) {

                    if (!playerEnv.strg) {
                        scrollToLocation(planetObj, showPlanetDialog);
                    } else {
                        scrollToLocation(planetObj);
                    }

                } else if (playerEnv.unknownPlanets.indexOf(index) !== -1) {
                    scrollToLocation(planetObj);
                }
            }

        } else if (info[0] === 'fleet') {
            var item = playerEnv.fleets.length;
            while (item--) {
                if (playerEnv.fleets[item].name === info[1]) {
                    scrollToLocation(playerEnv.fleets[item]);
                    break;
                }
            }
        }

    }


    function makeTurn() {

        logic.turn += 1;

        turnDisplay.innerHTML = 'Turn ' + logic.turn;

        if (reports.children.length > 80) {
            reports.innerHTML = '<h5>Log...</h5>';
        }

        report('Calculating turn ' + logic.turn);


        // Handle player planets
        for (var player = 0; player < logic.players; player++) {
            // TODO - Add logic to process player turn actions and report changes to env variables
        }

        // TODO: make use of only owned planets
        var item = logic.planets.length;

        var planet = new Object();
        var percentOutput = 0.0;
        var fixedOutput = 0.0;
        var multiOutput = 0.0;
        var productionValue = 0.0;
        var link = "";
        while (item--) {
            // Population growth
            if (logic.planets[item].population[0] !== 0 && logic.planets[item].population[0] < logic.planets[item].population[1]) {
                var previous = logic.planets[item].population[0];
                logic.planets[item].population[0] += (logic.planets[item].population[1] * 0.025) / logic.planets[item].population[0];

                if (logic.planets[item].population[0] > logic.planets[item].population[1]) {
                    logic.planets[item].population[0] = logic.planets[item].population[1];
                }

                if (parseInt(previous) < parseInt(logic.planets[item].population[0])) {
                    logic.planets[item].workForce[0] += 1;
                    logic.planets[item].workForce[1] += 1;

                    if (logic.currentPlayer === logic.planets[item].owner) {
                        link = createLink('planet', logic.planets[item].id, logic.planets[item].name);
                        report('Population of ' + link + ' grown to ' + parseInt(logic.planets[item].population[0]));
                    }
                }
            }

            // Planet production
            //lg('out '+logic.planets[item].production[0]);
            if (logic.planets[item].production[0]) {

                planet = logic.planets[item];

                percentOutput = getBaseOutput(planet);
                fixedOutput = getFixedOutput(planet);
                multiOutput = getMultiOutput(planet);
                productionValue = (planet.workForce[3] * (percentOutput[1] + multiOutput[1])) + fixedOutput[1];

                planet.production[1] += parseFloat(productionValue.toFixed(2));

                if (planet.production[1] >= planet.production[2]) {

                    link = createLink('planet', item, logic.planets[item].name);
                    report('Planet ' + link + ' finished the production of ' + planet.production[0]);

                    if (planet.production[3] === 'building') {
                        planet.constructions.push(planet.production[0]);
                        calcResearchPoints(planet);

                    } else if (planet.production[3] === 'design') {
                        // TODO: check if fleet is present, use autojoin or create new one
                        createShip(planet, planet.production[0], true);
                    }


                    if (planet.productionQueue.length !== 0) {
                        // TODO: Perform a check if an queued item still can be constructed
                        if (planet.productionQueue[0][0] === 'building') {
                            for (var option = logic.buildings.length - 1; option > -1; option--) {
                                if (planet.productionQueue[0][1] === logic.buildings[option][0]) {
                                    planet.production = [logic.buildings[option][0], 0, logic.buildings[option][1], 'building'];
                                    break;
                                }
                            }
                        } else if (planet.productionQueue[0][0] === 'design') {
                            for (var design = logic.environments[planet.owner].designs.length - 1; design > -1; design--) {
                                if (planet.productionQueue[0][1] === env.designs[design].name) {
                                    planet.production = [env.designs[design].name, 0, env.designs[design].cost, 'design'];
                                    break;
                                }
                            }
                        }


                        if (planet.production[0]) {
                            report('Continuing construction of queued item ' + planet.production[0]);
                        } else {
                            report('Cannot continue construction of ' + planet.productionQueue[0][1]);
                        }

                        planet.productionQueue.splice(0, 1);

                    } else if (planet.prevProduction[0]) {
                        planet.production = planet.prevProduction;
                        planet.prevProduction = [false, 0, 0];
                        report('Continuing construction of previous item ' + planet.production[0]);
                    } else {
                        planet.production = [false, 0, 0];
                        report('No further items in queue');
                    }
                }

            }

            // Planet agriculture


        }

        // Research
        var players = logic.players;
        while (players--) {
            if (logic.environments[players].research.project === false) {
                continue;
            }
            logic.environments[players].research.progress += logic.environments[players].research.points;
        }


        // Fleet movement
        var targetFleet = new Object();

        var fleetItems = 0;
        var items = logic.fleets.length;
        var planetObj = new Object();
        while (items--) {
            targetFleet = logic.fleets[items];

            if (targetFleet.needsMove) {
                
                if (targetFleet.location === 'planet') {
                    planetObj = targetFleet.origin;
                    if (planetObj.foreignFleets.length === 0) {
                        planetObj.stationedFleets.splice(planetObj.stationedFleets.indexOf(targetFleet), 1);

                        if (planetObj.stationedFleets.length !== 0) {
                            planetObj.stationedFleets[0].hideDrawing = false;
                        }
                    } else {
                        var isStationed = false;
                        var stationedFleets = planetObj.stationedFleets.length;
                        while (stationedFleets--) {
                            if (targetFleet.id === planetObj.stationedFleets[stationedFleets].id) {
                                planetObj.stationedFleets.splice(stationedFleets, 1);
                                isStationed = true;
                                break;
                            }
                        }

                        if (!isStationed) {
                            fleetItems = targetFleet.origin.foreignFleets.length;
                            while (fleetItems--) {
                                if (targetFleet.id === planetObj.foreignFleets[fleetItems].id) {
                                    planetObj.foreignFleets.splice(fleetItems, 1);
                                    if (planetObj.foreignFleets.length !== 0) {
                                        planetObj.foreignFleets[ planetObj.foreignFleets.length - 1 ].hideDrawing = false;
                                    }
                                    break;
                                }
                            }
                        }
                    }

                    targetFleet.hideDrawing = false;
                    targetFleet.location = 'space';
                }

                targetFleet.x += targetFleet.stepX;
                targetFleet.y += targetFleet.stepY;
                targetFleet.turns--;

                logic.scanAreas[targetFleet.owner][targetFleet.scanArea][1] = targetFleet.x;
                logic.scanAreas[targetFleet.owner][targetFleet.scanArea][2] = targetFleet.y;
                logic.environments[targetFleet.owner].scanAreas[targetFleet.scanArea][1] = targetFleet.x;
                logic.environments[targetFleet.owner].scanAreas[targetFleet.scanArea][2] = targetFleet.y;

                if (targetFleet.turns <= 0) {
                    var playerEnv = logic.environments[targetFleet.owner];

                    targetFleet.x = targetFleet.destination.x - (targetFleet.destination.size + 5);
                    targetFleet.y = targetFleet.destination.y - (targetFleet.destination.size + 5);

                    targetFleet.origin = targetFleet.destination;
                    targetFleet.destination = false;
                    targetFleet.needsMove = false;
                    targetFleet.turns = 0;
                    targetFleet.location = 'planet';

                    logic.scanAreas[targetFleet.owner][targetFleet.scanArea][1] = targetFleet.origin.x;
                    logic.scanAreas[targetFleet.owner][targetFleet.scanArea][2] = targetFleet.origin.y;
                    logic.environments[targetFleet.owner].scanAreas[targetFleet.scanArea][1] = targetFleet.origin.x;
                    logic.environments[targetFleet.owner].scanAreas[targetFleet.scanArea][2] = targetFleet.origin.y;

                    var isStationed = false;
                    var stationedFleets = targetFleet.origin.stationedFleets.length;

                    if (stationedFleets === 0) {
                        isStationed = true;
                    } else {
                        while (stationedFleets--) {
                            if (targetFleet.origin.stationedFleets[stationedFleets].owner === targetFleet.owner) {
                                isStationed = true;
                                break;
                            }
                        }
                    }

                    if (isStationed) {
                        if (targetFleet.origin.stationedFleets.length !== 0) {
                            targetFleet.hideDrawing = true;
                        }

                        targetFleet.origin.stationedFleets.push(targetFleet);

                    } else {
                        targetFleet.x += 20;
                        targetFleet.y -= 10;
                        var foreignFleet = new Object();
                        foreignFleet.x = targetFleet.x;
                        foreignFleet.y = targetFleet.y;
                        foreignFleet.id = targetFleet.id;
                        foreignFleet.hideDrawing = false;
                        foreignFleet.owner = targetFleet.owner;

                        /* TODO: Hide other player foreign fleets while own local fleet is shown?
                         if (targetFleet.origin.foreignFleets.length !== 0) {
                         var foreignFleets = targetFleet.origin.foreignFleets.length;
                         while (foreignFleets--) {
                         targetFleet.origin.foreignFleets[foreignFleets].hideDrawing = true;
                         }
                         }
                         */

                        foreignFleet.idx = playerEnv.fleets.indexOf(targetFleet);
                        targetFleet.origin.foreignFleets.push(foreignFleet);
                    }

                    // Remove route item
                    var routes = playerEnv.activeRoutes.length;
                    while (routes--) {
                        if (playerEnv.activeRoutes[routes][0] === targetFleet) {
                            playerEnv.activeRoutes.splice(routes, 1);
                            break;
                        }
                    }

                    if (playerEnv.knownPlanets.indexOf(targetFleet.origin.id) === -1) {
                        playerEnv.knownPlanets.push(targetFleet.origin.id);

                        var planets = playerEnv.unknownPlanets.length;
                        while (planets--) {
                            if (targetFleet.origin.id === playerEnv.unknownPlanets[planets]) {
                                playerEnv.unknownPlanets.splice(planets, 1);
                                break;
                            }
                        }

                        discoverPlanets(targetFleet.origin.x, targetFleet.origin.y, 150 / 1.3, targetFleet);
                    }


                    var link1 = createLink('fleet', targetFleet.name, 'Fleet ' + targetFleet.name);
                    var link2 = createLink('planet', targetFleet.origin.id, targetFleet.origin.name);
                    report(link1 + ' arrived at destination ' + link2);
                }
                
                // Detection for fleet during movement in scanAreas
                //updateScanAreas(targetFleet);
            }
            
            // Detection for fleet (during movement= in scanAreas
            updateScanAreas(targetFleet);
        }

        gameArea.focus();

    }



    function removeFleetFromPlayerViews(targetFleet) {

        for (var player = logic.players - 1; player > -1; player--) {

            if (player === targetFleet.owner) {
                continue;
            }

            var playerEnv = logic.environments[player];
            var scanX = 0.0;
            var scanY = 0.0;

            var area = playerEnv.scanAreas.length;
            var scanArea = [0.0, 0.0, 0.0, 0.0];
            var item = 0;
            while (area--) {
                scanArea = playerEnv.scanAreas[area];
                scanX = scanArea[1];
                scanY = scanArea[2];
                gameScreen.beginPath();
                gameScreen.arc(scanX, scanY, scanArea[0], 0, 6.3);
                gameScreen.closePath();

                if (gameScreen.isPointInPath(targetFleet.x, targetFleet.y)) {
                    item = playerEnv.foreignFleets.length;
                    while (item--) {
                        if (targetFleet.id === playerEnv.foreignFleets[item].id) {
                            playerEnv.foreignFleets.splice(item, 1);
                            break;
                        }
                    }
                }
            }

        }
    }


    function updateScanAreas(targetFleet) {
        for (var player = logic.players - 1; player > -1; player--) {
            if (player === targetFleet.owner) {
                continue;
            }

            var targetX = targetFleet.x;
            var targetY = targetFleet.y;

            if (targetFleet.location === 'planet') {
                targetX = targetFleet.origin.x;
                targetY = targetFleet.origin.y;
            }

            var removeFromPlayer = true;
            var isFleetIncluded = false;

            var playerEnv = logic.environments[player];

            var scanArea = [0.0, 0.0, 0.0, 0.0];
            var scanX = 0.0;
            var scanY = 0.0;

            var area = playerEnv.scanAreas.length;
            while (area--) {
                scanArea = playerEnv.scanAreas[area];
                scanX = scanArea[1];
                scanY = scanArea[2];

                gameScreen.beginPath();
                gameScreen.arc(scanX, scanY, scanArea[0], 0, 6.3);
                gameScreen.closePath();

                if (gameScreen.isPointInPath(targetX, targetY)) {
                    var item = playerEnv.foreignFleets.length;
                    while (item--) {
                        if (targetFleet.id === playerEnv.foreignFleets[item].id) {
                            isFleetIncluded = true;
                            removeFromPlayer = false;
                            playerEnv.foreignFleets[item].x = targetFleet.x;
                            playerEnv.foreignFleets[item].y = targetFleet.y;
                            break;
                        }
                    }

                    if (isFleetIncluded) {
                        break;
                    }

                    var foreignFleet = {};
                    foreignFleet.x = targetFleet.x;
                    foreignFleet.y = targetFleet.y;
                    foreignFleet.id = targetFleet.id;
                    foreignFleet.owner = targetFleet.owner;
                    foreignFleet.hideDrawing = false;
                    foreignFleet.idx = logic.environments[targetFleet.owner].fleets.indexOf(targetFleet);
                    playerEnv.foreignFleets.push(foreignFleet);
                    removeFromPlayer = false;
                    break;
                    
                } else {
                    var item = playerEnv.foreignFleets.length;
                    while (item--) {
                        if (targetFleet.id === playerEnv.foreignFleets[item].id) {
                            removeFromPlayer = true;
                            break;
                        }
                    }
                }
            }
            

            // if removeFromPlayer, we can safely remove the ship from the foreignfleets list
            if (removeFromPlayer) {
                var item = playerEnv.foreignFleets.length;
                while (item--) {
                    if (targetFleet.id === playerEnv.foreignFleets[item].id) {
                        playerEnv.foreignFleets.splice(item, 1);
                        break;
                    }
                }
            }
        }
    }


    function discoverPlanets(cordX, cordY, scanRange, obj) {
        gameScreen.beginPath();
        gameScreen.moveTo(cordX, cordY);
        gameScreen.arc(cordX, cordY, scanRange, 0, 6.3);
        gameScreen.closePath();

        var playerEnv = logic.environments[obj.owner];

        var distanceX = 0;
        var distanceY = 0;
        var distance = 0;
        var link1 = '';
        var link2 = '';

        var planetObj = new Object();
        var discoveredPlanets = [];
        var items = logic.planets.length;
        var targetFleet = new Object();
        while (items--) {
            planetObj = logic.planets[items];

            if (gameScreen.isPointInPath(planetObj.x, planetObj.y)) {
                if (playerEnv.ownedPlanets.indexOf(planetObj.id) === -1 && playerEnv.knownPlanets.indexOf(planetObj.id) === -1 && playerEnv.unknownPlanets.indexOf(planetObj.id) === -1) {
                    distanceX = Math.abs(cordX - planetObj.x);
                    distanceY = Math.abs(cordY - planetObj.y);
                    distance = Math.ceil(Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2)));

                    playerEnv.planets.push(planetObj);
                    playerEnv.unknownPlanets.push(planetObj.id);

                    discoveredPlanets.push([distance, obj, planetObj.id]);

                    // TODO: Logic creates foreign fleets objects, passing to player
                    if (planetObj.stationedFleets.length !== 0) {
                        for (var x = planetObj.stationedFleets.length - 1; x > -1; x--) {
                            targetFleet = planetObj.stationedFleets[x];
                            foreignFleet = new Object();
                            foreignFleet.x = targetFleet.x;
                            foreignFleet.y = targetFleet.y;
                            foreignFleet.id = targetFleet.id;
                            foreignFleet.owner = targetFleet.owner;

                            if (x === 0) {
                                foreignFleet.hideDrawing = false;
                            } else {
                                foreignFleet.hideDrawing = true;
                            }

                            foreignFleet.idx = logic.environments[targetFleet.owner].fleets.indexOf(targetFleet);
                            playerEnv.foreignFleets.push(foreignFleet);
                        }
                    }

                    if (!playerEnv.activeAnimations.hasOwnProperty(logic.terrains[planetObj.terrain][3])) {
                        playerEnv.activeAnimations[ logic.terrains[planetObj.terrain][3] ] = [];
                    }
                    playerEnv.activeAnimations[ logic.terrains[planetObj.terrain][3] ].push([planetObj.x, planetObj.y]);
                }

            }

        }

        function sortDistance(p1, p2) {
            if (p1[0] >= p2[0]) {
                return true;
            }

            return false;
        }

        if (playerEnv.player === logic.currentPlayer) {
            var items = 0;
            var maxItems = discoveredPlanets.length;
            var item = [];

            discoveredPlanets.sort(sortDistance);

            while (items < maxItems) {
                item = discoveredPlanets[items];
                link1 = '';
                if (item[1].type === 'fleet') {
                    link1 = createLink('fleet', item[1].name, 'Fleet ' + item[1].name);
                } else {
                    link1 = createLink('planet', item[1].id, 'Planet ' + item[1].name);
                }
                link2 = createLink('planet', item[2], 'planet in ' + item[0] + ' units');
                report(link1 + ' discovered a ' + link2 + ' away.');
                items++;
            }
        }
    }

    function createShip(planet, design, joinExisting) {
        var playerEnv = logic.environments[planet.owner];
        var shipDesign = false;

        for (var x = playerEnv.designs.length - 1; x > -1; x--) {
            if (design === playerEnv.designs[x].name) {
                shipDesign = playerEnv.designs[x];
                break;
            }
        }

        if (shipDesign) {
            var ship = new Object();
            ship.name = shipDesign.name + ' ' + shipDesign.count;
            ship.speed = shipDesign.speed;
            ship.range = shipDesign.range;
            ship.design = shipDesign.name;
            ship.type = shipDesign.type;

            shipDesign.count += 1;

            if (!joinExisting || planet.stationedFleets.length === 0) {
                var fleet = new Object();
                fleet.owner = planet.owner;
                fleet.name = shipDesign.name + ' ' + shipDesign.count;
                fleet.ships = [];
                fleet.count = 0;
                fleet.origin = planet;
                fleet.location = 'planet';
                fleet.type = 'fleet';
                fleet.x = planet.x - (planet.size + 5);
                fleet.y = planet.y - (planet.size + 5);
                fleet.destination = false;
                fleet.needsMove = false;
                fleet.hideDrawing = false;

                // Create unique fleet id
                fleet.id = createFleetId(planet.owner);

                fleet.ships.push(ship);
                fleet.count++;

                if (planet.stationedFleets.length !== 0) {
                    fleet.hideDrawing = true;
                }

                planet.stationedFleets.push(fleet);

                playerEnv.fleets.push(fleet);
                logic.fleets.push(fleet);

                playerEnv.scanAreas.push([110, fleet.origin.x, fleet.origin.y]);
                logic.scanAreas[planet.owner].push([110, fleet.origin.x, fleet.origin.y]);
                fleet.scanArea = playerEnv.scanAreas.length - 1;
            } else {
                planet.stationedFleets[0].ships.push(ship);
                planet.stationedFleets[0].count++;
            }


        }
    }

    function createFleetId(owner) {
        while (true) {
            var date = new Date();
            var fleetId = owner + "_" + date.getTime() + date.getMilliseconds();

            if (fleetId !== logic.environments[owner].lastFleetId) {
                logic.environments[owner].lastFleetId = fleetId;
                return fleetId;
            }
        }
    }


    function createFleet(player, planet, shipList, fleetName) {
        // TODO: Add a sync between logic and envs
        var playerEnv = logic.environments[planet.owner];

        var fleet = new Object();
        fleet.ships = [];
        fleet.count = 0;
        fleet.origin = planet;
        fleet.location = 'planet';
        fleet.type = 'fleet';
        fleet.owner = player;
        fleet.x = planet.x - (planet.size + 5);
        fleet.y = planet.y - (planet.size + 5);
        fleet.destination = false;
        fleet.needsMove = false;
        fleet.hideDrawing = false;
        fleet.scanArea = -1;

        // Create hopefully unique id for fleets
        fleet.id = createFleetId(player);

        // TODO: Create fleets base names only on fleets owned by a user
        //			separating logic.fleets to logic.fleets player/owner

        if (fleetName) {
            fleet.name = fleetName + ' ' + env.fleets.length;
        } else {
            fleet.name = 'Joined fleet ' + env.fleets.length;
        }

        for (var x = shipList.length - 1; x > -1; x--) {
            fleet.ships.push(shipList[x]);
            fleet.count++;
        }

        if (planet.stationedFleets.length !== 0) {
            fleet.hideDrawing = true;
        }

        if (player === planet.owner || planet.owner === -1) {
            planet.stationedFleets.push(fleet);
        }
        // TODO: Do we need this case really?
        /*
         else {
         var foreignFleet = new Object();
         foreignFleet.x = fleet.x + 20;
         foreignFleet.y = fleet.y - 10;
         foreignFleet.id = fleet.id;
         foreignFleet.owner = fleet.owner;
         foreignFleet.idx = playerEnv.fleets.indexOf(fleet);
         planet.foreignFleets.push(foreignFleet);

         fleet.hideDrawing = true;
         fleet.x = foreignFleet.x;
         fleet.y = foreignFleet.y;
         }
         */

        playerEnv.fleets.push(fleet);
        logic.fleets.push(fleet);

        playerEnv.scanAreas.push([110, fleet.x, fleet.y]);
        logic.scanAreas[player].push([110, fleet.x, fleet.y]);
        fleet.scanArea = playerEnv.scanAreas.length - 1;
    }

    // Create custom animation using imageMaps

    function genGalaxy(count) {
        var random = 0;
        var planetNames = logic.planetNames.length;

        for (var step = 0; step < count; step++) {
            var x = Math.floor(Math.random() * (gameArea.width * 0.85) + 20);
            var y = Math.floor(Math.random() * (gameArea.height * 0.85) + 20);
            var size = Math.ceil((Math.random() * 8) + 7);

            var planet = new Object;
            planet.x = x;
            planet.y = y;
            planet.size = 12;
            planet.type = "planet";
            // Old planet naming
            // planet.name = 'planet ' + Math.ceil(x) + ' | ' + Math.ceil(y);

            random = Math.ceil(Math.random() * (planetNames - 1));
            planet.name = logic.planetNames[random];
            planet.displayName = planet.name;
            logic.planetNames.splice(random, 1);

            planet.id = step;
            planet.owner = -1;

            planet.terrain = Math.ceil(Math.random() * (logic.terrains.length - 1));
            planet.mineralLevel = Math.ceil(Math.random() * logic.terrains[planet.terrain][1][1]);
            planet.ecologicalLevel = Math.ceil(Math.random() * logic.terrains[planet.terrain][2][1]);

            if (planet.mineralLevel < logic.terrains[planet.terrain][1][0]) {
                planet.mineralLevel = logic.terrains[planet.terrain][1][0];
            }

            if (planet.ecologicalLevel < logic.terrains[planet.terrain][2][0]) {
                planet.ecologicalLevel = logic.terrains[planet.terrain][2][0];
            }

            planet.population = [0, size];
            planet.workForce = [0, 0, 0, 0];

            planet.constructions = [];
            planet.production = [false, 0, 0];
            planet.prevProduction = [false, 0, 0];
            planet.productionQueue = [];
            planet.stationedFleets = [];
            planet.foreignFleets = []; // TODO: work on planet.foreignFleets when moving to fleets to any location upon arrival

            logic.planets.push(planet);

            if (step < logic.players) {
                var env = logic.environments[step];
                env.ownedPlanets = [step];
                env.knownPlanets = [];
                env.unknownPlanets = [];
                env.planets.push(planet);

                env.offsetX = -(planet.x - gameArea.width / 2);
                env.offsetY = -(planet.y - gameArea.height / 2);

                planet.population = [4, size];
                planet.constructions = ['Factory Complex', 'Farm Complex'];
                planet.workForce = [4, 0, 1, 2, 1];
                planet.owner = step;

                logic.scanAreas.push([]);
                var researchPoints = planet.workForce[4] * env.workers["research"];
                env.research.planets.push(researchPoints);
                env.research.points = researchPoints;

                createShip(planet, 'Wayfinder', false);
                createShip(planet, 'Colony Design', false);
                /*
                 createShip(planet, 'Wayfinder', false);
                 createShip(planet, 'Wayfinder', false);
                 createShip(planet, 'Colony Design', false);
                 createShip(planet, 'Retriever', false);
                 createShip(planet, 'Retriever', false);
                 createShip(planet, 'Colony Design', false);
                 createShip(planet, 'Retriever', false);
                 createShip(planet, 'Retriever', false);
                 createShip(planet, 'Colony Design', false);
                 */
            }

        }

        for (var player = 0; player < logic.players; player++) {
            var playerEnv = logic.environments[player];
            var planetObj = playerEnv.planets[0];

            playerEnv.scanAreas.push([150, planetObj.x, planetObj.y]);

            logic.scanAreas[player].push([150, planetObj.x, planetObj.y]);
            var key = logic.terrains[planetObj.terrain][3];

            if (!playerEnv.activeAnimations.hasOwnProperty(key)) {
                playerEnv.activeAnimations[key] = [];
            }
            playerEnv.activeAnimations[key].push([planetObj.x, planetObj.y]);
            discoverPlanets(planetObj.x, planetObj.y, 150, planetObj);
        }

        // TODO: Remove the global usage of env variable at some stage
        env = logic.environments[0];

        var evt = new Object();
        evt.keyCode = 72;
        checkKeys(evt);
    }



    function createAnimation(imgUrl, xWidth, xFrameSize, yFrameSize, duration, stepX, returnLoaded, lastX, useSet, setX, setY) {
        var img = new Image();

        img["src"] = imgUrl;
        animations[imgUrl] = {
            "src": img,
            "x": xFrameSize,
            "y": yFrameSize,
            "offX": xFrameSize / 2,
            "offY": yFrameSize / 2,
            "duration": duration,
            "stepx": stepX,
            "steps": Math.floor(xWidth / stepX),
            "step": 0,
            "current": duration,
            "useSet": useSet,
            "setX": setX,
            "setY": setY,
            "lastX": lastX
        };

        for (var x = 0; x < logic.environments.length; x++) {
            logic.environments[x].activeAnimations[imgUrl] = [];
        }

        if (returnLoaded === true) {
            animationsLoading = false;
        }

    }

    function drawAnimations() {

        var playerEnv = logic.environments[logic.currentPlayer];
        var keys = Object.keys(playerEnv.activeAnimations);
        var keyItems = keys.length;
        var animProps = {};
        var key = "";
        var imgSrc = new Image();
        var x = 0;
        var y = 0;
        var offsetX = 0;
        var offX = 0;
        var offY = 0;
        var size = 0;
        var items = 0;
        var activeAnimationItems = [];

        while (keyItems--) {
            key = keys[keyItems];
            animProps = animations[key];
            imgSrc = animProps["src"];
            animProps["current"] -= 1;

            if (animProps["current"] <= 0) {
                animProps["current"] = animProps["duration"];
                if (animProps["step"] >= animProps["steps"]) {
                    animProps["step"] = 0;
                } else {
                    animProps["step"] += 1;
                }
            }

            offsetX = animProps["stepx"] * animProps["step"];
            if (animProps["useSet"]) {
                if (animProps["lastX"]) {
                    if (offsetX >= animProps["lastX"]) {
                        offsetX = 0;
                        animProps["step"] = 0;
                    }
                }
                gameScreen.drawImage(imgSrc, animProps["setX"] - offsetX, animProps["setY"]);
                continue;
            }

            activeAnimationItems = playerEnv.activeAnimations[key];
            items = playerEnv.activeAnimations[key].length;
            offX = animProps["offX"];
            offY = animProps["offY"];
            while (items--) {
                x = (activeAnimationItems[items][0] + playerEnv.offsetX) - offX;
                y = (activeAnimationItems[items][1] + playerEnv.offsetY) - offY;
                gameScreen.save();
                gameScreen.beginPath();
                gameScreen.rect(x, y, animProps["x"], animProps["y"]);
                gameScreen.clip();
                gameScreen.drawImage(animProps["src"], (x - offsetX), y);
                gameScreen.restore();
            }
        }
    }


    function bindHandlers() {
        gameArea.addEventListener('click', checkClick);
        gameArea.addEventListener('mousedown', checkMovement);
        gameArea.addEventListener('mouseup', checkMovement);
        gameArea.addEventListener('mousemove', realiseMovement);
        document.addEventListener('keyup', checkKeys);
        document.addEventListener('keydown', checkKeys);
    }

    function unbindHandlers() {
        gameArea.removeEventListener('click', checkClick);
        gameArea.removeEventListener('mousedown', checkMovement);
        gameArea.removeEventListener('mouseup', checkMovement);
        gameArea.removeEventListener('mousemove', realiseMovement);
        document.removeEventListener('keyup', checkKeys);
        document.removeEventListener('keydown', checkKeys);
    }

    var scanArea = [];
    var scanX = 0;
    var scanY = 0;
    function mainloop() {

        if (mainloopCalculating) {
            return;
        }

        mainloopCalculating = true;

        var playerEnv = logic.environments[logic.currentPlayer];

        gameArea.width = gameArea.width;
        gameScreen.lineWidth = 1;
        gameScreen.fillStyle = 'rgba(255,255,255, 0.025)';

        // drawScanAreas
        gameScreen.beginPath();

        var items = playerEnv.scanAreas.length;
        while (items--) {
            scanX = playerEnv.scanAreas[items][1] + playerEnv.offsetX;
            scanY = playerEnv.scanAreas[items][2] + playerEnv.offsetY;
            gameScreen.moveTo(scanX, scanY);
            gameScreen.arc(scanX, scanY, playerEnv.scanAreas[items][0], 0, 6.3);
        }

        gameScreen.closePath();
        gameScreen.fill();


        drawAnimations();
        drawPlanets();


        if (playerEnv.activeRoutes.length !== 0) {
            drawRoutes();
        }


        drawFleets();

        if (playerEnv.activeSelection) {
            updateSelectionInfo(env.activeSelection);
            drawSelection();
        }

        mainloopCalculating = false;
    }

    function drawSingleFrame() {
        mainloop();
    }




    //------------------------------------------------------------------------------



    function createBaseShipDesign(shipClass, designName) {
        var shipDesign = new Object();
        shipDesign.name = designName;
        shipDesign.type = logic.shipClasses[shipClass].type;
        shipDesign.cost = logic.shipClasses[shipClass].cost;
        shipDesign.count = 0;
        shipDesign.range = 0;

        // Retrieve from shipClasses
        shipDesign.space = logic.shipClasses[shipClass].space;

        // Calculate value based on integrated engines for fleet movement calulation after creation
        shipDesign.speed = 0;

        // design.components = [ [Engines**], [Weapons**], [Shields**], [Modules**] ]
        //shipDesign.components = [ [], [], [], [] ];
        shipDesign.engines = [];
        shipDesign.weapons = [];
        shipDesign.shields = [];
        shipDesign.modules = [];

        return shipDesign;
    }


    function addComponent(design, type, name, count) {

        var components = false;
        var hasCount = false;
        var multiple = false;

        if (type === 'engine') {
            components = logic.shipEngines;
            hasCount = true;
            multiple = false;
        } else if (type === 'weapon') {
            components = logic.shipWeapons;
            hasCount = true;
            multiple = true;
        } else if (type === 'shield') {
            components = logic.shipShields;
            hasCount = false;
            multiple = false;
        } else if (type === 'module') {
            components = logic.shipModules;
            hasCount = false;
            multiple = true;
        } else {
            return;
        }

        var part = [];
        for (var item = 0; item < components.length; item++) {
            if (name === components[item].name) {

                if (hasCount) {
                    if (design.space < count * components[item].space) {
                        return;
                    }

                    design.space -= count * components[item].space;

                    if (multiple) {
                        part.push([name, count]);
                    } else {
                        part = [name, count];
                    }

                } else {
                    if (design.space < components[item].space) {
                        return;
                    }

                    if (multiple) {
                        for (var subitem = 0; subitem < part.length; subitem++) {
                            if (name === part[subitem][0]) {
                                delete subitem;
                                return;
                            }
                        }
                        design.space -= components[item].space;
                        part.push(components[item].name);

                    } else {
                        design.space -= components[item].space;
                        part = [name];
                    }
                }

                switch (type) {
                    case "engine":
                        design.engines = part;
                        break;
                    case "weapon":
                        design.weapons = part;
                        break;
                    case "shield":
                        design.shields = part;
                        break;
                    case "module":
                        design.modules = part;
                        break;
                    default:
                        return;
                }
                break;
            }
        }
    }

    function removeComponent(design, type, index) {

        var components = false;
        var hasCount = false;
        var part = [];

        switch (type) {
            case "engine":
                components = logic.shipEngines;
                part = design.engines;
                hasCount = true;
                break;
            case "weapon":
                components = logic.shipWeapons;
                part = design.weapons[index];
                hasCount = true;
                break;
            case "shields":
                components = logic.shipShields;
                part = design.shields[index];
                hasCount = false;
            case "module":
                components = logic.shipModules;
                part = design.modules[index];
                hasCount = false;
            default:
                return;
        }

        for (var item = 0; item < components.length; item++) {
            if (part[0] === components[item].name) {
                if (hasCount) {
                    design.space += part[1] * components[item].space;
                } else {
                    design.space += components[item].space;
                }

                part.splice(index, 1);
                break;
            }
        }

    }


    function calculateDesign(design) {

        for (var item = logic.shipEngines.length - 1; item > -1; item--) {
            if (design.engines[0] === logic.shipEngines[item].name) {
                design.speed = design.engines[1] * logic.shipEngines[item].speed;
                design.cost += design.engines[1] * logic.shipEngines[item].cost;
                design.range = logic.shipEngines[item].range;
                break;
            }
        }

        for (var subitem = design.weapons.length - 1; subitem > -1; subitem--) {
            for (var item = logic.shipWeapons.length - 1; item > -1; item--) {
                if (design.weapons[subitem][0] === logic.shipWeapons[item].name) {
                    design.cost += design.weapons[subitem][1] * logic.shipWeapons[item].cost;
                    break;
                }
            }
        }

        for (var item = logic.shipShields.length - 1; item > -1; item--) {
            if (design.shields[0] === logic.shipShields[item].name) {
                design.cost += logic.shipShields[item].cost;
                break;
            }
        }

        for (var subitem = design.modules.length - 1; subitem > -1; subitem--) {
            for (var item = logic.shipModules.length - 1; item > -1; item--) {
                if (design.modules[subitem] === logic.shipModules[item].name) {
                    design.cost += logic.shipModules[item].cost;

                    for (var effect = 0; effect < logic.shipModules[item].effects.length; effect++) {
                        if (logic.shipModules[item].effects[effect][0] === 'Range') {
                            design.range += logic.shipModules[item].effects[effect][1];
                        }
                    }

                    break;
                }
            }
        }

    }

    function getModule(designName, category) {
        var playerEnv = logic.environments[logic.currentPlayer];

        for (var item = playerEnv.designs.length - 1; item > -1; item--) {
            if (designName === playerEnv.designs[item].name) {

                for (var module = playerEnv.designs[item].modules.length - 1; module > -1; module--) {
                    for (var moduleItem = logic.shipModules.length - 1; moduleItem > -1; moduleItem--) {
                        if (playerEnv.designs[item].modules[module] === logic.shipModules[moduleItem].name) {
                            for (var effect = logic.shipModules[moduleItem].effects.length - 1; effect > -1; effect--) {
                                if (category === logic.shipModules[moduleItem].effects[effect][0]) {
                                    return [true, logic.shipModules[moduleItem].effects[effect][1]];
                                }
                            }
                        }
                    }

                }
            }

        }

        return [false];
    }



    // ---------------------------------------------------------------------------------

    var gameArea = document.getElementById('gameScreenArea');
    var gameScreen = gameArea.getContext('2d');
    gameScreen.font = "10px sans-serif";

    var reports = document.getElementById('logwindow');
    var resizeRight = document.getElementById('resizeRight');
    var statusBar = document.getElementById('statusBar');
    var modal = document.getElementById('modal');

    var combatArea = document.getElementById('combatArea');
    var combatScreen = combatArea.getContext('2d');
    var combatOverlay = document.getElementById('combatOverlay');

    var turnDisplay = document.getElementById('turnDisplay');
    var fleetDisplay = document.getElementById('fleetDisplay');
    var researchDisplay = document.getElementById('researchDisplay');
    var planetDisplay = document.getElementById('planetDisplay');
    var helpDisplay = document.getElementById("helpDisplay");

    var previousWidth = 0;
    turnDisplay.addEventListener('click', function (evt) {
        evt.preventDefault();

        if (reports.style.display !== 'none') {
            previousWidth = gameArea.width;
            reports.style.display = 'none';
            resizeRight.style.display = 'none';
            gameArea.width = document.getElementById('gameScreen').clientWidth;
        } else {
            reports.style.display = 'block';
            resizeRight.style.display = 'block';
            gameArea.width = previousWidth;
        }
    });

    fleetDisplay.addEventListener('click', function (evt) {
        evt.preventDefault();

        if (document.getElementById('designListing') !== null) {
            modal.style.display = 'none';
            modal.innerHTML = '';
            return;
        }

        function displayDesignDetails(evt) {
            evt.preventDefault();
            var designListing = document.getElementById('designListing');
            var targetDesign = new Object();
            var playerEnv = logic.environments[logic.currentPlayer];

            for (var design = playerEnv.designs.length - 1; design > -1; design--) {
                if (playerEnv.designs[design].name === evt.target.name) {
                    targetDesign = playerEnv.designs[design];
                    break;
                }
            }
            designListing.innerHTML = '';
            var listing = '<ul style="color: #fff; font-weight:bold; overflow:auto; padding: 5px; height: 208px;">';


            listing += '<li><span>Name</span>: ' + targetDesign.name + '</li>';
            listing += '<li><span>Type</span>: ' + targetDesign.type + '</li>';
            listing += '<li><span>Count</span>: ' + targetDesign.count + '</li>';
            listing += '<li><span>Range</span>: ' + targetDesign.range + '</li>';
            listing += '<li><span>Speed</span>: ' + targetDesign.speed + '</li>';
            listing += '<li><span>Cost</span>: ' + targetDesign.cost + '</li>';
            listing += '<li><span>Space</span>: ' + targetDesign.space + '</li>';

            if (targetDesign.engines !== '') {
                listing += '<br/>';
                listing += '<li><span>Engines</span><br/>' + targetDesign.engines[1] + ' x ' + targetDesign.engines[0] + '</li>';
            }

            if (targetDesign.shields !== '') {
                listing += '<br/>';
                listing += '<li><span>Shields</span><br/>' + targetDesign.shields[0] + '</li>';
            }

            if (targetDesign.weapons !== '') {
                listing += '<br/>';
                listing += '<li><span>Weapons</span>';

                for (var weapon in targetDesign.weapons) {
                    listing += '<br/>' + targetDesign.weapons[weapon][1] + ' x ' + targetDesign.weapons[weapon][0];
                }
                listing += '</li>';

            }

            if (targetDesign.modules !== '') {
                listing += '<br/>';
                listing += '<li><span>Modules</span>';

                for (var module in targetDesign.modules) {
                    listing += '<br/>' + targetDesign.modules[module];
                }
                listing += '</li>';

            }

            listing += '</ul>';
            designListing.innerHTML = listing;
        }


        function showLocation(evt) {
            var target = evt.target;

            if (target.tagName === 'IMG' || target.tagName === 'SPAN') {
                target = evt.target.parentNode.parentNode.parentNode;
            } else if (target.tagName === 'H5') {
                target = evt.target.parentNode.parentNode;
            }

            target = env.fleets[ parseInt(target.attributes.name.value) ];
            modal.style.display = 'none';
            modal.innerHTML = '';
            createSelection(target);
            scrollToLocation(target, false);
        }


        var fleetScreen = '';
        modal.style.display = 'none';
        modal.innerHTML = '';

        fleetScreen += '<div style="width:525px; background-color: #666; padding: 10px 10px; height: 223px; border-radius: 5px 5px 0px 0px;">';
        fleetScreen += '<div style="background-color:#555; border-radius:5px; width: 100%; height:100%; overflow:auto;"><ul id="fleetListing"></ul></div>';
        fleetScreen += '</div>';
        fleetScreen += '<div style="width:175px; background-color: #666; padding: 5px 10px; float: left; height: 218px; border-radius: 0px 0px 0px 5px;">';
        fleetScreen += '<ul style="overflow:auto; height: 228px; width: 170px;" id="fleetDesigns"></ul>';
        fleetScreen += '</div>';
        fleetScreen += '<div style="width:330px; background-color: #666; padding: 5px 10px; float: left; border-radius:0px 0px 5px 0px">';
        fleetScreen += '<div id="designListing" style="height: 218px; width: 100%; background-color:#555; border-radius:5px;"></div>';
        fleetScreen += '</div>';
        modal.innerHTML = fleetScreen;

        var designListing = document.getElementById('fleetDesigns');
        var fleetListing = document.getElementById('fleetListing');

        var playerEnv = logic.environments[logic.currentPlayer];
        playerEnv.designs.forEach(function (design) {
            designListing.innerHTML += '<li><a href="#" class="fleetDesign" name="' + design.name + '">' + design.count + ' x ' + design.name + ' (' + design.type + ')</a></li>';
        });

        for (var item = 0; item < playerEnv.fleets.length; item++) {
            if (playerEnv.fleets[item].location === 'planet') {
                locationImage = '<img src="planet.jpg" width="90px">';
            } else {
                locationImage = '<span style="height: 80px; width: 100%; background-color: #000;"></span>';
            }
            fleetListing.innerHTML += '<li style="float: left; height: 100px; width: 90px; padding: 5px; border: 1px solid #333; text-align:center;" class="fleet" name="' + item + '"><a href="#" style="margin:0px; padding:0px;"><div style="heigth:80px; width:90px; overflow:hidden;">' + locationImage + '</div><h5 style="color:#fff; font-weight:bold;">' + playerEnv.fleets[item].name + '</h5></a></li>';
        }



        var fleetDesigns = document.getElementsByClassName('fleetDesign');
        for (var x = fleetDesigns.length - 1; x > -1; x--) {
            fleetDesigns[x].addEventListener('click', displayDesignDetails);
        }

        var fleets = document.getElementsByClassName('fleet');
        for (var x = fleets.length - 1; x > -1; x--) {
            fleets[x].addEventListener('click', showLocation);
        }


        modal.style.display = 'inline';
    });


    researchDisplay.addEventListener('click', function (evt) {
        evt.preventDefault();

        if (document.getElementById('researchListing') !== null) {
            modal.style.display = 'none';
            modal.innerHTML = '';
            return;
        }

        modal.style.display = 'none';
        modal.innerHTML = '';
        var researchScreen = '';
        researchScreen += '<div id="researchListing">';
        researchScreen += '<h3>Research</h3>';
        researchScreen += '<div id="activeResearch">';

        if (env.research.project) {
            researchScreen += '<p id="researchProject">Active research: ' + env.research.project[1] + '<p>';
        } else {
            researchScreen += '<p id="researchProject">Active research: No project selected<p>';
        }

        var turns = 0;
        if (env.research.points !== 0) {
            turns = Math.ceil((env.research.required - env.research.progress) / env.research.points);
        }

        researchScreen += '<p id="researchProgress">Progress ' + env.research.progress + ' of ' + env.research.required + ' (' + env.research.points + ' pts each turn, ' + turns + ' turns)<p>';
        researchScreen += '</div>';
        researchScreen += '<div id="techGroupContainer">';

        // TODO: tech listing
        var techSize = env.listedTechs.length;
        var subitems = 0;
        var tech = [];
        for (var techs = 0; techs < techSize; techs++) {
            tech = env.listedTechs[techs];
            researchScreen += '<div class="techGroup" name="' + techs + '">';
            if (tech[0] === env.research.project) {
                color = '#fff;';
            } else {
                color = '#dedede;';
            }
            researchScreen += '<h5 style="text-transform: uppercase; color: ' + color + '" name="' + techs + '">' + tech[0] + ' (' + tech[1] + ')</h5>';

            subitems = tech[2].length;
            researchScreen += '<ul>';

            for (var option = 0; option < subitems; option++) {
                researchScreen += '<li class="techOption" name="' + techs + '_' + option + '">' + tech[2][option][0] + '</li>';
            }
            researchScreen += '</ul>';
            researchScreen += '</div>';
        }
        researchScreen += '</div>';

        researchScreen += '<div id="researchDescription"></div>';

        researchScreen += '</div></div>';
        modal.innerHTML = researchScreen;

        // Binding tech field elements mouseover for descriptions
        var techElements = document.getElementsByClassName("techOption");
        var options = techElements.length;
        while (options--) {
            techElements[options].addEventListener("mouseover", function (evt) {
                var keys = evt.target.getAttribute("name").split("_", 2);
                document.getElementById('researchDescription').innerHTML = env.listedTechs[keys[0]][2][keys[1]][1];
            });
        }

        // Binding tech groups to set active
        var techGroups = document.getElementsByClassName("techGroup");
        var options = techGroups.length;
        while (options--) {
            techGroups[options].addEventListener("click", function (evt) {
                var targetName = evt.target.getAttribute("name");
                if (targetName === null) {
                    targetName = evt.target.parentNode.getAttribute("name");
                }

                if (targetName.indexOf("_") !== -1) {
                    targetName = targetName.split("_", 1)[0];
                }

                var techItem = parseInt(targetName);
                env.research.project = [techItem, env.listedTechs[techItem][0]];
                env.research.required = env.listedTechs[techItem][1];
                env.research.progress = 0;

                document.getElementById('researchProject').innerHTML = 'Active research: ' + env.research.project[1];
                document.getElementById('researchProgress').innerHTML = 'Progress ' + env.research.progress + ' of ' + env.research.required + ' (' + env.research.points + ' pts each turn, ' + Math.ceil(env.research.required / env.research.points) + ' turns)';
            });
        }

        modal.style.display = 'inline';

    });

    planetDisplay.addEventListener("click", function (evt) {
        var playerEnv = logic.environments[logic.currentPlayer];
        evt.preventDefault();

        if (document.getElementById('planetListing') !== null) {
            modal.style.display = 'none';
            modal.innerHTML = '';
            return;
        }

        var planetScreen = '';
        planetScreen = '<div id="planetListing">';
        planetScreen += '<h3>Planet overview</h3>';
        planetScreen += '<div>';
        planetScreen += '<ul id="planetFilter">';
        planetScreen += '<li id="filterOwned" class="filterSelected">Colonized planets</li>';
        planetScreen += '<li id="filterKnown">Known planets</li>';
        planetScreen += '<li id="filterUnknown">Unknown planets</li>';
        planetScreen += '</ul>';
        planetScreen += '<ul id="planetList">';
        planetScreen += '</ul>';
        planetScreen += '<div id="planetDetails"></div>';

        planetScreen += '<div id="commands">';
        planetScreen += '<span style="margin-top:12px; margin-right:12px; clear: both; float: left; color:#dedede;">Sort planets by</span>';
        planetScreen += '<button id="sortByName">Name</button>';
        planetScreen += '<button id="sortBySize">Size</button>';
        planetScreen += '<button id="sortByDistance">Distance</button>';
        planetScreen += '</div>';

        planetScreen += '</div></div>';

        modal.innerHTML = planetScreen;

        var planet = new Object();
        var planetName = "";
        var planetInfo = "";

        var planetList = document.getElementById("planetList");
        var planetDetails = document.getElementById("planetDetails");

        var filterOwned = document.getElementById("filterOwned");
        var filterKnown = document.getElementById("filterKnown");
        var filterUnknown = document.getElementById("filterUnknown");

        var originalList = [];
        var sortByName = document.getElementById("sortByName");
        var sortByDistance = document.getElementById("sortByDistance");
        var sortBySize = document.getElementById("sortBySize");
        sortByDistance.disabled = true;

        modal.style.display = 'inline';

        // Create list of owned planets on opening
        createPlanetListItems(playerEnv.ownedPlanets);

        // Bind colonizedPlanet filter and create list on click
        filterOwned.addEventListener("click", function (evt) {
            var selected = document.getElementsByClassName("filterSelected")[0];
            selected.className = selected.className.replace("filterSelected", "");
            evt.target.className += "filterSelected";
            planetList.setAttribute("name", "own");
            sortBySize.disabled = false;
            sortByDistance.disabled = true;

            createPlanetListItems(playerEnv.ownedPlanets);
        });

        // Bind knownPlanets filter and create list on click
        filterKnown.addEventListener("click", function (evt) {
            var selected = document.getElementsByClassName("filterSelected")[0];
            selected.className = selected.className.replace("filterSelected", "");
            evt.target.className += "filterSelected";
            planetList.setAttribute("name", "known");
            sortBySize.disabled = false;
            sortByDistance.disabled = false;

            createPlanetListItems(playerEnv.knownPlanets);
        });

        // Bind knownPlanets filter and create list on click
        filterUnknown.addEventListener("click", function (evt) {
            var selected = document.getElementsByClassName("filterSelected")[0];
            selected.className = selected.className.replace("filterSelected", "");
            evt.target.className += "filterSelected";
            planetList.setAttribute("name", "unknown");
            sortBySize.disabled = true;
            sortByDistance.disabled = false;

            createPlanetListItems(playerEnv.unknownPlanets);
        });


        // Add custom scrolling feature to planetList
        planetList.addEventListener("wheel", function (evt) {
            evt.preventDefault();

            if (evt.deltaY > 0) {
                if ((planetList.scrollHeight - planetList.clientHeight) > 0) {
                    planetList.scrollTop += 29;
                }
            } else {
                if (planetList.scrollTop > 0) {
                    planetList.scrollTop -= 29;
                }
            }
        });

        // TODO: Change use of logic.planet in this functions at some point
        function createPlanetListItems(planets) {
            var playerEnv = logic.environments[logic.currentPlayer];

            var planet = new Object();
            var planetCount = planets.length;
            planetList.innerHTML = "";
            originalList = [];

            for (var x = 0; x < planetCount; x++) {
                planet = logic.planets[ planets[x] ];
                originalList.push([planet.id, planet.name, planet.population[1], planet.x, planet.y]);

                if (x === 0) {
                    showPlanetDetails(planet);
                }

                planetList.innerHTML += '<li name="' + planets[x] + '">' + planet.name + '</li>';
            }

            // Remove active sorting
            var actives = document.getElementsByClassName("active");
            if (actives.length === 1) {
                actives[0].className = "";
            }

            bindPlanetListItems();
        }

        function bindPlanetListItems() {
            // Bind all items to click and mouseOver
            var elements = planetList.children.length;
            var items = planetList.children;

            while (elements--) {
                items[elements].addEventListener("mouseover", function (evt) {
                    if (document.getElementsByClassName("activeFilter").length === 0) {
                        showPlanetDetails(logic.planets[ evt.target.getAttribute("name") ]);
                    }
                });

                items[elements].addEventListener("click", function (evt) {
                    var planetObj = logic.planets[ evt.target.getAttribute("name") ];

                    if (evt.target.className === "active") {
                        evt.target.className = "";
                        if (env.strg && playerEnv.ownedPlanets.indexOf(planetObj.id) !== -1) {
                            env.strg = false;
                            scrollToLocation(planetObj, showPlanetDialog);
                        } else {
                            scrollToLocation(planetObj, false);
                        }
                        return;
                    }

                    var selected = document.getElementsByClassName("activeFilter");
                    if (selected.length !== 0) {
                        selected[0].className = selected[0].className.replace("activeFilter", "");
                    }

                    evt.target.className += "activeFilter";

                    showPlanetDetails(planetObj);
                    scrollToLocation(planetObj, false);
                });
            }
        }

        function showPlanetDetails(planet) {
            var planetInfo = '';
            planetInfo += '<h3>' + planet.name + '</h3>';
            planetInfo += '<br><h5>Description<h5>';
            planetInfo += '<p>' + logic.terrains[planet.terrain][0] + ' planet</p><br/>';

            if (playerEnv.unknownPlanets.indexOf(planet.id) !== -1 || playerEnv.knownPlanets.indexOf(planet.id) !== -1) {
                var distanceX = 0;
                var distanceY = 0;
                var distance = 0;
                var shortestDistance = 10000000;
                var planets = playerEnv.ownedPlanets.length;
                var srcPlanet = new Object();
                var routeFrom = "";

                while (planets--) {
                    srcPlanet = logic.planets[ playerEnv.ownedPlanets[planets] ];
                    distanceX = Math.abs(srcPlanet.x - planet.x);
                    distanceY = Math.abs(srcPlanet.y - planet.y);
                    distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

                    if (distance < shortestDistance) {
                        shortestDistance = Math.round(distance);
                        routeFrom = srcPlanet.name;
                    }
                }

                planetInfo += '<p>Shortest route to planet..<br/>';
                planetInfo += routeFrom + ' by ' + shortestDistance + ' units</p><br/>';

            }

            if (playerEnv.knownPlanets.indexOf(planet.id) !== -1) {
                planetInfo += '<p><span>Terrain</span>' + logic.terrains[planet.terrain][0] + '</p>';
                planetInfo += '<p><span>Mineral richness</span>' + logic.mineralLevel[planet.mineralLevel][1] + '</p>';
                planetInfo += '<p><span>Ecological diversity</span>' + logic.ecologicalLevel[planet.ecologicalLevel][1] + '</p>';

                if (planet.owner === -1) {
                    planetInfo += '<br/><p><span>Maximum population</span>' + planet.population[1].toFixed(2) + '</p>';
                }
            }

            if (planet.owner === logic.currentPlayer) {
                planetInfo += '<br/><p><span>Current population</span>' + planet.population[0].toFixed(2) + ' of ' + planet.population[1].toFixed(2) + '</p>';
                planetInfo += '<br/><h5>Workforce</h5>';
                planetInfo += '<p><span>Assigned workforce</span>' + (planet.workForce[0] - planet.workForce[1]) + ' of ' + planet.workForce[0] + '<br/>';
                planetInfo += '<br/><span>Agriculture</span>' + planet.workForce[2];
                planetInfo += '<br/><span>Construction</span>' + planet.workForce[3];
                planetInfo += '<br/><span>Research</span>' + planet.workForce[4];
                planetInfo += '</p>';
            }

            planetDetails.innerHTML = planetInfo;
        }

        // Restoring function
        function restoreAndBindList(planetArray) {
            var elements = planetArray.length;
            planetList.innerHTML = "";

            while (elements--) {
                planetList.innerHTML += '<li name="' + planetArray[elements][0] + '">' + planetArray[elements][1] + '</li>';
            }

            bindPlanetListItems();
        }

        // Shadowing
        function createListShadow(planetArray) {
            var elements = planetArray.length;
            var originalShadow = [];
            while (elements--) {
                originalShadow.push(planetArray[elements]);
            }

            return originalShadow;
        }


        // Sorting functions
        function sortName(p1, p2) {
            if (p1[1] < p2[1]) {
                return true;
            }

            return false;
        }


        function sortSize(p1, p2) {
            if (p1[2] > p2[2]) {
                return true;
            }

            return false;
        }


        function sortDistance(p1, p2) {
            if (p1[2] < p2[2]) {
                return true;
            }

            return false;
        }


        // Sorting clickhandlers
        sortByName.addEventListener("click", function (evt) {
            evt.preventDefault();

            if (evt.target.className === "active") {
                evt.target.className = "";
                restoreAndBindList(originalList);
                return;
            }

            var actives = document.getElementsByClassName("active");
            if (actives.length === 1) {
                actives[0].className = "";
            }

            evt.target.className = "active";

            restoreAndBindList(createListShadow(originalList).sort(sortName));
        });


        sortBySize.addEventListener("click", function (evt) {
            evt.preventDefault();

            if (planetList.getAttribute("name") === "unknown") {
                return;
            }

            if (evt.target.className === "active") {
                evt.target.className = "";
                restoreAndBindList(originalList);
                return;
            }

            var actives = document.getElementsByClassName("active");
            if (actives.length === 1) {
                actives[0].className = "";
            }

            evt.target.className = "active";
            restoreAndBindList(createListShadow(originalList).sort(sortSize));
        });


        sortByDistance.addEventListener("click", function (evt) {
            evt.preventDefault();

            if (evt.target.className === "active") {
                evt.target.className = "";
                restoreAndBindList(originalList);
                return;
            }

            var actives = document.getElementsByClassName("active");
            if (actives.length === 1) {
                actives[0].className = "";
            }

            evt.target.className = "active";
            var shadowList = createListShadow(originalList);

            var distanceX = 0;
            var distanceY = 0;
            var distance = 0;
            var shortestDistance = 0;
            var planets = 0;
            var srcPlanet = new Object();
            var resultsArray = [];

            var items = shadowList.length;
            while (items--) {
                shortestDistance = 10000000;
                planets = playerEnv.ownedPlanets.length;
                while (planets--) {
                    srcPlanet = logic.planets[ playerEnv.ownedPlanets[planets] ];
                    distanceX = Math.abs(srcPlanet.x - shadowList[items][3]);
                    distanceY = Math.abs(srcPlanet.y - shadowList[items][4]);
                    distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

                    if (distance < shortestDistance) {
                        shortestDistance = Math.round(distance);
                    }
                }

                resultsArray.push([shadowList[items][0], shadowList[items][1], shortestDistance]);
            }

            restoreAndBindList(resultsArray.sort(sortDistance));
        });


    });



    helpDisplay.addEventListener("click", function (evt) {
        evt.preventDefault();

        if (document.getElementById('helpListing') !== null) {
            modal.style.display = 'none';
            modal.innerHTML = '';
            return;
        }

        var helpScreen = '';

        helpScreen += '<div id="helpListing" style="width: 550px; height: 400px; padding: 10px; background-color: #8a8a8a; border-radius: 5px;">';
        helpScreen += '<h4>Help overview - Controls</h4>';
        helpScreen += '<h6 style="margin: 5px;">This help is from <a style="width: auto; display: inline;" target="_blank" href="http://github.com/jrie/Connect">http://github.com/jrie/Connect</a></h6>';
        helpScreen += '<p style="height: 315px; overflow: auto; padding: 5px 15px; padding-bottom: 25px; clear: both;">';
        helpScreen += '- Pressing " T " advances the turn<br/><br/>';
        helpScreen += '- Pressing "Turn" in the main panel opens or closes the turn log which contains a history of discoveries, fleet arrivals, constructions and such<br/><br/>';
        helpScreen += '- Holding down the control/Strg key and the left mouse button in the game window while moving the mouse will move the galaxy<br/><br/>';
        helpScreen += '- Pressing control/Strg while clicking on fleet will open the fleet basic dialog - its by default hidden when there is only one fleet<br/><br/>';
        helpScreen += '- The current player can be switched using Shift + Tab key<br/><br/>';
        helpScreen += '- Pressing "Research" opens the research panel, for now this only has basic function and adding research results has to be implemented.<br/><br/>';
        helpScreen += '- The fleet overview can be opened by pressing "Fleets" - selecting a design name (bottom) will show its details<br/><br/>';
        helpScreen += '- The log window can be resized by pressing and moving on the very left, clicking "Turn" hides the logwindow<br/><br/>';
        helpScreen += '- Clicking on bold texts elements in the log will bring you to the place of action, and possibly showing further dialogs<br/><br/>';
        helpScreen += '- When a colony ship is brought to a uncolonized planet, a "colony" button appears on the top left of the galaxy view after the planet is selected<br/><br/>';
        helpScreen += '- Selecting a fleet and another planet will create a route where this fleet will travel towards, routes also can be selected, automatically selecting the first fleet using it, ships on routes/in space cant be moved before landing<br/><br/>';
        helpScreen += '- Selecting a colonized planet will show the planet dialog, workforce based on the population can be added or reset<br/><br/>';
        helpScreen += '- A queue for production items can be made by holding control/strg, clicking an item on the right will remove of the queue<br/><br/>';
        helpScreen += '- Selecting a fleet in the fleet overview with Strg/Control selects it, this allows to rename the fleet by pressing "rename", selecting multiple fleets and pressing join, joins all fleets into the first selected one. Selecting a fleet and pressing "split" will change the view to the split flit modal, allowing drag and drop of ships from the selected fleet into a new fleet<br/><br/>';
        helpScreen += '- The planet overview can be opened clicking on "Planets" in the main panel, clicking one on a planet scrolls the planet into the view and locking it, deselecting with a mouse click removes the lock of that entry, so while hovering other planets there information will be shown. When a planet is selected, pressing Strg/Control and clicking left will open the planet dialog for this particular planet<br/><br/>';
        helpScreen += '</p>';
        helpScreen += '</div>';

        modal.innerHTML = helpScreen;
        modal.style.display = 'inline';

    });

    // ---------------------------------------------------------------------------------

    logic = new Object();		// var logic, var envs
    envs = [];

    logic.planets = [];
    logic.fleets = [];
    logic.ownedPlanets = [];
    logic.knownPlanets = [];
    logic.unknownPlanets = [];
    logic.planetNames = [];
    logic.workers = [];
    logic.marines = [];
    logic.techs = [];
    logic.research = [];
    logic.planetResearch = [];
    logic.availableBuildings = [];
    logic.activeRoutes = [];
    logic.designs = [];

    logic.foreignFleets = [];
    logic.knownForeignDesigns = [];

    logic.turn = 0;
    logic.players = 3;
    logic.currentPlayer = 0;
    logic.actions = [];
    logic.scanAreas = [];


    //logic.spies = [];
    // Type, MineralLevel, EcoLevel
    logic.terrains = [
        ['Tundra', [1, 2], [0, 1], "img/terrain0.png"],
        ['Desert', [1, 2], [0, 1], "img/terrain1.png"],
        ['Aquatic', [1, 2], [3, 3], "img/terrain2.png"],
        ['Barren', [2, 3], [1, 2], "img/terrain3.png"],
        ['Jungle', [2, 3], [2, 3], "img/terrain4.png"],
        ['Vulcanic', [3, 3], [0, 1], "img/terrain5.png"]
    ];

    logic.mineralLevel = [
        [0, 'Very poor'],
        [1, 'Poor'],
        [2, 'Average'],
        [3, 'Rich']
    ];

    logic.ecologicalLevel = [
        [0, 'Very poor'],
        [1, 'Poor'],
        [2, 'Average'],
        [3, 'Rich']
    ];

    // logic.shipClasses = [ [Type, Space, BaseCost, BaseStructure, BaseArmor, BaseMovement ] ]
    logic.shipClasses = [
        ['Frigate', 20, 10, 5, 5, 7, 2],
        ['Battleship', 35, 35, 20, 20, 5, 4],
        ['Cruiser', 50, 75, 35, 35, 3, 6],
        ['Destroyer', 90, 150, 50, 50, 2, 8]
    ];

    //logic.modules = [ ['Component name', Space, BaseCost, [ [ActionType1, Effect], [ActionType2, Effect] ] ]]
    //logic.modules = [ ['Component name', Space, BaseCost, [ ['Colonize', 1] ]]
    logic.shipModules = [
        ['Basic colonization module', 25, 40, [['Colonize', 1]]],
        ['Extended colonization module', 50, 60, [['Colonize', 3]]],
        ['Fuel tanks', 7, 8, [['Range', 120]]],
        ['Troop module', 15, 12, [['Invasion', 15]]],
        ['Point defense module', 12, 16, [['AntiMissile', 25]]],
        ['Shield generators', 8, 25, [['ShieldGen', 5]]]
    ];

    //logic.engines = [ ['Engine name', Space, BaseCost, Speed, Range**, Explosion Damage?, Battle Movement?] ]
    logic.shipEngines = [
        ['Nuclear Drive', 5, 8, 10, 150]
    ];

    //logic.weapons = [ ['Weapon name', Type, Space, BaseCost, Range, Shots, fireRate?, DamageMin, DamageMax] ]
    logic.shipWeapons = [
        ['Laser beam', 'Beam', 4, 5, 50, -1, 450, 1, 3],
        ['Nuclear Missile', 'Missile', 5, 5, 150, 5, 850, 2, 5]
    ];

    //logic.shields = [ ['Shield name', Space, BaseCost, Strength, Resistance, RegenerationRate]]
    logic.shipShields = [
        ['Class I Shield', 0, 3, 10, 1, 1.2]
    ];

    //logic.buildings = [ ['Name', BaseCost, BuildingRequirement, [Category, Type, Effect, Capacity, CapacityLimit], R ]]
    //
    // * increase per worker
    // + fixed bonus for category on planet output
    // % percentage increase of base in category
    // BuildingType = BASECONSTRUCTION / REPLACEMENT / EXTENSION (B,R,E)
    // if R ask item
    // if E ask item
    //
    // TODO: Think of order of calculation for percentages prior fixed bonuses
    //			Extensions only work if requirement buildings are present
    //
    //	['Extended Factory Complex', ['building', 120, ['Construction', '+', 2, 'E', 'Factory Complex']] ]
    //

    logic.buildings = [
        ['Factory Complex', 40, 'B', ['Construction', '*', 1.05],
            "Basic construction facility for our planets, increasing base production by 5% each active construction worker."
        ], //['Construction', '+', 3, false] ],
        ['Farm Complex', 20, 'B', ['Agriculture', '%', 1.05],
            "Basic agriculture facility, increasing the base agriculture output of our planets by 5% each active farmer."
        ], //['Agriculture', '%', 1.05] ],
        ['Research Center', 50, 'B', ['Research', '+', 4],
            "Assiting our researchers analyzing the ecological as well as the environmental values of our colonies.<br/><br/>Providing 4 research points per turn."
        ],
        ['Marine Barracks', 35, 'B', ['PlanetCombat', 1, 4, 5],
            "Defending the colonies is an important task, our well trained marines help to do so.<br/><br/>Training one unit each 5 turns."
        ],
        ['Missile Base', 65, 'B', ['PlanetDefense', 1, 8, 8],
            "The missle base helps protecting the orbit around our planets. Providing 300 units space of our very best missiles; aiding our fleets."
        ]
    ];

    logic.techTrees = {
        "techTreeOrder": ["Force fields", "Physics", "Construction"],
        "Force fields":
                ['Advanced Magnetism', 250,
                    [
                        ['Class I Shields',
                            "First established shield for our ships, inflicting up to 5 damage, regenerating 30% per combat turn."
                        ],
                        ['ECM Jammer',
                            "Allows our ships to evade missile.<br/>The chance to evade missiles is increased by 70%."],
                        ['Mass Driver',
                            "Mass drivers shot projecticles at hyper-velocity, dealing 6 damage."
                        ]
                    ]
                ],
        "Construction":
                ['Construction Level 1', 350,
                    [
                        ['Extended Factory Complex',
                            "Extends our factory complexes with more advanced machinery. Scaling our production by addional 5% cummulative to the bonus of the Factory Complex."
                        ],
                        ['Space mining facility',
                            "Space mining around our planets allow us to harvest the resources of the galaxy, increasing our production base output by plus 7 units."
                        ]
                    ]
                ],
        "Physics":
                ["Fusion Physics", 150,
                    [
                        ["Fusion Beam",
                            "Advanced beam for ships, dealing 2 to 6 damage."
                        ],
                        ["Fusion Rifle",
                            "Very standard rifle for ground troops, increasing groud combat unit damage by +10."
                        ]
                    ]
                ]
    };

    // --------------------------------


    function prepareGameObjects() {

        // Create shipClass objects
        var size = logic.shipClasses.length;
        var obj = new Object();

        for (var item = 0; item < size; item++) {
            var shipClass = logic.shipClasses[item];
            obj = new Object();
            obj.type = shipClass[0];
            obj.space = shipClass[1];
            obj.cost = shipClass[2];
            obj.structure = shipClass[3];
            obj.armor = shipClass[4];
            obj.movement = shipClass[5];
            obj.combatSize = shipClass[6];
            logic.shipClasses.push(obj);
        }
        logic.shipClasses.splice(0, size);

        // Create shipModules objects
        size = logic.shipModules.length;
        for (var item = 0; item < size; item++) {
            var shipModule = logic.shipModules[item];
            obj = new Object();
            obj.name = shipModule[0];
            obj.space = shipModule[1];
            obj.cost = shipModule[2];
            obj.effects = shipModule[3];
            logic.shipModules.push(obj);
        }
        logic.shipModules.splice(0, size);

        // Create shipEngines objects
        size = logic.shipEngines.length;
        for (var item = 0; item < size; item++) {
            var shipEngine = logic.shipEngines[item];
            obj = new Object();
            obj.name = shipEngine[0];
            obj.space = shipEngine[1];
            obj.cost = shipEngine[2];
            obj.speed = shipEngine[3];
            obj.range = shipEngine[4];
            logic.shipEngines.push(obj);
        }
        logic.shipEngines.splice(0, size);

        // Create shipWeapons objects
        size = logic.shipWeapons.length;
        for (var item = 0; item < size; item++) {
            var shipWeapon = logic.shipWeapons[item];
            obj = new Object();
            obj.name = shipWeapon[0];
            obj.type = shipWeapon[1];
            obj.space = shipWeapon[2];
            obj.cost = shipWeapon[3];
            obj.range = shipWeapon[4];
            obj.shots = shipWeapon[5];
            obj.fireRate = shipWeapon[6];
            obj.damageMin = shipWeapon[7];
            obj.damageMax = shipWeapon[8];
            logic.shipWeapons.push(obj);
        }
        logic.shipWeapons.splice(0, size);

        // Create shipShields objects
        size = logic.shipShields.length;
        for (var item = 0; item < size; item++) {
            var shipShield = logic.shipShields[item];
            obj = new Object();
            obj.name = shipShield[0];
            obj.space = shipShield[1];
            obj.cost = shipShield[2];
            obj.strength = shipShield[3];
            obj.resistance = shipShield[4];
            obj.rechargeTime = shipShield[5];
            logic.shipShields.push(obj);
        }
        logic.shipShields.splice(0, size);
    }

    // Set initial players and preparePlayerObjects

    // These items are player specific for quicker interaction from handlers and ui, but need additional controls from logic upon extension


    function preparePlayerObjects() {

        for (var player = 0; player < logic.players; player++) {
            var env = new Object();

            env.offsetX = 0;
            env.offsetY = 0;
            env.rotation = 0;
            env.activeSelection = false;
            env.movement = false;
            env.stepping = 0.25;
            env.baseStepping = 0.15;
            env.strg = false;
            env.gameIntervalRunning = true;
            env.activeRoutes = [];
            env.scrollActive = false;
            env.scrollTargetToY = [false, 0];

            env.activeAnimations = {};

            env.turn = 0;
            env.player = player;
            env.actions = new Object();

            env.workers = new Object();
            env.marines = new Object();
            env.research = new Object();

            env.planets = [];
            env.ownedPlanets = [];
            env.knownPlanets = [];
            env.unknownPlanets = [];

            env.fleets = [];
            env.designs = [];
            env.scanAreas = [];

            env.foreignFleets = [];
            env.knownForeignDesigns = [];

            // Base efficiency
            env.workers.agriculture = 1;
            env.workers.production = 1;
            env.workers.research = 1;

            // Base efficiency
            env.marines.attack = 10;
            env.marines.defense = 10;
            env.marines.evasion = 10;

            env.research.project = false;
            env.research.progress = 0;
            env.research.required = 0;
            env.research.points = 4;

            // TODO: Array containing the research values of all user owned planets
            env.research.planets = [];

            // TODO: Env.techLevels will later be used to indicate the progress in a research field
            env.techLevels = [];
            env.listedTechs = [];

            // Storing discovered technologies in the format
            // "TechtreeName" : [
            //  ["name", "description text"],
            //  ["name2", "description text"]
            // ]
            env.techs = {};

            for (var option = 0; option < logic.techTrees.techTreeOrder.length; option++) {
                var tecKey = logic.techTrees.techTreeOrder[option];

                env.techLevels.push(0);
                env.techs[tecKey] = [];
                env.listedTechs.push(logic.techTrees[tecKey]);
            }

            env.availableBuildings = [
                'Farm Complex',
                'Factory Complex',
                'Research Center',
                'Marine Barracks'
            ];
            env.buildings = [];
            env.lastFleetId = 0;

            for (var option = 0; option < logic.buildings.length; option++) {
                if (env.availableBuildings.indexOf(logic.buildings[option][0]) !== -1) {
                    env.buildings.push(logic.buildings[option]);
                }
            }


            // Player actions in turn(s) to verify with logic
            env.actions = [];

            // Storeage holder for ship module effects
            env.moduleEffects = {
                "own": false,
                "planetIdx": 0,
                "modules": []
            };


            // Logic mirrors of player variables
            logic.availableBuildings.push(env.availableBuildings);
            logic.ownedPlanets.push(env.ownedPlanets);
            logic.knownPlanets.push(env.knownPlanets);
            logic.unknownPlanets.push(env.unknownPlanets);

            logic.workers.push(env.workers);
            logic.marines.push(env.marines);
            logic.research.push(env.research);

            logic.techs.push(env.techs);
            logic.designs.push(env.designs);
            logic.fleets.push(env.fleets);

            logic.actions.push(env.actions);

            envs.push(env);
        }

        return envs;
    }

    // Setup game and player game variables

    prepareGameObjects();
    logic.environments = preparePlayerObjects(); // envs = logic.environments

    env = logic.environments[0];


    // --------------------------------------------------------------------------------



    // --------------------------------------------------------------------------------

    for (var player = logic.players - 1; player > -1; player--) {
        var playerEnv = logic.environments[player];
        var design = createBaseShipDesign(0, 'Wayfinder');
        addComponent(design, 'engine', 'Nuclear Drive', 4);
        addComponent(design, 'module', 'Fuel tanks');
        calculateDesign(design);
        playerEnv.designs.push(design);
        //removeComponent(design, 'shield', 0);

        design = createBaseShipDesign(1, 'Colony Design');
        addComponent(design, 'engine', 'Nuclear Drive', 2);
        addComponent(design, 'module', 'Basic colonization module');
        calculateDesign(design);
        playerEnv.designs.push(design);
    }


    function getDesign(designOwner, designName) {
        var items = logic.environments[designOwner].designs.length;
        while (items--) {
            if (designName === logic.environments[designOwner].designs[items].name) {
                return logic.environments[designOwner].designs[items];
            }
        }

        return false;
    }


    //createAnimation(imgUrl, xWidth, xFrameSize, yFrameSize,  duration, stepX, returnLoaded, lastX, useSet, setX, setY) {

    createAnimation("img/terrain0.png", 176, 26, 25, 50, 30, false, false, false, false, false);
    createAnimation("img/terrain1.png", 176, 26, 25, 50, 30, false, false, false, false, false);
    createAnimation("img/terrain2.png", 176, 26, 25, 50, 30, false, false, false, false, false);
    createAnimation("img/terrain3.png", 176, 26, 25, 50, 30, false, false, false, false, false);
    createAnimation("img/terrain4.png", 176, 26, 25, 50, 30, false, false, false, false, false);
    createAnimation("img/terrain5.png", 176, 26, 25, 50, 30, false, false, false, false, false);
    createAnimation("img/stars1.png", 3860, 800, 600, 3, 0.4, true, 3160, true, 0, 0);


    function loadPlanetNames() {
        var fileLoader = new XMLHttpRequest();
        fileLoader.onreadystatechange = function () {
            if (fileLoader.readyState === 4) {
                logic.planetNames = fileLoader.responseText.split('\n', 2)[1].split("|");
                loadInProgress = false;
            }
        };
        fileLoader.open("GET", "logic/planetnames.txt");
        fileLoader.send();
    }

    env = logic.environments[0];

    // Blocking loader using loadInProgress variable
    loadPlanetNames();

    var loaderCheck = setInterval(checkFinishedLoad, 500);
    var gameInterval;

    function checkFinishedLoad() {
        if (!animationsLoading && !loadInProgress) {
            clearInterval(loaderCheck);

            genGalaxy(28);
            bindHandlers();
            gameInterval = setInterval(mainloop, 50);
        }
    }

}

document.addEventListener('load', app());
