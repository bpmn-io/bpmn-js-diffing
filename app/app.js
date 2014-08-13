(function() {

  'use strict';


  var $ = require('jquery'),
      _ = require('lodash'),
      BpmnViewer = require('bpmn-js'),
      Diffing = require('bpmn-js-diffing');


  function createViewer(container) {
    return new BpmnViewer({ container: container, height: '100%', width: '100%' });
  }


  // we use $.ajax to load the diagram.
  // make sure you run the application via web-server (ie. connect (node) or asdf (ruby))

  function loadDiagram(diagram, viewer, done) {
    if (diagram.xml) {
      return viewer.importXML(diagram.xml, done);
    }

    $.get(diagram.url, function(xml) {
      viewer.importXML(xml, done);
    });
  }


  function loadDiagrams(diagramOld, diagramNew, done) {

    var loading = 2;

    var viewerOld = createViewer(diagramOld.container),
        viewerNew = createViewer(diagramNew.container);

    function doneLoading(err) {
      if (err) {
        return done(err);
      }

      if (--loading === 0) {
        done(null, viewerOld, viewerNew);
      }
    }

    loadDiagram(diagramOld, viewerOld, doneLoading);
    loadDiagram(diagramNew, viewerNew, doneLoading);
  }


  function showDiff(viewerOld, viewerNew) {

    var result = Diffing.diff (viewerOld.definitions, viewerNew.definitions);

    console.log (result);


    $.each(result._removed, function(i, obj) {
      viewerOld.get('elementRegistry').getGraphicsByElement(obj).addClass('elementRemoved');

      var overlays = viewerOld.get('overlays');
      addMarker (overlays, i, "marker-removed", "&minus;");

    });


    $.each(result._added, function(i, obj) {
      viewerNew.get('elementRegistry').getGraphicsByElement(obj).addClass('elementAdded');

      var overlays = viewerNew.get('overlays');
      addMarker (overlays, i, "marker-added", "&#43;");

    });


    $.each(result._layoutChanged, function(i, obj) {
      console.log (i);
      viewerOld.get('elementRegistry').getGraphicsByElement(i).addClass('elementMoved');
      var overlays = viewerOld.get('overlays');
      addMarker (overlays, i, "marker-layoutChanged", "&#8680;");

      viewerNew.get('elementRegistry').getGraphicsByElement(i).addClass('elementMoved');
      var overlays = viewerNew.get('overlays');
      addMarker (overlays, i, "marker-layoutChanged", "&#8680;");

    });


    $.each(result._changed, function(i, obj) {
      viewerOld.get('elementRegistry').getGraphicsByElement(i).addClass('elementEdited');

      var overlays = viewerOld.get('overlays');
      addMarker (overlays, i, "marker-changed", "&#9998;");

      viewerNew.get('elementRegistry').getGraphicsByElement(i).addClass('elementEdited');
      var overlays = viewerNew.get('overlays');
      addMarker (overlays, i, "marker-changed", "&#9998;");

      var details = '<table ><tr><th>Attribute</th><th>old</th><th>new</th></tr>';
      $.each(obj.attrs, function(attr, changes) {
        details = details + '<tr><td>' + attr + '</td><td>' + changes.oldValue + '</td><td>' + changes.newValue + '</td></tr>';
      });

      details = details + '</table></div>';

      viewerOld.get('elementRegistry').getGraphicsByElement(i).click (function (event) {
        $('#changeDetailsOld_' + i).toggle();
      });

      var detailsOld = '<div id="changeDetailsOld_' + i + '" class="changeDetails">' + details;

      var overlays = viewerOld.get('overlays');

      // attach an overlay to a node
      overlays.add(i, {
        position: {
          bottom: -5,
          left: 0
        },
        html: detailsOld
      });

      $('#changeDetailsOld_' + i).toggle();

      viewerNew.get('elementRegistry').getGraphicsByElement(i).click (function (event) {
         $('#changeDetailsNew_' + i).toggle();
      });

      viewerNew.get('elementRegistry').getGraphicsByElement(i).addClass('elementEdited');

      var detailsNew = '<div id="changeDetailsNew_' + i + '" class="changeDetails">' + details;

      var overlays = viewerNew.get('overlays');

      // attach an overlay to a node
      overlays.add(i, {
        position: {
          bottom: -5,
          left: 0
        },
        html: detailsNew
      });

      $('#changeDetailsNew_' + i).toggle();
    });
  }


  var diagramOld = { url: '../resources/pizza-collaboration/old.bpmn', container: '#canvas_old' },
      diagramNew = { url: '../resources/pizza-collaboration/new.bpmn', container: '#canvas_new' };


  loadDiagrams(diagramOld, diagramNew, function(err, viewerOld, viewerNew) {

    if (err) {
      return console.log('something went wrong when opening the diagrams', err);
    }

    // show diff
    showDiff(viewerOld, viewerNew);
  });



  var viewerOld, viewerNew;


  function openDiagram(xml, target) {
    var viewer;

    $( '#' + target ).empty();

    viewer = createViewer('#' + target);

    loadDiagram({ xml: xml }, viewer, function(err) {
      if (err) {
        console.error('something went wrong:', err);
      }
    });

    if (target == 'canvas_old') {
      viewerOld = viewer;
    } else if (target == 'canvas_new') {
      viewerNew = viewer;
    }
  }

  $('.file').on('change', function(e) {
    openFile(e.target.files[0], $(this).attr('target'), openDiagram);
  });

  $('#diffNow').on('click', function(e) {
    showDiff(viewerOld, viewerNew);
  });


  function openFile(file, target, done) {
    var reader = new FileReader();

    reader.onload = function(e) {
      var xml = e.target.result;
      done(xml, target);
    };

    reader.readAsText(file);
  }


  function addMarker (overlays, elementId, className, symbol) {

    try {
      // attach an overlay to a node
      overlays.add(elementId, {
        position: {
          top: -15,
          right: 20
        },
        html: '<span class="marker ' + className + '">' + symbol + '</span>'
      });
    } catch (e) {
      // fuck you, haha
    }
  }

})();