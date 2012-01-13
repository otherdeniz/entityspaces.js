﻿/*globals es, ko*/

/// <reference path="../Libs/jquery-1.7.1.js" />
/// <reference path="../Libs/knockout-2.0.0.debug.js" />

var utils = {

    dateParser: new es.DateParser(),

    copyDataIntoEntity: function (target, source) {
        var prop, srcProp;

        if (!target || !source) {
            return;
        }

        for (prop in target) {

            if (source.hasOwnProperty(prop)) {

                srcProp = source[prop];

                if (typeof srcProp === "string") {
                    srcProp = utils.dateParser.deserialize(srcProp);
                }

                if (ko.isObservable(target[prop])) { //set the observable property
                    target[prop](srcProp); // set the observable
                } else {
                    target[prop] = srcProp;
                }
            }
        }

        return target;
    },

    extend: function (target, source) {
        var prop;

        if (!target || !source) {
            return;
        }

        for (prop in source) {
            target[prop] = source[prop];
        }

        return target;
    },

    addPropertyChangedHandlers: function (obj, propertyName) {

        var property = obj[propertyName];

        //only subscribe to property changes if its a ko.observable... not an ObservableArray, or a Computed
        if (ko.isObservable(property) && !(property instanceof Array) && property.__ko_proto__ !== ko.dependentObservable) {

            // This is the actual PropertyChanged event
            property.subscribe(function (originalValue) {

                if (obj.es.ignorePropertyChanged === false) {

                    if (ko.utils.arrayIndexOf(obj.ModifiedColumns(), propertyName) === -1) {

                        if (!obj.es.originalValues[propertyName]) {
                            obj.es.originalValues[propertyName] = originalValue;
                        }

                        if (propertyName !== "RowState") {
                            obj.ModifiedColumns.push(propertyName);

                            if (obj.RowState() !== es.RowState.MODIFIED && obj.RowState() !== es.RowState.ADDED) {
                                obj.RowState(es.RowState.MODIFIED);
                            }
                        }
                    }
                }
            }, obj, "beforeChange"); //subscribe to 'beforeChange' so we can be notified of the current value and not the new value!
        }
    },

    startTracking: function (entity) {

        var propertyName;

        if (!entity.hasOwnProperty("RowState")) {
            entity.RowState = ko.observable(es.RowState.ADDED);
        } else {
            if (!ko.isObservable(entity.RowState)) {
                entity.RowState = ko.observable(entity.RowState);
            }
        }

        if (entity.hasOwnProperty("ModifiedColumns")) {
            //overwrite existing data
            entity.ModifiedColumns([]);
        } else {
            entity.ModifiedColumns = ko.observableArray();
        }


        for (propertyName in entity) {
            if (propertyName !== "ModifiedColumns" &&
                propertyName !== '__type' &&
                propertyName !== 'esExtendedData' &&
                propertyName !== 'es') {

                var property = entity[propertyName];

                if (property instanceof Array) {
                    continue;
                }

                if (entity.hasOwnProperty(propertyName) && ko.isObservable(property)) {
                    utils.addPropertyChangedHandlers(entity, propertyName);
                }
            }
        }

        return entity;
    },

    expandExtraColumns: function (entity, shouldMakeObservable) {

        var data,
            i,
            ext,
            makeObservable = arguments[1] || false;

        if (entity.esExtendedData && es.isArray(entity.esExtendedData)) {

            data = ko.isObservable(entity.esExtendedData) ? entity.esExtendedData() : entity.esExtendedData;

            for (i = 0; i < data.length; i++) {

                if (ko.isObservable(entity[data[i].Key])) { //set the observable property
                    entity[data[i].Key](data[i].Value); // set the observable
                } else {
                    if (makeObservable) {
                        entity[data[i].Key] = ko.observable(data[i].Value);
                    } else {
                        entity[data[i].Key] = data[i].Value;
                    }
                }
            }

            delete entity.esExtendedData;
        }

        if (data !== undefined) {

            entity["esExtendedData"] = [];

            for (i = 0; i < data.length; i++) {
                entity.esExtendedData.push(ko.isObservable(data[i].Key) ? data[i].Key() : data[i].Key);
            }
        }

        return entity;
    },


    removeExtraColumns: function (entity) {
        var i, data;

        if (entity.esExtendedData && es.isArray(entity.esExtendedData)) {

            data = ko.isObservable(entity.esExtendedData) ? entity.esExtendedData() : entity.esExtendedData;

            for (i = 0; i < data.length; i++) {
                delete entity[data[i]];
            }
            delete entity.esExtendedData;
        }

        return entity;
    },

    // Private function used by 'getDirtyEntities' below
    // NOTE: This strips out unwanted properties, this method is only to
    //       be used to by getDirtyEntities
    shallowCopy: function (src) {
        if (typeof src === 'object' && src !== null) {
            var dst;

            if (es.isArray(src)) {
                dst = [];
            }
            else if (src instanceof Date) {
                dst = new Date(src);
            }
            else if (src instanceof Boolean) {
                dst = new Boolean(src);
            }
            else if (src instanceof Number) {
                dst = new Number(src);
            }
            else if (src instanceof String) {
                dst = new String(src);
            }
            else if (Object.create && Object.getPrototypeOf) {
                dst = Object.create(Object.getPrototypeOf(src));
            }
            else if (src.__proto__ || src.constructor.prototype) {
                var proto = src.__proto__ || src.constructor.prototype || {};
                var T = function () { };
                T.prototype = proto;
                dst = new T;
                if (!dst.__proto__) { dst.__proto__ = proto; }
            }

            ko.utils.arrayForEach(es.objectKeys(src), function (key) {

                var srcValue;

                if (!es.isEsCollection(src[key])) {

                    switch (key) {
                        case 'es':
                        case 'routes':
                            break;

                        default:

                            srcValue = src[key];

                            if (srcValue instanceof Date) {
                                dst[key] = utils.dateParser.serialize(srcValue);
                            } else {
                                dst[key] = srcValue;
                            }
                            break;
                    }
                }
            });
            return dst;
        } else {
            return src;
        }
    },

    getDirtyGraph: function (obj) {

        var i, k, dirty, paths = [], root = null;

        es.Visit(obj).forEach(function (theObj) {

            if (this.key === "esExtendedData") {
                this.block();
            } else {

                if (this.isLeaf === false) {

                    if (theObj instanceof Array) { return theObj; }

                    if (theObj.hasOwnProperty("RowState")) {

                        switch (theObj.RowState) {

                            case es.RowState.ADDED:
                            case es.RowState.DELETED:
                            case es.RowState.MODIFIED:

                                paths.push(this.path);
                                break;
                        }
                    }
                }
            }

            return theObj;
        });

        //#region Rebuild tree of dirty objects from "paths[]"
        if (paths.length > 0) {

            if (es.isArray(obj)) {
                dirty = [];
            } else {
                dirty = utils.shallowCopy(utils.removeExtraColumns(obj));
            }

            root = dirty;

            for (i = 0; i < paths.length; i++) {

                var thePath = paths[i];
                var data = obj;
                dirty = root;

                for (k = 0; k < thePath.length; k++) {

                    if (!dirty.hasOwnProperty(thePath[k])) {

                        if (es.isArray(data[thePath[k]])) {
                            dirty[thePath[k]] = [];
                            dirty = dirty[thePath[k]];
                        }
                    } else {
                        dirty = dirty[thePath[k]];
                    }

                    data = data[thePath[k]];
                }

                data = utils.removeExtraColumns(data);

                if (es.isArray(dirty)) {
                    dirty.push(utils.shallowCopy(data));
                } else {
                    dirty = utils.shallowCopy(data);
                }
            }
        }
        //#endregion Save

        return root;
    }
};

utils.newId = (function () {
	var seedId = new Date().getTime();

	return function () {
		return ++seedId;
	};

} ());

es.utils = utils;

es.exportSymbol('es.extend', es.extend);
es.exportSymbol('es.startTracking', es.startTracking);
es.exportSymbol('es.getDirtyGraph', es.getDirtyGraph);