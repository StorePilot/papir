"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _util = _interopRequireWildcard(require("./util"));

var _axios = _interopRequireDefault(require("axios"));

var _sign = _interopRequireDefault(require("./sign"));

/**
 * Requester
 */
var Requester = function Requester() {
  var _this = this;

  var customConf = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  (0, _classCallCheck2["default"])(this, Requester);

  if (typeof customConf.key !== 'undefined') {
    localStorage.setItem('papir.key', customConf.key);
  }

  if (typeof customConf.secret !== 'undefined') {
    localStorage.setItem('papir.secret', customConf.secret);
  }

  if (typeof customConf.token !== 'undefined' && customConf.token.constructor === Object) {
    localStorage.setItem('papir.token', JSON.stringify(customConf.token));
  }

  this.conf = {
    responseType: 'json',
    // ['arraybuffer', 'blob', 'document', 'json', 'text', 'stream']
    headers: {},
    override: {
      arg: '_method',
      // The query argument to be given actual method
      method: null // The replacement method. (will be fired instead of actual method. Ex.: 'OPTIONS')

    },
    name: null,
    // Root key where data is attached in data
    addDataToQuery: true,
    keepEmpty: true,
    keepEmptyInArrays: true,
    keepEmptyArray: true,
    keepNull: true,
    keepNullInArrays: true,
    protocol: 'rfc3986',
    delimiter: '&',
    splitter: '=',
    divider: '?',
    encodeNames: true,
    encodeValues: true,
    encodeNull: true,
    excludes: [],
    includes: [],
    dotNotation: false,
    authQuery: true,
    authHeader: false,
    dateFormat: '',
    authentication: 'oauth',
    version: '1.0a',
    type: 'one_legged',
    algorithm: 'HMAC-SHA1',
    key: localStorage.getItem('papir.key') !== null ? localStorage.getItem('papir.key') : '',
    secret: localStorage.getItem('papir.secret') !== null ? localStorage.getItem('papir.secret') : '',
    token: localStorage.getItem('papir.token') !== null ? JSON.parse(localStorage.getItem('papir.token')) : {
      key: '',
      secret: ''
    },
    nonce: '',
    nonceLength: 6,
    nonceTale: '',
    timestampLength: 30,
    indexArrays: true,
    emptyArrayToZero: false,
    keepArrayTags: true,
    requester: null,
    base64: true,
    ampersand: true,
    sort: true,
    // Conf specific per method type. (Same Options as above)
    get: {},
    post: {
      keepNull: false,
      keepEmpty: false,
      keepEmptyArray: false
    },
    put: {},
    patch: {},
    "delete": {},
    head: {},
    trace: {},
    connect: {},
    options: {},
    perform: true // If false, axios config will be returned instead

  };

  this.objMerge = function (target, custom) {
    var cl = Object.assign({}, target); // Ensures target not to inherit params from custom

    return Object.assign(cl, custom);
  };

  this.conf = this.objMerge(this.conf, customConf);
  this.getConf = this.objMerge(this.conf, this.conf.get);
  this.postConf = this.objMerge(this.conf, this.conf.post);
  this.putConf = this.objMerge(this.conf, this.conf.put);
  this.patchConf = this.objMerge(this.conf, this.conf.patch);
  this.deleteConf = this.objMerge(this.conf, this.conf["delete"]);
  this.headConf = this.objMerge(this.conf, this.conf.head);
  this.traceConf = this.objMerge(this.conf, this.conf.trace);
  this.connectConf = this.objMerge(this.conf, this.conf.connect);
  this.optionsConf = this.objMerge(this.conf, this.conf.options); // READ

  this.get = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.getConf, conf);
    return _this.custom('GET', url, promise, data, upload, conf);
  }; // CREATE


  this.post = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.postConf, conf);
    return _this.custom('POST', url, promise, data, upload, conf);
  }; // UPDATE / REPLACE


  this.put = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.putConf, conf);
    return _this.custom('PUT', url, promise, data, upload, conf);
  }; // UPDATE / MODIFY


  this.patch = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.patchConf, conf);
    return _this.custom('PATCH', url, promise, data, upload, conf);
  }; // DELETE


  this["delete"] = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.deleteConf, conf);
    return _this.custom('DELETE', url, promise, data, upload, conf);
  }; // GET HEADERS ONLY / NO CONTENT


  this.head = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.headConf, conf);
    return _this.custom('HEAD', url, promise, data, upload, conf);
  }; // GET ADDITIONS / CHANGES


  this.trace = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.traceConf, conf);
    return _this.custom('TRACE', url, promise, data, upload, conf);
  }; // CONVERT TO TCP / IP TUNNEL


  this.connect = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.connectConf, conf);
    return _this.custom('CONNECT', url, promise, data, upload, conf);
  }; // PERMISSION


  this.options = function (url, promise) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var upload = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var conf = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    conf = _this.objMerge(_this.optionsConf, conf);
    return _this.custom('OPTIONS', url, promise, data, upload, conf);
  };

  this.custom = function (method, url, promise) {
    var data = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var upload = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : _this.conf;
    conf = _this.objMerge(_this.conf, conf);
    return _this.request(method, url, promise, data, upload, conf);
  };

  this.request = function (method, url, abortPromise) {
    var data = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    var upload = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    var conf = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : _this.conf;

    /**
     * Correct order of creating a request:
     */
    var request = {}; // 1. Append protocol (http / https)
    // 2. Append base (://baseurl.com)
    // 3. Append path (/api/v1/users/362)
    // 4.1 Append arguments (?arg1=0&arg2=1)

    request.url = url; // 4.2 Encode arguments after first divider until second divider.
    // Ex.: ignored?encoded?ignored?ignored

    request.url = _util["default"].querystring.encode(request.url, {
      protocol: conf.protocol,
      divider: conf.divider,
      delimiter: conf.delimiter,
      splitter: conf.splitter,
      encodeNull: conf.encodeNull,
      keepEmpty: conf.keepEmpty,
      encodeNames: conf.encodeNames,
      encodeValues: conf.encodeValues
    }); // 5.1 Append data to querystring arguments if required

    if (conf.addDataToQuery && !upload) {
      request.url = _this.makeDataQuery(request.url, data, {
        name: conf.name,
        // Root key where data is attached
        protocol: conf.protocol,
        encodeNull: conf.encodeNull,
        dateFormat: conf.dateFormat,
        // Default ISO 8601
        keepEmpty: conf.keepEmpty,
        keepNull: conf.keepNull,
        keepNullInArrays: conf.keepNullInArrays,
        keepEmptyArray: conf.keepEmptyArray,
        keepEmptyInArrays: conf.keepEmptyInArrays,
        delimiter: conf.delimiter,
        splitter: conf.splitter,
        dotNotation: conf.dotNotation,
        encodeNames: conf.encodeNames,
        encodeValues: conf.encodeValues,
        indexArrays: conf.indexArrays,
        excludes: conf.excludes,
        // At first level
        includes: conf.includes,
        // At first level. includes overrides excludes
        emptyArrayToZero: conf.emptyArrayToZero,
        keepArrayTags: conf.keepArrayTags
      }, conf);
      data = null;
    } // 5.2. Append index to arrays in querystring if required


    if (conf.indexArrays) {
      request.url = _util["default"].querystring.indexArrays(request.url);
    } // 6 Sort arguments if required


    var querystring = '';
    var sortable = [];

    _util["default"].getParams(request.url).forEach(function (param) {
      sortable.push(param.key + conf.splitter + param.value + conf.delimiter);
    });

    sortable.sort();
    sortable.forEach(function (param) {
      querystring += param;
    });

    if (querystring !== '') {
      querystring = querystring.slice(0, -1);
      request.url = _util["default"].stripUri(request.url) + conf.divider + querystring;
    } else {
      request.url = _util["default"].stripUri(request.url);
    } // 7. Append data to request


    if (data !== null) {
      request.data = data;
    } // 8. Append method


    request.method = method; // 9. Append method override if required

    if (conf.override.method !== null && method !== conf.override.method) {
      request.method = conf.override.method;
      request.url += request.url.indexOf(conf.divider) === -1 ? conf.divider : conf.delimiter;
      request.url += conf.override.arg + conf.splitter + method;
    } // 10. Append headers

    /**
     * @note - Simple headers which passes preflight:
     * Accept (This should be declared in api config. [what response content does the client accept?]) 'application/json'
     * Accept-Language
     * Content-Language (This should be declared in api config. [what request content does the client send?]) 'application/json'
     * Content-Type [application/x-www-form-urlencoded, multipart/form-data, text/plain] (Others creates preflight)
     * DPR
     * Downlink
     * Save-Data
     * Viewport-Width
     * Width
     * (Other headers creates preflight)
     */
    // Get predefined headers


    request.headers = conf.headers; // If no data provided, set content-type to text/plain so preflight is avoided

    if (typeof request.data === 'undefined') {
      request.headers['Content-Type'] = 'text/plain';
    } // If data provided and it is a upload request, tell the server


    if (upload) {
      // @todo - Could be changed to multipart/form-data for multiupload, multi content later?
      request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } // 11. Authorize


    if (typeof conf.authentication === 'function') {
      request = conf.authentication(request, conf);
    } else if (conf.authentication === 'oauth') {
      // OAUTH
      // 1. Prepare configuration to be signed
      conf.url = request.url;
      conf.method = request.method; // 2. If authentication should be applied to querystring

      if (conf.authQuery) {
        request.url = _util["default"].stripUri(request.url) + conf.divider + _sign["default"].gen(conf).string;
      } // 3. If authentication should be applied to header


      if (conf.authHeader) {
        request.headers['Authorization'] = _sign["default"].gen(conf).header;
      }
    } else if (conf.authentication === 'nonce') {
      // ADD TOKEN / NONCE AT END OF QUERYSTRING
      request = _this.makeTale(request, conf);
    } // 12. Make request abortable


    request = _this.makeAbortable(request, abortPromise); // 13. Transform response
    // Set response type ['arraybuffer', 'blob', 'document', 'json', 'text', 'stream']

    request.responseType = conf.responseType; // Transform Response to raw

    request.transformResponse = function (response) {
      return response;
    }; // 14. If request should be applied, perform and return


    if (conf.perform) {
      return _axios["default"].request(request);
    } // 15. If only the axios config object is needed, return resolved promise


    return new Promise(function (resolve) {
      resolve(request);
    });
  };

  this.makeDataQuery = function (url, data, options) {
    var conf = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _this.conf;

    if (data !== null) {
      var queryString = _util["default"].querystring.stringify(data, options);

      if (url.indexOf(conf.divider) === -1 && queryString !== '') {
        url += conf.divider + queryString;
      } else if (queryString !== '') {
        url += conf.delimiter + queryString;
      }
    }

    return url;
  };

  this.makeTale = function (request) {
    var conf = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _this.conf;

    // Set nonce based on localized object / var
    if (conf.nonceTale !== '') {
      var query = conf.nonceTale.split(conf.splitter);

      if (query.length === 2) {
        var param = query[0];
        var hook = query[1];

        if (param.length > 0) {
          try {
            // @warning - eval can be harmful if used server side

            /* eslint-disable */
            var nonce = String(eval(hook));
            /* eslint-enable */

            if (request.url.indexOf(conf.divider) === -1) {
              request.url += conf.divider + param + conf.splitter + nonce;
            } else {
              request.url += conf.delimiter + param + conf.splitter + nonce;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    return request;
  };

  this.makeAbortable = function (request, promise) {
    var cancel;
    request.cancelToken = _axios["default"].CancelToken(function executor(c) {
      cancel = c;
    });
    promise.then(function () {
      cancel();
    });
    return request;
  };

  this.verifyToken = function (url) {
    var token = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    var conf = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _this.conf;
    window.open(url + conf.divider + (token !== '' ? _util["default"].querystring.stringify({
      oauth_token: token
    }) : ''), '_blank');
  };

  this.getTokenRequest = function (url) {
    var scope = _this;
    var conf = (0, _util.clone)({}, _this.getConf);
    conf.addDataToQuery = false;
    conf.authHeader = true;
    return new Promise(function (resolve, reject) {
      scope.get(url, null, false, false, conf).then(function (res) {
        resolve(res);
      })["catch"](function (e) {
        reject(e);
      });
    });
  };

  this.getTokenAccess = function (url, requestToken, requestTokenSecret, verifierToken) {
    url = url + '?oauth_verifier=' + verifierToken;
    var scope = _this;
    var conf = (0, _util.clone)({}, _this.getConf);
    conf.addDataToQuery = false;
    conf.authHeader = true;
    conf.key = requestToken;
    conf.secret = requestTokenSecret;
    return new Promise(function (resolve, reject) {
      scope.get(url, null, false, false, conf).then(function (res) {
        resolve(res);
      })["catch"](function (e) {
        reject(e);
      });
    });
  };
};

exports["default"] = Requester;