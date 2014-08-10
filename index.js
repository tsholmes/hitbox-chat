
var socketio_client = require("socket.io-client");
var utils = require("./lib/utils");
var credential = require("./lib/credential");
var HitboxChannel = require("./lib/channel");

function HitboxChatClient(opts) {
  if (!utils.isa(this, HitboxChatClient)) return new HitboxChatClient(opts);

  opts = opts || {};

  if (opts.name && opts.token) {
    this.credential = new credential.Immediate(opts.name, opts.token);
  } else if (opts.name && opts.pass) {
    this.credential = new credential.UserPass(opts.name, opts.pass);
  } else {
    this.credential = new credential.Dummy();
  }

  this.channels = {};
  this.connected = false;

  this.open();
}
HitboxChatClient.prototype = {
  // internal handlers
  onconnect: function(socket) {
    this.connected = true;
    var t = this;
    this.socket = socket;
    socket.on("message", function(data) {
      t.onmessage(JSON.parse(data));
    });
    socket.on("disconnect", function() {
      t.emit("disconnect");
    });
    this.emit("connect");
  },
  onmessage : function(message) {
    var channel = message.params.channel;
    if (channel in this.channels) {
      this.channels[channel].onmessage(message);
    } else {
      throw "Unknown channel " + channel;
    }
  },
  // internal websocket functions
  send: function(method, params, auth) {
    var t = this;
    this.credential.withCredential(function(name, token) {
      params.name = name;
      if (auth) {
        params.token = token;
      }
      t.socket.emit("message", {
        method: method,
        params: params
      });
    });
  },
  open: function() {
    var t = this;
    utils.safeGet("http://www.hitbox.tv/api/chat/servers?redis=true", function(body){
      var servers = JSON.parse(body);
      var sock = socketio_client.connect("http://" + servers[0].server_ip);
      sock.on("connect", function() {
        t.onconnect(sock);
      });
    });
  },
  // external API functions
  joinChannel: function(channel) {
    if (!this.connected) {
      throw "WTF";
    }

    var ch = this.channels[ch];

    if (!ch) {
      ch = this.channels[channel] = new HitboxChannel(this, channel);
    }

    ch.join();

    return ch;
  }
}
utils.mixin(HitboxChatClient, utils.emitter);

module.exports = HitboxChatClient;
