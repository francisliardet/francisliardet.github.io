
//Direction constants
var NORTH = [-1, 0];
var EAST = [0, +1];
var SOUTH = [+1, 0];
var WEST = [0, -1];

var rows = 30;
var cols = 50;
var size = 20; //Size of grid squares in pixels

var steps = 30; //How many steps to simulate each go

//Chances of a square containing a strawberry/mushroom: 1.0 = 0% 0.10 = 90%
var strawberryChance = 0.90;
var mushroomChance = 0.95;
var mutateChance = 0.95; //Chance that a gene will mutate upon reproduction
var eliteChance = 0.90; //Chance that a creature will be picked from top 10% instead of ranked selection

var numMonsters; //Get number of monsters from html
var numCreatures; //Get number of creatues from html
var updateSpeed; //Speed in ms/tick
var timeSteps; //Number of ticks every simulation

var currentStep = 0;
var mainLoop;

var monsterDelay = 1; //Number of timestep delay between monster actions

var spaceArray = []; //Array to keep track of which squares are empty or not.
var sbArray = []; //Strawberry array
var mrArray = []; //Mushroom array

var creatureArray = []; //1-D Creature array
var monsterArray = []; //1-D Monster array
var creatureArray2D = []; //2-D Creature location array
var monsterArray2D = []; //2-D Monster location array

var hasPlayed = false; //To make sure you can't hit the "Start Moving" button more than once

var totalFitness; //Used with rank selection and finding the average fitness for a generation
var mushroomDeaths = 0;
var monsterDeaths = 0;
var starveDeaths = 0;

$("#mainGrid").width(cols * size);
$("#mainGrid").height(rows * size);


//Draws the square divs to the screen
function drawGrid(){
	//First remove all existing grid squares
	var myNode = document.getElementById("mainGrid");
	while (myNode.firstChild) {
    	myNode.removeChild(myNode.firstChild);
	}

	for (var i=0; i<rows; i++){
		for(var j=0; j<cols; j++){
			var colour;
			if(sbArray[i][j]){
				colour = '#FF3030';
			} else if(mrArray[i][j]){
				colour = '#ababab';
			} else{
				colour = 'white';
			}
			//Check if there are any creatures occupying the current grid square
			for(var creature = 0; creature < creatureArray.length; creature++){
				if((i == creatureArray[creature].pos[0]) && (j == creatureArray[creature].pos[1])){
					colour = 'yellow';
				}
			}
			//Check if there are any monsters occupying the current grid square
			for(var monster = 0; monster < monsterArray.length; monster++){
				if((i == monsterArray[monster].pos[0]) && (j == monsterArray[monster].pos[1])){
					colour = 'blue';
				}
			}

			var newElement = document.createElement("div");
			newElement.style.backgroundColor = colour;
			newElement.style.textAlign = "center";
			
			if(sbArray[i][j]){
				newElement.appendChild(document.createTextNode(sbArray[i][j]));
			}
			if(mrArray[i][j]){
				newElement.appendChild(document.createTextNode(mrArray[i][j]));
			}

	    	document.getElementById("mainGrid").appendChild(newElement);  
		}
	}
}
//##############################################################//
//					CREATURE CLASS								//
//##############################################################//

var Creature = function(energy, pos, chromosone){
	this.energy = energy;
	this.pos = pos;
	this.lastPos = pos;
	this.chromosone = chromosone;
}

/*This functions makes sure that the creature is kept track of properly
  in the nxm creature array. */
Creature.prototype.updatePos = function(){
	var pos = this.pos;
	var lastPos = this.lastPos;
	creatureArray2D[pos[0]][pos[1]] += 1;
	creatureArray2D[lastPos[0]][lastPos[1]] -= 1;
	this.lastPos = pos;
}

Creature.prototype.strawb_present = function(){
 	var pos = this.pos;
 	if(sbArray[pos[0]][pos[1]] > 0){
 		return true;
 	}

 	return false;
}

Creature.prototype.mushroom_present = function(){
 	var pos = this.pos;
 	if(mrArray[pos[0]][pos[1]] > 0){
 		return true;
 	}

 	return false;
}

