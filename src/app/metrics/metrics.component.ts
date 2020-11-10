/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
    ChartValue,
    LineSeriesEntry,
    PrometheusReplyResult,
    PrometheusMatrixResult,
    PrometheusMatrixReplyResult,
    PrometheusReplyData,
    PrometheusReply
} from './types';
import { NodesService } from '../nodes/service/nodes-service.service';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { PrometheusService } from './prometheus.service';
import { map, shareReplay } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';


interface LayoutConfig {
    cols: number;
    cards: {
        daily_watt: {
            cols: number;
            rows: number;
        },
        last_30d_kwh: {
            cols: number;
            rows: number;
        },
        last_30d_slots: {
            cols: number;
            rows: number;
        }
    };
}


@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.component.html',
  styleUrls: ['./metrics.component.scss']
})
export class MetricsComponent implements OnInit {

    public isHandset$: Observable<boolean> =
        this.breakpointObserver.observe([
            Breakpoints.Handset,
            Breakpoints.Tablet,
            Breakpoints.Medium,
            Breakpoints.Small
    ])
    .pipe(
        map(result => result.matches),
        shareReplay()
    );

    private _layout_handset: LayoutConfig = {
        cols: 1,
        cards: {
            daily_watt: { cols: 1, rows: 3 },
            last_30d_kwh: { cols: 1, rows: 3},
            last_30d_slots: { cols: 1, rows: 3}
        }
    };
    private _layout_regular: LayoutConfig = {
        cols: 4,
        cards: {
            daily_watt: { cols: 2, rows: 3 },
            last_30d_kwh: { cols: 1, rows: 3 },
            last_30d_slots: { cols: 1, rows: 3}
        }
    };
    public layout: LayoutConfig = this._layout_regular;

    constructor(
        private breakpointObserver: BreakpointObserver
    ) {
        this.isHandset$.subscribe(this._changeLayout.bind(this));
    }

    public ngOnInit(): void { }

    private _changeLayout(handset_like: boolean): void {
        if (handset_like) {
            this.layout = this._layout_handset;
        } else {
            this.layout = this._layout_regular;
        }
    }
}
