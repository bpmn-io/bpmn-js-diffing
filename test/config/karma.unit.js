module.exports = function(karma) {
  karma.set({

    basePath: '../../',

    frameworks: [ 'browserify', 'mocha', 'chai' ],

    files: [
      'test/spec/**/*.js'
    ],

    preprocessors: {
      'test/spec/**/*.js': [ 'browserify' ]
    },

    reporters: [ 'progress' ],

    browsers: [ 'PhantomJS' ],

    browserNoActivityTimeout: 20000,

    singleRun: false,
    autoWatch: true,

    // browserify configuration
    browserify: {
      transform: [ [ 'brfs', { global: true } ] ],
      debug: true
    }
  });
};