Creature.prototype.creature_present = function(){
 	var pos = this.pos;
 	if(creatureArray2D[pos[0]][pos[1]] > 0){
 		return true;
 	}

 	return false;
}

Creature.prototype.monster_present = function(){
 	var pos = this.pos;
 	if(monsterArray2D[pos[0]][pos[1]] > 0){
 		return true;
 	}

 	return false;
}

//Returns how far to shift in y & x arrays in order to get
//	closer to the strawberry
Creature.prototype.nearest_strawb = function(){
	var result = false;
	var pos = this.pos;

	/*
		North = [-1, 0]
		East = [0, +1]
		South = [+1, 0]
		West = [0, -1]

		We make a call to checkFree before sbArray to make sure that we aren't checking 
		for a position that is out of bounds
	*/

	if(checkFree([(pos[0]-1), (pos[1])]) && sbArray[pos[0]-1][pos[1]] > 0){ //top mid
 		result = NORTH;
 	}
 	else if(checkFree([(pos[0]), (pos[1]+1)]) && sbArray[pos[0]][pos[1]+1] > 0){ //mid right
 		result = EAST;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1])]) && sbArray[pos[0]+1][pos[1]] > 0){ //bottom mid
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]), (pos[1]-1)]) && sbArray[pos[0]][pos[1]-1] > 0){ //mid left
 		result = WEST;
 	}
 	else if(checkFree([(pos[0]-1), (pos[1]+1)]) && sbArray[pos[0]-1][pos[1]+1] > 0){ //top right
 		result = NORTH;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1]+1)]) && sbArray[pos[0]+1][pos[1]+1] > 0){ //bottom right
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1]-1)]) && sbArray[pos[0]+1][pos[1]-1] > 0){ //bottom left
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]-1), (pos[1]-1)]) && sbArray[pos[0]-1][pos[1]-1] > 0){ //top left
 		result = NORTH;
 	}

 	return result;
}

Creature.prototype.nearest_mushroom = function(){
	var result = false;
	var pos = this.pos;

	if(checkFree([(pos[0]-1), (pos[1])]) && mrArray[pos[0]-1][pos[1]] > 0){ //top mid
 		result = NORTH;
 	}
 	else if(checkFree([(pos[0]), (pos[1]+1)]) && mrArray[pos[0]][pos[1]+1] > 0){ //mid right
 		result = EAST;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1])]) && mrArray[pos[0]+1][pos[1]] > 0){ //bottom mid
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]), (pos[1]-1)]) && mrArray[pos[0]][pos[1]-1] > 0){ //mid left
 		result = WEST;
 	}
 	else if(checkFree([(pos[0]-1), (pos[1]+1)]) && mrArray[pos[0]-1][pos[1]+1] > 0){ //top right
 		result = NORTH;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1]+1)]) && mrArray[pos[0]+1][pos[1]+1] > 0){ //bottom right
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1]-1)]) && mrArray[pos[0]+1][pos[1]-1] > 0){ //bottom left
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]-1), (pos[1]-1)]) && mrArray[pos[0]-1][pos[1]-1] > 0){ //top left
 		result = NORTH;
 	}

 	return result;
}

Creature.prototype.nearest_creature = function(){
	var result = false;
	var pos = this.pos;

	if(checkFree([(pos[0]-1), (pos[1])]) && creatureArray2D[pos[0]-1][pos[1]] > 0){ //top mid
 		result = NORTH;
 	}
 	else if(checkFree([(pos[0]), (pos[1]+1)]) && creatureArray2D[pos[0]][pos[1]+1] > 0){ //mid right
 		result = EAST;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1])]) && creatureArray2D[pos[0]+1][pos[1]] > 0){ //bottom mid
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]), (pos[1]-1)]) && creatureArray2D[pos[0]][pos[1]-1] > 0){ //mid left
 		result = WEST;
 	}
 	else if(checkFree([(pos[0]-1), (pos[1]+1)]) && creatureArray2D[pos[0]-1][pos[1]+1] > 0){ //top right
 		result = NORTH;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1]+1)]) && creatureArray2D[pos[0]+1][pos[1]+1] > 0){ //bottom right
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1]-1)]) && creatureArray2D[pos[0]+1][pos[1]-1] > 0){ //bottom left
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]-1), (pos[1]-1)]) && creatureArray2D[pos[0]-1][pos[1]-1] > 0){ //top left
 		result = NORTH;
 	}

 	return result;
}

