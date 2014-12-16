/**
* Accessors allow accessing the same Generator across different
* processes
*/


// Module imports
var http = require("http");

// Just as in ./Generator.js the "debug" module will only be required as
// a devDependency as we do NOT depend on it to function well
var debug = process.env.DEBUG
  ? require("debug")("Sequential:Accessor")
  : function() {};


// Defintion of an Accessor
var Accessor = (function() {
  /**
  * Constructor for an Accessor. "port" is the port number of the port
  * which the accessor should listen on. Defaults to 9876.
  *
  * @param  {Number}  port
  */
  function Accessor(port) {
    debug("Instantiating an Accessor");
    this.port = port || 9876;
    this.url = "http://localhost:" + this.port;
  }

  /**
  * Pinging the Generator to see if its online
  *
  * @param  {Function}  callback(err)
  */
  Accessor.prototype.ping = function(callback) {
    debug("pinging Generator at Port: %d", this.port);
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

  /**
  * Asking Generator for the next ID. The Id is passed to the callback.
  *
  * @param  {String}  key [Optional]
  * @param  {Function} callback(err, id)
  */
  Accessor.prototype.next = function(key, callback) {
    debug("Asking for the next ID from the Generator");
    if (typeof key === "function") {
      callback = key;
      key = "";
    } else {
      callback = callback || function() {};
    }
    var url = this.url + "/next" + (key ? '/'+key : '');

    http.get(url, function(res) {
      var id = "";
      res.setEncoding("utf8");
      res.on("data", function(data){id += data;});
      res.on("end", function(){
        if(id === ''){
          return callback(new Error("Can't generate an ID for undefined \
            key '"+key+"'"));
        }
        callback(null, id);
      });
    }).on("error", function(err) {
      callback(err);
    });
  };

  return Accessor;
})();


// Module exports
exports = module.exports = Accessor;
