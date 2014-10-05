var assert = require("assert");
var http = require("http");
var Generator = require("../Generator");

var GEN;

describe("A Generator", function() {
  it("should generate a new ID", function() {
    GEN = new Generator();
    var id = GEN.generate();
    assert(id.search(/^(\w+) - (\d+)$/) >= 0);
  });

  it("stores IDs depending on the store frequency", function(done) {
    var calls = 0;
    function store(IDs) {
      assert(IDs.length <= 3, "Store frequency not respected");
      calls++;
      if (calls === 4) done();
    }
    GEN = new Generator({store_freq: 3, store: store});
    for(var idx = 0; idx < 10; idx++) {
      GEN.generate();
    }
    GEN.store(); // remaining ids
  });

  it("restores from a saved ID", function() {
    GEN = new Generator({restore: "AA - 011"});
    assert.equal("AA - 012", GEN.generate(), "Incorrect Restoration");
  });

  it("respects number of digits and letters", function() {
    GEN = new Generator({digits: 5, letters: 2});
    var id = GEN.generate();
    assert.equal(id, "AA - 00000", "no. of letters & digits not respected");
  });

  it("handles number overflow", function() {
    GEN = new Generator({restore: "A - 999"});
    var id = GEN.generate();
    assert.equal(id, "B - 000", "number overflow error");
  });

  it("handles letter overflow", function() {
    GEN = new Generator({restore: "Z - 999"});
    var id = GEN.generate();
    assert.equal(id, "AA - 000", "letter overflow error");
  });

  it("allows ignoring numbers part using .digits option", function() {
    GEN = new Generator({digits: 0, letters: 3});
    var id = GEN.generate();
    assert.equal(id, "AAA", "numbers part not ignored");
    id = GEN.generate();
    assert.equal(id, "AAB", "failed incrementing letters when numbers ignored");
  });

  it("allows ignoring numbers using a restore id", function() {
    GEN = new Generator({restore: "AA"});
    var id = GEN.generate();
    assert.equal(id, "AB", "failed when restore id used to ignore number part");

  });

  it("allows ignoring letters part using .digits option", function() {
    GEN = new Generator({digits: 3, letters: 0});
    var id = GEN.generate();
    assert.equal(id, "000", "letters part not ignored");
  });

  it("allows ignoring letters using a restore id", function() {
    GEN = new Generator({restore: "0023"});
    var id = GEN.generate();
    assert.equal(id, "0024", "Lettes part not ignored");
  });

});

describe("A Generator Server", function() {
  it("starts a server", function(done) {
    GEN = new Generator({port: 8765});
    GEN.start();
    http.get("http://localhost:8765/ping", function(res) {
      done();
    });
  });

  it("serves ids off its port", function(done) {
    GEN = new Generator({digits: 3, letters: 3, port: 9999});
    GEN.start();
    http.get("http://localhost:9999/next", function(res) {
      var id = "";
      res.setEncoding("utf8");
      res.on("data", function(data) {
        id += data;
      });
      res.on("end", function() {
        assert.equal(id, "AAA - 000", "Got incorrect ID");
        GEN.stop();
        done();
      });
    });
  });

  it("silently ignores repeated .start invocations", function() {
    assert.doesNotThrow(function() {
      var generator = new Generator({port: 8122});
      generator.start();
      generator.start();
      generator.start();
    });
  });

  it("silently ignores repeated .stop invocations", function() {
    assert.doesNotThrow(function() {
      var generator = new Generator({port: 8132});
      generator.start();
      generator.stop();
      generator.stop();
      generator.stop();
    });
  });

  it("silently ignores .stop invocation before .start invocation", function() {
  assert.doesNotThrow(function() {
      var generator = new Generator();
      generator.stop();
    });
  });

});

describe("Generators", function() {
  it("allows more than 1 generator", function() {
    var generator1 = new Generator({port: 7667, letters: 3, digits: 3});
    var generator2 = new Generator({port: 8877, letters: 3, digits: 3});
    assert.equal(generator1.generate(), "AAA - 000", "Got incorrect ID");
    assert.equal(generator2.generate(), "AAA - 000", "Got incorrect ID");
  });
});
