/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import {
	AfterViewInit, Component, OnInit, ViewChild, Input, OnChanges
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { NodeDetailsTableDataSource, } from './node-details-table-datasource';
import { HttpClient } from '@angular/common/http';
import { NetworkValue, Value } from '../../../types/Value';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { ValuesService } from '../../service/values-service.service';

@Component({
	selector: 'app-node-details-table',
	templateUrl: './node-details-table.component.html',
	styleUrls: ['./node-details-table.component.scss']
})
export class NodeDetailsTableComponent 
       implements AfterViewInit, OnInit, OnChanges {
	@ViewChild(MatPaginator) paginator: MatPaginator;
	@ViewChild(MatSort) sort: MatSort;
	@ViewChild(MatTable) table: MatTable<NetworkValue>;

	@Input() scope: string
	@Input() node_id: number;

  	datasource = new NodeDetailsTableDataSource(this._values_svc);
	displayedColumns = ['label', 'data'];
	values_observer: BehaviorSubject<NetworkValue[]> =
		this.datasource.getNodeDetailsSubject();
	form_controls: {[id: string]: FormControl} = {};
	form_groups: {[id: string]: FormGroup} = {};


	constructor(
		private http: HttpClient,
		private fb: FormBuilder,
		private _values_svc: ValuesService
	) { }

	ngOnInit() {
		console.log("details: init datasource for scope ", this.scope);
		this.values_observer.subscribe( (values) => {
			values.forEach( (value: NetworkValue) => {
				let value_id: string = value.value.value_id;
				let fc: FormControl = new FormControl('');
				this.form_controls[value_id] = fc;
				this.form_groups[value_id] = new FormGroup({
					valuectrl: fc
				});
				fc.setValue(value.value.value);
			});
		});
	}

	ngOnChanges() {
		this.datasource.clearState();
		this.datasource.loadDetails(this.node_id, this.scope);
	}

	ngAfterViewInit() {
		console.log("details: after view init");
		this.datasource.sort = this.sort;
		this.datasource.paginator = this.paginator;
		this.table.dataSource = this.datasource;
	}

	public onSubmit(net_value: NetworkValue) {
		let _value = net_value.value;
		let _valueid = _value.value_id;
		let _new_value = this.form_groups[_valueid].value['valuectrl'];
		console.log(`details: submit id ${_valueid} value`, _new_value);
		this.setValue(net_value, _new_value);
	}

	public onChange(valueid: string) {
		console.log(`details: change id ${valueid}`);
	}

	public toggleSwitch(net_value: NetworkValue): void {
		console.log(`details: value: `, net_value);
		let _value: Value = net_value.value;
		console.log(`details: toggle ${_value.value_id}`);
		let _new_value: boolean = !_value.value;
		this._values_svc.setValueByID(
			_value.node_id, _value.value_id, _new_value);		
	}

	public setValue(
		net_value: NetworkValue, new_value: string|number|boolean
	): void {
		console.log(`details: set value `, net_value, ` to ${new_value}`);
		let _nodeid: number = net_value.value.node_id;
		let _valueid: string = net_value.value.value_id;
		this._values_svc.setValueByID(_nodeid, _valueid, new_value);
	}

	public isDisabled(value: NetworkValue) {
		return false;
	}
}
