var assert = require("assert");
var Accessor = require("../Accessor");
var Generator = require("../Generator");

var ACS, GEN;

beforeEach(function() {
  GEN = new Generator({letters: 3, digits: 3});
  GEN.start();
});

afterEach(function() {
  GEN.stop();
});

describe("An Accessor", function() {
  it("gets next id", function(done) {
    ACS = new Accessor();
    ACS.next(function(err, id) {
      assert.equal(id, "AAA - 000", "Did not get next id");
      done();
    });
  });

  it("can ping generator", function(done) {
    ACS.ping(function(err) {
      assert.ok(! err, "Error thrown pinging generator");
      done();
    });
  });

  it("passes an error to callback if gen. is down", function(done) {
    GEN.stop();
    ACS.next(function(err, id) {
      assert.ok(err, "Error not passed to callback");
      done();
    });
  });

});

describe("Accessors", function() {
  it("allows more than 1 accessor", function(done) {
    var accessor1 = new Accessor();
    var accessor2 = new Accessor();
    accessor1.next(function(err, id) {
      assert.equal(id, "AAA - 000", "Accessor 1 got wrong ID");
    });
    process.nextTick(function() {
      accessor2.next(function(err, id) {
        assert.equal(id, "AAA - 001", "Accessor 2 got wrong ID");
        done();
      });
    });
  });
});
