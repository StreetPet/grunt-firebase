/*
 * grunt-firebase
 * https://github.com/assemble/grunt-firebase
 *
 * Copyright (c) 2013 Assemble
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

  var _ = require('lodash');
  var path = require('path');
  var FirebaseAdmin = require('firebase-admin');
  var gaze = require('gaze');


  var validation = {
    reference: 'Define a Database firebase URL (only root path).',
    path: 'Path in Database to use',
    credential: 'Credential Data from Firebase Admin Credential file.'
  };

  var validateOptions = function (options, cb) {
    var errs = [];

    _.forOwn(validation, function (msg, k) {
      if (!options[k]) {
        errs.push({ option: k, msg: msg });
      }
    });

    if (errs.length === 0) {
      cb(null, true);
    } else {
      cb(errs, false);
    }
  };

  var database;
  var initializeApp = function(options){
    if(!database){
      database = FirebaseAdmin.initializeApp({
        credential: FirebaseAdmin.credential.cert(options.credential),
        databaseURL: options.reference
      }).database();
    }
  }

  var upload = function (task, options, done) {

    initializeApp(options);

    // create a new firebase reference using the reference url
    var ref = database.ref(options.path);

    // update firebase with the data
    if (options.data) {
      ref.update(options.data);
    }

    // for each file, update the firebase using the filename as the key
    task.filesSrc.forEach(function (filepath) {
      if (grunt.file.exists(filepath)) {
        var filename = path.basename(filepath, path.extname(filepath));
        var data = grunt.file.readJSON(filepath);
        ref.child(filename).update(data);
      }
    });

    done();

  };

  var download = function (task, options, done) {

    initializeApp(options);

    // create a new firebase reference using the reference url
    var ref = database.ref(options.path);

    var dest = options.dest || ('./');
    var filename = (options.reference.split('/')[options.reference.split('/').length - 1]);
    var ext =  '.json';
    var output = path.join(dest, filename) + ext;

    // download to the destination
    grunt.log.writeln(('Downloading to ' + output).cyan);
    ref.on('value', function (snapshot) {
      var data = snapshot.exportVal();
      grunt.file.write(output, JSON.stringify(data, null, 2));
      done();
    });

  };

  var live = function (task, options, done) {

    initializeApp(options);

    // create a new firebase reference using the reference url
    var ref = database.ref(options.path);

    var fileMapping = {};
    task.filesSrc.forEach(function (filepath) {
      var filename = path.basename(filepath, path.extname(filepath));
      fileMapping[filename] = filepath;
    });

    // authenticate to firebase with the credential

    // for each file, setup live watching
    gaze(task.filesSrc, function (err, watcher) {
      if (err) {
        grunt.warn('Error attempting to watch file: ' + task.filesSrc, err);
        done(false);
      }

      grunt.log.writeln('Listening for file changes...'.cyan);

      this.on('changed', function (filepath) {
        grunt.log.writeln((filepath + ' was changed. Uploading to firebase...').cyan);
        var filename = path.basename(filepath, path.extname(filepath));
        var data = grunt.file.readJSON(filepath);
        ref.child(filename).update(data);
      });

      ref.on('child_changed', function (snapshot) {
        var name = snapshot.name();
        grunt.log.writeln((name + ' was changed. Updating file with new data...').cyan);
        var data = snapshot.exportVal();
        var filepath = fileMapping[name];
        if (grunt.file.exists(filepath)) {
          grunt.file.write(filepath, JSON.stringify(data, null, 2));
        }
      });

    });

  };

  grunt.registerMultiTask('firebase', 'Update your firebase.', function () {

    var task = this;
    var done = task.async();

    // Merge task-specific and/or target-specific options with these defaults.
    var options = task.options({
      mode: 'upload'
    });

    validateOptions(options, function (errs, valid) {
      if (errs) {
        errs.forEach(function (err) {
          grunt.warn('options.' + err.option + ' undefined: ' + err.msg);
        });
        done(false);
      }
    });

    var func = null;
    switch (options.mode.toLowerCase()) {
      case 'upload':
        func = upload;
        break;
      case 'download':
        func = download;
        break;
      case 'live':
        func = live;
        break;
      default:
        func = upload;
        break;
    }

    func(task, options, done);

  });

};
