function checkMouseResize(evt) {
    if (evt.clientX <= 250 || evt.clientX >= (document.getElementById('gameScreen').clientWidth - 150)) {
        return;
    }
    document.getElementById('gameScreenArea').width = evt.clientX - document.getElementById('gameScreenArea').offsetLeft;
}

function scaleCombatScreen() {
    document.getElementById('combatArea').width = document.getElementById('combatDisplay').clientWidth * 0.96;
    document.getElementById('combatArea').height = document.getElementById('combatDisplay').clientHeight * 0.75;
    document.getElementById('combatReport').style.height = document.getElementById('combatDisplay').clientHeight * 0.18;
    //console.log(document.getElementById('combatDisplay').clientHeight);
}


// UI element handlers
document.getElementById('resizeRight').addEventListener('mousedown', function(evt) {
    window.addEventListener('mousemove', checkMouseResize);
});

window.addEventListener('mouseup', function() {
    window.removeEventListener('mousemove', checkMouseResize);
});


window.addEventListener('resize', function() {
    scaleCombatScreen();
});


window.addEventListener('load', function() {
    scaleCombatScreen();
});