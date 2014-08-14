(function() {

  'use strict';


  var $ = require('jquery'),
      _ = require('lodash'),
      BpmnViewer = require('bpmn-js'),
      Diffing = require('bpmn-js-diffing');


  function createViewer(side) {
    return new BpmnViewer({
      container: '#canvas-' + side,
      height: '100%',
      width: '100%'
    });
  }

  function syncViewers(a, b) {

    var changing;

    function update(viewer) {

      return function(e) {
        if (changing) {
          return;
        }

        changing = true;
        viewer.get('canvas').viewbox(e.viewbox);
        changing = false;
      };
    }

    function syncViewbox(a, b) {
      a.on('canvas.viewbox.changed', update(b));
    }

    syncViewbox(a, b);
    syncViewbox(b, a);
  }

  function createViewers(left, right) {

    var sides = {};

    sides[left] = createViewer(left);
    sides[right] = createViewer(right);

    // sync navigation
    syncViewers(sides[left], sides[right]);

    return sides;
  }


  var viewers = createViewers('left', 'right');

  function getViewer(side) {
    return viewers[side];
  }


  function allDiagramsLoaded() {
    return _.every(viewers, function(v) {
      return !v.loading;
    });
  }

  function setLoading(viewer, loading) {
    viewer.loading = loading;
  }


  function clearDiffs(viewer) {
    viewer.get('overlays').remove({ type: 'diff' });

    // TODO(nre): expose as external API
    _.forEach(viewer.get('elementRegistry')._elementMap, function(container) {
      var gfx = container.gfx;

      gfx
        .removeClass('diff-added')
        .removeClass('diff-changed')
        .removeClass('diff-removed')
        .removeClass('diff-layout-changed');
    });

  }

  function diagramLoading(side, viewer) {

    setLoading(viewer, true);

    var loaded = _.filter(viewers, function(v, s) {
      return s !== side && v.loading !== undefined && !v.loading;
    });

    // clear diffs on loaded
    _.forEach(loaded, function(v) {
      clearDiffs(v);
    });
  }

  function diagramLoaded(err, side, viewer) {
    if (err) {
      console.error('load error', err);
    }

    setLoading(viewer, err);

    if (allDiagramsLoaded()) {
      showDiff(getViewer('left'), getViewer('right'));
    }
  }


  // we use $.ajax to load the diagram.
  // make sure you run the application via web-server (ie. connect (node) or asdf (ruby))

  function loadDiagram(side, diagram) {

    var viewer = getViewer(side);

    function done(err) {
      diagramLoaded(err, side, viewer);
    }

    diagramLoading(side, viewer);

    if (diagram.xml) {
      return viewer.importXML(diagram.xml, done);
    }

    $.get(diagram.url, function(xml) {
      viewer.importXML(xml, done);
    });
  }


  function showDiff(viewerOld, viewerNew) {

    var result = Diffing.diff (viewerOld.definitions, viewerNew.definitions);


    $.each(result._removed, function(i, obj) {
      viewerOld.get('elementRegistry').getGraphicsByElement(obj).addClass('diff-removed');

      var overlays = viewerOld.get('overlays');
      addMarker (overlays, i, "marker-removed", "&minus;");

    });


    $.each(result._added, function(i, obj) {
      viewerNew.get('elementRegistry').getGraphicsByElement(obj).addClass('diff-added');

      var overlays = viewerNew.get('overlays');
      addMarker (overlays, i, "marker-added", "&#43;");

    });


    $.each(result._layoutChanged, function(i, obj) {

      viewerOld.get('elementRegistry').getGraphicsByElement(i).addClass('diff-layout-changed');
      var overlays = viewerOld.get('overlays');
      addMarker (overlays, i, "marker-layout-changed", "&#8680;");

      viewerNew.get('elementRegistry').getGraphicsByElement(i).addClass('diff-layout-changed');
      var overlays = viewerNew.get('overlays');
      addMarker (overlays, i, "marker-layout-changed", "&#8680;");

    });


    $.each(result._changed, function(i, obj) {
      viewerOld.get('elementRegistry').getGraphicsByElement(i).addClass('diff-changed');

      var overlays = viewerOld.get('overlays');
      addMarker (overlays, i, "marker-changed", "&#9998;");

      viewerNew.get('elementRegistry').getGraphicsByElement(i).addClass('diff-changed');
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
      overlays.add(i, 'diff', {
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

      viewerNew.get('elementRegistry').getGraphicsByElement(i).addClass('diff-changed');

      var detailsNew = '<div id="changeDetailsNew_' + i + '" class="changeDetails">' + details;

      var overlays = viewerNew.get('overlays');

      // attach an overlay to a node
      overlays.add(i, 'diff', {
        position: {
          bottom: -5,
          left: 0
        },
        html: detailsNew
      });

      $('#changeDetailsNew_' + i).toggle();
    });

    // create Table Overview of Changes
    showChangesOverview (result, viewerOld, viewerNew);

  }


  loadDiagram('left', { url: '../resources/pizza-collaboration/old.bpmn' });
  loadDiagram('right', { url: '../resources/pizza-collaboration/new.bpmn' });


  function openDiagram(xml, side) {
    loadDiagram(side, { xml: xml });
  }

  function openFile(file, target, done) {
    var reader = new FileReader();

    reader.onload = function(e) {
      var xml = e.target.result;
      done(xml, target);
    };

    reader.readAsText(file);
  }

  $('.file').on('change', function(e) {
    openFile(e.target.files[0], $(this).attr('target'), openDiagram);
  });


  function addMarker(overlays, elementId, className, symbol) {

    try {
      // attach an overlay to a node
      overlays.add(elementId, 'diff', {
        position: {
          top: -12,
          right: 12
        },
        html: '<span class="marker ' + className + '">' + symbol + '</span>'
      });
    } catch (e) {
      // fuck you, haha
    }
  }

  function addPointer(overlays, elementId, className) {

    try {
      // attach an overlay to a node
      overlays.add(elementId, 'diff', {
        position: {
          top: -20,
          right: 12
        },
        html: '<span class="changePointer ' + className + '">&#9754;</span>'
      });
    } catch (e) {
      // fuck you, haha
    }
  }

  $('#changesOverviewToggle').on('click', function(e) {
    showChangesOverview();

  });
  
  function showChangesOverview (result, viewerOld, viewerNew) {
    var changesOverviewTable = "<table id='changesOverviewTable'><tr><th>#</th><th>Name</th><th>Type</th><th>Change</th></tr>";

    console.log (result);

    var count = 0;

    $.each(result._removed, function(i, obj) {
      count++;
      changesOverviewTable += "<tr class='changesOverviewTr' elementId='" + obj.id + "' changed='removed'><td>" + count + "</td><td>" + obj.name + "</td><td>" + obj.$type.replace('bpmn:', '') + "</td><td class='removed'>Removed</td></tr>";
    });

    $.each(result._added, function(i, obj) {
      count++;
      changesOverviewTable += "<tr class='changesOverviewTr' elementId='" + obj.id + "' changed='added'><td>" + count + "</td><td>" + obj.name + "</td><td>" + obj.$type.replace('bpmn:', '') + "</td><td class='added'>Added</td></tr>";
    });

    $.each(result._changed, function(i, obj) {
      count++;
      changesOverviewTable += "<tr class='changesOverviewTr' elementId='" + obj.model.id + "' changed='changed'><td>" + count + "</td><td>" + obj.model.name + "</td><td>" + obj.model.$type.replace('bpmn:', '') + "</td><td class='changed'>Changed</td></tr>";
    });

    $.each(result._layoutChanged, function(i, obj) {
      count++;
      changesOverviewTable += "<tr class='changesOverviewTr' elementId='" + obj.id + "' changed='layoutChanged'><td>" + count + "</td><td>" + obj.name + "</td><td>" + obj.$type.replace('bpmn:', '') + "</td><td class='layoutChanged'>Layout</td></tr>";
    });

    changesOverviewTable += "</table>";


  
    $('#changesOverviewContainer').append (changesOverviewTable);

    $(".changesOverviewTr").hover(
      function() {
        var elementId =  $(this).attr("elementId");
        var changed = $(this).attr("changed");

        if (changed == "removed") {
          // viewerOld.get('elementRegistry').getGraphicsByElement(elementId).addClass('elementSelected');

          var overlays = viewerOld.get('overlays');
          addPointer (overlays, elementId);

        } else if (changed == "added") {
          // viewerNew.get('elementRegistry').getGraphicsByElement(elementId).addClass('elementSelected');
          var overlays = viewerNew.get('overlays');
          addPointer (overlays, elementId);

        } else {
          // viewerOld.get('elementRegistry').getGraphicsByElement(elementId).addClass('elementSelected');
          // viewerNew.get('elementRegistry').getGraphicsByElement(elementId).addClass('elementSelected');

          var overlays = viewerOld.get('overlays');
          addPointer (overlays, elementId);

          overlays = viewerNew.get('overlays');
          addPointer (overlays, elementId);

        }
      }, function() {

        $('.changePointer').remove();

        /*
          var elementId =  $(this).attr("elementId");
          var changed = $(this).attr("changed");

          if (changed == "removed") {
            viewerOld.get('elementRegistry').getGraphicsByElement(elementId).removeClass('elementSelected');
          } else if (changed == "added") {
            viewerNew.get('elementRegistry').getGraphicsByElement(elementId).removeClass('elementSelected');
          } else {
            viewerOld.get('elementRegistry').getGraphicsByElement(elementId).removeClass('elementSelected');
            viewerNew.get('elementRegistry').getGraphicsByElement(elementId).removeClass('elementSelected');
          }
        */
      }
    );

    $(".changesOverviewTr").click(function() {

      var containerWidth = $('.di-container').width();
      var containerHeight = $('.di-container').height();

      var elementId =  $(this).attr("elementId");
      var changed = $(this).attr("changed");

      if (changed == "removed") {

        if (viewerOld.get('elementRegistry').getById(elementId).waypoints) {
          var x = viewerOld.get('elementRegistry').getById(elementId).waypoints[0].x;
          var y = viewerOld.get('elementRegistry').getById(elementId).waypoints[0].y;

        } else {
          var x = viewerOld.get('elementRegistry').getById(elementId).x;
          var y = viewerOld.get('elementRegistry').getById(elementId).y;
        }

        var newCanvas = viewerOld.get('canvas');
        newCanvas.viewbox({ x: x - (containerWidth/2), y: y - (containerHeight/2), width: containerWidth, height: 800 });
      
      } else {

        if (viewerNew.get('elementRegistry').getById(elementId).waypoints) {
          var x = viewerNew.get('elementRegistry').getById(elementId).waypoints[0].x;
          var y = viewerNew.get('elementRegistry').getById(elementId).waypoints[0].y;

        } else {

          var x = viewerNew.get('elementRegistry').getById(elementId).x;
          var y = viewerNew.get('elementRegistry').getById(elementId).y;
        }

        var newCanvas = viewerNew.get('canvas');
        newCanvas.viewbox({ x: x - (containerWidth/2), y: y - (containerHeight/2), width: containerWidth, height: 800 });
      }




    });



    


  }

})();