Creature.prototype.nearest_monster = function(){
	var result = false;
	var pos = this.pos;

	if(checkFree([(pos[0]-1), (pos[1])]) && monsterArray2D[pos[0]-1][pos[1]] > 0){ //top mid
 		result = NORTH;
 	}
 	else if(checkFree([(pos[0]), (pos[1]+1)]) && monsterArray2D[pos[0]][pos[1]+1] > 0){ //mid right
 		result = EAST;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1])]) && monsterArray2D[pos[0]+1][pos[1]] > 0){ //bottom mid
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]), (pos[1]-1)]) && monsterArray2D[pos[0]][pos[1]-1] > 0){ //mid left
 		result = WEST;
 	}
 	else if(checkFree([(pos[0]-1), (pos[1]+1)]) && monsterArray2D[pos[0]-1][pos[1]+1] > 0){ //top right
 		result = NORTH;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1]+1)]) && monsterArray2D[pos[0]+1][pos[1]+1] > 0){ //bottom right
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1]-1)]) && monsterArray2D[pos[0]+1][pos[1]-1] > 0){ //bottom left
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]-1), (pos[1]-1)]) && monsterArray2D[pos[0]-1][pos[1]-1] > 0){ //top left
 		result = NORTH;
 	}

 	return result;
}

Creature.prototype.kill = function(){
	var pos = this.pos;
	creatureArray2D[pos[0]][pos[1]] -= 1;

	for(var creature = 0; creature < creatureArray.length; creature++){
		if(creatureArray[creature] == this){
			creatureArray.splice(creature, 1);
		}
	}
}

/*	Function to make the creature eat. Eating costs 5 energy to complete, and the creature's
	energy is fully replenished if it eats a strawberry. It dies if they eat a mushroom. */
Creature.prototype.eat = function(){
	var pos = this.pos;
	//this.energy -= 5;
	if(this.strawb_present()){
		sbArray[pos[0]][pos[1]] -= 1;
		if(this.energy <= 50){
			this.energy += 30;
		} else{
			this.energy = 100;
		}
	}
	else if(this.mushroom_present()){
		mrArray[pos[0]][pos[1]] -= 1;
		mushroomDeaths++;
		this.kill();
	}
}

//Move the creature in a random direction within the confines of the grid
Creature.prototype.move_random = function(){
	var hasMoved = false;
	while(!hasMoved){
		switch (Math.floor((Math.random() * 4)+1)){
			case 1:
				if(this.moveUp()){hasMoved = true;}
				break;
			case 2:
				if(this.moveRight()){hasMoved = true;}
				break;
			case 3:
				if(this.moveDown()){hasMoved = true;}
				break;
			case 4:
				if(this.moveLeft()){hasMoved = true;}
				break;
		}
	}
}

//******* NEED TO INTRODUCE RANDOM ELEMENT TO PATHFINDING *******

//Move in a given direction
Creature.prototype.move_towards = function(direction){
	switch (direction){
			case NORTH:
				if(this.moveUp()){hasMoved = true;}
				break;
			case EAST:
				if(this.moveRight()){hasMoved = true;}
				break;
			case SOUTH:
				if(this.moveDown()){hasMoved = true;}
				break;
			case WEST:
				if(this.moveLeft()){hasMoved = true;}
				break;
		}
}

//Move in a given direction
Creature.prototype.move_away = function(direction){
	switch (direction){
			case NORTH:
				if(this.moveDown()){hasMoved = true;}
				break;
			case EAST:
				if(this.moveLeft()){hasMoved = true;}
				break;
			case SOUTH:
				if(this.moveUp()){hasMoved = true;}
				break;
			case WEST:
				if(this.moveRight()){hasMoved = true;}
				break;
		}
}

/*	This function selects an action for the creature to do based on their chromosones
	and sensory input. */
