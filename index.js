
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
    console.log({method:method,params:params});
    this.socket.emit("message", {
      method: method,
      params: params
    });
  },
  open: function() {
    var t = this;
    utils.safeRequest("http://www.hitbox.tv/api/chat/servers?redis=true", function(body){
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

    if (channel in this.channels) {
      return this.channels[channel];
    }

    var ch = this.channels[channel] = new HitboxChannel(this,channel);

    ch.join();

    return ch;
  }
}
utils.mixin(HitboxChatClient, utils.emitter);

function HitboxChannel(client, channel) {
  if (this.__proto__ != HitboxChannel.prototype) return new HitboxChannel(client, channel);

  this.channel = channel;
  this.client = client;
  this.joined = false;
  this.loggedIn = false;
  this.role = null;
  this.name = null;
  this.defaultColor = "0000FF";
}
HitboxChannel.prototype = {
  // internal handlers
  onmessage: function(message) {
    if (message.method == "loginMsg") {
      this.loggedin = true;
      this.name = message.params.name;
      this.role = message.params.role;
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
  },
  // external handlers
  join: function() {
    if (this.joined) {
      return;
    }
    var joinParams = {
      channel: this.channel,
      name: "UnknownSoldier",
      token: null,
      isAdmin: false
    };
    if (this.client.user && this.client.token) {
      joinParams.name = this.client.user;
      joinParams.token = this.client.token;
    }
    this.joined = true;
    this.client.send("joinChannel", joinParams);
  },
  leave: function() {
    if (!this.joined) {
      return;
    }
    this.client.send("partChannel", {
      channel: this.channel,
      name: this.name
    });
    this.joined = false;
    this.loggedIn = false;
    this.role = null;
    this.name = null;
  },
  sendMessage: function(text,nameColor) {
    var color = nameColor || this.defaultColor;
    this.client.send("chatMsg", {
      channel: this.channel,
      name: this.name,
      nameColor: color,
      text: text
    });
  },
  votePoll: function(choice) {
    this.client.send("votePoll", {
      channel: this.channel,
      name: this.name,
      token: this.client.token,
      choice: choice.toString()
    });
  }
}
utils.mixin(HitboxChannel, utils.emitter);

module.exports = HitboxChatClient;
