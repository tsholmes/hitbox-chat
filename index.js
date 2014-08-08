
var request = require("request");
var socketio_client = require("socket.io-client");
var utils = require("./utils");

function HitboxChatClient(user, token) {
  if (this.__proto__ != HitboxChatClient.prototype) return new HitboxChatClient(user, token);

  this.channels = {};
  this.user = user;
  this.token = token;
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
  send: function(method,params) {
    this.socket.emit("message", {
      method: method,
      params: params
    });
  },
  open: function() {
    var t = this;
    request("http://hitbox.tv/api/chat/servers", function(_,_,body){
      var servers = JSON.parse(body);
      var found = false;
      var sockets = [];
      for (var i = 0; i < servers.length; i++) {
        if (servers[i].server_type != "chat" || servers[i].server_enabled != "1") continue;
        var sock = socketio_client.connect("http://" + servers[i].server_ip);
        sockets.push(sock);
        sock.on("connect", function(){
          if (found) {
            this.disconnect();
            return;
          }
          found = true;
          t.onconnect(this);
        });
      }
    });
  },
  // external API functions
  joinChannel: function(channel) {
    if (!this.connected) {
      throw "WTF";
    }

    if (channel in this.channels) {
      return this.channels[channel];
    }

    var joinParams = {
      channel: channel,
      name: "UnknownSoldier",
      token: null,
      isAdmin: false
    };
    if (this.user && this.token) {
      joinParams.name = this.user;
      joinParams.token = this.token;
    }
    this.send("joinChannel", joinParams);

    return this.channels[channel] = new HitboxChannel(this,channel);
  }
}
utils.mixin(HitboxChatClient, utils.emitter);

function HitboxChannel(client, channel) {
  if (this.__proto__ != HitboxChannel.prototype) return new HitboxChannel(client, channel);

  this.channel = channel;
  this.client = client;
}
HitboxChannel.prototype = {
  // internal handlers
  onmessage: function(message) {
    if (message.method == "loginMsg") {
      this.emit("login", message.params.name, message.params.role);
    } else if (message.method == "chatMsg") {
      this.emit("chat", message.params.name, message.params.text, message.params.role);
    } else if (message.method == "motdMsg") {
      this.emit("motd", message.params.text);
    } else if (message.method == "slowMsg") {
      this.emit("slow", message.params.slowTime);
    } else if (message.method == "infoMsg") {
      this.emit("info", message.params.text);
    } else if (message.method == "pollMsg") {
      this.emit("poll", message.params.question, message.params.choices, message.params.voters);
    } else {
      // catch all so if something else happens its more visible
      this.emit("other", message.method, message.params);
    }
  }
}
utils.mixin(HitboxChannel, utils.emitter);

module.exports = HitboxChatClient;
