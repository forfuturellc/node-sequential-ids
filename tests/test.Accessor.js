var assert = require("assert");
var Accessor = require("../Accessor");
var Generator = require("../Generator");

var ACS, GEN;

beforeEach(function(done) {
  GEN = new Generator({letters: 3, digits: 3});
  GEN.start(done);
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

  it("passes an error to callback if key does not exist", function(done) {
    ACS.next('newKey', function(err, id) {
      assert.ok(err, "Can't generate an ID for undefined key 'newKey'");
      done();
    });
  });


  it("gets ID from new key if generator has autoAddKeys set", function(done) {
    var GEN2 = new Generator({autoAddKeys: true, port: 2327});
    GEN2.start();
    var ACS2 = new Accessor(2327);

    assert.doesNotThrow(function(){
      ACS2.next('newKey',function(err, id){
        assert.equal(id, "AAA - 000000", "Did not get next id");
        GEN2.stop();
        done();
      });
    }, 'Error passed to callback');
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
