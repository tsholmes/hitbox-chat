
var utils = require("./utils");

function HitboxRaffle(channel, params) {
  if (!utils.isa(this,HitboxRaffle)) return new HitboxRaffle(channel, params);

  this.channel = channel;

  this.onmessage(params);
}
HitboxRaffle.prototype = {
  // internal update methods
  onmessage: function(params) {
    var notify = {};

    this.admin = params.forAdmin || false;
    this.question = params.question || this.question || "";
    this.choices = params.choices || this.choices || [];
    this.startTime = (params.start_time ? new Date(params.start_time) : this.startTime) || new Date();

    if (this.status == "started" && params.status == "started") {
      notify.vote = true;
    } else if (this.status != "started" && params.status == "started") {
      notify.start = true;
    } else if (this.status != "paused" && params.status == "paused") {
      notify.pause = true;
    } else if (this.status != "ended" && params.status == "ended") {
      notify.end = true;
    } else if (this.status != "hidden" && params.status == "hidden") {
      notify.hide = true;
    } else if (this.status != "deleted" && params.status == "deleted") {
      notify.delete = true;
    }
    this.status = params.status;

    for (var not in notify) {
      this.emit(not);
    }
  },
  onwinner: function(params) {
    if (params.forAdmin) {
      this.emit("winner", params.winner_name, params.winner_email);
    } else {
      this.emit("win");
    }
  },
  // external API functions
  vote: function(choice) {
    if (this.status != "started") {
      throw "Raffle is not currently running";
    }
    choice = Number(choice);
    if(!(choice >= 0 && choice < this.choices.length)) {
      throw "Invalid choice";
    }
    this.channel.send("voteRaffle", { choice: choice.toString() });
  }
};
utils.mixin(HitboxRaffle, utils.emitter);

module.exports = HitboxRaffle;
