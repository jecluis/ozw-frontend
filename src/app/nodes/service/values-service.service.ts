/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { Injectable, WrappedValue } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, merge } from 'rxjs';
import { NetworkValue, Value } from 'src/app/types/Value';
import { catchError } from 'rxjs/operators';
import { throwToolbarMixedModesError } from '@angular/material/toolbar';

export interface ScopeValues {
	scope: string;
	values: NetworkValue[];
	last_fetch: Date;
}

interface ValueWrapper {
	valueid: string;
	value: NetworkValue;
	last_fetch: Date;
	subject: BehaviorSubject<NetworkValue|undefined>;
}

declare type ScopeValueMap = {[id: string]: ScopeValues};
declare type NetworkValueMap = {[id: string]: ValueWrapper};


interface NodeValue {
	nodeid: number;
	scopes: ScopeValueMap;
	values: NetworkValueMap;
}

interface NodeValueWrapper {
	nodevalue: NodeValue;
	value_subject: BehaviorSubject<NetworkValue[]>;
	scope_subject: BehaviorSubject<ScopeValues>;
}

@Injectable({
	providedIn: 'root'
})
export class ValuesService {

	private _values_by_node: {[id: number]: NodeValueWrapper} = {};
	private _fetch_interval: number = 20000;


	constructor(private _http: HttpClient) { }


	private _shouldFetch(last_fetch: Date) {
		let now: number = new Date().getTime();
		return (now - last_fetch.getTime() >= this._fetch_interval);
	}

	private _getOrCreateNode(nodeid: number): NodeValueWrapper {
		if (!(nodeid in this._values_by_node)) {
			console.debug(`creating node ${nodeid}`);
			this._values_by_node[nodeid] = {
				nodevalue: {
					nodeid: nodeid,
					scopes: {},
					values: {}
				},
				scope_subject: new BehaviorSubject<ScopeValues>(undefined),
				value_subject: new BehaviorSubject<NetworkValue[]>([])
			};
		}
		return this._values_by_node[nodeid];
	}

	private _getOrCreateScope(nodeid: number, scope: string): ScopeValues {
		let _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
		if (!(scope in _node_wrapper.nodevalue.scopes)) {
			_node_wrapper.nodevalue.scopes[scope] = {
				scope: scope,
				values: [],
				last_fetch: new Date(0)
			};
		}
		return _node_wrapper.nodevalue.scopes[scope];
	}

	private _getOrCreateValueByID(
		nodeid: number, valueid: string
	): ValueWrapper {
		let _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
		if (!(valueid in _node_wrapper.nodevalue.values)) {
			let _value: ValueWrapper = {
				valueid: valueid,
				value: {} as NetworkValue,
				last_fetch: new Date(0),
				subject: new BehaviorSubject<NetworkValue|undefined>(undefined)
			}
			_node_wrapper.nodevalue.values[valueid] = _value;
		}
		return _node_wrapper.nodevalue.values[valueid];
	}

	private _getOrCreateValue(
		nodeid: number, value: NetworkValue
	): ValueWrapper {
		let _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
		let _valueid = value.value.value_id;
		if (!(_valueid in _node_wrapper.nodevalue.values)) {
			let _value: ValueWrapper = {
				valueid: _valueid,
				value: value,
				last_fetch: new Date(0),
				subject: new BehaviorSubject<NetworkValue>(value)
			}
			_node_wrapper.nodevalue.values[_valueid] = _value;
		}
		return _node_wrapper.nodevalue.values[_valueid];
	}

	public getValues(nodeid: number): NetworkValue[] {
		if (!(nodeid in this._values_by_node)) {
			return [];
		}
		let _values_map: NetworkValueMap =
			this._values_by_node[nodeid].nodevalue.values;
		let _values: NetworkValue[] = [];
		Object.values(_values_map).forEach( (wrapper: ValueWrapper) => {
			_values.push(wrapper.value);
		});
		return _values;
	}

	public getValuesByScope(
		nodeid: number, scope: string
	): BehaviorSubject<ScopeValues> {

		let _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
		let _scope: ScopeValues = this._getOrCreateScope(nodeid, scope);
		if (!this._shouldFetch(_scope.last_fetch)) {
			_node_wrapper.scope_subject.next(_scope);
			return _node_wrapper.scope_subject;
		}
		
		let endpoint = `/api/nodes/${nodeid}/values/genre/${scope}`;
		this._http.get<NetworkValue[]>(endpoint)
		.pipe(
			catchError( () => merge([]))
		)
		.subscribe( (values: NetworkValue[]) => {
			let scope_value: ScopeValues = {
				scope: scope,
				last_fetch: new Date(),
				values: values
			};
			_node_wrapper.nodevalue.scopes[scope] = scope_value;
			_node_wrapper.scope_subject.next(scope_value);

			let node_values: NetworkValueMap = _node_wrapper.nodevalue.values;
			values.forEach( (value: NetworkValue) => {
				let _value: ValueWrapper =
					this._getOrCreateValue(nodeid, value);
				node_values[value.value.value_id] = _value;
				_value.subject.next(value);
			});
			_node_wrapper.value_subject.next(this.getValues(nodeid));
		});
		return _node_wrapper.scope_subject;
	}

	public getValueByID(
		nodeid: number, valueid: string
	): BehaviorSubject<NetworkValue> {
	
		let _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
		let _node_value_map: NetworkValueMap = _node_wrapper.nodevalue.values;
		if (valueid in _node_value_map) {
			let _value_wrapper: ValueWrapper = _node_value_map[valueid];
			if (!this._shouldFetch(_value_wrapper.last_fetch)) {
				return _value_wrapper.subject;
			}
		}

		let _value_wrapper = this._getOrCreateValueByID(nodeid, valueid);

		let endpoint = `/api/nodes/${nodeid}/values/id/${valueid}`;
		this._http.get<NetworkValue>(endpoint)
		.pipe(
			catchError( () => merge([]))
		).subscribe( (value: NetworkValue) => {
			_value_wrapper.subject.next(value);
			// XXX: we're not updating the scope here. We should!
		});
		console.debug(`getvaluebyid(${nodeid}): `, _value_wrapper.subject);
		return _value_wrapper.subject;
	}

}
