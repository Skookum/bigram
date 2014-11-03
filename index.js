/* MIT License. Copyright (c) 2014 Skookum Digital Works */

(function (root, factory) {
  if (typeof exports === 'object')
    module.exports = factory();
  else if (typeof define === 'function' && define.amd)
    define([], factory);
  else
    root['bigram'] = factory();
}(this, function () {

  var BIGRAM = 2;

  var blurred = Blurred.prototype;
  var node = Node.prototype;

  var intersection = function(a1, a2) {
    var a1i = 0,
    a2i = 0,
    a1l = a1.length,
    a2l = a2.length,
    r = [];

    while (a1i < a1l && a2i < a2l) {
      if (a1[a1i] < a2[a2i]) a1i++;
      else if (a1[a1i] > a2[a2i]) a2i++;
      else {
        r.push(a1[a1i]);
        a1i++; a2i++;
      }
    }

    return r;
  };

  var sort = function(array, comparator) {
    var length = array.length;

    if (1 === length) return array;
    var left = sort(array.slice(0, length/2), comparator),
    right = sort(array.slice(length/2), comparator);
    return merge(left, right, comparator);
  };

  var merge = function(a1, a2, fn) {
    var result = [],
    a1l = a1.length,
    a2l = a2.length;

    while (0 < a1l || 0 < a2l) {
      if (0 < a1l && 0 < a2l) {
        var a1v = a1[0],
        a2v = a2[0];

        if (fn(a1v, a2v)) {
          result.push(a1.shift());
          a1l--;
        } else {
          result.push(a2.shift());
          a2l--;
        }
      } else if (0 < a1l) {
        result.push(a1.shift());
        a1l--;
      } else if (0 < a2l) {
        result.push(a2.shift());
        a2l--;
      }
    }

    return result;
  };

  var ngrams = function(s, n) {
    s = s.toString().replace(/[^A-Za-z0-9]/g, "").toLowerCase();

    var r = [],
    i = s.length - n + 1;

    if (i < 1)
      return r;

    while (i--)
      r[i] = s.substr(i, n);

    return r;
  };

  function Node(value, grams, object) {
    this._value = value;
    this._object = object;
    this._vector = grams.reduce(function(vector, gram) {
      if ("undefined" === typeof(vector[gram])) {
        vector[gram] = 1;
      } else {
        vector[gram]++;
      }

      return vector;
    }, {});
    this._keys = sort(Object.keys(this._vector), function(a,b) { return a < b; });
    this._similarity = 0;
  }

  node.similarity = function(o) {
    var v1 = this._vector,
    v2 = o._vector,
    k1 = this._keys,
    k2 = o._keys,
    i = intersection(k1, k2),
    n = i.reduce(function(p, c) { return p + v1[c] * v2[c]; }, 0),
    s1 = k1.reduce(function(p, c) { return p + Math.pow(v1[c], 2); }, 0),
    s2 = k2.reduce(function(p, c) { return p + Math.pow(v2[c], 2); }, 0)
    d = Math.sqrt(s1) * Math.sqrt(s2);

    return (0 === d ? 0 : n/d);
  };

  function Blurred(o) {
    if (!(this instanceof Blurred))
      return new Blurred(o);

    var self = this;

    this._gramSize = o.gramSize || BIGRAM;
    this._dictionary = o.collection.reduce(function(dictionary, object) {
      var value = o.mapper(object),
      grams = ngrams(value, self._gramSize),
      node = new Node(value, grams, object);

      grams.forEach(function(gram) {
        if ("undefined" === typeof(dictionary[gram]))
          dictionary[gram] = [];

        dictionary[gram].push(node);
      });

      return dictionary;
    }, {});
  }

  blurred.search = function(string, threshold) {
    var dictionary = this._dictionary,
    grams = ngrams(string, this._gramSize),
    matches = grams.reduce(function(array, gram) {
      if ("undefined" === typeof(dictionary[gram]))
        return array;
      var set = dictionary[gram];
      for (var i = 0, il = set.length; i < il; i++)
      if(0 === ~array.indexOf(set[i]))
        array.push(set[i]);
      return array;
    }, []),
    results = [];

    var test = new Node(string, grams);

    for (var i = 0, il = matches.length; i < il; i++) {
      var similarity = matches[i].similarity(test)
      if (threshold <= similarity) {
        matches[i]._similarity = similarity;
        results.push(matches[i]);
      }
    }

    if (1 >= results) return results;
    return sort(results, function(a, b) { return a._similarity > b._similarity})
      .map(function(m) { m._similarity = 0; return m._object; });
  };

  return Blurred;
}));

