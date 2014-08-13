var BpmnJS = require('bpmn-js/lib/Viewer');

BpmnJS.prototype._modules.push([
  require('bpmn-js/lib/features/movecanvas'),
  require('bpmn-js/lib/features/zoomscroll')
]);

module.exports = BpmnJS;