Creature.prototype.selectAction = function(){
	var actionsList = [];
	this.energy -= 1;

	if(this.energy <= 0){
		starveDeaths++;
		this.kill();
	}
	else if(this.monster_present()){
		monsterDeaths++;
		this.kill();
	}

	//If the creature senses something and it's action isn't 'ignore', add the sense's
	//position to the action list
	if(this.strawb_present()){if(this.chromosone[0] != 'ignore'){actionsList.push(0);}}
	if(this.mushroom_present()){if(this.chromosone[1] != 'ignore'){actionsList.push(1);}}
	if(this.nearest_strawb()){if(this.chromosone[2] != 'ignore'){actionsList.push(2);}}
	if(this.nearest_mushroom()){if(this.chromosone[3] != 'ignore'){actionsList.push(3);}}
	if(this.nearest_monster()){if(this.chromosone[4] != 'ignore'){actionsList.push(4);}}
	if(this.nearest_creature()){if(this.chromosone[5] != 'ignore'){actionsList.push(5);}}

	//If the action list is empty, do the default action
	if(actionsList.length == 0){
		//console.log("default");
		switch (this.chromosone[6]){
			case 'random':
				this.move_random();
				break;
			case 'north':
				if(this.moveUp()){hasMoved = true;}
				break;
			case 'east':
				if(this.moveRight()){hasMoved = true;}
				break;
			case 'south':
				if(this.moveDown()){hasMoved = true;}
				break;
			case 'west':
				if(this.moveLeft()){hasMoved = true;}
				break;
		}
	}

	var maxWeight = 0;
	var chosenAction = 0;
	for(var i=0; i<actionsList.length; i++){
		//console.log("Checking action " + actionsList[i] + " with weight " + this.chromosone[actionsList[i] + 7]);
		if(this.chromosone[actionsList[i] + 7] > maxWeight){
			maxWeight = this.chromosone[actionsList[i] + 7];
			chosenAction = actionsList[i];
		}
	}
	//console.log("chosenAction: " + chosenAction + " weight: " + this.chromosone[chosenAction + 7] + " energy: " + this.energy);
	if(chosenAction <= 1){ //If action is to eat strawberry/mushroom
		this.energy -= 1;
		this.eat();
	}
	else{
		switch(this.chromosone[chosenAction]){
			case 'towards':
				switch(chosenAction){
					case 2:
						this.move_towards(this.nearest_strawb());
						break;
					case 3:
						this.move_towards(this.nearest_mushroom());
						break;
					case 4:
						this.move_towards(this.nearest_monster());
						break;
					case 5:
						this.move_towards(this.nearest_creature());
						break;
				}
				break;
			case 'away':
				switch(chosenAction){
					case 2:
						this.move_away(this.nearest_strawb());
						break;
					case 3:
						this.move_away(this.nearest_mushroom());
						break;
					case 4:
						this.move_away(this.nearest_monster());
						break;
					case 5:
						this.move_away(this.nearest_creature());
						break;
				}
				break;

			case 'random':
				this.move_random();
		}
	}
	//if action 0 or 1, eat
	//if actions 2 through 5, move towards/away/random
}

/*	These are the base move functions. If a creature trys to move off the 
	side of the grid, they will wrap back around. This is to avoid creatures
	freezing on the edges of the grid. */
Creature.prototype.moveUp = function(){
	var pos = this.pos;
	if (checkFree([(pos[0]-1), (pos[1])])){
		this.pos = [(pos[0]-1), (pos[1])];
	}
	else{
		this.pos = [rows-1, pos[1]];
	}
	this.updatePos();
	this.energy -= 1;
	return true;
}

Creature.prototype.moveRight = function(){
	var pos = this.pos;
	if (checkFree([(pos[0]), (pos[1]+1)])){
		this.pos = [(pos[0]), pos[1]+1];
	}
	else{
		this.pos = [pos[0], 0];
	}
	this.updatePos();
	this.energy -= 1;
	return true;
}

Creature.prototype.moveDown = function(){
	var pos = this.pos;
	if (checkFree([(pos[0]+1), (pos[1])])){
		this.pos = [(pos[0]+1), (pos[1])];
	}
	else{
		this.pos = [0, pos[1]];
	}
	this.updatePos();
	this.energy -= 1;
	return true;
}

