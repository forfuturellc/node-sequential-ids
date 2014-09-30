var http = require("http");


var Accessor = (function() {
  function Accessor(port) {
    this.port = port || 9876;
    this.url = "http://localhost:" + this.port;
    http.get(this.url + "/ping").on("error", function(err) {
      throw err;
    });
  }

  Accessor.prototype.next = function(callback) {
    callback = callback || function() {};
    http.get(this.url + "/next", function(res) {
      var id = "";
      res.setEncoding("utf8");
      res.on("data", function(data) {id += data;});
      res.on("end", function() {callback(id);});
    });
  };

  return Accessor;
})();

exports = module.exports = Accessor;
