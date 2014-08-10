
var utils = require("./utils");

function Credential() {
  if (!utils.isa(this, Credential)) {
    throw "Cannot instantiate abstract Credential";
  }
  this.ready = false;
  this.waiters = [];
}
Credential.prototype = {
  markReady: function() {
    this.ready = true;
    this.consumeQueue();
  },
  consumeQueue: function() {
    var callback;
    while (callback = this.waiters.shift()) {
      callback(this.name, this.token);
    }
  },
  withCredential: function(callback) {
    this.waiters.push(callback);
    if (this.ready) {
      this.consumeQueue();
    }
  }
};

function ImmediateCredential(name, token) {
  if (!utils.isa(this, ImmediateCredential)) return new ImmediateCredential(name, token);
  utils.super(this, ImmediateCredential);

  this.name = name;
  this.token = token;

  this.markReady();
}
utils.extend(ImmediateCredential, Credential);

function DummyCredential() {
  if (!utils.isa(this, DummyCredential)) return new DummyCredential();
  utils.super(this, DummyCredential, "UnknownSoldier", null);
}
utils.extend(DummyCredential, ImmediateCredential);

function UserPassCredential(name, password) {
  if (!utils.isa(this, UserPassCredential)) return new UserPassCredential(name, password);
  utils.super(this, UserPassCredential);

  this.name = name;

  var t = this;
  utils.safePost("https://api.hitbox.tv/auth/token", {
    login: name,
    pass: password,
    app: "desktop"
  }, function(data) {
    data = JSON.parse(data);
    t.token = data.authToken;
    t.markReady();
  });
}
utils.extend(UserPassCredential, Credential);

module.exports = {
  Immediate: ImmediateCredential,
  Dummy: DummyCredential,
  UserPass: UserPassCredential
};
