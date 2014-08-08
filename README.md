hitbox-chat
===========

A chat client library for hitbox.tv

Usage
-----

```
var HitboxChatClient = require("hitbox-chat");

// (username, token) or () for guest
var client = new HitboxChatClient("tsholmes", "0123456789abcdef0123456789abcdef01234567");
client.on("connect", function() {
  // handle connect
  var channel = client.joinChannel("tsholmes");
  channel.on("login", function(name, role) {
    /*
     * successfully joined channel
     * role is one of {
     *   guest: read-only (bad or no credentials)
     *   anon: normal read/write
     *   mod?
     *   admin?
     * }
     */
  }).on("chat", function(name,text,role) {
    // chat message received
  }).on("motd", function(text) {
    // message of the day changed
  }).on("slow", function(slowTime) {
    // slow mode enabled. limited to 1 message every slowTime seconds
  }).on("info", function(text) {
    // info message (bans, kicks, etc)
  }).on("other", function(method,params) {
    // something else that isn't handled yet. params is raw event JSON
  });
}).on("disconnect", function() {
  // handle disconnect
});
```
