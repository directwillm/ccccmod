var currentCommands = [];
var d = new Date();
var lastTime = d.getTime();
var currentLaserTime = 0;
var laser;
var timeDif;

setInterval(function()
{
	//Reaches out to the localhost for stored commands every 5 seconds
	//and adds them to currentCommands
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() 
	{
		if (this.readyState == 4 && this.status == 200) 
		{
			var commands = JSON.parse(this.responseText);
			console.log(this.responseText);
			
			if (commands === undefined || commands.length ==0)
			{
				console.log("no commands");
			}
			else
			{
				currentCommands = currentCommands.concat(commands);
			}
			
			//Where the commands actually get used
			processCommands();
			
		}
	};
	xhttp.open("GET", "http://localhost:8080/api/nextCommands", true);
	xhttp.send();
}, 5000);

//10 times a second to make sure we waste
//little time if a timer is going but a room
//change requires reactivation
setInterval(()=>runTimers(),100);

function processCommands(){
	//Obviously don't run anything under these scenarios
	if (!ig.game || !ig.game.playerEntity || ig.game.playerEntity._killed == true) 
	{
		console.log("no player yet");
		return;
	}
	
	currentCommands.forEach((e)=> 
	{
		//Cancel current processCommands()
		//if the player doesn't exist for some reason
		//or they are _killed (like when we go to the main menu
		if (!ig.game.playerEntity || ig.game.playerEntity._killed == true) 
		{
			console.log("no player yet");
			return;
		}
		
		console.log(e);
		switch(e.command) 
		{
			case "hurt 10":
				heal(-0.1);
				break;
			case "bomb":
				spawnBombAtPlayer();
				break;
			case "overload":
				instantOverload();
				break;
			case "laser":
				//30 seconds set.  Timers will all just be
				//adjusting a variable.  #TODO make them all under a
				//more generic timers object.  Not allowed
				//to add another timer thing until you do that me!
				currentLaserTime=30000;
			default:
				console.log("unknown command");
		}
	});
	currentCommands = [];
}

function runTimers() {
	var d = new Date();
	timeDif = d.getTime()-lastTime;
	if (ig.game && !ig.loading && !ig.game.paused && ig.game.playerEntity && ig.game.playerEntity._killed == false) {
		laserTimer();
	}
	
	
	lastTime=d.getTime();
}

function laserTimer() {
	if(currentLaserTime<=0 && !laser) {
		return;
	} else if (currentLaserTime<=0 && laser) {
		laser.kill();
		laser = null;
		return;
	}
	
	if(!laser || laser._killed){
		spawnLaser();
		//To counteract the timeDif including the latest timedif right as it spawns
		currentLaserTime+=timeDif;
	}
	currentLaserTime-=timeDif;
	if (currentLaserTime < 0) {
		currentLaserTime = 0;
	}
	
}


//Thanks @2767mr
function spawnLaser() {
	console.log("spawning laser");
	new sc.EnemyType("arid.mega-laser").load(() => {laser = ig.game.spawnEntity("Enemy", 10000, 10000, 10000, 
	{
		name:"megaLaser",
		enemyInfo:{
			group:"",
			party:"",
			type:"arid.mega-laser",
			targetOnSpawn: true
		}
	})});
}

function heal(amt) {
	ig.game.playerEntity.heal({value:amt},false);
}

function instantOverload() { 
	//strangely just setting it to 1 does not work
	sc.model.player.elementLoad = 1.1;
}

function spawnBombAtPlayer() {
	var c = ig.game.spawnEntity(sc.BombEntity, ig.game.playerEntity.coll.pos.x, ig.game.playerEntity.coll.pos.y, ig.game.playerEntity.coll.pos.z+ 100, {});
	c.start(0, ig.game.playerEntity ,0,0);
	c.timer = 2;
}

function spawnBomb(x,y,z) {
	var c = ig.game.spawnEntity(sc.BombEntity, x, y, z, {});
	c.start(0, ig.game.playerEntity ,0,0);
	c.timer = 2;
}