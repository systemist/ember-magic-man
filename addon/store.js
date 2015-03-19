import Ember from 'ember';
import IdentityMap from './identity-map';

export default Ember.Object.extend({
  init: function(){
    this.records = IdentityMap.create();
  },

  find: function(type, id){
    var adapter = this.adapterFor(type);
    this._adapterHasMethod(adapter, 'find');

    var cached = this.records.get(type, id);
    if(cached) {

      adapter.find(type, id).then(function(recordData) {
        var record = this.createRecord(type, recordData);
        this.records.set(type, id, record);
      }.bind(this));

      return Ember.RSVP.resolve(cached);

    } else {

      return adapter.find(type, id).then(function(recordData) {
        var record = this.createRecord(type, recordData);
        this.records.set(type, id, record);
        return record;
      }.bind(this));

    }
  },

  findAll: function(type){
    var adapter = this.adapterFor(type);
    this._adapterHasMethod(adapter, 'find');

    return adapter.findAll(type).then(function(recordsData) {
      this.records.clear(type);
      recordsData.forEach(function(recordData) {
        var record = this.createRecord(type, recordData);
        this.records.set(type, record.id, record);
      }.bind(this));

      return this.records.get(type);
    }.bind(this));
  },

  findQuery: function(type, query){
    var adapter = this.adapterFor(type);
    this._adapterHasMethod(adapter, 'find');

    return adapter.findQuery(type, query);
  },

  destroy: function(type, record) {
    var adapter = this.adapterFor(type);
    this._adapterHasMethod(adapter, 'find');

    return adapter.destroy(type, record).then(function() {
      this.records.remove(type, record);
    });
  },

  save: function(type, record) {
    var adapter = this.adapterFor(type);
    this._adapterHasMethod(adapter, 'find');

    return adapter.save(type, record).then(function(recordData) {
      var record = this.createRecord(type, recordData);
      return this.records.set(type, record.id, record);
    }.bind(this));
  },

  push: function(type, record) {
    return this.records.set(type, record.id, record);
  },

  createRecord: function(type, properties){
    var factory = this.modelFor(type);
    return factory.create(properties);
  },

  adapterFor: function(type) {
    var adapter = this.container.lookup('adapter:' + type);
    if (!adapter) {
      throw new Ember.Error("No adapter was found for '" + type + "'");
    }
    return adapter;
  },

  modelFor: function(type) {
    var factory = this.container.lookupFactory('model:' + type);
    if (!factory) {
      throw new Ember.Error("No model was found for '" + type + "'");
    }
    return factory;
  },

  _adapterHasMethod: function(adapter, method) {
    if (!adapter || !adapter[method] || typeof(adapter[method]) !== 'function') {
      throw new Ember.Error("Adapter " + adapter.toString() + " has no method '" + method + "'");
    }
  }
});