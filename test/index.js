"use strict";

var async = require('async');
var assert = require('assert');

var linksAbsolutizer = require('..');

var tests = {

  setPath: [
    [ '/a/b/c', '/d/e', '/d/e' ],
    [ '/a/b/c', {
      path: '/d/e',
      setPath: true
    }, '/d/e' ]
  ],

  joinPath: [
    [ '/a/b/c', './d/e', '/a/b/c/d/e' ],
    [ '/a/b/c', {
      path: 'd/e',
      joinPath: true
    }, '/a/b/c/d/e' ]
  ],

  mergePath: [
    [ '/a/b/c', '+d/e', '/a/b/cd/e' ],
    [ '/a/b/c', {
      path: 'd/e',
      mergePath: true
    }, '/a/b/cd/e' ]
  ],

  setQuery: [
    [ '/a?b=1&c=2', '?d=3&e=4', '/a?d=3&e=4' ],
    [ '/a?b=1&c=2', {
      path: '?d=3&e=4',
      setQuery: true
    }, '/a?d=3&e=4' ]
  ],

  mergeQuery: [
    [ '/a?b=1&c=2', '&d=3&e=4', '/a?b=1&c=2&d=3&e=4' ],
    [ '/a?b=1&c=2', {
      path: '?d=3&e=4',
      mergeQuery: true
    }, '/a?b=1&c=2&d=3&e=4' ]
  ]

};

function buildResultWithHalLinks(key, href) {
  var links = {};

  links[key] = {
    href: href
  };

  return {
    _links: links
  };
}

function buildResultWithHalEmbededdLinks(key, href) {
  var links = {};

  links[key] = {
    href: href
  };

  return {
    _embedded: {
      test: {
        _links: links
      }
    }
  };
}

describe('links-absolutizer', function () {

  function testHandler(url, result, send, options, done) {
    if (!done) {
      done = options;
      options = {};
    }

    var req = {
      uri: url,
      url: url
    };

    var res = {
      send: send,
      result: result
    };

    var handler = linksAbsolutizer(options);

    handler(req, res, done);
  }

  describe('res.result', function () {

    it('should not send anything if no result is passed in res', function (done) {
      var result = null;

      testHandler(
        '',
        result,
        function () {
          assert.equal(true, false, 'should not pass here');
        },
        done
      );
    });

  });

  describe('options', function () {

    describe('rootPath', function () {

      it('should add ', function (done) {
        done();
      });

    });

    describe('embed', function () {

      it('should not add _embedded if options.embed is not set to true', function (done) {
        testHandler(
          '/',
          buildResultWithHalEmbededdLinks('test', '/b'),
          function (json) {
            assert.equal(json._embedded, undefined, 'should match');
          },
          {
            embed: false
          },
          done
        );
      });

      it('should add _embedded if options.embed is set to true', function (done) {
        testHandler(
          '/',
          buildResultWithHalEmbededdLinks('test', '/b'),
          function (json) {
            assert.notEqual(json._embedded, undefined, 'should not match');
          },
          {
            embed: true
          },
          done
        );
      });

      it('should add _embedded if embed is set in URL query even if options.embed is set to false', function (done) {
        testHandler(
          '/?embed',
          buildResultWithHalEmbededdLinks('test', '/b'),
          function (json) {
            assert.notEqual(json._embedded, undefined, 'should not match');
          },
          {
            embed: false
          },
          done
        );
      });

      it('should add empty links if links aren\'t set in _embedded', function (done) {
        testHandler(
          '/',
          {
            _embedded: {
              test: {}
            }
          },
          function (json) {
            assert.notEqual(json._embedded, undefined, 'should not match');
          },
          {
            embed: true
          },
          done
        );
      });

      it('should handle array  _embedded items', function (done) {
        testHandler(
          '/',
          {
            _embedded: {
              test: [
                buildResultWithHalLinks('test', 'a'),
                buildResultWithHalLinks('test', 'b')
              ]
            }
          },
          function (json) {
            assert.equal(json._embedded.test.length, 2, 'should match');
          },
          {
            embed: true
          },
          done
        );
      });

    });

  });

  describe('links', function () {

    describe('self', function () {

      it('should add a self link if not given', function (done) {
        testHandler(
          '/a',
          {},
          function (json) {
            assert.equal(json._links.self.href, '/a', 'should match');
          },
          done
        );
      });

    });

    describe('index', function () {

      it('should add an index link if self is different from rootPath', function (done) {
        testHandler(
          '/a',
          buildResultWithHalLinks('self', '/a'),
          function (json) {
            assert.equal(json._links.index.href, '/', 'should match');
          },
          done
        );
      });

      it('should not add an index link if self is same as rootPath', function (done) {
        testHandler(
          '/a',
          buildResultWithHalLinks('self', '/'),
          function (json) {
            assert.equal(json._links.index, undefined, 'should match');
          },
          done
        );
      });

    });

    describe('next', function () {

      it('should remove next link if same as index', function (done) {
        testHandler(
          '/a',
          buildResultWithHalLinks('next', '/'),
          function (json) {
            assert.equal(json._links.next, undefined, 'should match');
          },
          done
        );
      });

    });

  });

  describe('path handling', function () {

    var handler = linksAbsolutizer();

    function testPath(a, b, r, done) {
      var req = {
        uri: a,
        url: a
      };

      var result = {
        _links: {
          test: {
            href: b
          }
        }
      };

      var res = {
        send: function (json) {
          assert.equal(json._links.test.href, r, 'should match');
        },
        result: result
      };

      handler(req, res, done);
    }

    function testAllPaths(method, done) {
      async.forEach(tests[method], function (test, callback) {
        test.push(callback);

        testPath.apply(this, test);
      }, done);
    }

    it('should set path', testAllPaths.bind(this, 'setPath'));

    it('should join paths', testAllPaths.bind(this, 'joinPath'));

    it('should merge paths', testAllPaths.bind(this, 'mergePath'));

    it('should set query', testAllPaths.bind(this, 'setQuery'));

    it('should merge queries', testAllPaths.bind(this, 'mergeQuery'));

    it('should resolve href with self path if not beginning with special formatting character', function (done) {
      testHandler(
        '/a/b/c',
        buildResultWithHalLinks('test', 'd'),
        function (json) {
          assert.equal(json._links.test.href, '/a/b/d', 'should match');
        },
        done
      );
    });

    it('should not do anything if no href is set in link', function (done) {
      testHandler(
        '/',
        {
          _links: {
            test: {}
          }
        },
        function (json) {
          assert.equal(json._links.test.href, undefined, 'should match');
        },
        done
      );
    });

    it('should handle array links', function (done) {
      testHandler(
        '/',
        {
          _links: {
            test: [{
              href: 'a'
            }, {
              href: 'b'
            }]
          }
        },
        function (json) {
          assert.equal(json._links.test.length, 2, 'should match');
        },
        done
      );
    });

  });

});
