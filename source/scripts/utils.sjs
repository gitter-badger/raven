var slug = require('to-slug');
var fs = require('fs');
var path = require('path');
var Future = require('data.future');
var $ = jQuery;

exports.slugify = slug;

exports.run = function(future) {
  future.fork(
    function(error){
      if (error) {
        console.log('Error: ' + error + '\n' + error.stack)
      }
      window.alert(error);
    },
    function(){ }
  )
};

exports.spawn = function(future) {
  exports.run(future);
  return Future.of();
}

exports.home = function() {
  var env = process.env;
  return process.platform === 'win32'?  env.USERPROFILE || (env.HOMEDRIVE + env.HOMEPATH)
  :      /* otherwise */                env.HOME
};

exports.debounce = function(f, time) {
  var timer;
  return function() {
    var args = arguments
    var _this = this
    if (timer)  clearTimeout(timer);
    timer = setTimeout(function() {
      f.apply(_this, args)
    }, time)
  }
};

exports.selectDirectory = function(initial) {
  return new Future(function(reject, resolve) {
    var i = document.createElement('input');
    i.type = "file";
    i.nwdirectory = 'nwdirectory';
    if (initial)  i.nwworkingdir = initial;
    $(i).hide()
        .on('change', notifySelection)
        .appendTo($('body'))
        .click();

    function notifySelection() {
      resolve(i.value);
      $(i).detach();
    }
  })
};

exports.saveAsDialog = function(initial) {
  return new Future(function(reject, resolve) {
    var i = document.createElement('input');
    $(i).attr({ type: 'file', nwsaveas: initial });
    i.files.append(new window.File('', ''));

    $(i).hide()
        .on('change', notifySelection)
        .appendTo($('body'))
        .click();

    function notifySelection() {
      if (i.value)  resolve(i.value);
      else          reject(new Error(''));
      $(i).detach();
    }
  })
};

exports.chooseFileDialog = function(accept, multiple, initialDir) {
  return new Future(function(reject, resolve) {
    var i = document.createElement('input');
    $(i).attr({
      type: 'file',
      multiple: multiple,
      accept: accept.join(','),
      nwworkingdir: initialDir
    });
    i.files.append(new window.File('', ''));

    $(i).hide()
        .on('change', notifySelection)
        .appendTo($('body'))
        .click();

    function notifySelection() {
      if (i.value)  resolve(i.value);
      else          reject(new Error(''));
      $(i).detach();
    }
  })
};

exports.values = function(object) {
  return Object.keys(object).map(λ(k) -> object[k])
};

exports.resource = path.join.bind(path, path.join(__dirname, '../../resources'));

exports.showMessage = function(a) {

};
