'use strict';


function ChangeHandler() {
  this._layoutChanged = {};
  this._changed = {};
  this._removed = {};
  this._added = {};
}

module.exports = ChangeHandler;


ChangeHandler.prototype.removed = function(model, property, element, idx) {
  if (element.$instanceOf('bpmn:FlowElement') ||
      element.$instanceOf('bpmn:MessageFlow')) {

    this._removed[element.id] = element;
  }
};

ChangeHandler.prototype.changed = function(model, property, newValue, oldValue) {

  if (model.$instanceOf('bpmndi:BPMNEdge') || model.$instanceOf('bpmndi:BPMNShape')) {
    this._layoutChanged[model.bpmnElement.id] = model.bpmnElement;
  }

  if (model.$instanceOf('bpmn:FlowElement')) {
    var changed = this._changed[model.id];

    if (!changed) {
      changed = this._changed[model.id] = { model: model, attrs: { } };
    }

    if (oldValue !== undefined || newValue !== undefined) {
      changed.attrs[property] = { oldValue: oldValue, newValue: newValue };
    }
  }
};

ChangeHandler.prototype.added = function(model, property, element, idx) {
  if (element.$instanceOf('bpmn:FlowElement') ||
      element.$instanceOf('bpmn:MessageFlow')) {

    this._added[element.id] = element;
  }
};

ChangeHandler.prototype.moved = function(model, property, oldIndex, newIndex) { };
