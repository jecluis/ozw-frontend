/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { map } from 'rxjs/operators';

interface APIKVStoreReply<T> {
    key: string;
    value: T;
    result: boolean;
}

interface APIKVStoreRequest {
    value: string;
}

@Injectable({
    providedIn: 'root'
})
export class KVStoreService {

    constructor(private _http: HttpClient) { }

    public get<T>(key: string): Observable<T|undefined> {
        const _obs: Observable<T|undefined> = new Observable<T|undefined>(
            (subscriber: Subscriber<T|undefined>) => {
                this._http.get<APIKVStoreReply<T>>(`/api/kvstore/get/${key}`)
                .subscribe({
                    next: (reply: APIKVStoreReply<T>) => {
                        if (!reply.result || !reply.value) {
                            subscriber.next(undefined);
                        } else {
                            subscriber.next(reply.value);
                        }
                    }
                });
            }
        );
        return _obs;
    }

    public put(_key: string, _value: any): Observable<boolean> {
        const _obs: Observable<boolean> = new Observable<boolean>(
            (subscriber: Subscriber<boolean>) => {
                const body: APIKVStoreRequest = {
                    value: JSON.stringify(_value)
                };
                console.log("kvstore > put > ", body);
                this._http.put<APIKVStoreReply<boolean>>(
                    `/api/kvstore/put/${_key}`, body
                ).subscribe({
                    next: (reply: APIKVStoreReply<any>) => {
                        subscriber.next(reply.result);
                    }
                });
            }
        );
        return _obs;
    }

    public exists(_key: string): Observable<boolean> {
        const _obs: Observable<boolean> = new Observable<boolean>(
            (subscriber: Subscriber<boolean>) => {
                this._http.get<APIKVStoreReply<boolean>>(
                    `/api/kvstore/exists/${_key}`
                ).pipe(
                    map( (reply: APIKVStoreReply<boolean>) => {
                        console.log(`kvstore > exists ${_key}: `, reply);
                        console.log(`kvstore > exists ${_key}: next ${reply.result}`);
                        subscriber.next(reply.result);
                        subscriber.complete();
                    })
                ).subscribe( () => {});
            }
        );
        return _obs;
    }
}
