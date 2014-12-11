var http = require("http");


function incrementLetter(letter) {
  if (letter === "Z") {
    return null;
  } else {
    var charCode = letter.charCodeAt(0);
    charCode++;
    return String.fromCharCode(charCode);
  }
}

function incrementLetters(letters) {
  letters = letters.split("");
  var idx = letters.length - 1;
  var nextLetter;
  while(1) {
    if (idx < 0) {
      letters.unshift("A");
      break;
    }
    nextLetter = incrementLetter(letters[idx]);
    if (! nextLetter) {
      letters[idx] = "A";
      idx--;
    } else {
      letters[idx] =  nextLetter;
      break;
    }
  }
  return letters.join("");
}

function fillLetters(letters, numLetters) {
  numLetters = numLetters - letters.length;
  while (numLetters > 0) {
    letters = "A" + letters;
    numLetters--;
  }
  return letters;
}

function incrementNumber(num, _max) {
  return num === _max ? null : ++num;
}

function fillZeros(num, numDigits) {
  var number = num.toString();
  numDigits = numDigits - number.length;
  while(numDigits > 0) {
    number = "0" + number;
    numDigits--;
  }
  return number;
}

function parseId(id) {
  if (! id) return null;
  id = id.trim();
  // NOTE: using \w in Regexp matches both digits and letters
  var ltrs = id.match(/^([A-z]*)\s*\-*/);
  var nums = id.match(/\-*\s*(\d*)$/);
  var result = {};
  if (ltrs || nums) {
    result.numbers = nums[1] || "";
    result.letters = ltrs[1] ? ltrs[1].toUpperCase() : "";
    return result;
  } else {
    return null;
  }
}

function generateId(letters, numLetters, numbers, numNumbers) {
  if (numLetters > 0 && numNumbers <= 0) {
    var nextLetters = incrementLetters(letters);
    var id = fillLetters(nextLetters, numLetters);
    return {id: id, letters: nextLetters, numbers: null};
  } else if (numLetters <= 0 && numNumbers > 0) {
    var nextNumber = incrementNumber(numbers);
    var id = fillZeros(nextNumber, numNumbers);
    return {id: id, letters: null, numbers: nextNumber};
  } else {
    var maxNumber = Math.pow(10, numNumbers) - 1;
    var nextNumber = incrementNumber(numbers, maxNumber);
    var nextLetters = letters;
    if (nextNumber === null) {
      nextNumber = 0;
      nextLetters = incrementLetters(letters);
    }
    var id = fillLetters(nextLetters, numLetters)
      + " - " + fillZeros(nextNumber, numNumbers);
    return {id: id, letters: nextLetters, numbers: nextNumber};
  }
}

function int(_var, _default) {
  if (typeof(_var) === "undefined") return _default;
  var _int = parseInt(_var);
  return isNaN(_int) ? _default : _int;
}

var Generator = (function() {
  function Generator(options) {
    options = options || {};
    this.options = {};
    this.keys = {};
    this.options.port = int(options.port, 9876);
    this.options.autoAddKeys = options.autoAddKeys ? true : false;
    this.server;
    this._started;
    this._stopped;
    this.add('__default',options);
  }

  Generator.prototype.add = function(key, options){
    options = options || {};
    if(this.keys[key]){ return false; }
    this.keys[key] = {};
    this.keys[key].options = {};
    this.keys[key].options.digits = int(options.digits, 6);
    this.keys[key].options.letters = int(options.letters, 3);
    this.keys[key].options.store = typeof(options.store) === "function"
      ? options.store : function() {}
    this.keys[key].options.store_freq = int(options.store_freq, 1);
    this.keys[key].options.restore = options.restore || null;
    this.keys[key].numbers = -1;
    this.keys[key].letters = "A";
    // workaround to get A's generated as first ids when
    // options.digits is 0
    if (options.digits === 0) {
      this.keys[key].letters = "@";
    }
    if (options.restore) {
      var result = parseId(options.restore);
      if (result) {
        this.keys[key].numbers = parseInt(result.numbers);
        this.keys[key].options.digits = result.numbers.length;
        this.keys[key].letters = result.letters;
        this.keys[key].options.letters = result.letters.length;
      }
    }
    this.keys[key].generatedIds = [];
    this.keys[key].unsavedIds = [];

    return true;
  };

  Generator.prototype.generate = function(key) {
    if(!key){ key = '__default'; }
    if(!this.keys[key]){
      if(!this.options.autoAddKeys){
        return null;
      }
      this.add(key);
    }
    var _new = generateId(this.keys[key].letters, this.keys[key].options.letters,
      this.keys[key].numbers, this.keys[key].options.digits);
    this.keys[key].letters = _new.letters;
    this.keys[key].numbers = _new.numbers;
    this.keys[key].generatedIds.push(_new.id);
    this.keys[key].unsavedIds.push(_new.id);
    if (this.keys[key].options.store_freq === this.keys[key].unsavedIds.length) {
      this.keys[key].options.store(this.keys[key].unsavedIds);
      this.keys[key].unsavedIds = [];
    }
    return _new.id;
  };

  Generator.prototype.start = function(done) {
    done = done || function() {};
    if (this._online) return;
    this.server = http.Server(function(req, res) {
      if(req.url.match(/(^\/\w+)(?:\/(\w+))?/)){
        var action = RegExp.$1, key = RegExp.$2 || '__default';
        switch(action) {
          case "/next":
            res.end(this.generate(key));
            break;
          case "/ping":
            res.end("pong");
            break;
        }
      }
    }.bind(this));
    this.server.listen(this.options.port, done);
    this._online = true;
  };

  Generator.prototype.store = function(key) {
    if(!key){ key = '__default'; }
    if (this.keys[key].unsavedIds.length > 0) this.keys[key].options.store(this.keys[key].unsavedIds);
  };

  Generator.prototype.stop = function() {
    if (! this._online) return;
    for(var key in this.keys){
      this.store(key);
    }
    this.server.close();
    this._online = false;
  };

  return Generator;
})();

exports = module.exports = Generator;
