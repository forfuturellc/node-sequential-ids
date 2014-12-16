/**
* A Generator produces unique ids
*/


// Module imports
var http = require("http");

// Importing the "debug" module only if we are running in DEBUG
// mode. This in turn makes the module a Dev-Dependency and NOT
// a hard dependency
var debug = process.env.DEBUG
  ? require("debug")("Sequential:Generator")
  : function() {};


/**
* increments a character e.g. incrementing character "P" returns "Q", the
* next consecutive character as in ASCII specifications..
*
* @param  {String}  character
* @return  {String}
*/
function incrementCharacter(character) {
  debug("incrementing character: %s", character);
  var charCode = character.charCodeAt(0);
  charCode++;
  return String.fromCharCode(charCode);
}


/**
* Returns true if the character appears after "Z". Else false
*
* @param  {String}  character
* @return  {Boolean}
*/
function isAfterZ(character) {
  debug("checking if character [%s] is after Z", character);
  if (character.charCodeAt(0) > 90) {return true;}
  return false;
}


/**
* increments a string of characters e.g. incrementing characters "aaa"
* returns "aab".
*
* @param  {String|Array}  characters
* @return  {String}
*/
function incrementCharacters(characters) {
  debug("incrementing the characters: %s", characters);
  function increment(charactersArray, targetIndex) {
    var targetCharacter = charactersArray[targetIndex];
    var nextCharacter = incrementCharacter(targetCharacter);
    if (isAfterZ(nextCharacter)) {
      charactersArray[targetIndex] = "A";
      charactersArray.unshift("A");
      return charactersArray;
    } else {
      charactersArray[targetIndex] = nextCharacter;
      return charactersArray;
    }
  }
  var charactersArray = characters.split("");
  var targetIndex = characters.length - 1;
  var nextCharacters = increment(charactersArray, targetIndex);
  return nextCharacters.join("");
}


/**
* pads letters with A's from the left until length of letters equals
* numOfLetters. Returns the padded string.
*
* @param  {String}  letters
* @param  {Number} numOfLetters
* @return   {String}
*/
function padWithAs(letters, numOfLetters) {
  debug("padding [%s] with %d number of letters", letters, numOfLetters);
  var numOfLettersToAdd = numOfLetters - letters.length;
  while (numOfLettersToAdd > 0) {
    letters = "A" + letters;
    numOfLettersToAdd--;
  }
  return letters;
}


/**
* increment a Number with a restriction of _max being the maximum
* value allowed. Returns null if maximum is reached.
*
* @param  {Number}  num
* @param  {Number}  _string
* @return   {Number}
*/
function incrementNumber(num, _max) {
  debug("incrementing the Number [%d] with Maximum of %d", num, _max);
  return num === _max ? null : ++num;
}


/**
* pads numbers with zeros from the left until the length of the
* num equals numOfDigits. Returns the padded string of numbers.
*
* @param  {Number|String}  num
* @param  {Number} numOfDigits
* @return   {String}
*/
function padWithZeros(num, numOfDigits) {
  debug("padding Number [%d] with %d of letters", num, numOfDigits);
  var number = num.toString();
  var numOfDigitsToAdd = numOfDigits - number.length;
  while(numOfDigitsToAdd > 0) {
    number = "0" + number;
    numOfDigitsToAdd--;
  }
  return number;
}


