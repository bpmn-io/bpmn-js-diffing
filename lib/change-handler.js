'use strict';


function ChangeHandler() {
  this._layoutChanged = {};
  this._changed = {};
  this._removed = {};
  this._added = {};
}

module.exports = ChangeHandler;


ChangeHandler.prototype.removed = function(model, property, element, idx) {
  if (element.$instanceOf('bpmn:FlowElement')) {
    this._removed[element.id] = element;
  }
};

ChangeHandler.prototype.changed = function(model, property, oldValue, newValue) {
  if (model.$instanceOf('bpmndi:BPMNEdge') || model.$instanceOf('bpmndi:BPMNShape')) {
    this._layoutChanged[model.bpmnElement.id] = model.bpmnElement;
  }

  if (model.$instanceOf('bpmn:FlowElement')) {
    this._changed[model.id] = model;
  }
};

ChangeHandler.prototype.added = function(model, property, element, idx) {
  if (element.$instanceOf('bpmn:FlowElement')) {
    this._added[element.id] = element;
  }
};

ChangeHandler.prototype.moved = function(model, property, oldIndex, newIndex) { };