Creature.prototype.moveLeft = function(){
	var pos = this.pos;
	if (checkFree([(pos[0]), (pos[1]-1)])){
		this.pos = [(pos[0]), (pos[1]-1)];
	}
	else{
		this.pos = [pos[0], cols-1];
	}
	this.updatePos();
	this.energy -= 1;
	return true;
}
//##############################################################//
//##############################################################//

//##############################################################//
//					MONSTER CLASS								//
//##############################################################//

var Monster = function(pos){
	this.pos = pos;
	this.lastPos = pos;
	this.counter = 0;
}

/*This functions makes sure that the monster is kept track of properly
  in the n*m creature array. */
Monster.prototype.updatePos = function(){
	var pos = this.pos;
	var lastPos = this.lastPos;
	monsterArray2D[pos[0]][pos[1]] += 1;
	monsterArray2D[lastPos[0]][lastPos[1]] -= 1;
	this.lastPos = pos;
}

Monster.prototype.nearest_creature = function(){
	var result = false;
	var pos = this.pos;

	if(checkFree([(pos[0]-1), (pos[1])]) && creatureArray2D[pos[0]-1][pos[1]] > 0){ //top mid
 		result = NORTH;
 	}
 	else if(checkFree([(pos[0]), (pos[1]+1)]) && creatureArray2D[pos[0]][pos[1]+1] > 0){ //mid right
 		result = EAST;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1])]) && creatureArray2D[pos[0]+1][pos[1]] > 0){ //bottom mid
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]), (pos[1]-1)]) && creatureArray2D[pos[0]][pos[1]-1] > 0){ //mid left
 		result = WEST;
 	}
 	else if(checkFree([(pos[0]-1), (pos[1]+1)]) && creatureArray2D[pos[0]-1][pos[1]+1] > 0){ //top right
 		result = NORTH;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1]+1)]) && creatureArray2D[pos[0]+1][pos[1]+1] > 0){ //bottom right
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]+1), (pos[1]-1)]) && creatureArray2D[pos[0]+1][pos[1]-1] > 0){ //bottom left
 		result = SOUTH;
 	}
 	else if(checkFree([(pos[0]-1), (pos[1]-1)]) && creatureArray2D[pos[0]-1][pos[1]-1] > 0){ //top left
 		result = NORTH;
 	}

 	return result;
}

//Move the creature in a random direction within the confines of the grid
Monster.prototype.move_random = function(){
	var hasMoved = false;
	while(!hasMoved){
		switch (Math.floor((Math.random() * 4)+1)){
			case 1:
				if(this.moveUp()){hasMoved = true;}
				break;
			case 2:
				if(this.moveRight()){hasMoved = true;}
				break;
			case 3:
				if(this.moveDown()){hasMoved = true;}
				break;
			case 4:
				if(this.moveLeft()){hasMoved = true;}
				break;
		}
	}
}

//******* NEED TO INTRODUCE RANDOM ELEMENT TO PATHFINDING *******

//Move in a given direction
Monster.prototype.move_towards = function(direction){
	switch (direction){
			case NORTH:
				if(this.moveUp()){hasMoved = true;}
				break;
			case EAST:
				if(this.moveRight()){hasMoved = true;}
				break;
			case SOUTH:
				if(this.moveDown()){hasMoved = true;}
				break;
			case WEST:
				if(this.moveLeft()){hasMoved = true;}
				break;
			case false: //If there isn't a creature nearby
				this.move_random();
				break;
		}
}

//Selects an action for the monster to perform given their sensory input
Monster.prototype.move = function(){
	var pos = this.pos;

	if(this.counter >= monsterDelay){
		this.counter = 0;
		this.move_towards(this.nearest_creature());
	}
	else{
		this.counter++;
	}
}

Monster.prototype.moveUp = function(){
	var pos = this.pos;
	if (checkFree([(pos[0]-1), (pos[1])])){
		this.pos = [(pos[0]-1), (pos[1])];
		this.updatePos();
		return true;
	}

	return false;
}

