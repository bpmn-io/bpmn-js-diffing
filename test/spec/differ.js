'use strict';

var TestHelper = require('bpmn-js/test/TestHelper');


var _ = require('lodash');

var fs = require('fs');


var BpmnModdle = require('bpmn-moddle');

var Differ = require('../../lib/differ'),
    SimpleChangeHandler = require('../../lib/change-handler');


TestHelper.insertCSS('diff.css', fs.readFileSync('assets/diff.css', 'utf-8'));


describe('diffing', function() {

  function importDiagrams(a, b, done) {

    new BpmnModdle().fromXML(a, function(err, adefs) {

      if (err) {
        return done(err);
      }

      new BpmnModdle().fromXML(b, function(err, bdefs) {
        if (err) {
          return done(err);
        } else {
          return done(null, adefs, bdefs);
        }
      });
    });
  }

  function diff(a, b, done) {

    importDiagrams(a, b, function(err, adefs, bdefs) {
      if (err) {
        return done(err);
      }

      // given
      var handler = new SimpleChangeHandler();

      // when
      new Differ().diff(adefs, bdefs, handler);

      done(err, handler, adefs, bdefs);
    });

  }


  describe('diff', function() {

    it('should discover add', function(done) {

      var aDiagram = fs.readFileSync('test/fixtures/add/before.bpmn', 'utf-8');
      var bDiagram = fs.readFileSync('test/fixtures/add/after.bpmn', 'utf-8');

      // when
      diff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }


        // then
        expect(results._added).to.have.keys([ 'EndEvent_1', 'SequenceFlow_2' ]);
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.eql({});
        expect(results._changed).to.eql({});

        done();
      });

    });


    it('should discover remove', function(done) {

      var aDiagram = fs.readFileSync('test/fixtures/remove/before.bpmn', 'utf-8');
      var bDiagram = fs.readFileSync('test/fixtures/remove/after.bpmn', 'utf-8');

      // when
      diff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
        expect(results._layoutChanged).to.eql({});
        expect(results._changed).to.eql({});

        done();
      });

    });


    it('should discover change', function(done) {

      var aDiagram = fs.readFileSync('test/fixtures/change/before.bpmn', 'utf-8');
      var bDiagram = fs.readFileSync('test/fixtures/change/after.bpmn', 'utf-8');

      // when
      diff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.eql({});
        expect(results._changed).to.have.keys([ 'Task_1'  ]);

        done();
      });

    });


    it('should discover layout-change', function(done) {

      var aDiagram = fs.readFileSync('test/fixtures/layout-change/before.bpmn', 'utf-8');
      var bDiagram = fs.readFileSync('test/fixtures/layout-change/after.bpmn', 'utf-8');

      // when
      diff(aDiagram, bDiagram, function(err, results, aDefinitions, bDefinitions) {

        if (err) {
          return done(err);
        }

        // then
        expect(results._added).to.eql({});
        expect(results._removed).to.eql({});
        expect(results._layoutChanged).to.have.keys([ 'Task_1', 'SequenceFlow_1' ]);
        expect(results._changed).to.eql({});

        done();
      });

    });

  });

});