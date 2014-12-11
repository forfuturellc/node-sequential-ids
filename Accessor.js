var http = require("http");


var Accessor = (function() {
  function Accessor(port) {
    this.port = port || 9876;
    this.url = "http://localhost:" + this.port;
  }

  Accessor.prototype.ping = function(callback) {
    callback = callback || function() {};
    http.get(this.url + "/ping", function(res) {
      // Waiting for the `end` event seems to require that
      // we first listen to `data` event Otherwise, the
      // callback wont be fired.
      res.on("data", function(){});
      res.on("end", function() {callback(null);});
    }).on("error", function(err) {
      callback(err);
    });
  };

  Accessor.prototype.next = function() {
    var key, callback;
    if(arguments.length === 1){
      if(typeof arguments[0] === 'function'){
        callback = arguments[0];
      }
      else if(typeof arguments[0] === 'string'){
        key = arguments[0];
      }
    }
    if(arguments.length > 1){
      key = arguments[0];
      callback = arguments[1];
    }

    callback = callback || function() {};
    var url = this.url + "/next" + (key ? '/'+key : '');

    http.get(url, function(res) {
      var id = "";
      res.setEncoding("utf8");
      res.on("data", function(data){id += data;});
      res.on("end", function(){
        if(id === ''){
          return callback(new Error("Can't generate an ID for undefined key '"+key+"'"));
        }
        callback(null, id);
      });
    }).on("error", function(err) {
      callback(err);
    });
  };

  return Accessor;
})();

exports = module.exports = Accessor;