Monster.prototype.moveRight = function(){
	var pos = this.pos;
	if (checkFree([(pos[0]), (pos[1]+1)])){
		this.pos = [(pos[0]), pos[1]+1];
		this.updatePos();
		return true;
	}

	return false;
}

Monster.prototype.moveDown = function(){
	var pos = this.pos;
	if (checkFree([(pos[0]+1), (pos[1])])){
		this.pos = [(pos[0]+1), (pos[1])];
		this.updatePos();
		return true;
	}

	return false;
}

Monster.prototype.moveLeft = function(){
	var pos = this.pos;
	if (checkFree([(pos[0]), (pos[1]-1)])){
		this.pos = [(pos[0]), (pos[1]-1)];
		this.updatePos();
		return true;
	}

	return false;
}

//##############################################################//
//##############################################################//

/*  Generates a new array of values. A 'chance' ranging from 0 (100%) to 1 (0%) is given which
	decides whether or not a point in the array will contain a value grater than 0. This value is randomly
	chosen between 1 and 4.*/
function makeArray(chance){
	tempArray = [];
	for (var i=0; i<rows; i++){
		tempArray[i] = [];
		if(chance == 1){ //If we're creating spaceArray for the first time
			spaceArray[i] = [];
		}	
		for(var j=0; j<cols; j++){
			if(Math.random() > chance && !spaceArray[i][j]){ //if there isn't already something in this square
				tempArray[i][j] = Math.floor((Math.random() * 4)+1);
				spaceArray[i][j] = true;
			} else{
				tempArray[i][j] = 0;
				//make sure that spaceArray keeps track of all arrays
				if(!spaceArray[i][j]){
					spaceArray[i][j] = false;
				}
			}
		}
	}

	return tempArray;
}

//Generate a 2-D array of 0 int values
function makeIntArray(){
	tempArray = [];
	for (var i=0; i<rows; i++){
		tempArray[i] = [];
		for(var j=0; j<cols; j++){
			tempArray[i][j] = 0;
		}
	}

	return tempArray;
}

/*	Creates a new child creature from two parents. The parents are selected using ranked selection.
	The child's chromosone is generated using crossover and mutation. Ranked from lowest fitness to
	highest. */
function createChild(){
	var rankArray = []; //Array to hold creatures sorted by fitness
	var chromosone;
	totalFitness = 0;

	//Create an array of creatures sorted by their energy levels
	for(var creature=0; creature<creatureArray.length; creature++){
		var count = 0;
		totalFitness += creatureArray[creature].energy;
		var inserted = false;

		while(!inserted){
			if(count >= rankArray.length){ //If we've reached the end of the rank array
				rankArray.push(creatureArray[creature]);
				inserted = true;
			}
			else if(creatureArray[creature].energy <= rankArray[count].energy){
				rankArray.splice(count, 0, creatureArray[creature]);
				inserted = true;
			}
			else{
				count++;
;			}
		}
	}


	var parent1 = getParent(rankArray, totalFitness);
	var parent2 = parent1;
	
	//Make sure that we don't have the same creature for both parent 1 & 2
	while(parent2 == parent1){
		parent2 = getParent(rankArray, totalFitness);
	}

	chromosone = crossover(parent1, parent2);
	chromosone = mutate(chromosone);
	//console.log("CO: " + chromosone);

	var randY = Math.floor((Math.random() * (rows-1)));
	var randX = Math.floor((Math.random() * (cols-1)));
	spaceArray[randY][randX] = true;

	return new Creature(100, [randY, randX], chromosone);
}

/*	Merge the chromosones of the two parents by randomly generating a crossover
	point and secting genes from one half of parent1 and one half from parent2. */
function crossover(parent1, parent2){
	var tempChromosone = [];

	//Crossover for genes
	var crossPoint =  Math.floor((Math.random() * 5)+1);
	var p1 = parent1;
	var p2 = parent2;
	for(var i=0; i<crossPoint; i++){
		tempChromosone[i] = p1.chromosone[i];
	}
	for(var i=crossPoint; i<7; i++){
		tempChromosone[i] = p2.chromosone[i];
	}

	//Crossover for weights
	var crossPoint =  Math.floor((Math.random() * 11)+8);
	for(var i=7; i<crossPoint; i++){
		tempChromosone[i] = p1.chromosone[i];
	}
	for(var i=crossPoint; i<13; i++){
		tempChromosone[i] = p2.chromosone[i];
	}

	//console.log("P1: " + p1.chromosone);
	//console.log("P2: " + p2.chromosone);
	return tempChromosone;
}

