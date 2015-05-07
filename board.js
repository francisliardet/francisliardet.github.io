

var rows = 30;
var cols = 50;
var size = 20; //Size of grid squares in pixels

var steps = 30; //How many steps to simulate each go

var strawberryChance = 0.95;
var mushroomChance = 0.95;

var numMonsters = 5;
var numCreatures = 10;

var spaceArray = []; //Array to keep track of which squares are empty or not.
var sbArray = []; //Strawberry array
var mrArray = []; //Mushroom array

var creatureArray = [];
var monsterArray = [];


$("#mainChessBoard").width(cols * size);
$("#mainChessBoard").height(rows * size);


//Draws the square divs to the screen
function drawGrid(){
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
			if((j == creature1.getPos()[0]) && (i == creature1.getPos()[1])){
				colour = 'blue';
			}
			//console.log([j, i]+ " : " + creature1.getPos() + " : " + colour);
			var newElement = document.createElement("div");
			newElement.style.backgroundColor = colour;
			newElement.style.textAlign = "center";
			
			if(sbArray[i][j]){
				newElement.appendChild(document.createTextNode(sbArray[i][j]));
			}
			if(mrArray[i][j]){
				newElement.appendChild(document.createTextNode(mrArray[i][j]));
			}

	    	document.getElementById("mainChessBoard").appendChild(newElement); 
	    	//document.getElementById("mainChessBoard").appendChild(document.createElement("div")).style.backgroundColor = colour;   
		}
	}
}
/*  Generates a new array of values. A 'chance' ranging from 0 (100%) to 1 (0%) is given which
	decides whether or not a point in the array will contain a value grater than 0. This value is randomly
	chosen between 1 and 4.*/
function makeArray(chance){
	tempArray = [];
	for (var i=0; i<rows; i++){
		tempArray[i] = [];
		spaceArray[i] = [];
		for(var j=0; j<cols; j++){
			if(Math.random() > chance && !spaceArray[i][j]){ //if there isn't already something in this square
				//console.log("Inserting... SA: " + spaceArray[i][j]);
				tempArray[i][j] = Math.floor((Math.random() * 4)+1);
				spaceArray[i][j] = true;
			} else{
				tempArray[i][j] = 0;
				//make sure that spaceArray keeps track of all arrays
				if(!spaceArray[i][j]){
					//console.log("Arrayprob: " + chance);
					spaceArray[i][j] = false;
				}
			}
		}
	}

	return tempArray;
}
//##############################################################//
//					CREATURE CLASS								//
//##############################################################//

var Creature = function(energy, pos){
	this.energy = energy;
	this.pos = pos;
}

Creature.prototype.getPos = function(){
	return this.pos;
}

Creature.prototype.setPos = function(pos){
	this.pos = pos;
}

Creature.prototype.move = function(){
	//If not at top of box or blocked by something else,
	//try a random direction
	var hasMoved = false;
	while(!hasMoved){
		switch (Math.floor((Math.random() * 4)+1)){
			case 1:
				if(this.moveUp()){hasMoved = true;}
				else{console.log("Can't move up!");}
				break;
			case 2:
				if(this.moveRight()){hasMoved = true;}
				else{console.log("Can't move right!");}
				break;
			case 3:
				if(this.moveDown()){hasMoved = true;}
				else{console.log("Can't move down!");}
				break;
			case 4:
				if(this.moveLeft()){hasMoved = true;}
				else{console.log("Can't move left!");}
				break;
		}
	}
}

Creature.prototype.moveUp = function(){
	pos = this.getPos();
	if (checkFree([pos[0], (pos[1]-1)])){
		this.setPos([pos[0], (pos[1]-1)]);
		return true;
	}

	return false;
}

Creature.prototype.moveRight = function(){
	pos = this.getPos();
	if (checkFree([(pos[0]+1), pos[1]])){
		this.setPos([(pos[0]+1), pos[1]]);
		return true;
	}

	return false;
}

Creature.prototype.moveDown = function(){
	pos = this.getPos();
	if (checkFree([pos[0], (pos[1]+1)])){
		this.setPos([pos[0], (pos[1]+1)]);
		return true;
	}

	return false;
}

