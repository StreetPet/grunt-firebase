/*
 * grunt-firebase
 * https://github.com/assemble/grunt-firebase
 *
 * Copyright (c) 2013 Assemble
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var credential = grunt.file.readJSON('../config/street-pet-firebase-adminsdk-f9zf6-118e672276.json');

  // Project configuration.
  grunt.initConfig({

    credential: credential,

    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    // Configuration to be run (and then tested).
    firebase: {
      options: {
        // database reference url, only root url
        reference: 'https://grunt-firebase.firebaseio.com',
        // Database path
        path: '/test',
        // credential from Firebase Admin SDK
        credential: '<%= credential %>'
      },
      load: {
        options: {
          data: {
            one: {
              foo: 'bar'
            },
            two: [
              { a: 'A' },
              { b: 'B' },
              { c: 'C' }
            ],
            three: [ 'first', 'second', 'third' ]
          }
        }
      },
      upload: {
        files: [{ src: './data/*.json' }]
      },
      download: {
        options: {
          mode: 'download',
          dest: './data/downloads/'
        }
      },
      'issue-upload': {
        options: {
          data: {
            issueList: {
              2: '2^1',
              4: '2^2',
              8: '2^3',
              16: '2^4'
            }
          },
        },
      },
      'issue-download': {
        options: {
          mode: 'download',
          dest: './data/downloads/issue/'
        }
      },
      live: {
        options: {
          mode: 'live'
        },
        files: [{ src: './data/*.json' }]
      }
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'firebase:load', 'firebase:upload', 'firebase:download']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

  // alias specific tasks
  grunt.registerTask('load', ['clean', 'firebase:load']);
  grunt.registerTask('upload', ['clean', 'firebase:upload']);
  grunt.registerTask('download', ['clean', 'firebase:download']);

  grunt.registerTask('issue', ['clean', 'firebase:issue-upload', 'firebase:issue-download']);

};
