/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { KVStoreService } from '../kvstore/kvstore.service';
import { NodesService } from '../nodes/service/nodes-service.service';
import { NetworkNode } from '../types/Node';


interface NodeLock {
    full_lock: boolean;  // is node fully locked; takes precedence over genre.
    genre_lock: string[];  // takes precedence over individual locks
    locks: string[];
}

interface LockSetter {
    full_lock?: boolean;
    genre?: string;
    value?: string;
}

@Injectable({
    providedIn: 'root'
})
export class LockingService {

    private _nodes_subject: BehaviorSubject<NetworkNode[]>;
    private _nodes_subscription: Subscription;
    private _locks_per_node: {[id: number]: NodeLock} = {};

    constructor(
        private _kvstore: KVStoreService,
        private _nodes_svc: NodesService
    ) {
        this._nodes_subject = this._nodes_svc.getNodes();
        this._nodes_subscription =
            this._nodes_subject.subscribe({
                next: this._refreshNodes.bind(this)
            });
    }

    private _getLockKey(node: number): string {
        return `locks.node.${node}`;
    }

    private _refreshNodes(_nodes: NetworkNode[]): void {
        _nodes.forEach( (_node: NetworkNode) => {
            this._refreshNode(_node);
        });
    }

    private _refreshNode(_node: NetworkNode): void {
        const _id: number = _node.id;
        const _lkey: string = this._getLockKey(_id);
        this._kvstore.exists(_lkey).subscribe({
            next: (result: boolean) => {
                console.log(`lock-svc > refresh ${_id}: `, result);
                if (!result) {
                    delete this._locks_per_node[_id];
                    return;
                }
                this._kvstore.get<string>(_lkey).subscribe({
                    next: (_str: string) => {
                        console.log(`lock-svc > got ${_lkey}: `, _str);
                        if (!_str) {
                            return;
                        }
                        // const _lockstr: string = JSON.parse(_str);
                        const _lockstr: string = _str;
                        const _lock: NodeLock = JSON.parse(_lockstr);
                        if (!_lock) {
                            return;
                        }
                        console.log(`lock-svc > get ${_lkey}: `, _lock);
                        this._locks_per_node[_id] = _lock;
                    }
                });
            }
        });
    }

    private _updateNode(_nodeid: number): void {
        if (!(_nodeid in this._locks_per_node)) {
            return;
        }
        const lkey: string = this._getLockKey(_nodeid);
        this._kvstore.put(lkey, this._locks_per_node[_nodeid]).subscribe({
            next: (result: boolean) => {}
        });
    }

    public hasLock(_nodeid: number): boolean {
        return _nodeid in this._locks_per_node;
    }

    public isFullyLocked(_nodeid: number): boolean {
        return (
            this.hasLock(_nodeid) &&
            this._locks_per_node[_nodeid].full_lock
        );
    }

    public isGenreLocked(_nodeid: number, _genre: string): boolean {
        return (this.hasLock(_nodeid) &&
            (this.isFullyLocked(_nodeid) ||
             _genre in this._locks_per_node[_nodeid].genre_lock)
        );
    }

    public isLocked(_nodeid: number, _valueid: string): boolean {
        if (!this.hasLock(_nodeid)) {
            return false;
        }
        if (this.isFullyLocked(_nodeid)) {
            return true;
        }
        return (
            this._locks_per_node[_nodeid].locks.indexOf(_valueid) >= 0
        );
    }

    public setLock(_nodeid: number, what?: LockSetter): void {
        if (!(_nodeid in this._locks_per_node)) {
            this._locks_per_node[_nodeid] = {
                full_lock: false,
                genre_lock: [],
                locks: []
            };
        }
        let is_full_lock: boolean = false;
        let is_genre_lock: boolean = false;
        let is_value_lock: boolean = false;

        if (!what) {
            is_full_lock = true;
        } else {
            is_full_lock = !!what.full_lock ? what.full_lock : false;
            is_genre_lock = (!!what.genre ? true : false) &&
                            (what.genre !== "");
            is_value_lock = !!what.value ? true : false;
        }

        if (!is_full_lock && !is_genre_lock && !is_value_lock) {
            console.warn("lock-svc: lock: nothing to set");
            return;
        }

        if (is_full_lock) {
            this._locks_per_node[_nodeid].full_lock = is_full_lock;
        }
        if (is_genre_lock) {
            this._locks_per_node[_nodeid].genre_lock.push(what.genre);
        }
        if (is_value_lock) {
            this._locks_per_node[_nodeid].locks.push(what.value);
        }
        this._updateNode(_nodeid);
    }

    public unsetLock(_nodeid: number, what?: LockSetter): void {
        if (!(_nodeid in this._locks_per_node)) {
            return;
        }

        const is_full_unlock: boolean = !!what && !!(what.full_lock);
        const is_genre_unlock: boolean = !!what && (what.genre?.length > 0);
        const is_value_unlock: boolean = !!what && (what.value?.length > 0);

        const node_lock = this._locks_per_node[_nodeid];
        if (node_lock.full_lock && !is_full_unlock) {
            return;
        }
        if (is_full_unlock) {
            node_lock.full_lock = false;
        }
        if (is_genre_unlock) {
            const new_genres: string[] = [];
            node_lock.genre_lock.forEach( (genre: string) => {
                if (genre !== what.genre) {
                    new_genres.push(genre);
                }
            });
            node_lock.genre_lock = new_genres;
        }
        if (is_value_unlock) {
            const new_value_locks: string[] = [];
            node_lock.locks.forEach( (value_lock: string) => {
                if (value_lock !== what.value) {
                    new_value_locks.push(value_lock);
                }
            });
            node_lock.locks = new_value_locks;
        }
        this._updateNode(_nodeid);
    }
}
