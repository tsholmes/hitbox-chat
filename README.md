# hitbox-chat

A chat client library for hitbox.tv

## API

### HitboxChatClient

#### HitboxChatClient(opts:Object)
Constructs a hitbox.tv chat client. Exposed as the result of calling `require("hitbox-chat")`
```
opts = null
     | { user: "tsholmes", pass: "hunter2" }
     | { user: "tsholmes", token: "0123456789abcdef0123456789abcdef0123457" }
```

#### HitboxChatClient#on(event:String, callback:Function)
Adds an event listener
```
(event, callback) = ("connect",    Function())
                  | ("disconnect", Function());
```

#### HitboxChatClient#joinChannel(channel:String):HitboxChannel
Joins a channel and returns the channel object

### HitboxChannel

#### HitboxChannel#on(event:String, callback:Function)
Adds an event listener
```
(event, callback) = ("login", Function(name:String, role:String))
                  | ("chat",  Function(name:String, text:String, role:String))
                  | ("motd",  Function(text:String))
                  | ("slow",  Function(slowTime:Number))
                  | ("info",  Function(text:String))
                  | ("poll",  Function(poll:HitboxPoll))
                  | ("other", Function(method:String, params:Object)
```

#### HitboxChannel#join()
(Re)joins the channel with the credentials specified in the client.

#### HitboxChannel#leave()
Leaves the channel. Stops receiving events on this channel (once the server receives the leave request).

#### HitboxChannel#sendMessage(text:String, nameColor:String)
Sends a message to this channel with the given name color (or the default color if null)

#### HitboxChannel#votePoll(choice:Number)
Votes for the current poll with the choice specified by (0-based) index `choice`.

#### HitboxChannel#defaultColor:String
The default name color when sending messages

### HitboxPoll

#### HitboxPoll#on(event:String, callback:Function)
Adds an event listener
```
(event, callback) = ("pause", Function())
                  | ("start", Function()) // sent on restart after pause
                  | ("vote",  Function()) // sent when (every time?) someone new votes
                  | ("end",   Function())
```

#### HitboxPoll#vote(choice:Number)
Votes for the choice specified by (0-based) index `choice`.

#### HitboxPoll#startTime:Date
The time the poll was started

#### HitboxPoll#status:String
The status of the poll. One of `{ started, paused, ended }`.

#### HitboxPoll#question:String
The question the poll is asking.

#### HitboxPoll#choices:Array[Object]
The choices for responding to the poll.
```
choices = [
  { text: "choice 0", votes: 1 },
  { text: "choice 1", votes: 4 },
  ...
]
```

#### HitboxPoll#voters:Array[String]
The list of usernames that voted in the poll.

#### HitboxPoll#votes:Number
The number of votes cast in the poll. (same as `voters.length`)

##Example Usage

```
var HitboxChatClient = require("hitbox-chat");

// (username, token) or () for guest
var client = new HitboxChatClient({user:"tsholmes", pass:"hunter2"});
client.on("connect", function() {
  // handle connect
  var channel = client.joinChannel("tsholmes");
  channel.on("login", function(name, role) {
    /*
     * successfully joined channel
     * role is one of {
     *   guest: read-only (bad or no credentials)
     *   anon: normal read/write
     *   user: mod
     *   admin: owner/staff
     * }
     */
  }).on("chat", function(name,text,role) {
    // chat message received
    channel.sendMessage("Hi " + name, "00FF00");
  }).on("motd", function(text) {
    // message of the day changed
  }).on("slow", function(slowTime) {
    // slow mode enabled. limited to 1 message every slowTime seconds
  }).on("info", function(text) {
    // info message (bans, kicks, etc)
  }).on("poll", function(poll) {
    // poll started
    poll.vote(0);
  }).on("other", function(method,params) {
    // something else that isn't handled yet. params is raw event JSON
  });
}).on("disconnect", function() {
  // handle disconnect
});
```
