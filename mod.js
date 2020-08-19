var currentCommands = [];
var d = new Date();
var lastTime = d.getTime();
var timers {
	laser: 0,
	ice: 0,
	bombTime: 0,
	hiGrav: 0,
};
var laser;
var timeDif;
var ORIGINAL_NG = null;
var iceStart = false;

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
			//console.log(this.responseText);
			
			if (commands === undefined || commands.length ==0)
			{
				//console.log("no commands");
			}
			else
			{
				console.log(commands);
				currentCommands = currentCommands.concat(commands);
			}
			
			//Where the commands actually get used
			processCommands();
			
		}
	};
	xhttp.open("GET", "http://localhost:8080/api/nextCommands", true);
	xhttp.send();
}, 1000);

//10 times a second to make sure we waste
//little time if a timer is going but a room
//change requires reactivation
setInterval(()=>runTimers(),100);

function processCommands(){
	//Obviously don't run anything under these scenarios:
	//Game isnt loaded
	//player doesnt exist yet
	//player has ceased to exist
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
			//console.log("no player yet");
			return;
		}
		
		//console.log(e);
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
				//15 seconds set.  Timers will all just be
				//adjusting a variable.  runTimers() will take care of
				//everything else
				timers.laser=15000;
				break;
			case "ice":
				timers.ice=15000;
				break;
			case "sandwich":
				sandwich();
				break;
			case "hiGrav":
				timers.hiGrav=15000;
				break;
			default:
				console.log("unknown command");
		}
	});
	currentCommands = [];
}

function sandwich() {
	sc.model.player.addItem(1,1,false,false);
	ig.game.playerEntity.useItem(1);
}

function ice() {
	if(timers.ice<=0 && !sc.newgame.options["ice-physics"]) {
		return;
	} else if (timers.ice<=0 && sc.newgame.options["ice-physics"]) {
		sc.newgame.options["ice-physics"] = false;
		sc.newgame.active = ORIGINAL_NG;
		timers.ice = 0;
		return;
	}
	sc.newgame.active = true;
	sc.newgame.options["ice-physics"] = true;
	timers.ice-=timeDif;
}

function lowGrav() {
	//#todo: copy paste and change a few vars from hiGrav
}

function hiGrav() {
	if(timers.hiGrav<=0 && ig.game.gravity == 800) {
		return;
	} //this else checks if its greater so it doesnt reset a low grav effect
	else if (timers.hiGrav<=0 && ig.game.gravity > 800) {
		ig.game.gravity = 800;
		timers.hiGrav = 0;
		return;
	}
	
	//perfectly troll calibrated to still allow sometimes going up
	//but still being super annoying
	ig.game.gravity = 1068; 
	timers.hiGrav-=timeDif;
}

function runTimers() {
	//Before anything that changes the NG can run, we see if it's null
	//if it is then we can fill it with the current NG status
	//ultimately if the game is saved while NG is active it's borked
	//anyways so it might be better to just say "This mod makes your game NG+"
	//and leave it at that
	if (!ORIGINAL_NG) {
		ORIGINAL_NG = sc.newgame.active;
	}
	var d = new Date();
	timeDif = d.getTime()-lastTime;
	
	//Dont run/decrement timers if:
	//focus is lost
	//game does not exist
	//game is loading
	//game is paused
	//player doesnt exit
	//player entity is destroyed (not kileld in game, but really _killed)
	if (!ig.system.hasFocusLost() && ig.game && !ig.loading && !ig.game.paused && ig.game.playerEntity && ig.game.playerEntity._killed == false) {
		laserr();
		ice();
		lowGrav();
		hiGrav(); //high gravity will overwrite lowGrav if its active
	}
	
	//still update last time since run no matter what
	//lest the time decrement gets buffered and make the
	//previous state checks pointless
	lastTime=d.getTime();
}

function laserr() {
	if(timers.laser<=0 && !laser) {
		return;
	} else if (timers.laser<=0 && laser) {
		laser.kill();
		laser = null;
		return;
	}
	
	if(!laser || laser._killed){
		spawnLaser();
		//To counteract the timeDif including the latest timedif right as it spawns
		timers.laser+=timeDif;
	}
	timers.laser-=timeDif;
	if (timers.laser < 0) {
		timers.laser = 0;
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