/**
* parses `id` into an object with its `.numbers` property set to the number
* part of the ID and its `.letters` property set to the letter part of the ID.
* If a part is not found, the respective property is set to an empty string.
* If no part could be found, null is returned instead.
* 
* @param  {String}  id
* @return   {Object}
*/
function parseId(id) {
  debug("parsing ID [%s] into an object", id);
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


/**
* Generates the next ID.
*
* @param  {String}  letters
* @param  {Number} numOfLetters
* @param  {Number|String}  numbers
* @param  {Number}  numOfDigits
* @return   {Object} .letters, .numbers, .id
*/
function generateId(letters, numOfLetters, numbers, numOfDigits) {
  debug("generating a new Id");
  var generateLetters = (letters !== "") && (numOfLetters > 0);
  var generateDigits = (numbers > -2) && (numOfDigits > 0);
  var nextId = {
    id: null,
    letters: null,
    numbers: null
  };
  var numberOverflow = false;

  if (generateDigits) {
    var _max = Math.pow(10, numOfDigits) - 1;
    nextId.numbers = incrementNumber(numbers, _max);
    if (nextId.numbers === null) {
      nextId.numbers = 0;
      numberOverflow = true;
    }
    nextId.numbers = padWithZeros(nextId.numbers, numOfDigits);
  }

   if ((generateLetters && ! generateDigits) ||
      (generateLetters && generateDigits && numberOverflow)) {
    nextId.letters = incrementCharacters(letters, numOfLetters);
    nextId.letters = padWithAs(nextId.letters, numOfLetters);
   } else if (generateLetters) {
    nextId.letters = padWithAs(letters, numOfLetters);
   }

  var temp = [];
  if (nextId.letters) {temp.push(nextId.letters);}
  if (nextId.numbers) {temp.push(nextId.numbers);}
  nextId.id = temp.join(" - ");
  return nextId;
}


/**
* Returns "_default" if "_var" is not an Integer or is "undefined"
*
* @param  {Integer}   _var
* @param  {Integer}   _default
* @return   {Integer}
*/
function int(_var, _default) {
  debug("Choosing between var [%d] and default [%d]", _var, _default);
  if (typeof(_var) === "undefined") return _default;
  var _int = parseInt(_var);
  return isNaN(_int) ? _default : _int;
}


/**
* Generator Class
*/
var Generator = (function() {

  /**
  * Constructor
  *
  * @options  {Object}  options
  */
  function Generator(options) {
    debug("creating new Generator instance");
    options = options || {};
    this.options = {};
    this.keys = {};
    this.options.port = int(options.port, 9876);
    this.options.autoAddKeys = options.autoAddKeys ? true : false;
    this.server;
    this._online;
    this._connecting;
    this.add('__default',options);
  }

  /**
  * Adds a new key for retrieving IDs
  *
  * @param  {String}  key
  * @param  {Object}  options
  */
  Generator.prototype.add = function(key, options){
    debug("adding new Key: %s", key);
    options = options || {};
    if(this.keys[key]) {return false;}
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

  /**
  * Generates a new ID. "key" being the key owning the ID.
  *
  * @param  {String}  key
  * @return   {String}
  */
  Generator.prototype.generate = function(key) {
    debug("generating new ID for Key: %s", key);
    if (!key) {key = '__default';}
    if (! this.keys[key]) {
      if (! this.options.autoAddKeys) {
        return null;
      }
      this.add(key);
    }
    var _new = generateId(this.keys[key].letters,
      this.keys[key].options.letters, this.keys[key].numbers,
      this.keys[key].options.digits);
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

  /**
  * Binds the Generator to the set port
  * "done" is called once the server is listening on the port
  *
  * @param  {Function} done
  */
  Generator.prototype.start = function(done) {
    debug("starting. taking generator online");
    done = done || function() {};
    if (this._online || this._connecting) {return done()};
    this._connecting = true;
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
    this.server.listen(this.options.port, function() {
      this._online = true;
      this._connecting = false;
      done();
    }.bind(this));
  };

  /**
  * Calls the Store function on the unsaved Ids, if any. "key" may refer
  * to the target IDs
  *
  * @param  {String} key
  */
  Generator.prototype.store = function(key) {
    debug("storing unsaved for key: %s", key);
    if (! key) {key = '__default';}
    if (this.keys[key].unsavedIds.length > 0) {
      this.keys[key].options.store(this.keys[key].unsavedIds);
    }
  };

  /**
  * Puts the generator offline. Stores all the unsaved IDs. Closes the
  * Server. Registers Generator as offline.
  */
  Generator.prototype.stop = function() {
    debug("stopping the Generator's server");
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