Creature.prototype.moveLeft = function(){
	pos = this.getPos();
	if (checkFree([(pos[0]-1), pos[1]])){
		this.setPos([(pos[0]-1), pos[1]]);
		return true;
	}

	return false;
}
//##############################################################//
//##############################################################//

//##############################################################//
//					MONSTER CLASS								//
//##############################################################//

var Monster = function(energy, pos){
	this.pos = pos;
}

Monster.prototype.getPos = function(){
	return this.pos;
}

Monster.prototype.setPos = function(pos){
	this.pos = pos;
}

Monster.prototype.move = function(){
	//If not at top of box or blocked by something else,
	//try a random direction
	var hasMoved = false;
	while(!hasMoved){
		switch (Math.floor((Math.random() * 4)+1)){
			case 1:
				if(this.moveUp()){hasMoved = true;}
				else{console.log("Can't move up!");}
				break;
			case 2:
				if(this.moveRight()){hasMoved = true;}
				else{console.log("Can't move right!");}
				break;
			case 3:
				if(this.moveDown()){hasMoved = true;}
				else{console.log("Can't move down!");}
				break;
			case 4:
				if(this.moveLeft()){hasMoved = true;}
				else{console.log("Can't move left!");}
				break;
		}
	}
}

Monster.prototype.moveUp = function(){
	pos = this.getPos();
	if (checkFree([pos[0], (pos[1]-1)])){
		this.setPos([pos[0], (pos[1]-1)]);
		return true;
	}

	return false;
}

Monster.prototype.moveRight = function(){
	pos = this.getPos();
	if (checkFree([(pos[0]+1), pos[1]])){
		this.setPos([(pos[0]+1), pos[1]]);
		return true;
	}

	return false;
}

Monster.prototype.moveDown = function(){
	pos = this.getPos();
	if (checkFree([pos[0], (pos[1]+1)])){
		this.setPos([pos[0], (pos[1]+1)]);
		return true;
	}

	return false;
}

Monster.prototype.moveLeft = function(){
	pos = this.getPos();
	if (checkFree([(pos[0]-1), pos[1]])){
		this.setPos([(pos[0]-1), pos[1]]);
		return true;
	}

	return false;
}
//##############################################################//
//##############################################################//

//Returns true if the given square is unoccupied
function checkFree(pos){
	if((pos[0] >= 0 && pos[0] < cols) && (pos[1] >= 0 && pos[1] < rows)){
		//console.log("Check Pos: " + pos + " sbA: " + sbArray[pos[1]][pos[0]] + " mrA: " + mrArray[pos[1]][pos[0]]);
		if(sbArray[pos[1]][pos[0]]){
			return false;
		}
		else if(mrArray[pos[1]][pos[0]]){
			return false;
		}

		return true;
	}
	return false;
}

function tick(){
	var myNode = document.getElementById("mainChessBoard");
	//Removes all existing squares
	while (myNode.firstChild) {
    	myNode.removeChild(myNode.firstChild);
	}

	creature1.move();
	drawGrid();
}



function start(){
	setInterval(function() {tick();}, 300);

	//Create the audio tag
	var soundFile = document.createElement("audio");
	soundFile.preload = "auto";

	//Load the sound file (using a source element for expandability)
	var src = document.createElement("source");
	src.src = "eminence_front.mp3";
	soundFile.appendChild(src);

	//Load the audio tag
	//It auto plays as a fallback
	soundFile.load();
	soundFile.volume = 1.000000;
	soundFile.play();

	//Plays the sound
	function play() {
	   //Set the current time for the audio file to the beginning
	   soundFile.currentTime = 0.01;
	   soundFile.volume = volume;

	   //Due to a bug in Firefox, the audio needs to be played after a delay
	   setTimeout(function(){soundFile.play();},1);
	}
}

var creature1 = new Creature(100, [20,20]);

spaceArray = makeArray(1); //create an array containing only 'false' values
sbArray = makeArray(strawberryChance);
mrArray = makeArray(mushroomChance);

drawGrid();

document.getElementById("demo").onclick = function() {start()};