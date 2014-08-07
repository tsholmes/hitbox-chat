
var request = require("request");
var socketio_client = require("socket.io-client");

function HitboxChatClient(channel, user, token) {
  if (this.__proto__ != HitboxChatClient.prototype) return new HitboxChatClient(channel, user, token);

  this.callbacks = {};
  this.channel = channel;
  this.user = user;
  this.token = token;

  var t = this;

  openWebsocket(this.onconnect.bind(this));
}

module.exports = HitboxChatClient;

HitboxChatClient.prototype.on = function(type, callback) {
  if (!(type in this.callbacks)) {
    this.callbacks[type] = [];
  }
  this.callbacks[type].push(callback);
  return this;
}

HitboxChatClient.prototype.emit = function(type) {
  var args = Array.prototype.slice.call(arguments);
  args.shift();
  if (type in this.callbacks) {
    var cbs = this.callbacks[type];
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].apply(null, args);
    }
  }
}

HitboxChatClient.prototype.onconnect = function(socket) {
  var t = this;
  socket.on("message", function(data) {
    t.onmessage(JSON.parse(data));
  });
  socket.on("disconnect", function() {
    t.emit("disconnect");
  });
  var joinMsg = {
    method: "joinChannel",
    params: {
      channel: this.channel,
      name: "UnknownSoldier",
      token: null,
      isAdmin: false
    }
  };
  if (this.user && this.token) {
    joinMsg.params.name = this.user;
    joinMsg.params.token = this.token;
  }
  socket.emit("message", joinMsg);
}

HitboxChatClient.prototype.onmessage = function(message) {
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
  } else {
    // catch all so if something else happens its more visible
    this.emit("other", message.method, message.params);
  }
}

function openWebsocket(callback) {
  request("http://hitbox.tv/api/chat/servers", function(_,_,body){

    getFirstConnected(JSON.parse(body), callback);
  });
}

function getFirstConnected(servers, callback) {
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
      callback(this);
    });
  }
}
