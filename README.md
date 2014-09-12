connect
=======

An approach for a space game based on HTML5 and javascript - linked to the feeling of Master of Orion 2.

Note: The game was mainly tested in Firefox, Chrome workability has just been added, IE 10 failed yet to load the project properly.

At present the game elements are pretty simple, main focus has been set on getting the logic and some ui interaction in place, in favor of working with graphic elements - which has changed to get away with the flat appeareance. Its pretty simple at its state, but can already be "played". Its not in any way a full game as the underlying structure has no agriculture implemented, but work on research is ongoing.
Production is working as is and also basic fleet management, renaming/splitting/joining and the options to switch players on demand in an - at the moment - totally random generated galaxie without any order.

But the general idea was to move slightly away from Moo2 and add other details alike manageable trade routes between planets or systems, galaxie generation in formations or other cool stuff. But thats far away as other basic features are missing at the moment and also the variant to play in multiplayer mode using a server and client solution which also would require to separate the present codebase between logic and player environments.

A very brief instruction about the controls:
- Pressing "T" advances the turn
- Pressing "Turn" in the main panel opens and closes the turn log which contains a history of discoveries, fleet arrivals, constructions and such
- Holding down the control/Strg key and the left mouse button in the game window while moving the mouse will move the galaxy
- Pressing control/Strg while clicking on fleet will open the fleet basic dialog - its by default hidden when there is only one fleet
- The current player can be switched using Shift + Tab key
- Pressing "Research" opens the research panel, for now this only has basic function and adding research results has to be implemented.
- The fleet overview can be opened by pressing "Fleets" - selecting a design name (bottom) will show its details
- The log window can be resized by pressing and moving on the very left, clicking "Turn" hides the logwindow
- Clicking on bold texts elements in the log will bring you to the place of action, and possibly showing further dialogs
- When a colony ship is brought to a uncolonized planet, a "colony" button appears on the top left of the galaxy view after the fleet is selected again
- Selecting a fleet and another planet will create a route where this fleet will travel towards, routes also can be selected, automatically selecting the first fleet using it, ships on routes/in space cant be moved before landing
- Selecting a colonized planet will show the planet dialog, workforce based on the population can be added or reset
- A queue for production items can be made by holding control/strg, clicking an item on the right will remove of the queue
- Selecting a fleet in the fleet overview with Strg/Control selects it, this allows to rename the fleet by pressing "rename", selecting multiple fleets and pressing join, joins all fleets into the first selected one. Selecting a fleet and pressing "split" will change the view to the split flit modal, allowing drag and drop of ships from the selected fleet into a new fleet
- The planet overview can be opened clicking on "Planets" in the main panel, clicking one on a planet scrolls the planet into the view, deselecting using Strg/Control mouse click will remove the planet lock of that entry, so while hovering other planets there information will be shown