/*	Using ranked selection, return a parent creature. There is also a small chance that a
	creature in the top 10% of fitness will be chosen instead. */
function getParent(rankArray, totalFitness){
	var sum = 0;
	var count = 0;
	var parent;
	var randNum = Math.floor((Math.random() * totalFitness)+1);
	var elite = Math.ceil(rankArray.length * 0.1); //Pointer for the top 10% of creatures

	if(Math.random() > eliteChance){
		return rankArray[rankArray.length - Math.floor((Math.random() * elite)+1)]; //Return a random creature from the top 10%
	}
	else{
		while(sum < randNum){
			parent = rankArray[count];
			sum += parent.energy;
			count++;
		}
	}

	return parent;
}

/*	For each gene in the given chromosone, give it a chance to randomly re-generate
	itself based on mutateChance. */
function mutate(chromosone){
	//Generate actions for the first two senses
	for(var i=0; i<2; i++){
		if(Math.random() > mutateChance){
			if(Math.floor((Math.random() * 2) + 1) > 1){ //1=ignore, 2=eat
				chromosone[i] = 'eat';
			}
			else{
				chromosone[i] = 'ignore';
			}
		}
	}

	//Generate actions for the next 4 senses
	for(var i=2; i<6; i++){
		if(Math.random() > mutateChance){
			switch(Math.floor((Math.random() * 4) + 1)){ //1=towards, 2=away, 3=random, 4=ignore
				case 1:
					chromosone[i] = 'towards';
					break;
				case 2:
					chromosone[i] = 'away';
					break;
				case 3:
					chromosone[i] = 'random';
					break;
				case 4:
					chromosone[i] = 'ignore';
					break;
			}
		}
	}

	//Generate default action
	if(Math.random() > mutateChance){
		switch(Math.floor((Math.random() * 5) + 1)){
			case 1:
				chromosone[6] = 'random';
				break;
			case 2:
				chromosone[6] = 'north';
				break;
			case 3:
				chromosone[6] = 'east';
				break;
			case 4:
				chromosone[6] = 'south';
				break;
			case 5:
				chromosone[6] = 'west';
				break;
		}
	}

	//Generate weights for the 6 non-default actions
	for(var i=7; i<12; i++){
		if(Math.random() > mutateChance){
			chromosone[i] = Math.random();
		}
	}

	return chromosone;
}

/*	Randomly generate a new chromosone. Every action for each gene has an even chance of becoming dominant. */
function generateChromosone(){
	var chromosone = [];
	//Generate actions for the first two senses
	for(var i=0; i<2; i++){
		if(Math.floor((Math.random() * 2) + 1) > 1){ //1=ignore, 2=eat
			chromosone.push('eat');
		}
		else{
			chromosone.push('ignore');
		}
	}

	//Generate actions for the next 4 senses
	for(var i=0; i<4; i++){
		switch(Math.floor((Math.random() * 4) + 1)){ //1=towards, 2=away, 3=random, 4=ignore
			case 1:
				chromosone.push('towards');
				break;
			case 2:
				chromosone.push('away');
				break;
			case 3:
				chromosone.push('random');
				break;
			case 4:
				chromosone.push('ignore');
				break;
		}
	}

	//Generate default action
	switch(Math.floor((Math.random() * 5) + 1)){
		case 1:
			chromosone.push('random');
			break;
		case 2:
			chromosone.push('north');
			break;
		case 3:
			chromosone.push('east');
			break;
		case 4:
			chromosone.push('south');
			break;
		case 5:
			chromosone.push('west');
			break;
	}

	//Generate weights for the 6 non-default actions
	for(var i=0; i<6; i++){
		chromosone.push(Math.random());
	}

	return chromosone;
}

/*	Populates the creature/monster arrays and randomly places them in the grid.
	Also updates spaceArray to make sure that strawberries and mushrooms aren't
	generate on top of creatures/monsters. */
