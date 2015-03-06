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

describe('links-absolutizer', function () {

  var res = {
    send: function () {}
  };

  var handler = linksAbsolutizer();

  describe('res.result', function () {

    it('should return if no result is passed in res', function (done) {
      done();
    });

  });

  describe('options', function () {

    describe('rootPath', function () {

      it('should add ', function (done) {
        done();
      });

    });

  });

  describe('links', function () {

    describe('self', function () {

      it('should', function (done) {
        done();
      });

    });

    describe('index', function () {

      it('should add an index link if self is different from rootPath', function (done) {
        var req = {
          uri: 'http://test.com/a',
          url: '/a'
        };

        var res = {
          send: function (json) {
            assert.equal(json._links.index.href, 'http://test.com/', 'should match');
          },
          result: {
            _links: {}
          }
        };

        handler(req, res, done);
      });

      it('should add a self link if not given', function (done) {
        var req = {
          uri: 'http://test.com/a',
          url: '/a'
        };

        var res = {
          send: function (json) {
            assert.equal(json._links.index.href, 'http://test.com/', 'should match');
          },
          result: {
            _links: {}
          }
        };

        handler(req, res, done);
      });

    });

    describe('next', function () {

      it('should', function (done) {
        done();
      });

    });

  });

  describe('path handling', function () {

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

    function testHandler(method, done) {
      async.forEach(tests[method], function (test, callback) {
        test.push(callback);

        testPath.apply(this, test);
      }, done);
    }

    it('should set path', testHandler.bind(this, 'setPath'));

    it('should join paths', testHandler.bind(this, 'joinPath'));

    it('should merge paths', testHandler.bind(this, 'mergePath'));

    it('should set query', testHandler.bind(this, 'setQuery'));

    it('should merge queries', testHandler.bind(this, 'mergeQuery'));

  });

});
