
module.exports = {
  mixin: function(func, mix) {
    for (var method in mix) {
      func.prototype[method] = mix[method];
    }
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
  }
}
