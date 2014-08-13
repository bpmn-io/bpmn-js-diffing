module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  /* global process */

  // configures browsers to run test against
  // any of [ 'PhantomJS', 'Chrome', 'Firefox', 'IE']
  var TEST_BROWSERS = ((process.env.TEST_BROWSERS || '').replace(/^\s+|\s+$/, '') || 'PhantomJS').split(/\s*,\s*/g);


  // project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    config: {
      app: 'app',
      sources: 'lib',
      tests: 'test'
    },

    release: {
      options: {
        tagName: 'v<%= version %>',
        commitMessage: 'chore(project): release v<%= version %>',
        tagMessage: 'chore(project): tag v<%= version %>'
      }
    },

    jshint: {
      src: ['<%= config.sources %>'],
      options: {
        jshintrc: true
      }
    },

    karma: {
      options: {
        configFile: '<%= config.tests %>/config/karma.unit.js',
      },
      single: {
        singleRun: true,
        autoWatch: false,

        browsers: TEST_BROWSERS,

        browserify: {
          watch: false,
          debug: true,
          transform: [ [ 'brfs', { global: true } ] ]
        }
      },
      unit: {
        browsers: TEST_BROWSERS,
        debug: true
      }
    },

    browserify: {
      options: {
        browserifyOptions: {
          builtins: false
        },
        bundleOptions: {
          detectGlobals: false,
          insertGlobalVars: [],
          debug: true
        }
      },
      watch: {
        files: {
          '<%= config.app %>/bpmn-viewer.js': [ '<%= config.app %>/bpmn.js', 'index.js' ]
        },
        options: {
          watch: true
        }
      },
      standaloneViewer: {
        files: {
          '<%= config.app %>/bpmn-viewer.js': [ '<%= config.app %>/bpmn.js', 'index.js' ]
        },
        options: {
          alias: [
            'jquery:jquery',
            'lodash:lodash',
            'index.js:bpmn-js-diffing',
            '<%= config.app %>/bpmn.js:bpmn-js'
          ]
        }
      },
    },

    jsdoc: {
      dist: {
        src: [ '<%= config.sources %>/**/*.js' ],
        options: {
          destination: 'docs/api',
          plugins: [ 'plugins/markdown' ]
        }
      }
    }
  });

  // tasks

  grunt.registerTask('test', [ 'karma:single' ]);

  grunt.registerTask('auto-test', [ 'karma:unit' ]);

  grunt.registerTask('default', [ 'jshint', 'test', 'browserify:standaloneViewer', 'jsdoc' ]);
};