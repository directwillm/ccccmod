currentCommands = [];
	
function start() 
{
	console.log('starting');
	setInterval(()=>
	{
		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = ()=>
		{
			if (this.readyState == 4 && this.status == 200) 
			{
				console.log(this.responseText);
				let commands = JSON.parse(this.responseText);
				
				if (commands === undefined || commands.length ==0)
				{
					console.log("no commands");
				} 
				else 
				{
					currentCommands = currentCommands.concat(commands);
				}
			}
		}
		xhttp.open("GET", "http://localhost:8080/api/nextCommands", true);
		xhttp.send();
	}
	, 5000);
}
	
function next() 
{
	let cmd = currentCommands[0];
	currentCommands.shift();
	return cmd;
	
}



console.log('?');
sc.TwitchCrowdControl = ig.GameAddon.extend({
  init() {
    this.parent("TwitchCrowdControl");
	start();
  },

  onPreUpdate() {
    // ...
  },

  onPostUpdate() {
    // ...
  },
});

ig.addGameAddon(() => new sc.TwitchCrowdControl());