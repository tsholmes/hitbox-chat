
var request = require("request");
var zlib = require("zlib");

utils = module.exports = {
  mixin: function(func, mix) {
    for (var method in mix) {
      func.prototype[method] = mix[method];
    }
  },
  extend: function(func, parent) {
    for (var method in parent.prototype) {
      func.prototype[method] = parent.prototype[method];
    }
    func.prototype.super = parent;
  },
  isa: function(t,clazz) {
    if (t.__proto__ == clazz.prototype) return true;
    var cur = t.__proto__.super;
    while (cur) {
      if (cur == clazz) return true;
      cur = cur.prototype.super;
    }
    return false;
  },
  super: function(t,clazz) {
    clazz.prototype.super.apply(t,Array.prototype.slice.call(arguments, 2));
  },
  emitter: {
    on: function(type, callback) {
      if (!this._callbacks) this._callbacks = {};
      if (!(type in this._callbacks)) {
        this._callbacks[type] = [];
      }
      this._callbacks[type].push(callback);
      return this;
    },
    emit: function(type) {
      if (!this._callbacks) this._callbacks = {};
      var args = Array.prototype.slice.call(arguments);
      args.shift();
      if (type in this._callbacks) {
        var cbs = this._callbacks[type];
        for (var i = 0; i < cbs.length; i++) {
          cbs[i].apply(this, args);
        }
      }
    }
  },
  safeRequest: function(opts, callback) {
    opts.encoding = null;
    request(opts, function(_,res,body){
      var encoding = res.headers["content-encoding"] || "";
      if (~encoding.indexOf("gzip") || ~encoding.indexOf("deflate")) {
        zlib.unzip(body, function(_,data){callback(data.toString());});
      } else {
        callback(body.toString());
      }
    });
  },
  safeGet: function(url, callback) {
    utils.safeRequest({url:url}, callback);
  },
  safePost: function(url, form, callback) {
    utils.safeRequest({url:url, method: "POST", form: form}, callback);
  }
}
