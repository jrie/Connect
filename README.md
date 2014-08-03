connect
=======

An approach for a space game based on HTML5 and javascript - linked to the feeling of Master of Orion 2.

At present the game elements are pretty simple, main focus has been set on getting the logic and some ui interaction in place, in favor of working with graphic elements. Its pretty simple at its state, but can already be "played" in a very simple fashion, meaning that a basic space combat simulation is done and the option to start with one or more players. Its not in any way a full game as the underlying structure has no research or agriculture implemented, but production is working as is and also basic fleet management and the options to switch players on demand in an - at the moment - totally random generated galaxie without any order.

But the general idea was to move slightly away from Moo2 and add other details alike manageable trade routes between planets or systems, galaxie generation in formations or other cool stuff. But thats far away as other basic features are missing at the moment and also the variant to play in multiplayer mode using a server and client solution which also would require to separate the present codebase between logic and player environments.

A very brief instruction about the controls:
	Pressing "T" makes a turn
	
	Holding down the control/"Strg" key and the left mouse button in the game window while moving the mouse will move the galaxie.
	
	Pressing control/Strg while clicking on fleet will open the fleet basic dialog - its by default hidden when there is only one fleet
	
	The fleet overview can be opened by pressing "Fleets" - selecting a design name will show its details
	
	The log window can be resized by pressing and moving on the very left, clicking "Turn" hides the logwindow
	
	Clicking on bold texts elements in the log will bring you to the place of action, and possibly showing further dialogs when pressed again
	
	When a colony ship is brought to a uncolonized planet, a "colony" button appears on the top left of the galaxie view
	
	Selecting a fleet and another planet will create a route where this fleet will move towards, routes also can be selected, automatically selecting the first fleet using it, ships on routes cant be moved
	
	Selecting a colonized planet will show the planet dialog, workforce based on the population can be added or reset
	
	A queue for an production item can be made by holding control/strg, selecting an item remove it accordingly of the queue
	
	
	