function populateCreatures(){
	perfectStats = ['eat', 'ignore', 'towards', 'ignore', 'away', 'ignore', 'random', 0.9, 0.1, 0.8, 0.2, 1.0, 0.3];
	for(var i=0; i<numCreatures; i++){
		var randY = Math.floor((Math.random() * (rows-1)));
		var randX = Math.floor((Math.random() * (cols-1)));

		creatureArray[i] = new Creature(100, [randY, randX], generateChromosone());
		spaceArray[randY][randX] = true;

		//console.log("New Creature created at " + [randY, randX]);
	}

	
	//creatureArray[creatureArray.length] = new Creature(100, [0, 0], perfectStats);
}

function populateMonsters(){
	for(var i=0; i<numMonsters; i++){
		var randY = Math.floor((Math.random() * (rows-1)));
		var randX = Math.floor((Math.random() * (cols-1)));

		monsterArray[i] = new Monster([randY, randX]);
		spaceArray[randY][randX] = true;

		//console.log("New Monster created at " + [randY, randX]);
	}
}

/* Returns true if the given square is within the confines of the grid. */
function checkFree(pos){
	if((pos[0] >= 0 && pos[0] < rows) && (pos[1] >= 0 && pos[1] < cols)){
		return true;
	}
	else{
		return false;
	}
}

/*	Handles all of the function calls to be made at every time step. This includes
	telling every creature/monster to select an action and re-drawing the grid. */
function tick(){
	//Stop simulations if we've reached the designated number of ticks
	if(currentStep >= timeSteps){
		stop();
		if($("#automate").is(':checked')){ //If automate button is checked
			console.log("Going to next epoch");
			generate();
			simulate();
		}
	}
	else{
		for(var i=0; i<creatureArray.length; i++){
			creatureArray[i].selectAction();
		}
		for(var i=0; i<monsterArray.length; i++){
			monsterArray[i].move();
		}

		drawGrid();
		currentStep++;
	}
}

function stop(){
	currentStep = 0;
	clearInterval(mainLoop);
	console.log("*******STOP*******");
	$("#simulate").prop('disabled', ''); //Reenable the start button
}

/*	Takes the remaining creature population and generates a new population of
	size 'numCreatures'. The new generation's chromosones will be generated through
	the merging of the previous generation's chromosones. */
function evolve(){
	var newCreatureArray = [];
	for(var i=0; i<numCreatures; i++){
		newCreatureArray.push(createChild());
	}

	return newCreatureArray;
}

/*	Start a simulation using the given population count and time length. */
function simulate(){
	updateSpeed = $("#updateSpeed").val();
 	timeSteps = $("#tickCount").val();
	$("#simulate").prop('disabled', 'disabled'); //Disable the start button when simulation is running
	mainLoop = setInterval(function() {tick();}, updateSpeed);
}

/* Generate all arrays. If there is already a creature array present, run evolve() rather than populate. */
function generate(){
	numMonsters = $("#monsterNum").val();
	numCreatures = $("#creatureNum").val();
	spaceArray = makeArray(1); //Create an array containing only 'false' values

	if(creatureArray.length != 0){
		console.log("*******NEW EPOCH*******");
		creatureArray = evolve();
		populateMonsters();
		console.log("Last generation's average fitness: " + (totalFitness / creatureArray.length));
		console.log("Mushroom deaths: " + mushroomDeaths + " Monster deaths: " + monsterDeaths + " Starvation deaths: " + starveDeaths);
		
		mushroomDeaths = 0;
		monsterDeaths = 0;
 		starveDeaths = 0;
	}
	else{
		populateCreatures(); //Add creatures/monsters
		populateMonsters();
	}


	sbArray = makeArray(strawberryChance);
	mrArray = makeArray(mushroomChance);
	creatureArray2D = makeIntArray();
	monsterArray2D = makeIntArray();

	drawGrid();
}

document.getElementById("generate").onclick = function() {generate();};
document.getElementById("stop").onclick = function() {stop();};
document.getElementById("simulate").onclick = function() {if(currentStep == 0){simulate();}};
document.getElementById("next").onclick = function() {tick();};