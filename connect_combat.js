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

    for (var x = 0; x < 2; x++) {
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

        for (var fleet in currentFleets) {
            for (var ship in currentFleets[fleet].ships) {
                if (combat.designNames.indexOf(currentFleets[fleet].ships[ship].design) === -1) {

                    designInfo = getDesign(currentPlayer, currentFleets[fleet].ships[ship].design);

                    for (var item in designInfo.weapons) {
                        for (var subitem in logic.shipWeapons) {
                            if (designInfo.weapons[item][0] === logic.shipWeapons[subitem].name) {
                                if (combat.weaponNames.indexOf(logic.shipWeapons[subitem].name) === -1) {
                                    combat.weaponNames.push(logic.shipWeapons[subitem].name);
                                    combat.weaponIndexes.push(subitem);
                                }
                            }
                        }
                    }

                    for (var item in designInfo.shields) {
                        for (var subitem in logic.shipShields) {
                            if (designInfo.shields[item] === logic.shipShields[subitem].name) {
                                if (combat.shieldNames.indexOf(logic.shipShields[subitem].name) === -1) {
                                    combat.shieldNames.push(logic.shipShields[subitem].name);
                                    combat.shieldIndexes.push(subitem);
                                }
                            }
                        }
                    }

                    for (var item in logic.shipClasses) {
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
                    for (var item in designInfo.weapons) {

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