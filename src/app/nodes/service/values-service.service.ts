/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, merge, interval } from 'rxjs';
import { NetworkValue, APIValueSetRequest } from '../../types/Value';
import { catchError } from 'rxjs/operators';
import { NodesService } from './nodes-service.service';
import { NetworkNode } from '../../types/Node';

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
    private _all_fetch_interval: number = this._fetch_interval * 3;


    public constructor(
        private _http: HttpClient,
        private _nodes_svc: NodesService
    ) {
        interval(this._all_fetch_interval).subscribe( () => {
            this._fetchAllValues();
        });
        // run immediately
        this._fetchAllValues();
    }


    private _shouldFetch(last_fetch: Date): boolean {
        const now: number = new Date().getTime();
        return (now - last_fetch.getTime() >= this._fetch_interval);
    }

    private _nodeExists(nodeid: number): boolean {
        return (nodeid in this._values_by_node);
    }

    private _valueIDExists(nodeid: number, valueid: string): boolean {
        if (!this._nodeExists(nodeid)) {
            return false;
        }
        return (valueid in this._values_by_node[nodeid].nodevalue.values);
    }

    private _getOrCreateNode(nodeid: number): NodeValueWrapper {
        if (!this._nodeExists(nodeid)) {
            console.debug(`values-svc: creating node ${nodeid}`);
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

    private _getOrCreateScope(nodeid: number, _scope: string): ScopeValues {
        const _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
        if (!(_scope in _node_wrapper.nodevalue.scopes)) {
            _node_wrapper.nodevalue.scopes[_scope] = {
                scope: _scope,
                values: [],
                last_fetch: new Date(0)
            };
        }
        return _node_wrapper.nodevalue.scopes[_scope];
    }

    private _getOrCreateValueByID(
        nodeid: number, _valueid: string
    ): ValueWrapper {
        const _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
        if (!this._valueIDExists(nodeid, _valueid)) {
            const _value: ValueWrapper = {
                valueid: _valueid,
                value: {} as NetworkValue,
                last_fetch: new Date(0),
                subject: new BehaviorSubject<NetworkValue|undefined>(undefined)
            };
            _node_wrapper.nodevalue.values[_valueid] = _value;
        }
        return _node_wrapper.nodevalue.values[_valueid];
    }

    private _getOrCreateValue(
        nodeid: number, value: NetworkValue
    ): ValueWrapper {
        const _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
        const _valueid = value.value.value_id;
        if (!this._valueIDExists(nodeid, _valueid)) {
            const _value: ValueWrapper = {
                valueid: _valueid,
                value: value,
                last_fetch: new Date(0),
                subject: new BehaviorSubject<NetworkValue>(value)
            };
            _node_wrapper.nodevalue.values[_valueid] = _value;
        }
        return _node_wrapper.nodevalue.values[_valueid];
    }

    private _updateAllValues(nodeid: number, values: NetworkValue[]): void {
        console.debug(`values-svc: update values for node ${nodeid}`);

        const _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
        const _node_scopes: ScopeValueMap = {};

        values.forEach( (value: NetworkValue) => {
            const _scope_name: string = value.value.genre;
            if (!(_scope_name in _node_scopes)) {
                _node_scopes[_scope_name] = {
                    last_fetch: new Date(),
                    scope: _scope_name,
                    values: []
                };
            }
            _node_scopes[_scope_name].values.push(value);
        });

        for (let _scope_name in _node_scopes) {
            let _scope: ScopeValues = _node_scopes[_scope_name];
            _node_wrapper.nodevalue.scopes[_scope_name] = _scope;
            _node_wrapper.scope_subject.next(_scope);
        }

        values.forEach( (value: NetworkValue) => {
            let _value = this._getOrCreateValue(nodeid, value);
            _value.value = value;
            _value.last_fetch = new Date();
            _value.subject.next(value);
        });
    }

    private _fetchAllValues(): void {
        console.debug("values-svc: fetch all values");
        const _nodes: NetworkNode[] = this._nodes_svc.getKnownNodes();
        _nodes.forEach( (node: NetworkNode) => {
            const endpoint = `/api/nodes/${node.id}/values`;
            this._http.get<NetworkValue[]>(endpoint)
            .pipe(catchError( () => merge([])))
            .subscribe( (values: NetworkValue[]) => {
                this._updateAllValues(node.id, values);
            });
        });
    }

    public getValues(nodeid: number): NetworkValue[] {
        if (!(nodeid in this._values_by_node)) {
            return [];
        }
        const _values_map: NetworkValueMap =
            this._values_by_node[nodeid].nodevalue.values;
        const _values: NetworkValue[] = [];
        Object.values(_values_map).forEach( (wrapper: ValueWrapper) => {
            _values.push(wrapper.value);
        });
        return _values;
    }

    public getValuesByScope(
        nodeid: number, scope: string
    ): BehaviorSubject<ScopeValues> {

        const _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
        const _scope: ScopeValues = this._getOrCreateScope(nodeid, scope);
        if (!this._shouldFetch(_scope.last_fetch)) {
            _node_wrapper.scope_subject.next(_scope);
            return _node_wrapper.scope_subject;
        }

        const endpoint = `/api/nodes/${nodeid}/values/genre/${scope}`;
        this._http.get<NetworkValue[]>(endpoint)
        .pipe(
            catchError( () => merge([]))
        )
        .subscribe( (values: NetworkValue[]) => {
            const scope_value: ScopeValues = {
                scope: scope,
                last_fetch: new Date(),
                values: values
            };
            _node_wrapper.nodevalue.scopes[scope] = scope_value;
            _node_wrapper.scope_subject.next(scope_value);

            const node_values: NetworkValueMap = _node_wrapper.nodevalue.values;
            values.forEach( (value: NetworkValue) => {
                const _value: ValueWrapper =
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
        const _node_wrapper: NodeValueWrapper = this._getOrCreateNode(nodeid);
        const _node_value_map: NetworkValueMap = _node_wrapper.nodevalue.values;
        if (valueid in _node_value_map) {
            const _value_wrapper: ValueWrapper = _node_value_map[valueid];
            if (!this._shouldFetch(_value_wrapper.last_fetch)) {
                return _value_wrapper.subject;
            }
        }

        const _value_wrapper = this._getOrCreateValueByID(nodeid, valueid);

        const endpoint = `/api/nodes/${nodeid}/values/id/${valueid}`;
        this._http.get<NetworkValue>(endpoint)
        .pipe(
            catchError( () => merge([]))
        ).subscribe( (value: NetworkValue) => {
            _value_wrapper.value = value;
            _value_wrapper.subject.next(value);
            // XXX: we're not updating the scope here. We should!
        });
        return _value_wrapper.subject;
    }

    public setValueByID(
        nodeid: number, valueid: string, value: boolean|number|string
    ): void {
        if (!this._nodeExists(nodeid)) {
            return; // XXX: throw!
        }
        if (!this._valueIDExists(nodeid, valueid)) {
            return; // XXX: throw!
        }
        const _value_wrapper: ValueWrapper =
            this._getOrCreateValueByID(nodeid, valueid);
        console.log(`values-svc: set-value-by-id wrapper `, _value_wrapper);
        const _value: NetworkValue = _value_wrapper.value;
        const _request: APIValueSetRequest = {
            value_id: valueid,
            value_type: _value.value.type,
            node_id: nodeid,
            class_id: _value.value.class_id,
            instance: _value.value.instance,
            index: _value.value.index,
            value: value
        };
        const endpoint = `/api/nodes/${nodeid}/values/id/${valueid}`;
        console.debug(
            `values-svc: set node ${nodeid} value ${valueid} to `, _request);
        this._http.post<boolean>(endpoint, _request)
        .subscribe(
            (ret: boolean) => {
                console.debug(`values-svc: asked to set node ${nodeid} value ${valueid} to`, _request);
            },
            (err: any) => {
                console.debug(`values-svc: error setting node ${nodeid} value ${valueid} to`, _request, ": ", err);
            }
        );
    }

    public hasValueID(nodeid: number, valueid: string): boolean {
        return this._valueIDExists(nodeid, valueid);
    }

    public getSwitchState(
        nodeid: number
    ): BehaviorSubject<NetworkValue|undefined> {
        const switch_value_id = `${nodeid}-37-1-0`;
        return this.getValueByID(nodeid, switch_value_id);
    }
}
