/* global require, module */

'use strict';

var url = require('url');
var path = require('path');

var url42 = require('url42');

function linksAbsolutizer(options) {
  if (! options) {
    options = {};
  }

  var rootPath = options.rootPath || '/';
  var embedByDefault = options.embed !== undefined ? options.embed : true;

  function formatLinkHref(baseUri, link) {
    var href = link.href;

    if (! href) {
      return;
    }

    var parsedBase = url42(baseUri);

    if (typeof href === 'string') {
      if (href[0] === '/') {
        parsedBase.setPath(href);
      }

      if (href[0] === '.') {
        parsedBase.joinPath(href);
      }

      if (href[0] === '+') {
        parsedBase.mergePath(href.path || href.substr(1));
      }

      if (~href.indexOf('?')) {
        parsedBase.setQuery(href);
      }

      if (href[0] === '&') {
        parsedBase.mergeQuery(href.path || ('?' + href.substr(1)));
      }
    } else {
      var path = href.path;

      if (href.setPath) {
        parsedBase.setPath(path);
      }

      if (href.joinPath) {
        parsedBase.joinPath(path);
      }

      if (href.mergePath) {
        parsedBase.mergePath(href.path);
      }

      if (href.setQuery) {
        parsedBase.setQuery(path);
      }

      if (href.mergeQuery) {
        parsedBase.mergeQuery(href.path);
      }
    }

    if (parsedBase.changed){
      link.href = url.format(parsedBase);
      return;
    }

    link.href = url.resolve(baseUri, href);
  }

  function absolutizeLinks(baseUri, item, addEmbed) {
    var links = item._links;

    if (! links) {
      // console.error('absolutizeLinks:', item);
      // throw new Error('no links in item');
      links = {};
    }

    Object.keys(links).forEach(function (rel) {
      var link = links[rel];

      if (! Array.isArray(link)) {
        link = [ link ];
      }

      return link.forEach(formatLinkHref.bind(this, baseUri));
    });

    var embedded = item._embedded;

    if (! embedded) {
      return;
    }

    if (! addEmbed) {
      delete item._embedded;
      return;
    }

    Object.keys(embedded).forEach(function (rel) {
      var item = embedded[rel];

      if (! Array.isArray(item)) {
        item = [ item ];
      }

      item.forEach(function (item) {
        absolutizeLinks(baseUri, item, addEmbed);
      });
    });
  }

  return function linksAbsolutizerMiddleware(req, res, next) {
    var result = res.result;

    if (! result) {
      return next();
    }

    var links = result._links;

    if (typeof links !== 'object') {
      // console.error('absolutizeLinks:', result);
      // throw new Error('no links in result');
      links = {};
      result._links = links;
    }

    var parsedUri = url.parse(req.uri);

    if (parsedUri.pathname.match('/$')) {
      parsedUri.pathname = parsedUri.pathname
        .substr(0, parsedUri.pathname.length - 1);
    }

    var baseUri = url.format(parsedUri);

    var isNextLinkSameAsRootPath = (function (next) {
      return next && next.href === rootPath;
    }(links.next));

    // no need to have a 'next' link if it points to index
    if (isNextLinkSameAsRootPath) {
      delete links.next;
    }

    if (! links.self) {
      links.self = {
        href: parsedUri.path
      };
    }

    if (links.self.href !== rootPath) {
      links.index = {
        href: rootPath
      };
    }

    var addEmbed = req.url.match('embed') || embedByDefault;

    try {
      absolutizeLinks(baseUri, result, addEmbed);
    } catch (e) {
      return next(e);
    }

    res.send(result);

    next();
  };
}

module.exports = linksAbsolutizer;
