(function(window) {
  'use strict';

  var $ = require('jquery'),
      _ = require('lodash'),
      BpmnViewer = require('bpmn-js'),
      Diffing = require('bpmn-js-diffing'),
      viewerOld = new BpmnViewer({ container: '#canvas_old', height: '100%', width: '100%' }),
      viewerNew = new BpmnViewer({ container: '#canvas_new', height: '100%', width: '100%' });



  // we use $.ajax to load the diagram.
  // make sure you run the application via web-server (ie. connect (node) or asdf (ruby))

  var loaded = 0;


  $.get('../resources/pizza-collaboration/old.bpmn', function(pizzaDiagram) {
    viewerOld.importXML(pizzaDiagram, function(err) {

      if (!err) {
        console.log('success!');
        //viewerOld.get('canvas').zoom('fit-viewport');
        if (++loaded === 2) {
          showDiff(viewerOld, viewerNew);
        }

      } else {
        console.log('something went wrong:', err);
      }
    });
  });

  $.get('../resources/pizza-collaboration/new.bpmn', function(pizzaDiagram) {
    viewerNew.importXML(pizzaDiagram, function(err) {

      if (!err) {
        console.log('success!');
        //viewerNew.get('canvas').zoom('fit-viewport');
        if (++loaded === 2) {
          showDiff(viewerOld, viewerNew);
        }
        
      } else {
        console.log('something went wrong:', err);
      }

    
    });
  });


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
        viewerNew.get('elementRegistry').getGraphicsByElement(i).addClass('elementMoved');
      });


      $.each(result._changed, function(i, obj) {
          viewerOld.get('elementRegistry').getGraphicsByElement(i).addClass('elementEdited');

          var overlays = viewerOld.get('overlays');
          addMarker (overlays, i, "marker-changed", "&#9998;");

          viewerNew.get('elementRegistry').getGraphicsByElement(i).addClass('elementEdited');
      
          var details = '<div class="changeDetails"><table id="' + i + '" ><tr><th>Attribute</th><th>old</th><th>new</th></tr>';
          $.each(obj.attrs, function(attr, changes) {
            details = details + '<tr><td>' + attr + '</td><td>' + changes.oldValue + '</td><td>' + changes.newValue + '</td></tr>';
          });

          details = details + '</table></div>';

           viewerOld.get('elementRegistry').getGraphicsByElement(i).click (function (event) {

           alert(details);
        });

        viewerNew.get('elementRegistry').getGraphicsByElement(i).addClass('elementEdited');

            var overlays = viewerOld.get('overlays');

            // attach an overlay to a node
            overlays.add(i, {
              position: {
                bottom: 0,
                left: 0
              },
              html: details
            });

  
      });


    
  }

  function openDiagram (xml, target) {
    $( '#' + target ).empty();

    console.log (target);

    if (target == "canvas_old") {
      viewerOld = new BpmnViewer({ container: '#' + target, height: '100%', width: '100%' });
      viewerOld.importXML(xml, function(err) {
          if (!err) {
            console.log('success!');

          } else {
            console.log('something went wrong:', err);
          }
        });
    } else if (target == "canvas_new") {
      viewerNew = new BpmnViewer({ container: '#' + target, height: '100%', width: '100%' });
      viewerNew.importXML(xml, function(err) {
          if (!err) {
            console.log('success!');

          } else {
            console.log('something went wrong:', err);
          }
        });      
    }

  }

  $('.file').on('change', function(e) {
    openFile(e.target.files[0], openDiagram, $(this).attr('target'));
  });

  $('#diffNow').on('click', function(e) {
    showDiff(viewerOld, viewerNew);
  });


  function openFile(file, callback, target) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var xml = e.target.result;
        callback(xml, target);
      };

      reader.readAsText(file);
    }


  function addMarker (overlays, elementId, className, symbol) {
        
        // attach an overlay to a node
        overlays.add(elementId, {
          position: {
            top: -15,
            right: 20
          },
          html: "<span class='marker " + className + "'>" + symbol + "</span>"
        });

  }


    function oldstuff() {

    var definitions = viewerOld.definitions;

    definitions.$instanceOf('bpmn:FlowNode');

    //debugger;

    _.forEach(definitions.rootElements, function(element) {

      //console.log(element.$type, element);
      if(element.$instanceOf('bpmn:Process')) {
        _.forEach(element.flowElements, function(flowElement) {
          console.log(flowElement.$type, flowElement);
        });
      }



    });


    }
})(window);