

function app() {

    function lg(msg) {
        console.log(msg);
    }

    function clearStage() {
        gameArea.width = gameArea.width;
    }

    function drawPlanets() {
        env = logic.environments[logic.currentPlayer];

        for (item in env.planets) {

            var planet = env.planets[item];
            gameScreen.beginPath();

            gameScreen.strokeStyle = 'rgba(255, 255, 255, 0.5)';

            // TODO: Update the planet display only if a planet is in scanRange of the current player
            if (planet.owner !== logic.currentPlayer && planet.owner !== -1) {
                gameScreen.fillStyle = "rgba(170,70,70, 1)";
            } else {
                gameScreen.fillStyle = "rgba(150,150,175, 1)";
            }

            if (env.knownPlanets.indexOf(planet.id) !== -1) {
                gameScreen.arc(planet.x + env.offsetX, planet.y + env.offsetY, planet.size, 0, 10);
                gameScreen.font = "10px sans-serif";
                /*if (env.ownedPlanets.indexOf(planet.id) !== -1) {
                 textsize = gameScreen.measureText(planet.name);
                 gameScreen.strokeText(planet.name, planet.x+env.offsetX-(textsize.width/2), planet.y+planet.size+15+env.offsetY)
                 } else {
                 textsize = gameScreen.measureText(planet.displayName);
                 gameScreen.strokeText(planet.displayName, planet.x+env.offsetX-(textsize.width/2), planet.y+planet.size+15+env.offsetY)
                 }
                 */
                textsize = gameScreen.measureText(planet.name);
                gameScreen.strokeText(planet.name, planet.x + env.offsetX - (textsize.width / 2), planet.y + planet.size + 16 + env.offsetY);

            } else if (env.unknownPlanets.indexOf(planet.id) !== -1) {
                gameScreen.arc(planet.x + env.offsetX, planet.y + env.offsetY, planet.size, 0, 10);
            }
            gameScreen.fill();
            gameScreen.closePath();
        }

    }

    function checkPlanets(evt) {
        for (var item in logic.planets) {
            gameScreen.beginPath();
            gameScreen.arc(logic.planets[item].x + env.offsetX, logic.planets[item].y + env.offsetY, logic.planets[item].size + 4, 0, 10);
            gameScreen.closePath();

            if (gameScreen.isPointInPath(evt.layerX, evt.layerY)) {
                if (env.knownPlanets.indexOf(logic.planets[item].id) !== -1 || env.unknownPlanets.indexOf(logic.planets[item].id) !== -1) {
                    lg(logic.planets[item]);
                    return logic.planets[item];
                }
            }
        }

        return false;
    }

    function checkFleets(evt) {
        var env = logic.environments[logic.currentPlayer];

        for (var item in env.fleets) {
            gameScreen.beginPath();
            //gameScreen.rect(env.fleets[item].x - 10 + env.offsetX, env.fleets[item].y - 8 + env.offsetY, 18, 14);
            gameScreen.arc(env.fleets[item].x + env.offsetX, env.fleets[item].y + env.offsetY, 10, 0,  10);
            gameScreen.closePath();

            if (gameScreen.isPointInPath(evt.layerX, evt.layerY)) {
                if (env.fleets[item].location !== 'space') {
                    
                    if (env.fleets[item].origin.owner === env.player || env.fleets[item].origin.foreignFleets.length === 0) {
                        return env.fleets[item].origin.stationedFleets[0];
                    } else {
                        return env.fleets[item].origin.foreignFleets[0];
                    }
                }
                
                return env.fleets[item];
            }
        }

        return false;
    }

    function checkRoutes(evt) {
        gameScreen.lineWidth = 10;
        var env = logic.environments[logic.currentPlayer];

        for (var route in env.activeRoutes) {
            gameScreen.beginPath();
            gameScreen.moveTo(env.activeRoutes[route][0].origin.x + env.offsetX, env.activeRoutes[route][0].origin.y + env.offsetY);
            gameScreen.lineTo(env.activeRoutes[route][1].x + env.offsetX, env.activeRoutes[route][1].y + env.offsetY);

            gameScreen.closePath();

            if (gameScreen.isPointInStroke(evt.layerX, evt.layerY)) {
                createSelection(env.activeRoutes[route][0]);
                gameScreen.lineWidth = 1;
                return true;
            }
        }

        gameScreen.lineWidth = 1;
        return false;
    }

    function checkClick(evt) {
        //lg(evt);

        if (evt.originalTarget.id !== 'modal') {
            modal.style.display = 'none';
            modal.innerHTML = '';
        }

        var planet = false;
        var fleet = false;

        planet = checkPlanets(evt);
        fleet = checkFleets(evt);

        if (!planet && !fleet) {
            if (checkRoutes(evt)) {
                return;
            }
        }
        
        if (fleet) {          
            // Retrieve fleet info from env.fleet for selection
            if (!fleet.hasOwnProperty('name')) {
                fleet = getFleetById(fleet);
            }            
            
            if (fleet.location !== 'space') {
                createSelection(fleet);
                showFleetDialog(fleet.origin, env.strg);
            } else {
                createSelection(fleet);
            }

        } else if (planet) {
            //lg(planet.stationedFleets);
            env = logic.environments[logic.currentPlayer];

            if (env.activeSelection.type === 'fleet' && env.activeSelection.location !== 'space') {
                if (env.activeSelection.origin !== planet) {
                    if (!setDestination(env.activeSelection, planet)) {
                        //createSelection(fleet);
                        return;
                    }
                } else {
                    if (env.activeSelection.destination) {
                        for (route in env.activeRoutes) {
                            if (env.activeRoutes[route][0] === env.activeSelection) {
                                env.activeRoutes.splice(route, 1);
                                break;
                            }
                        }
                    }
                    env.activeSelection.destination = false;
                    env.activeSelection.needsMove = false;
                    //env.activeSelection = false;
                }
            } else {
                if (env.unknownPlanets.indexOf(planet.id) === -1) {
                    createSelection(planet);
                }

                if (env.knownPlanets.indexOf(planet.id) !== -1) {
                    showPlanetDialog(planet);
                    createSelection(planet);
                }
            }
        } else {
            env.activeSelection = false;
            statusBar.innerHTML = '';
        }

    }
    
    function getFleetById(fleetObj) {
        var fleetEnv = logic.environments[ parseInt(fleetObj.id.split('_')) ].fleets;
        for (fleetItem in fleetEnv ) {
            if (fleetObj.id === fleetEnv[fleetItem].id) {
                return fleetEnv[fleetItem];
            }
        }
    }



    function getBaseOutput(planet) {
        var baseAgriculture = logic.ecologicalLevel[planet.ecologicalLevel][0];
        var baseProduction = logic.mineralLevel[planet.mineralLevel][0];
        var baseResearch = logic.workers[planet.owner].research;

        // Increasing basic planet output by percentage based buildings
        for (var planetConstruction in planet.constructions) {
            for (var building in logic.buildings) {
                if (logic.buildings[building][0] === planet.constructions[planetConstruction]) {
                    if (logic.buildings[building][3][1] === '%') {
                        switch (logic.buildings[building][3][0]) {
                            case "Agriculture":
                                baseAgriculture *= logic.buildings[building][3][2];
                                break;
                            case "Construction":
                                baseProduction *= logic.buildings[building][3][2];
                                break;
                            case "Research":
                                baseResearch *= logic.buildings[building][3][2];
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

        for (var planetConstruction in planet.constructions) {
            for (var building in logic.buildings) {
                if (logic.buildings[building][0] === planet.constructions[planetConstruction]) {
                    if (logic.buildings[building][3][1] === '+') {
                        switch (logic.buildings[building][3][0]) {
                            case "Agriculture":
                                planetAgriculture += logic.buildings[building][3][2];
                                break;
                            case "Construction":
                                planetProduction += logic.buildings[building][3][2];
                                break;
                            case "Research":
                                planetResearch += logic.buildings[building][3][2];
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

        for (var planetConstruction in planet.constructions) {
            for (var building in logic.buildings) {
                if (logic.buildings[building][0] === planet.constructions[planetConstruction]) {
                    if (logic.buildings[building][3][1] === '*') {
                        switch (logic.buildings[building][3][0]) {
                            case "Agriculture":
                                planetAgriculture += logic.buildings[building][3][2];
                                break;
                            case "Construction":
                                planetProduction += logic.buildings[building][3][2];
                                break;
                            case "Research":
                                planetResearch += logic.buildings[building][3][2];
                                break;
                        }
                    }
                }
            }
        }

        return [planetAgriculture, planetProduction, planetResearch];
    }

    function showPlanetDialog(planet, openTabItem) {

        if (env.ownedPlanets.indexOf(planet.id) !== -1) {
            name = planet.name;
        } else {
            name = planet.displayName;
        }

        var infoScreen = '<div id="planetInfo" name="' + name + '" style="border-radius: 5px; background-color: #3c3c3c; padding: 10px; color: #fff; font-family: sans-serif; font-weight: bold; width: 100%; display:inline-block; border: 1px solid #5a5a5a;">';
        infoScreen += '<div style="width:100%;">';
        infoScreen += '<h3>' + name + ' (' + planet.type + ')</h3>';
        infoScreen += '<br><h5>Description<h5>';
        infoScreen += '<p>' + name + ' is a ' + logic.terrains[planet.terrain][0] + ' ' + planet.type + '.</p>';

        infoScreen += '<br><h4>Overview</h4>';
        infoScreen += '<p>Location.. ' + Math.ceil(planet.x) + '/' + Math.ceil(planet.y) + '</p>';
        infoScreen += '<p>Terrain.. ' + logic.terrains[planet.terrain][0] + '</p>';
        infoScreen += '<p>Mineral richness.. ' + logic.mineralLevel[planet.mineralLevel][1] + '</p>';
        infoScreen += '<p>Ecological diversity.. ' + logic.ecologicalLevel[planet.ecologicalLevel][1] + '</p>';

        if (env.ownedPlanets.indexOf(planet.id) !== -1) {
            infoScreen += '<br><p>Current population.. ' + planet.population[0].toString().slice(0, 4) + ' of ' + planet.population[1] + '</p>';
        }

        infoScreen += '</div>';
        
        if (env.ownedPlanets.indexOf(planet.id) !== -1) {

            var percentOutput = getBaseOutput(planet);
            var fixedOutput = getFixedOutput(planet);
            var multiOutput = getMultiOutput(planet);
                      
            if (planet.workForce[3] !== 0) {
                turns = Math.ceil( (planet.production[2] - planet.production[1]) / ( (planet.workForce[3] * (percentOutput[1] + multiOutput[1])) + fixedOutput[1] ) );
            } else {
                turns = '-';
            }

            infoScreen += '<hr><div style="height: 20px;"><a href="#" class="tabregister" name="workForceModal">Workforce</a><a href="#" name="productionModal" class="tabregister">Production</a></div>';
            infoScreen += '<div class="planetstats"><p>Current project: <span id="currentProject">' + planet.production[0] + ', ' + planet.production[1] + ' of ' + planet.production[2] + ' units (' + turns + ' turns )</span></p>';
            infoScreen += '<p>Available workforce: <span id="availableWorkforce">' + planet.workForce[1] + '</span></p></div>';

            // Workforce modal
            infoScreen += '<div class="tabcontent" id="workForceModal">';
            infoScreen += '<div style="float: left;"><button id="agriculture" style="float: left; clear: both; width: 100px;">Agriculture</button>';
            infoScreen += '<button id="production" style="float: left; clear: both; width: 100px;">Production</button>';
            infoScreen += '<button id="research" style="float: left; clear: both; width: 100px; ">Research</button>';
            infoScreen += '<button id="reset" style="float: left; clear: both; width: 100px;">Reset workforce</button></div>';

            var baseMixOutput = [
                percentOutput[0]+multiOutput[0],
                percentOutput[1]+multiOutput[1],
                percentOutput[2]+multiOutput[2]            
            ];
            
            var displayAgriculture = baseMixOutput[0].toString().slice(0, baseMixOutput[0].toString().indexOf('.') + 3);
            var displayProduction = baseMixOutput[1].toString().slice(0, baseMixOutput[1].toString().indexOf('.') + 3);
            var displayResearch = baseMixOutput[2].toString().slice(0, baseMixOutput[2].toString().indexOf('.') + 2);
            infoScreen += '<div style="float:right; text-align:right;">';
            infoScreen += '<p>Base Agriculture.. ' + displayAgriculture + '</p>';
            infoScreen += '<p>Base Production.. ' + displayProduction + '</p>';
            infoScreen += '<p>Base research.. ' + displayResearch + '</p>';

            var agricultureValue = 0;
            var productionValue = 0;
            var researchValue = 0;

            displayAgriculture = 0;
            displayProduction = 0;
            displayResearch = 0;
            
            if (planet.workForce[2] > 0) {
                agricultureValue = planet.workForce[2] * (percentOutput[0] + multiOutput[0]);

                if (agricultureValue.toString().indexOf('.') !== -1) {
                    displayAgriculture = agricultureValue.toString().slice(0, agricultureValue.toString().indexOf('.') + 3);
                } else {
                    displayAgriculture = agricultureValue;
                }
            }

            if (planet.workForce[3] > 0) {
                productionValue = planet.workForce[3] * (percentOutput[1] + multiOutput[1]);

                if (productionValue.toString().indexOf('.') !== -1) {
                    displayProduction = productionValue.toString().slice(0, productionValue.toString().indexOf('.') + 3);
                } else {
                    displayProduction = productionValue;
                }
            }

            if (planet.workForce[4] > 0) {
                researchValue = planet.workForce[4]  * (percentOutput[2] + multiOutput[2]);

                if (researchValue.toString().indexOf('.') !== -1) {
                    displayResearch = researchValue.toString().slice(0, researchValue.toString().indexOf('.') + 3);
                } else {
                    displayResearch = researchValue;
                }
            }

            infoScreen += '<br>';
            infoScreen += '<p>Agriculture value.. ' + displayAgriculture + ' + '+ fixedOutput[0] +'</p>';
            infoScreen += '<p>Production value.. ' + displayProduction + ' + '+ fixedOutput[1] +'</p>';
            infoScreen += '<p>Research value.. ' + displayResearch + ' + '+ fixedOutput[2] +'</p>';
            infoScreen += '</div></div>';

            // Production modal
            infoScreen += '<div class="tabcontent" id="productionModal" style="display: none;">';
            infoScreen += '<div style="float: left; width: 200px;">';
            infoScreen += '<ul style="width:100%; height: 100%; padding: 0px; overflow:auto;">';
            infoScreen += '<li style="padding: 5px;">CONSTRUCTIONS</li>';
            if (planet.constructions.length !== 0) {

                for (buildingOption in env.availableBuildings) {
                    if (planet.constructions.indexOf(env.availableBuildings[buildingOption]) === -1) {
                        if (planet.production[0] === env.availableBuildings[buildingOption]) {
                            infoScreen += '<li><a href="#" style="color:#ffa300;" class="constructionItem" name="building">' + env.availableBuildings[buildingOption] + '</a></li>';
                        } else {
                            infoScreen += '<li><a href="#" class="constructionItem" name="building">' + env.availableBuildings[buildingOption] + '</a></li>';
                        }
                    }
                }
            } else {
                for (buildingOption in env.availableBuildings) {
                    infoScreen += '<li><a href="#" class="constructionItem" name="building">' + env.availableBuildings[buildingOption] + '</a></li>';
                }
            }

            // TODO: Add a check for a shipyards, distinguish by design size and option to build or not
            infoScreen += '<li style="border-top: 1px dashed #666; padding: 5px;">SHIP DESIGNS</li>';
            for (design in env.designs) {
                if (planet.production[0] === env.designs[design].name) {
                    infoScreen += '<li><a href="#" style="color:#ffa300;" class="constructionItem" name="design">' + env.designs[design].name + '</a></li>';
                } else {
                    infoScreen += '<li><a href="#" class="constructionItem" name="design">' + env.designs[design].name + '</a></li>';
                }
            }

            infoScreen += '</ul></div>';

            infoScreen += '<div style="float: right;"><h5>Production Queue</h5><ul id="productionQueue" style="width:130px; overflow:auto; height: 85px">';
            for (item in planet.productionQueue) {
                infoScreen += '<li>' + planet.productionQueue[item][1] + '</li>';
            }
            infoScreen += '</ul></div>';

            infoScreen += '</div>';

        }

        infoScreen += '</div>';
        modal.innerHTML = infoScreen;

        // Set the event handlers for the tabregisters
        if (env.ownedPlanets.indexOf(planet.id) !== -1) {
            var tabRegisters = document.getElementsByClassName('tabregister');

            for (var x = 0; x < tabRegisters.length; x++) {
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

                tabRegisters[x].addEventListener('click', function(evt) {
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
            if (env.ownedPlanets.indexOf(planet.id) !== -1) {

                var reset = document.getElementById('reset').addEventListener('click', function() {
                    planet.workForce = [planet.workForce[0], planet.workForce[0], 0, 0, 0];
                    showPlanetDialog(planet, 0);
                });

                var agriculture = document.getElementById('agriculture').addEventListener('click', function(evt) {
                    if (planet.workForce[1] !== 0 && !env.strg) {
                        planet.workForce[1] -= 1;
                        planet.workForce[2] += 1;
                    } else if (planet.workForce[2] !== 0 && env.strg) {
                        planet.workForce[1] += 1;
                        planet.workForce[2] -= 1;
                    }
                    showPlanetDialog(planet, 0);
                });

                var production = document.getElementById('production').addEventListener('click', function() {
                    if (planet.workForce[1] !== 0 && !env.strg) {
                        planet.workForce[1] -= 1;
                        planet.workForce[3] += 1;
                    } else if (planet.workForce[3] !== 0 && env.strg) {
                        planet.workForce[1] += 1;
                        planet.workForce[3] -= 1;
                    }
                    showPlanetDialog(planet, 0);
                });

                var research = document.getElementById('research').addEventListener('click', function() {
                    if (planet.workForce[1] !== 0 && !env.strg) {
                        planet.workForce[1] -= 1;
                        planet.workForce[4] += 1;
                    } else if (planet.workForce[4] !== 0 && env.strg) {
                        planet.workForce[1] += 1;
                        planet.workForce[4] -= 1;
                    }

                    showPlanetDialog(planet, 0);
                });


                var buildingOptions = document.getElementsByClassName('constructionItem');

                for (var item = 0; item < buildingOptions.length; item++) {

                    buildingOptions[item].addEventListener('click', function(evt) {
                        evt.preventDefault();

                        // Planet contruction handling
                        if (evt.target.name === 'building') {
                            for (option in env.buildings) {
                                if (env.buildings[option][0] === evt.target.innerHTML) {

                                    if (!env.strg) {
                                        if (planet.prevProduction[0]) {
                                            for (var queueItem = 0; queueItem < planet.productionQueue.length; queueItem++) {
                                                if (planet.productionQueue[queueItem][1] === env.buildings[option][0]) {
                                                    planet.productionQueue.splice(queueItem, 1);
                                                    break;
                                                }
                                            }

                                            if (evt.target.innerHTML === planet.prevProduction[0]) {
                                                var tmpProduction = planet.production;
                                                planet.production = planet.prevProduction;
                                                planet.prevProduction = tmpProduction;
                                            } else {
                                                planet.production = [env.buildings[option][0], 0, env.buildings[option][1], 'building'];
                                            }
                                        } else {
                                            for (var queueItem = 0; queueItem < planet.productionQueue.length; queueItem++) {
                                                if (planet.productionQueue[queueItem][1] === env.buildings[option][0]) {
                                                    planet.productionQueue.splice(queueItem, 1);
                                                    break;
                                                }
                                            }

                                            if (planet.production[0] === env.buildings[option][0]) {
                                                return;
                                            }

                                            planet.prevProduction = planet.production;
                                            planet.production = [env.buildings[option][0], 0, env.buildings[option][1], 'building'];
                                        }

                                        showPlanetDialog(planet, 1);

                                    } else {
                                        for (var queueItem in planet.productionQueue) {
                                            if (planet.productionQueue[queueItem][1] === env.buildings[option][0]) {
                                                return;
                                            }
                                        }

                                        if (planet.prevProduction[0] === env.buildings[option][0]) {
                                            planet.prevProduction = [false, 0, 0];
                                        }

                                        if (!planet.production[0]) {
                                            planet.prevProduction = planet.production;
                                            planet.production = [env.buildings[option][0], 0, env.buildings[option][1], 'building'];
                                            showPlanetDialog(planet, 1);
                                        } else {
                                            if (planet.production[0] === env.buildings[option][0]) {
                                                return;
                                            }

                                            planet.productionQueue.push(['building', env.buildings[option][0]]);
                                            document.getElementById('productionQueue').innerHTML += '<li class="queueItem">' + env.buildings[option][0] + '</li>';

                                            queueItems = document.getElementById('productionQueue').getElementsByTagName('LI');
                                            for (var x = 0; x < queueItems.length; x++) {
                                                queueItems[x].addEventListener('click', removeQueueItem);
                                            }

                                        }
                                    }

                                    break;
                                }
                            }
                        } else if (evt.target.name === 'design') {
                            for (option in env.designs) {
                                if (env.designs[option].name === evt.target.innerHTML) {

                                    if (!env.strg) {
                                        if (planet.prevProduction[0]) {
                                            if (evt.target.innerHTML === planet.prevProduction[0]) {
                                                var tmpProduction = planet.production;
                                                planet.production = planet.prevProduction;
                                                planet.prevProduction = tmpProduction;
                                            } else {
                                                planet.production = [env.designs[option].name, 0, env.designs[option].cost, 'design'];
                                            }
                                        } else {
                                            if (planet.production[0] === env.designs[option].name) {
                                                return;
                                            }

                                            planet.prevProduction = planet.production;
                                            planet.production = [env.designs[option].name, 0, env.designs[option].cost, 'design'];
                                        }

                                        showPlanetDialog(planet, 1);

                                    } else {

                                        if (planet.prevProduction[0] === env.designs[option].name) {
                                            planet.prevProduction = [false, 0, 0];
                                        }

                                        if (!planet.production[0]) {
                                            planet.prevProduction = planet.production;
                                            planet.production = [env.designs[option].name, 0, env.designs[option].cost, 'design'];
                                            showPlanetDialog(planet, 1);
                                        } else {

                                            planet.productionQueue.push(['design', env.designs[option].name]);
                                            document.getElementById('productionQueue').innerHTML += '<li class="queueItem">' + env.designs[option].name + '</li>';

                                            var queueItems = document.getElementById('productionQueue').getElementsByTagName('LI');
                                            for (var x = 0; x < queueItems.length; x++) {
                                                queueItems[x].addEventListener('click', removeQueueItem);
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

                        for (var position = 0; position < queueItemList.length; position++) {
                            if (evt.target === queueItemList[position]) {
                                planet.productionQueue.splice(position, 1);
                                evt.target.parentNode.removeChild(evt.target);
                                break;
                            }
                        }
                    }

                }
            }
        }

        modal.style.display = 'inline';
        gameArea.focus();
    }
    
    function showFleetDialog(planet, forceDisplay) {

        var options = '';
        var colonizeInfo = [0];
        if (planet.owner === -1) {
            if (env.ownedPlanets.indexOf(planet.id) === -1) {
                var stationedFleets = planet.stationedFleets;
                for (var fleet in stationedFleets) {
                    for (var ship in stationedFleets[fleet].ships) {
                        var effect = getModule(stationedFleets[fleet].ships[ship].design, 'Colonize');
                        if (effect[0]) {
                            if (colonizeInfo < effect[1]) {
                                colonizeInfo = [effect[1], fleet, ship];
                            }
                        }
                    }
                }

                if (colonizeInfo[0] !== 0) {
                    options += '<br><button id="btnColonize">Colonize</button><br>';
                }

            }
        }

        var shipListing = '';
        if (planet.owner === logic.currentPlayer || planet.owner === -1) {
            if (planet.stationedFleets.length > 1 || forceDisplay) {
                shipListing = '<div id="fleetInfo" style="width:50px; float:left; display: inline-block; padding: 4px; border-radius:5px; background-color:#5a5a5a">';
                shipListing += '<span id="joinFleets">Join</span>';
                shipListing += '<span id="nameFleet">Rename</span>';
                shipListing += '<span id="splitFleet">Split</span>';
                shipListing += '</div>';

                shipListing += '<ul id="shipListing" style="height: 120px; float: left; overflow:auto; display: inline-block; margin-bottom:5px; border-radius: 5px; background-color: #3c3c3c; padding: 10px; color: #fff; font-family: sans-serif; font-weight: bold; min-width: 275px;">';

                for (item in planet.stationedFleets) {
                    var fleetItem = planet.stationedFleets[item];
                    var targetLocation = '';
                    if (fleetItem.destination) {
                        if (env.unknownPlanets.indexOf(fleetItem.destination.id) !== -1 && env.ownedPlanets.indexOf(fleetItem.destination.id) === -1) {
                            targetLocation = ' - travelling to planet at ' + Math.ceil(fleetItem.destination.x) + '-' + Math.ceil(fleetItem.destination.y) + ' (' + Math.floor(fleetItem.turns) + ' turns)';
                        } else {
                            targetLocation = ' - travelling to ' + fleetItem.destination.name + ' (' + Math.floor(fleetItem.turns) + ' turns)';
                        }
                    }

                    shipListing += '<li><a href="#" name="' + fleetItem.name + '" class="">' + fleetItem.name + targetLocation + '</a></li>';

                }

                shipListing += '</ul>';
                shipListing += '<div id="fleetDetails" style="clear: both; width:538px; height: 110px; padding: 8px; border-radius:5px; border: 1px solid #8a8a8a; background-color:#5a5a5a;"></div>';

            }
        } else {
            if (forceDisplay) {
                shipListing = '<div id="fleetInfo" style="width:50px; float:left; display: inline-block; padding: 4px; border-radius:5px; background-color:#5a5a5a">';
                shipListing += '<span id="joinFleets">Join</span>';
                shipListing += '<span id="nameFleet">Rename</span>';
                shipListing += '<span id="splitFleet">Split</span>';
                shipListing += '</div>';

                shipListing += '<ul id="shipListing" style="height: 120px; float: left; overflow:auto; display: inline-block; margin-bottom:5px; border-radius: 5px; background-color: #3c3c3c; padding: 10px; color: #fff; font-family: sans-serif; font-weight: bold; min-width: 275px;">';

                for (item in planet.foreignFleets) {
                    var fleetItem = planet.foreignFleets[item];
                    var targetLocation = '';
                    if ( fleetItem.owner === logic.currentPlayer) {     // TODO: MAke a check for the fleetId
                        fleetItem = getFleetById(fleetItem);

                        if (fleetItem.destination) {
                            if (env.unknownPlanets.indexOf(fleetItem.destination.id) !== -1 && env.ownedPlanets.indexOf(fleetItem.destination.id) === -1) {
                                targetLocation = ' - travelling to planet at ' + Math.ceil(fleetItem.destination.x) + '-' + Math.ceil(fleetItem.destination.y) + ' (' + Math.floor(fleetItem.turns) + ' turns)';
                            } else {
                                targetLocation = ' - travelling to ' + fleetItem.destination.name + ' (' + Math.floor(fleetItem.turns) + ' turns)';
                            }
                        }
                        shipListing += '<li><a href="#" name="' + fleetItem.name + '" class="">' + fleetItem.name + targetLocation + '</a></li>';
                    }

                }

                shipListing += '</ul>';
                shipListing += '<div id="fleetDetails" style="clear: both; width:538px; height: 110px; padding: 8px; border-radius:5px; border: 1px solid #8a8a8a; background-color:#5a5a5a;"></div>';

            }
        }

        if (options !== '' || shipListing !== '') {
            modal.innerHTML = shipListing + options;
            modal.style.display = 'inline';
            gameArea.focus();
            activeItem = false;


            function clearFleetSelections() {
                var activeSelections = document.getElementsByClassName('selectedFleet');

                if (activeSelections.length !== 0) {
                    for (var x = 0; x < activeSelections.length; x++) {
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
                if (!env.strg) {
                    for (item in logic.fleets) {
                        if (logic.fleets[item].owner === logic.currentPlayer) {
                            if (evt.target.name === logic.fleets[item].name) {
                                createSelection(logic.fleets[item]);
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

                    if (planet.owner === logic.currentPlayer) {
                        for (item in planet.stationedFleets) {
                            if (evt.target.id === planet.stationedFleets[item].id) {
                                targetFleet = planet.stationedFleets[item];
                                createSelection(planet.stationedFleets[item]);
                                break;
                            }
                        }
                    } else {
                        for (item in planet.stationedFleets) {
                            if (evt.target.id === planet.stationedFleets[item].id) {
                                targetFleet = planet.stationedFleets[item];
                                createSelection(planet.stationedFleets[item]);
                                break;
                            }
                        }
                        if (!targetFleet) {
                            for (item in planet.foreignFleets) {
                                if (evt.target.id === planet.foreignFleets[item].id) { // && parseInt(evt.target.id.split('_')[0]) === logic.currentPlayer --- Add a player check using fleetId
                                    targetFleet = getFleetById(evt.target); //env.fleets[ planet.foreignFleets[item].index ];
                                    createSelection(planet.foreignFleets[item]);
                                    break;
                                }
                            }
                        }
                    }

                    if (!targetFleet) {
                        return;
                    }

                    detailScreen = document.getElementById('fleetDetails');
                    details = '';
                    details += '<div style="float: left; width: 50%"><h5>Ship Classes - <input value="' + evt.target.name + '" id="nameFleet" class="dynamicInput"/></h5>';

                    details += '<ul id="fleetListing" style="width:100%; height: 90px; overflow:auto;"></ul></div>';
                    details += '<div id="splitFleetModal" style="display: none; float: left; padding-left: 10px;"><input value="New fleet name" id="partedFleetName" autocomplete="off" style="width: 100%; border: 1px solid #5a5a5a; font-size: 10px; padding: 2px;"/><ul id="partedFleet" style="height: 70px; overflow: auto; width: 245px"><br><span>Drop ships here</span></ul><button id="partFleet" style="float: right;">Split</button></div>';
                    detailScreen.innerHTML = details;
                    delete detailScreen;

                    if (activeItem) {
                        if (activeItem.id === 'splitFleet') {
                            document.getElementById('splitFleetModal').style.display = 'block';
                        }
                    }


                    // Prepare ship types and designs in fleet
                    for (ship in targetFleet.ships) {
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
                        for (ship in shipTypes) {
                            info = shipTypes[ship].split('_', 3);
                            listing.innerHTML += '<li><a class="fleetShips" href="#" name="' + shipTypes[ship] + '">' + shipCount[ship] + 'x ' + info[0] + ' (' + info[1] + ')</a></li>';
                        }

                        delete listing;

                        var fleetSelections = document.getElementsByClassName('fleetShips');

                        // Bind handles to the current displayed ships
                        for (var x = 0; x < fleetSelections.length; x++) {
                            fleetSelections[x].addEventListener('click', function(evt) {
                                evt.preventDefault();
                            });

                            fleetSelections[x].addEventListener('dragstart', function(evt) {
                                dropSrc = evt;
                            });

                            fleetSelections[x].addEventListener('dragend', function(evt) {
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
                            for (ship in partedFleetTypes) {
                                info = partedFleetTypes[ship].split('_', 3);
                                listing.innerHTML += '<li><a class="partedShips" href="#" name="' + partedFleetTypes[ship] + '">' + partedFleetCount[ship] + 'x ' + info[0] + ' (' + info[1] + ')</a></li>';
                            }

                            if (partedFleetTypes.length === 0) {
                                listing.innerHTML = '<br><span>Drop ships here</span>';
                            }

                            delete listing;

                            var partedShips = document.getElementsByClassName('partedShips');

                            // Bind handles to the current displayed ships
                            for (var x = 0; x < partedShips.length; x++) {
                                partedShips[x].addEventListener('click', function(evt) {
                                    evt.preventDefault();
                                });

                                partedShips[x].addEventListener('dragstart', function(evt) {
                                    dropSrc = evt;

                                });

                                partedShips[x].addEventListener('dragend', function(evt) {
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
                    document.getElementById('fleetListing').addEventListener('dragover', function(evt) {
                        if (dropSrc) {
                            dropTarget = evt;
                        }
                    });


                    document.getElementById('partedFleet').addEventListener('dragover', function(evt) {
                        if (dropSrc) {
                            dropTarget = evt;
                        }
                    });

                    document.getElementById('partFleet').addEventListener('click', function(evt) {
                        evt.preventDefault();

                        if (targetFleet.ships.length === 1) {
                            showFleetDialog(planet, true);
                            return;
                        }

                        var newFleetList = [];
                        var removeIndexes = [];

                        // TODO: Create a new fleet from and check with logic.fleets instead of targetFleet

                        var fleetShips = targetFleet.ships.length;

                        for (item in partedFleetTypes) {
                            var details = partedFleetTypes[item].split('_', 2);
                            for (ship in targetFleet.ships) {
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

                        createFleet(logic.currentPlayer, planet, newFleetList, fleetName);

                        for (var x = 0; x < removeIndexes.length; x++) {
                            targetFleet.ships.splice(removeIndexes[x] - x, 1);
                        }

                        showFleetDialog(planet, true);

                    });

                    showFleetInfo();
                }


                document.getElementById('joinFleets').addEventListener('click', function(evt) {
                    if (activeItem) {
                        activeItem.className = '';
                    }
                    activeItem = false;


                    var fleetSelection = document.getElementsByClassName('selectedFleet');
                    var joinedFleet = false;

                    for (var x = 0; x < fleetSelection.length; x++) {
                        for (fleetItem in planet.stationedFleets) {
                            if (!joinedFleet) {
                                if (planet.stationedFleets[fleetItem].name === fleetSelection[x].name) {
                                    joinedFleet = planet.stationedFleets[fleetItem];
                                }
                            } else if (joinedFleet) {
                                if (planet.stationedFleets[fleetItem].name === fleetSelection[x].name) {
                                    for (ship in planet.stationedFleets[fleetItem].ships) {
                                        joinedFleet.ships.push(planet.stationedFleets[fleetItem].ships[ship]);
                                    }

                                    for (route in env.activeRoutes) {
                                        if (env.activeRoutes[route][0] === planet.stationedFleets[fleetItem]) {
                                            env.activeRoutes.splice(route, 1);
                                            break;
                                        }
                                    }

                                    env.fleets.splice(env.fleets.indexOf(planet.stationedFleets[fleetItem]), 1);
                                    planet.stationedFleets.splice(fleetItem, 1);
                                }
                            }
                        }
                    }

                    if (joinedFleet) {
                        planet.stationedFleets[0].hideDrawing = false;
                        showFleetDialog(planet, true);
                    }

                });

                document.getElementById('nameFleet').addEventListener('click', function(evt) {
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
                    input.value = fleetSelection[0].name;

                    modal.appendChild(input);

                    fleetName = input.addEventListener('keyup', function(evt) {
                        evt.preventDefault();

                        if (evt.keyCode === 13) {
                            for (fleetItem in planet.stationedFleets) {
                                if (fleetSelection[0].name === planet.stationedFleets[fleetItem].name) {
                                    planet.stationedFleets[fleetItem].name = evt.target.value;
                                    break;
                                }
                            }
                            showFleetDialog(planet, true);
                        }

                    });
                    gameArea.focus();
                });

                document.getElementById('splitFleet').addEventListener('click', function(evt) {
                    evt.preventDefault();
                    if (activeItem) {
                        activeItem.className = '';
                    }

                    if (activeItem !== evt.target) {
                        activeItem = evt.target;
                        activeItem.className = 'active';

                        if (document.getElementById('splitFleetModal')) {
                            document.getElementById('splitFleetModal').style.display = 'block';
                        }

                    } else {
                        activeItem = false;
                        document.getElementById('splitFleetModal').style.display = 'none';
                    }

                    clearFleetSelections();

                });


                document.getElementById('shipListing').addEventListener('mouseover', function(evt) {

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

            if (colonizeInfo[0]) {

                lg(env);

                document.getElementById('btnColonize').addEventListener('click', function() {
                    this.parentNode.removeChild(this);

                    env = logic.environments[logic.currentPlayer];
                    env.ownedPlanets.push(planet.id);
                    planet.population[0] = colonizeInfo[0];
                    planet.workForce = [colonizeInfo[0], colonizeInfo[0], 0, 0, 0];

                    // TODO: If greater then 1, place workforce in agriculture until food lvl is high enough
                    // then place into production, no research
                    /*
                     if (colonizeInfo[0] > 1) {
                     planet.workForce[0] = 1;
                     } else {
                     planet.workForce[0] = 1;
                     }
                     */

                    if (planet.stationedFleets[colonizeInfo[1]].ships.length === 1) {
                        // Remove fleet

                        var isVisible = planet.stationedFleets[colonizeInfo[1]].hideDrawing;

                        // Remove fleet from other player screens
                        var targetFleet = planet.stationedFleets[colonizeInfo[1]];
                        removeFleetFromPlayerViews(targetFleet);

                        env.fleets.splice(env.fleets.indexOf(planet.stationedFleets[colonizeInfo[1]]), 1);
                        planet.stationedFleets.splice(colonizeInfo[1], 1);
                        env.activeSelection = false;

                        if (!isVisible && planet.stationedFleets.length !== 0) {
                            planet.stationedFleets[0].hideDrawing = false;
                        }

                    } else {
                        // Remove single ship from fleet
                        planet.stationedFleets[colonizeInfo[1]].ships.splice(colonizeInfo[2], 1);
                    }

                    modal.innerHTML = '<h2>Colony name</h2><input id="planetName" autocomplete="off" maxlength=25 width=25/>';
                    modal.style.display = 'inline';

                    var nameField = document.getElementById('planetName');
                    nameField.focus();
                    nameField.addEventListener('keyup', function(evt) {
                        if (evt.keyCode === 13) {
                            planet.name = nameField.value;
                            planet.owner = logic.currentPlayer;
                            modal.style.display = 'none';
                            discoverPlanets(planet.x, planet.y, 400, planet);

                            logic.scanAreas[logic.currentPlayer].push([150, planet.x, planet.y]);
                            env.scanAreas.push([150, planet.x, planet.y]);

                            createSelection(planet);
                            scrollToLocation(planet, showPlanetDialog);
                            gameArea.focus();
                        }
                    });

                });

            }
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
                    env.offsetX = -(logic.planets[logic.knownPlanets1[0]].x - gameArea.width / 2);
                    env.offsetY = -(logic.planets[logic.knownPlanets1[0]].y - gameArea.height / 2);
                    break;
                case 17:
                    if (env.strg) {
                        env.strg = false;
                    }
                    break;
                case 9:
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
        if (env.movement) {
            env.offsetX = evt.pageX - env.movement[0];
            env.offsetY = evt.pageY - env.movement[1];
        }
    }


    function drawSelection() {
        env = logic.environments[logic.currentPlayer];

        gameScreen.beginPath();
        gameScreen.strokeStyle = "rgba(240,240,240, 0.6)";
        gameScreen.arc(env.activeSelection.x + env.offsetX, env.activeSelection.y + env.offsetY, env.selectionSize + 5 + env.selectionIteration, 0, 10);
        gameScreen.stroke();
        gameScreen.closePath();

        env.selectionIteration += env.stepping;
        if (env.selectionIteration >= 7) {
            env.stepping = -env.baseStepping;
        } else if (env.selectionIteration <= 0) {
            env.stepping = +env.baseStepping;
        }
    }

    function drawRoutes() {
        env = logic.environments[logic.currentPlayer];

        gameScreen.fillStyle = '#232323';

        for (route in env.activeRoutes) {
            if (env.activeSelection) {
                if (env.activeRoutes[route][0] === env.activeSelection) {
                    gameScreen.strokeStyle = "rgba(180,90,20, 1)";
                    gameScreen.lineWidth = 2;
                } else {
                    gameScreen.strokeStyle = "rgba(255,255,255, 0.25)";
                    gameScreen.lineWidth = 1;
                }
            }
            gameScreen.beginPath();
            gameScreen.moveTo(env.activeRoutes[route][0].origin.x + env.offsetX, env.activeRoutes[route][0].origin.y + env.offsetY);
            gameScreen.lineTo(env.activeRoutes[route][1].x + env.offsetX, env.activeRoutes[route][1].y + env.offsetY);
            gameScreen.stroke();
            gameScreen.closePath();

            gameScreen.beginPath();
            gameScreen.arc(env.activeRoutes[route][0].origin.x + env.offsetX, env.activeRoutes[route][0].origin.y + env.offsetY, 3, 0, 10);
            gameScreen.arc(env.activeRoutes[route][1].x + env.offsetX, env.activeRoutes[route][1].y + env.offsetY, 3, 0, 10);
            gameScreen.fill();
            gameScreen.closePath();
        }

        gameScreen.lineWidth = 1;

    }

    function drawFleets() {

        gameScreen.beginPath();
        var env = logic.environments[logic.currentPlayer];
        for (item in env.fleets) {
            var fleet = env.fleets[item];

            // TODO: Position player fleets in different formation
            if (!fleet.hideDrawing) {
                gameScreen.strokeStyle = "rgba(255,255,120, 0.75)";
                gameScreen.moveTo(fleet.x - 5 + env.offsetX, fleet.y - 3 + env.offsetY);
                gameScreen.lineTo(fleet.x + 5 + env.offsetX, fleet.y + env.offsetY);
                gameScreen.lineTo(fleet.x - 5 + env.offsetX, fleet.y + 3 + env.offsetY);
            }
        }
        gameScreen.stroke();
        gameScreen.closePath();

        gameScreen.beginPath();

        for (item in env.foreignFleets) {
            var fleet = env.foreignFleets[item];
            if (!fleet.hideDrawing) {
                gameScreen.strokeStyle = "rgba(255,0,0, 0.75)";
                gameScreen.moveTo(fleet.x - 5 + env.offsetX, fleet.y - 3 + env.offsetY);
                gameScreen.lineTo(fleet.x + 5 + env.offsetX, fleet.y + env.offsetY);
                gameScreen.lineTo(fleet.x - 5 + env.offsetX, fleet.y + 3 + env.offsetY);
            }
        }
        gameScreen.stroke();
        gameScreen.closePath();
    }

    function isInRange(destination, fleetRange) {
        // TODO: Disable return once fleets can be ranged up
        return true;

        for (item in logic.ownedPlanets) {
            var distanceX = Math.abs(logic.ownedPlanets[item].x - destination.x);
            var distanceY = Math.abs(logic.ownedPlanets[item].y - destination.y);
            var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

            if (distance <= fleetRange) {
                return true;
            }
        }

        return false;
    }

    function setDestination(fleet, destination) {
        env = logic.environments[logic.currentPlayer];

        if (fleet.location !== 'planet') {
            return false;
        }

        if (fleet.destination) {
            for (route in env.activeRoutes) {
                if (env.activeRoutes[route][0] === fleet) {
                    env.activeRoutes.splice(route, 1);
                    break;
                }
            }
        }

        fleet.speed = fleet.ships[0].speed;
        fleet.range = fleet.ships[0].range;

        for (item in fleet.ships) {
            if (fleet.ships[item].speed < fleet.speed) {
                fleet.speed = fleet.ships[item].speed;
            }

            if (fleet.ships[item].range < fleet.range) {
                fleet.range = fleet.ships[item].range;
            }
        }

        if (!isInRange(destination, fleet.range)) {
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

        env.activeRoutes.push([fleet, destination]);

        return true;

    }


    var scrollInterval = false;
    function scrollToLocation(object, callElement) {

        if (env.scrollActive) {
            clearInterval(scrollInterval);

        }

        env.scrollActive = true;

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

        var distanceX = env.offsetX - targetX;
        if (distanceX !== 0) {
            stepX = (distanceX / 15);
        }

        var distanceY = env.offsetY - targetY;
        if (distanceY !== 0) {
            stepY = (distanceY / 15);
        }

        targetX = Math.floor(Math.abs(targetX));
        targetY = Math.floor(Math.abs(targetY));

        createSelection(object);

        function doScroll() {
            if (Math.floor(Math.abs(env.offsetX)) === targetX && Math.floor(Math.abs(env.offsetY)) === targetY) {
                clearInterval(scrollInterval);

                if (callElement) {
                    callElement(object);
                }

                env.scrollActive = false;
                return;
            }

            env.offsetX -= stepX;
            env.offsetY -= stepY;
        }

        scrollInterval = setInterval(doScroll, 50);
    }


    function createSelection(object) {
        env.activeSelection = object;
        env.selectionIteration = 0;
        if (object.type === "fleet") {
            env.selectionSize = 5;
        } else {
            env.selectionSize = object.size;
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
            info = 'Planet ' + selection.name;
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
        for (var x = 0; x < infoLinks.length; x++) {
            infoLinks[x].addEventListener('click', openInfoItem);
        }
    }

    function createLink(type, linkName, linkMsg) {
        if (linkMsg) {
            return '<a href="#" class="infoLink" name="' + type + '_' + linkName + '">' + linkMsg + '</a>';
        } else {
            return '<a href="#" class="infoLink" name="' + type + '_' + linkName + '">' + linkName + '</a>';
        }
    }


    function openInfoItem(evt) {
        evt.preventDefault();
        var info = evt.target.name.split('_');
        modal.style.display = 'none';

        if (info[0] === 'planet') {
            index = Number.toInteger(info[1]);

            planet = false;
            for (obj in env.planets) {
                if (env.planets[obj].id === index) {
                    planet = env.planets[obj];
                    break;
                }
            }

            if (planet) {
                if (env.ownedPlanets.indexOf(index) !== -1) {
                    infoScreen = document.getElementById('planetInfo');
                    if (infoScreen) {
                        if (infoScreen.className === planet.name || infoScreen.className === planet.displayName) {
                            modal.style.display = 'none';
                            infoScreen.className = '';
                            return;
                        }
                    }

                    if (!env.strg) {
                        scrollToLocation(planet, showPlanetDialog);
                    } else {
                        scrollToLocation(planet);
                    }

                } else if (env.knownPlanets.indexOf(index) !== -1) {

                    if (!env.strg) {
                        scrollToLocation(planet, showPlanetDialog);
                    } else {
                        scrollToLocation(planet);
                    }

                } else if (env.unknownPlanets.indexOf(index) !== -1) {
                    scrollToLocation(planet);
                }
            }

        } else if (info[0] === 'fleet') {
            for (fleetItem in env.fleets) {
                if (env.fleets[fleetItem].name === info[1]) {
                    scrollToLocation(env.fleets[fleetItem]);
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

        for (item in logic.planets) {		// TODO: make use of only owned planets

            // Population growth
            if (logic.planets[item].population[0] !== 0 && logic.planets[item].population[0] < logic.planets[item].population[1]) {
                var previous = logic.planets[item].population[0];
                logic.planets[item].population[0] += (logic.planets[item].population[1] * 0.025) / logic.planets[item].population[0];

                if (logic.planets[item].population[0] > logic.planets[item].population[1]) {
                    logic.planets[item].population[0] = logic.planets[item].population[1];
                }

                if (Number.toInteger(previous) < Number.toInteger(logic.planets[item].population[0])) {
                    logic.planets[item].workForce[0] += 1;
                    logic.planets[item].workForce[1] += 1;

                    var link = createLink('planet', logic.planets[item].id, logic.planets[item].name);
                    report('Population of ' + link + ' grown to ' + Number.toInteger(logic.planets[item].population[0]));
                }
            }

            // Planet production
            //lg('out '+logic.planets[item].production[0]);
            if (logic.planets[item].production[0]) {
                
                var planet = logic.planets[item];
                
                var percentOutput = getBaseOutput(planet);
                var fixedOutput = getFixedOutput(planet);
                var multiOutput = getMultiOutput(planet);
                            
                planet.production[1] += (planet.workForce[3] * (percentOutput[1] + multiOutput[1])) + fixedOutput[1];

                if (planet.production[1] >= planet.production[2]) {

                    link = createLink('planet', item, logic.planets[item].name);
                    report('Planet ' + link + ' finished the production of ' + planet.production[0]);

                    if (planet.production[3] === 'building') {
                        planet.constructions.push(planet.production[0]);

                    } else if (planet.production[3] === 'design') {
                        // TODO: check if fleet is present, use autojoin or create new one
                        createShip(planet, planet.production[0], true);
                    }


                    if (planet.productionQueue.length !== 0) {
                        // TODO: Perform a check if an queued item still can be constructed
                        if (planet.productionQueue[0][0] === 'building') {
                            for (option in logic.buildings) {
                                if (planet.productionQueue[0][1] === logic.buildings[option][0]) {
                                    planet.production = [logic.buildings[option][0], 0, logic.buildings[option][1], 'building'];
                                    break;
                                }
                            }
                        } else if (planet.productionQueue[0][0] === 'design') {
                            for (design in env.designs) {
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
            // Planet research

        }


        // Fleet movement
        for (item in logic.fleets) {
            var targetFleet = logic.fleets[item];

            if (targetFleet.needsMove) {

                if (targetFleet.location === 'planet') {
                    if (targetFleet.origin.owner === logic.currentPlayer)  {
                        targetFleet.origin.stationedFleets.splice(targetFleet.origin.stationedFleets.indexOf(targetFleet), 1);

                        if (targetFleet.origin.stationedFleets.length !== 0) {
                            targetFleet.origin.stationedFleets[0].hideDrawing = false;
                        }

                    } else {
                        
                        var wasStationedFleet = false;
                        
                        if (targetFleet.origin.foreignFleets.length === 0) {
                            targetFleet.origin.stationedFleets.splice(targetFleet.origin.stationedFleets.indexOf(targetFleet), 1);
                            wasStationedFleet = true;
                            
                            if (targetFleet.origin.stationedFleets.length !== 0) {
                                targetFleet.origin.stationedFleets[0].hideDrawing = false;
                            }                            
                        }
                        
                        if (!wasStationedFleet) {
                            for (fleetItem in targetFleet.origin.foreignFleets) {
                                if (targetFleet.id === targetFleet.origin.foreignFleets[fleetItem].id ) { // use unqiue fleetId to
                                    targetFleet.origin.foreignFleets.splice(fleetItem, 1);
                                    break;
                                }
                            }    
                        }
                    }

                    targetFleet.hideDrawing = false;
                    targetFleet.location = 'space';
                }
                
                lg(targetFleet);


                targetFleet.x += targetFleet.stepX;
                targetFleet.y += targetFleet.stepY;
                targetFleet.turns--;

                logic.scanAreas[targetFleet.owner][targetFleet.scanArea][1] = targetFleet.x;
                logic.scanAreas[targetFleet.owner][targetFleet.scanArea][2] = targetFleet.y;
                logic.environments[targetFleet.owner].scanAreas[targetFleet.scanArea][1] = targetFleet.x;
                logic.environments[targetFleet.owner].scanAreas[targetFleet.scanArea][2] = targetFleet.y;

                if (targetFleet.turns <= 0) {
                    env = logic.environments[targetFleet.owner];

                    targetFleet.x = targetFleet.destination.x - (targetFleet.destination.size + 5);
                    targetFleet.y = targetFleet.destination.y - (targetFleet.destination.size + 5);

                    targetFleet.origin = targetFleet.destination;
                    targetFleet.destination = false;
                    targetFleet.needsMove = false;
                    targetFleet.turns = 0;
                    targetFleet.location = 'planet';

                    logic.scanAreas[targetFleet.owner][targetFleet.scanArea][1] = targetFleet.x;
                    logic.scanAreas[targetFleet.owner][targetFleet.scanArea][2] = targetFleet.y;
                    logic.environments[targetFleet.owner].scanAreas[targetFleet.scanArea][1] = targetFleet.x;
                    logic.environments[targetFleet.owner].scanAreas[targetFleet.scanArea][2] = targetFleet.y;


                    // TODO: Check planet for foreign fleets upon arrival and offering options for space combat..
                    lg(targetFleet);
                    if (targetFleet.origin.stationedFleets.length !== 0) {
                        if (targetFleet.owner === targetFleet.origin.stationedFleets[0].owner) {
                            targetFleet.hideDrawing = true;
                            targetFleet.origin.stationedFleets.push(targetFleet);
                        } else {
                            targetFleet.x += 20;
                            targetFleet.y -= 10;
                            var foreignFleet = new Object();
                            foreignFleet.x = targetFleet.x;
                            foreignFleet.y = targetFleet.y;
                            foreignFleet.id = targetFleet.id;
                            foreignFleet.owner = targetFleet.owner;
                            targetFleet.origin.foreignFleets.push(foreignFleet);
                        }
                    } else {
                        targetFleet.origin.stationedFleets.push(targetFleet);
                        targetFleet.hideDrawing = false;
                    }

                    // Remove route item
                    for (route in env.activeRoutes) {
                        if (env.activeRoutes[route][0] === targetFleet) {
                            env.activeRoutes.splice(route, 1);
                            break;
                        }
                    }

                    if (env.knownPlanets.indexOf(targetFleet.origin.id) === -1) {
                        env.knownPlanets.push(targetFleet.origin.id);
                        discoverPlanets(targetFleet.origin.x, targetFleet.origin.y, 150, targetFleet);
                    }


                    var link1 = createLink('fleet', targetFleet.name, 'Fleet ' + targetFleet.name);
                    var link2 = createLink('planet', targetFleet.origin.id, targetFleet.origin.name);
                    report(link1 + ' arrived at destination ' + link2);

                    env = previousEnv;
                }
                
                // Detection for fleet during movement in scanAreas
                updateScanAreas(targetFleet);
            }
        }

        gameArea.focus();

    }



    function removeFleetFromPlayerViews(targetFleet) {

        for (var player = 0; player < logic.players; player++) {

            if (player === targetFleet.owner) {
                continue;
            }

            for (area in logic.environments[player].scanAreas) {
                var scanArea = logic.environments[player].scanAreas[area];
                var scanX = scanArea[1];
                var scanY = scanArea[2];
                gameScreen.beginPath();
                gameScreen.arc(scanX, scanY, scanArea[0], 0, 10);
                gameScreen.closePath();

                if (gameScreen.isPointInPath(targetFleet.x, targetFleet.y)) {
                    for (fleetItem in logic.environments[player].foreignFleets) {
                        if (targetFleet.id === logic.environments[player].foreignFleets[fleetItem].id) {
                            logic.environments[player].foreignFleets.splice(fleetItem, 1);
                            break;
                        }
                    }
                }
            }
            
        }
    }


    function updateScanAreas(targetFleet)  {
        for (var player = 0; player < logic.players; player++) {
            if (player === targetFleet.owner) {
                continue;
            }

            var removeFromPlayer = true;
            var isFleetIncluded = false;

            for (area in  logic.environments[player].scanAreas) {
                var scanArea = logic.environments[player].scanAreas[area];
                var scanX = scanArea[1];
                var scanY = scanArea[2];

                gameScreen.beginPath();
                gameScreen.arc(scanX, scanY, scanArea[0], 0, 10);
                gameScreen.closePath();

                if (gameScreen.isPointInPath(targetFleet.x, targetFleet.y)) {

                    for (fleetItem in logic.environments[player].foreignFleets) {
                        if (targetFleet.id === logic.environments[player].foreignFleets[fleetItem].id) {
                            isFleetIncluded = true;
                            removeFromPlayer = false;
                            logic.environments[player].foreignFleets[fleetItem].x = targetFleet.x;
                            logic.environments[player].foreignFleets[fleetItem].y = targetFleet.y;
                            break;
                        }
                    }

                    if (isFleetIncluded) {
                        break;
                    }

                    var foreignFleet = new Object();
                    foreignFleet.x = targetFleet.x;
                    foreignFleet.y = targetFleet.y;
                    foreignFleet.id = targetFleet.id;
                    foreignFleet.owner = targetFleet.owner;
                    logic.environments[player].foreignFleets.push(foreignFleet);
                    removeFromPlayer = false;
                    break;
                }
            }

            // if removeFromPlayer, we can safely remove the ship from the foreignfleets list
            if (removeFromPlayer) {
                for (fleetItem in logic.environments[player].foreignFleets) {
                    if (targetFleet.id === logic.environments[player].foreignFleets[fleetItem].id) {
                        logic.environments[player].foreignFleets.splice(fleetItem, 1);
                        break;
                    }
                }
            }
        }
    }


    function discoverPlanets(x, y, scanRange, obj) {
        gameScreen.beginPath();
        gameScreen.arc(x, y, scanRange, 0, 10); // gameScreen.arc(x, y, scanRange/2, 0, 10);
        gameScreen.closePath();

        previousEnv = env;
        env = logic.environments[obj.owner];

        for (activeItem in logic.planets) {
            var planet = logic.planets[activeItem];

            if (gameScreen.isPointInPath(planet.x, planet.y)) {
                if (env.knownPlanets.indexOf(planet.id) === -1 && env.unknownPlanets.indexOf(planet.id) === -1) {
                    var distanceX = Math.abs(x - planet.x);
                    var distanceY = Math.abs(y - planet.y);
                    var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

                    env.planets.push(planet);
                    env.unknownPlanets.push(planet.id);

                    var link1 = '';
                    if (obj.type === 'fleet') {
                        link1 = createLink(obj.type, obj.name, obj.type + ' ' + obj.name);
                    } else {
                        link1 = createLink(obj.type, obj.id, obj.type + ' ' + obj.name);
                    }
                    var link2 = createLink('planet', planet.id, 'planet in ' + Math.ceil(distance) + ' units');
                    report(link1 + ' discovered a ' + link2 + ' away.');

                    // TODO: Logic creates foreign fleets objects, passing to player
                    if (planet.stationedFleets.length !== 0) {
                        for (stationedItem in planet.stationedFleets) {
                            fleet = planet.stationedFleets[stationedItem];
                            foreignFleet = new Object();
                            foreignFleet.x = fleet.x;
                            foreignFleet.y = fleet.y;
                            foreignFleet.id = fleet.id;
                            foreignFleet.owner = fleet.owner;
                            env.foreignFleets.push(foreignFleet);
                        }
                    }
                }
            }
        }

        env = previousEnv;

    }

    function createShip(planet, design, joinExisting) {
        previousEnv = env;
        env = logic.environments[planet.owner];

        var shipDesign = false;
        for (fleetDesign in env.designs) {
            if (design === env.designs[fleetDesign].name) {
                shipDesign = env.designs[fleetDesign];
                break;
            }
        }

        if (shipDesign) {
            ship = new Object();
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
                fleet.id = createFleetId(fleet, planet.owner);

                fleet.ships.push(ship);
                fleet.count++;

                if (planet.stationedFleets.length !== 0) {
                    fleet.hideDrawing = true;
                }

                planet.stationedFleets.push(fleet);

                env.fleets.push(fleet);
                logic.fleets.push(fleet);

                env.scanAreas.push([110, fleet.x, fleet.y]);
                logic.scanAreas[planet.owner].push([110, fleet.x, fleet.y]);
                fleet.scanArea = env.scanAreas.length - 1;

            } else {
                planet.stationedFleets[0].ships.push(ship);
                planet.stationedFleets[0].count++;
            }


        }

        env = previousEnv;

    }
    
    function createFleetId(fleet, owner) {
        var date = new Date();
        var fleetId = owner+"_"+date.getTime()+date.getMilliseconds();
        return fleetId;
    }


    function createFleet(player, planet, shipList, fleetName) {
        // TODO: Add a sync between logic and envs
        previousEnv = env;
        env = logic.environments[player];

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
        fleet.id = createFleetId(fleet, player);

        // TODO: Create fleets base names only on fleets owned by a user
        //			separating logic.fleets to logic.fleets player/owner

        if (fleetName) {
            fleet.name = fleetName + ' ' + env.fleets.length;
        } else {
            fleet.name = 'Joined fleet ' + env.fleets.length;
        }

        for (shipItem in shipList) {
            fleet.ships.push(shipList[shipItem]);
            fleet.count++;
        }

        if (planet.stationedFleets.length !== 0) {
            fleet.hideDrawing = true;
        }

        if (player === planet.owner || planet.owner === -1) {
            planet.stationedFleets.push(fleet);
        } else {
            var foreignFleet = new Object();
            foreignFleet.x = fleet.x + 20;
            foreignFleet.y = fleet.y - 10;
            foreignFleet.id = fleet.id;
            foreignFleet.owner = fleet.owner;
            planet.foreignFleets.push(foreignFleet);

            fleet.hideDrawing = true;
            fleet.x = foreignFleet.x;
            fleet.y = foreignFleet.y;
        }

        env.fleets.push(fleet);
        logic.fleets.push(fleet);

        env.scanAreas.push([110, fleet.x, fleet.y]);
        logic.scanAreas[player].push([110, fleet.x, fleet.y]);
        fleet.scanArea = env.scanAreas.length - 1;

        env = previousEnv;
    }

    function genGalaxie(count) {

        for (var step = 0; step < count; step++) {
            var x = Math.random() * (gameArea.width * 0.75) + 20;
            var y = Math.random() * (gameArea.height * 0.75) + 20;
            var size = Math.ceil((Math.random() * 8) + 7);

            var planet = new Object;
            planet.x = x;
            planet.y = y;
            planet.size = size;
            planet.type = "planet";
            planet.name = 'planet ' + Math.ceil(x) + ' | ' + Math.ceil(y);
            planet.displayName = planet.name;
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
                env = logic.environments[step];
                env.ownedPlanets = [step];
                env.knownPlanets = [step];
                env.unknownPlanets = [];
                env.planets.push(planet);

                env.offsetX = -(planet.x - gameArea.width / 2);
                env.offsetY = -(planet.y - gameArea.height / 2);

                planet.population = [4, size];
                planet.name = 'Home colony ' + step;
                planet.constructions = ['Factory Complex', 'Farm Complex'];
                planet.workForce = [4, 0, 1, 2, 1];
                planet.owner = step;

                logic.scanAreas.push([]);
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
            env = logic.environments[player];
            env.scanAreas.push([150, env.planets[0].x, env.planets[0].y]);

            logic.scanAreas[player].push([150, env.planets[0].x, env.planets[0].y]);

            discoverPlanets(env.planets[0].x, env.planets[0].y, 150, env.planets[0]);
        }

        env = logic.environments[0];

        var evt = new Object();
        evt.keyCode = 72;
        checkKeys(evt);

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


    function mainloop() {
        clearStage();

        gameScreen.fillStyle = 'rgba(255,255,255, 0.02)';

        // Check if there is any gain to delare this variable in global scope instead of main loop
        var scanArea = [];
        var scanX = 0;
        var scanY = 0;

        for (area in env.scanAreas) {
            gameScreen.beginPath();
            scanArea = env.scanAreas[area];
            scanX = scanArea[1] + env.offsetX;
            scanY = scanArea[2] + env.offsetY;
            gameScreen.arc(scanX, scanY, scanArea[0], 0, 10);
            gameScreen.closePath();
            gameScreen.fill();
        }

        if (env.activeSelection) {
            updateSelectionInfo(env.activeSelection);
            drawSelection();
        }

        drawPlanets();

        if (env.activeRoutes.length !== 0) {
            drawRoutes();
        }

        drawFleets();


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
        for (item in components) {
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
                        for (subitem in part) {
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

        for (item in components) {
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

        for (item in logic.shipEngines) {
            if (design.engines[0] === logic.shipEngines[item].name) {
                design.speed = design.engines[1] * logic.shipEngines[item].speed;
                design.cost += design.engines[1] * logic.shipEngines[item].cost;
                design.range = logic.shipEngines[item].range;
                break;
            }
        }

        for (subitem in design.weapons) {
            for (item in logic.shipWeapons) {
                if (design.weapons[subitem][0] === logic.shipWeapons[item].name) {
                    design.cost += design.weapons[subitem][1] * logic.shipWeapons[item].cost;
                    break;
                }
            }
        }

        for (item in logic.shipShields) {
            if (design.shields[0] === logic.shipShields[item].name) {
                design.cost += logic.shipShields[item].cost;
                break;
            }
        }

        for (subitem in design.modules) {
            for (item in logic.shipModules) {
                if (design.modules[subitem] === logic.shipModules[item].name) {
                    design.cost += logic.shipModules[item].cost;

                    for (effect in logic.shipModules[item].effects) {
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
        for (item in env.designs) {
            if (designName === env.designs[item].name) {
                //lg('design');
                for (module in env.designs[item].modules) {
                    //lg('Module');
                    lg(env.designs[item].modules[module]);

                    for (moduleItem in logic.shipModules) {
                        if (env.designs[item].modules[module] === logic.shipModules[moduleItem].name) {
                            lg(logic.shipModules[moduleItem].effects);
                            for (effect in logic.shipModules[moduleItem].effects) {
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

    var reports = document.getElementById('logwindow');
    var resizeRight = document.getElementById('resizeRight');
    var statusBar = document.getElementById('statusBar');
    var modal = document.getElementById('modal');

    var combatArea = document.getElementById('combatArea');
    var combatScreen = combatArea.getContext('2d');
    var combatOverlay = document.getElementById('combatOverlay');

    var turnDisplay = document.getElementById('turnDisplay');
    var fleetDisplay = document.getElementById('fleetDisplay');


    var previousWidth = 0;
    turnDisplay.addEventListener('click', function(evt) {
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

    fleetDisplay.addEventListener('click', function(evt) {
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
            for (design in env.designs) {
                if (env.designs[design].name === evt.target.name) {
                    targetDesign = env.designs[design];
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

                for (weapon in targetDesign.weapons) {
                    listing += '<br/>' + targetDesign.weapons[weapon][1] + ' x ' + targetDesign.weapons[weapon][0];
                }
                listing += '</li>';

            }

            if (targetDesign.modules !== '') {
                listing += '<br/>';
                listing += '<li><span>Modules</span>';

                for (module in targetDesign.modules) {
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

            target = env.fleets[ Number.toInteger(target.attributes.name.value) ];
            modal.style.display = 'none';
            modal.innerHTML = '';
            createSelection(target);
            scrollToLocation(target, false);
        }


        var fleetScreen = '';
        modal.style.display = 'none';
        modal.innerHTML = '';

        fleetScreen += '<div style="width:525px; background-color: #666; padding: 10px 10px; height: 223; border-radius: 5px 5px 0px 0px;">';
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

        env.designs.forEach(function(fleetDesign) {
            designListing.innerHTML += '<li><a href="#" class="fleetDesign" name="' + fleetDesign.name + '">' + fleetDesign.count + ' x ' + fleetDesign.name + ' (' + fleetDesign.type + ')</a></li>';
        });

        for (item in env.fleets) {
            if (env.fleets[item].location === 'planet') {
                locationImage = '<img src="planet.jpg" width="90px">';
            } else {
                locationImage = '<span style="height: 80px; width: 100%; background-color: #000;"></span>';
            }
            fleetListing.innerHTML += '<li style="float: left; height: 100px; width: 90px; padding: 5px; border: 1px solid #333; text-align:center;" class="fleet" name="' + item + '"><a href="#" style="margin:0px; padding:0px;"><div style="heigth:80px; width:90px; overflow:hidden;">' + locationImage + '</div><h5 style="color:#fff; font-weight:bold;">' + env.fleets[item].name + '</h5></a></li>';
        }



        var fleetDesigns = document.getElementsByClassName('fleetDesign');
        for (x = 0; x < fleetDesigns.length; x++) {
            fleetDesigns[x].addEventListener('click', displayDesignDetails);
        }

        var fleets = document.getElementsByClassName('fleet');
        for (x = 0; x < fleets.length; x++) {
            fleets[x].addEventListener('click', showLocation);
        }


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
    logic.workers = [];
    logic.marines = [];
    logic.techs = [];
    logic.research = [];
    logic.availableBuildings = [];
    logic.activeRoutes = [];
    logic.designs = [];

    logic.foreignFleets = [];
    logic.knownForeignDesigns = [];

    logic.turn = 0;
    logic.players = 2;
    logic.currentPlayer = 0;
    logic.actions = [];
    logic.scanAreas = [];


    //logic.spies = [];
    // Type, MineralLevel, EcoLevel
    logic.terrains = [
        ['Tundra', [1, 2], [0, 1]],
        ['Desert', [1, 2], [0, 1]],
        ['Aquatic', [1, 2], [3, 3]],
        ['Barren', [2, 3], [1, 2]],
        ['Jungle', [2, 3], [2, 3]]
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
        ['Factory Complex', 40, 'B', ['Construction', '*', 3]], //['Construction', '+', 3, false] ],
        ['Farm Complex', 20, 'B', ['Agriculture', '%', 1.15]], //['Agriculture', '%', 1.05] ],
        ['Research Center', 50, 'B', ['Research', '+', 4]],
        ['Marine Barracks', 35, 'B', ['PlanetCombat', 1, 4, 5]],
        ['Missile Base', 65, 'B', ['PlanetDefense', 1, 8, 8]]
    ];

    //logic.research = [
    //		[TreeName, [Requirements**], ResearchCost,
    //			[ Name, [Category, Type**, Options**, Effect] ],
    //		]

    logic.techtrees = [
        ['Force fields', [
                ['Advanced Magnetism', 250, [
                        ['Class I Shield', ['shipShields', 5, 3, 2, 10, 1]],
                        ['Ecm Jammer', ['shipModules', 'AntiMissile', 0.7]],
                        ['Mass Driver', ['shipWeapons', 'Beam', 10, 7, 50, 0, 1, 6, 6]]
                    ]],
                ['Garvitic Fields', 650, [
                        ['Anti-Grav Harness', ['PlanetCombat', 10]],
                        ['Inertial Stabilizer', ['shipWeapons', 'Beam', 10, 7, 50, 0, 1, 6, 6]],
                        ['Gyro Destabilizer', ['shipModules', 'AntiBeam', 50]]
                    ]]
            ]],
        ['Construction', [
                ['Construction Level 1', 250, [
                        ['Extended Factory Complex', ['building', 120, ['Construction', '+', 2, 'E', 'Factory Complex']]]
                    ]],
                ['Construction Level 2', 450, [
                        ['Space mining facility', ['building', 120, ['Construction', '+', 3, 'B']]]
                    ]]
            ]]
    ];



    // --------------------------------


    function prepareGameObjects() {

        // Create shipClass objects
        var size = logic.shipClasses.length;
        var obj = new Object();

        for (item in logic.shipClasses) {
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
        for (item in logic.shipModules) {
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
        for (item in logic.shipEngines) {
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
        for (item in logic.shipWeapons) {
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
        for (item in logic.shipShields) {
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

        for (player = 0; player < logic.players; player++) {
            var env = new Object();

            env.offsetX = 0;
            env.offsetY = 0;
            env.rotation = 0;
            env.activeSelection = false;
            env.movement = false;
            env.stepping = 0.25;
            env.baseStepping = 0.25;
            env.strg = false;
            env.gameIntervalRunning = true;
            env.activeRoutes = [];
            env.scrollActive = false;

            env.turn = 0;
            env.player = player;
            env.actions = [];

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


            env.workers.agriculture = 1;	// % efficiency
            env.workers.production = 1;	// % efficiency
            env.workers.research = 1;		// % efficiency

            env.marines.attack = 1;
            env.marines.defense = 1;
            env.marines.evasion = 1;

            env.research.project = false;
            env.research.progress = 0;
            env.research.required = 0;

            env.techs = [];

            env.availableBuildings = [
                'Farm Complex',
                'Factory Complex',
                'Research Center',
                'Marine Barracks'
            ];
            env.buildings = [];

            for (option in logic.buildings) {
                if (env.availableBuildings.indexOf(logic.buildings[option][0]) !== -1) {
                    env.buildings.push(logic.buildings[option]);
                }
            }


            // Player actions in turn(s) to verify with logic
            env.actions = [];

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

    var design = createBaseShipDesign(0, 'Wayfinder');
    addComponent(design, 'engine', 'Nuclear Drive', 4);
    addComponent(design, 'module', 'Fuel tanks');
    calculateDesign(design);
    env.designs.push(design);

    //removeComponent(design, 'shield', 0);

    design = createBaseShipDesign(0, 'Interceptor');
    addComponent(design, 'engine', 'Nuclear Drive', 2);
    addComponent(design, 'weapon', 'Laser beam', 1);
    addComponent(design, 'shield', 'Class I Shield');
    calculateDesign(design);
    env.designs.push(design);

    design = createBaseShipDesign(1, 'Silencer');
    addComponent(design, 'engine', 'Nuclear Drive', 3);
    addComponent(design, 'weapon', 'Laser beam', 2);
    addComponent(design, 'shield', 'Class I Shield');
    calculateDesign(design);
    env.designs.push(design);

    design = createBaseShipDesign(1, 'Colony Design');
    addComponent(design, 'engine', 'Nuclear Drive', 2);
    addComponent(design, 'module', 'Basic colonization module');
    calculateDesign(design);
    env.designs.push(design);
    /*
     design = createBaseShipDesign(2, 'Design 2');
     addComponent(design, 'engine', 'Nuclear Drive' , 2);
     addComponent(design, 'module', 'Basic colonization module');
     calculateDesign(design);

     env.designs.push(design);
     */

    // Test designs for space combat

    env = logic.environments[1];

    design = createBaseShipDesign(0, 'Wayfinder');
    addComponent(design, 'engine', 'Nuclear Drive', 4);
    addComponent(design, 'module', 'Fuel tanks');
    calculateDesign(design);
    env.designs.push(design);

    env = logic.environments[0];
    design = createBaseShipDesign(0, 'Counterfire');
    addComponent(design, 'engine', 'Nuclear Drive', 1);
    addComponent(design, 'weapon', 'Laser beam', 2);
    calculateDesign(design);
    env.designs.push(design);

    design = createBaseShipDesign(1, 'Retriever');
    addComponent(design, 'engine', 'Nuclear Drive', 1);
    addComponent(design, 'weapon', 'Nuclear Missile', 2);
    addComponent(design, 'shield', 'Class I Shield');
    calculateDesign(design);
    env.designs.push(design);

    env = logic.environments[1];
    design = createBaseShipDesign(1, 'Colony Design');
    addComponent(design, 'engine', 'Nuclear Drive', 2);
    addComponent(design, 'module', 'Basic colonization module');
    calculateDesign(design);
    env.designs.push(design);

    //lg(env.designs)


    function getDesign(designOwner, designName) {
        for (design in logic.environments[designOwner].designs) {
            if (designName === logic.environments[designOwner].designs[design].name) {
                return logic.environments[designOwner].designs[design];
            }
        }
    }

    function openCombat(planetIndex, attacker) {

        document.getElementById('overlayContainer').style.display = 'inline';
        //document.getElementById('combatOverlay').style.display = 'inline';

        var combat = new Object();

        combat.designNames = [];
        combat.weaponNames = [];
        combat.weaponIndexes = [];
        combat.shieldNames = [];
        combat.shieldIndexes = [];
        combat.shipTypes = [];
        combat.typeIndexes = [];

        combat.players = [];
        combat.ships = [];


        defender = logic.planets[planetIndex].owner;

        for (x = 0; x < 2; x++) {
            player = new Object();
            player.tactics = [];
            player.targets = [];		// fleet?
            player.ships = [];

            if (x === 0) {
                // Defender
                currentFleets = logic.planets[planetIndex].stationedFleets;
                currentPlayer = defender;
                xLoc = 20;
                yLoc = 150;
            } else if (x === 1) {
                // Attacker
                currentFleets = logic.planets[planetIndex].foreignFleets;
                currentPlayer = attacker;
                xLoc = 450;
                yLoc = 150;
            }

            for (fleet in currentFleets) {
                for (ship in currentFleets[fleet].ships) {
                    if (combat.designNames.indexOf(currentFleets[fleet].ships[ship].design) === -1) {

                        designInfo = getDesign(currentPlayer, currentFleets[fleet].ships[ship].design);

                        for (item in designInfo.weapons) {
                            for (subitem in logic.shipWeapons) {
                                if (designInfo.weapons[item][0] === logic.shipWeapons[subitem].name) {
                                    if (combat.weaponNames.indexOf(logic.shipWeapons[subitem].name) === -1) {
                                        combat.weaponNames.push(logic.shipWeapons[subitem].name);
                                        combat.weaponIndexes.push(subitem);
                                    }
                                }
                            }
                        }

                        for (item in designInfo.shields) {
                            for (subitem in logic.shipShields) {
                                if (designInfo.shields[item] === logic.shipShields[subitem].name) {
                                    if (combat.shieldNames.indexOf(logic.shipShields[subitem].name) === -1) {
                                        combat.shieldNames.push(logic.shipShields[subitem].name);
                                        combat.shieldIndexes.push(subitem);
                                    }
                                }
                            }
                        }

                        for (item in logic.shipClasses) {
                            if (designInfo.type === logic.shipClasses[item].type) {
                                if (combat.shipTypes.indexOf(logic.shipClasses[item].type) === -1) {
                                    combat.shipTypes.push(logic.shipClasses[item].type);
                                    combat.typeIndexes.push(item);
                                }
                            }
                        }

                        combat.designNames.push(currentFleets[fleet].ships[ship].design);
                    }

                    combatShip = new Object();
                    combatShip.design = currentFleets[fleet].ships[ship].design;
                    combatShip.fleet = currentFleets[fleet].name;
                    combatShip.fleetIndex = fleet;
                    combatShip.shipIndex = ship;

                    combatShip.canFire = true;
                    combatShip.target = false;
                    combatShip.owner = x;
                    combatShip.direction = x;
                    combatShip.weapons = [];

                    currentType = combat.shipTypes.indexOf(currentFleets[fleet].ships[ship].type);
                    combatShip.armor = logic.shipClasses[currentType].armor;
                    combatShip.structure = logic.shipClasses[currentType].structure;
                    combatShip.movement = logic.shipClasses[currentType].movement;
                    combatShip.size = logic.shipClasses[currentType].combatSize;

                    combatShip.speed = currentFleets[fleet].ships[ship].speed;

                    if (designInfo.weapons.length !== 0) {
                        for (item in designInfo.weapons) {

                            index = combat.weaponNames.indexOf(designInfo.weapons[item][0]);

                            weapon = new Object();
                            weapon.type = logic.shipWeapons[index].type;
                            weapon.range = logic.shipWeapons[index].range;
                            weapon.canFire = true;
                            weapon.currentShots = logic.shipWeapons[index].shots;
                            weapon.totalShots = weapon.currentShots;
                            weapon.fireRate = logic.shipWeapons[index].fireRate;
                            weapon.damageMin = logic.shipWeapons[index].damageMin;
                            weapon.damageMax = logic.shipWeapons[index].damageMax;
                            weapon.lastfired = 0;

                            combatShip.weapons.push(weapon);
                        }
                    } else {
                        combatShip.weapons = false;
                    }


                    if (designInfo.shields.length !== 0) {
                        index = combat.shieldNames.indexOf(designInfo.shields[0]);

                        shield = new Object();
                        shield.resistance = logic.shipShields[index].resistance;
                        shield.rechargeTime = logic.shipShields[index].rechargeTime;
                        shield.rechargeCount = shield.rechargeTime;
                        shield.currentStrength = logic.shipShields[index].strength;
                        shield.totalStrength = shield.currentStrength;
                        combatShip.shield = shield;
                    } else {
                        combatShip.shield = false;
                    }


                    combatShip.x = xLoc;
                    combatShip.y = yLoc;

                    player.ships.push(combatShip);
                    combat.ships.push(combatShip);

                    yLoc += 10;
                }
            }

            combat.players.push(player);

        }

        lg(combat);


        combat.offsetX = 0;
        combat.offsetY = 0;
        combat.calculating = false;
        function combatloop() {

            if (combat.calculating) {
                return;
            }
            combatArea.width = combatArea.width;

            combatScreen.strokeStyle = 'rgba(255,255,255, 0.25)';

            for (var item in combat.ships) {
                combat.calculating = true;
                var ship = combat.ships[item];

                var distanceX = ship.x - ship.target.x;
                var distanceY = ship.y - ship.target.y;

                var distance = Math.sqrt(Math.pow(Math.abs(distanceX), 2) + Math.pow(Math.abs(distanceY), 2));
                var unusedWeapons = ship.weapons.length;

                for (var weapon in ship.weapons) {

                    if (ship.weapons[weapon].canFire) {
                        if (distance <= ship.weapons[weapon].range) {


                            if (combat.ships.indexOf(ship.target) !== -1) {
                                var damage = Math.ceil((Math.random() * ship.weapons[weapon].damageMax));
                                if (damage < ship.weapons[weapon].damageMin) {
                                    damage = ship.weapons[weapon].damgageMin;
                                }

                                var offsetX = Math.random() * -3;
                                var offsetY = Math.random() * -3;

                                if (Math.round(Math.random()) === 1) {
                                    offsetX = Math.abs(offsetX);
                                }

                                if (Math.round(Math.random()) === 1) {
                                    offsetY = Math.abs(offsetY);
                                }

                                combatScreen.beginPath();
                                combatScreen.moveTo(ship.x, ship.y);
                                combatScreen.lineTo(ship.target.x, ship.target.y + offsetY);
                                combatScreen.stroke();
                                combatScreen.closePath();

                                combatScreen.beginPath();
                                combatScreen.arc(ship.target.x, ship.target.y, ship.target.size, 0, 10);
                                combatScreen.closePath();

                                if (combatScreen.isPointInPath(ship.target.x, ship.target.y)) {

                                    if (ship.target.armor > 0) {
                                        ship.target.armor -= damage;
                                    } else {
                                        ship.target.structure -= damage;
                                        if (ship.target.structure <= 0) {
                                            combat.ships.splice(combat.ships.indexOf(ship.target), 1);
                                            combat.players[ship.target.owner].ships.splice(combat.players[ship.target.owner].ships.indexOf(ship.target), 1);
                                            ship.target = false;
                                        }
                                    }
                                }

                                ship.weapons[weapon].canFire = false;
                                ship.weapons[weapon].lastFired = new Date().getTime();
                                unusedWeapons -= 1;
                            }

                        }
                    } else {
                        if (ship.weapons[weapon].fireRate <= (new Date().getTime() - ship.weapons[weapon].lastFired)) {
                            ship.weapons[weapon].canFire = true;
                            ship.canFire = true;
                        }
                    }

                }

                if (combat.ships.indexOf(ship.target) === -1) {
                    ship.target = getNewTarget(ship.owner);
                    if (!ship.target) {

                        if (!combat.stopLoop) {
                            combat.stopLoop = 10;
                        }
                        //combatOverlay.style.display === 'none';
                    }
                }

                if (unusedWeapons === 0) {
                    ship.canFire = false;
                }


                if (Math.abs(distanceX) >= 35 && ship.canFire) {
                    if (ship.target.x > ship.x) {
                        ship.x += (ship.speed * 0.08);
                    } else {
                        ship.x -= (ship.speed * 0.08);
                    }
                } else {
                    if (ship.direction === 0) {
                        ship.x -= (ship.speed * 0.08);
                    } else {
                        ship.x += (ship.speed * 0.08);
                    }
                }


                if (ship.canFire && ship.target) {
                    if (ship.target.y > ship.y) {
                        ship.y += (ship.speed * 0.08);
                    } else if (ship.target.y < ship.y) {
                        ship.y -= (ship.speed * 0.08);
                    }
                } else {
                    if (ship.direction === 0 && ship.y !== ship.target.y)
                        ship.y -= (ship.speed * 0.08);
                    else if (ship.y !== ship.target.y) {
                        ship.y += (ship.speed * 0.08);
                    }
                }

                drawShip(ship);
            }

            if (combat.stopLoop) {
                combat.stopLoop -= 1;

                if (combat.stopLoop <= 0) {
                    clearInterval(combatInterval);
                    combatOverlay.style.display = 'none';
                    document.getElementById('combatDisplay').style.display = 'none';
                    return;
                }
            }

            combat.calculating = false;

        }


        function drawShip(ship) {

            if (ship.owner === 0) {
                combatScreen.fillStyle = '#00309a';
            } else {
                combatScreen.fillStyle = '#9a3000';
            }
            combatScreen.beginPath();
            combatScreen.arc(ship.x, ship.y, ship.size, 0, 10);
            combatScreen.fill();
            combatScreen.closePath();
        }

        function getNewTarget(player) {
            if (player === 0) {
                if (combat.players[1].ships.length === 0) {
                    return false;
                }
                index = Math.round(Math.random() * (combat.players[1].ships.length - 1));
                return combat.players[1].ships[index];
            } else {
                if (combat.players[0].ships.length === 0) {
                    return false;
                }
                index = Math.round(Math.random() * (combat.players[0].ships.length - 1));
                return combat.players[0].ships[index];
                //return combat.players[0].ships[0];
            }
        }


        combatInterval = setInterval(combatloop, 20);
    }

    // ---------------------------------------------------------------------------------------
    combatArea = document.getElementById('combatArea');
    combatScreen = combatArea.getContext('2d');
    combatOverlay = document.getElementById('combatOverlay');



    // TESTCODE FOR COMBAT
    /*
     env = logic.environments[0];

     genGalaxie(1);
     createShip(env.planets[0], 'Interceptor', true);
     createShip(env.planets[0], 'Interceptor', true);
     createShip(env.planets[0], 'Interceptor', true);
     createShip(env.planets[0], 'Interceptor', true);
     createShip(env.planets[0], 'Interceptor', true);
     createShip(env.planets[0], 'Interceptor', true);
     createShip(env.planets[0], 'Interceptor', true);
     createShip(env.planets[0], 'Silencer', false);
     createShip(env.planets[0], 'Silencer', false);
     createShip(env.planets[0], 'Silencer', false);
     createShip(env.planets[0], 'Interceptor', true);

     env.planets[0].foreignFleets = env.planets[0].stationedFleets;
     env.planets[0].stationedFleets = [];

     env = logic.environments[1];
     createShip(logic.environments[0].planets[0], 'Counterfire', true);
     createShip(logic.environments[0].planets[0], 'Counterfire', true);
     createShip(logic.environments[0].planets[0], 'Counterfire', true);
     createShip(logic.environments[0].planets[0], 'Counterfire', true);
     createShip(logic.environments[0].planets[0], 'Counterfire', true);
     createShip(logic.environments[0].planets[0], 'Counterfire', true);
     createShip(logic.environments[0].planets[0], 'Retriever', false);
     createShip(logic.environments[0].planets[0], 'Retriever', false);
     createShip(logic.environments[0].planets[0], 'Retriever', false);

     planetId = 0;
     //openCombat(planetId, 0);
     */

    env = logic.environments[0];
    genGalaxie(40);
    bindHandlers();
    gameInterval = setInterval(mainloop, 100);






}

document.addEventListener('load', app());
