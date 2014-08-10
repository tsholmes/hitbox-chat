
var utils = require("./utils");

function HitboxPoll(channel, params) {
  if (!utils.isa(this,HitboxPoll)) return new HitboxPoll(channel, params);

  this.channel = channel;

  this.onmessage(params);
}
HitboxPoll.prototype = {
  // internal update methods
  onmessage: function(params) {
    var notify = {};

    this.startTime = (params.start_time ? new Date(params.start_time) : this.startTime) || new Date();

    if (this.status == "started" && params.status == "paused") {
      notify.pause = true;
    } else if (this.status == "paused" && params.status == "started") {
      notify.start = true;
    } else if (this.status == "paused" && params.status == "ended") {
      notify.end = true;
    }
    this.status = params.status; // always sent

    this.question = params.question || this.question || "";
    this.choices = params.choices || this.choices || [];
    for (var i = 0; i < this.choices.length; i++) {
      this.choices[i].votes = Number(this.choices[i].votes);
    }
    this.voters = params.voters || this.voters || [];

    if (params.votes && params.votes != this.votes) {
      notify.vote = true;
    }
    this.votes = params.votes || this.votes || 0;

    for (var not in notify) {
      this.emit(not);
    }
  },
  // external API functions
  vote: function(choice) {
    if (this.status != "started") {
      throw "Poll is not currently running";
    }
    choice = Number(choice);
    if (!(choice >= 0 && choice < this.choices.length)) {
      throw "Invalid choice";
    }
    this.channel.send("votePoll", { choice: choice.toString() }, true);
  }
};
utils.mixin(HitboxPoll, utils.emitter);

module.exports = HitboxPoll;
