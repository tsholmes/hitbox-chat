
var HitboxChatClient = require("./");
var readline = require("readline");

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("channel: ", function(answer) {
  var client = new HitboxChatClient().on("connect", function() {
    var channel = client.joinChannel(answer);
    channel.on("login", function(name, role) {
      console.log(name, role);
    }).on("chat", function(name,text,role) {
      console.log(name + ": " + text);
    }).on("motd", function(text) {
      console.log("=== " + text + " ===");
    }).on("slow", function(slowTime) {
      console.log("*** Slow mode: " + slowTime + "s ***");
    }).on("info", function(text) {
      console.log("--- " + text + " ---");
    }).on("poll", function(poll) {
      console.log("??? " + poll.question + " " + JSON.stringify(poll.choices));
    }).on("raffle", function(raffle) {
      console.log("!!! " + raffle.question + " " + JSON.stringify(raffle.choices));
    }).on("other", function(method,params) {
      console.log(method, params);
    });
  });
  rl.close();
});

