import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings-operations',
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.scss']
})
export class SettingsOperationsComponent implements OnInit {

	constructor() { }

	ngOnInit(): void {
	}

	private _is_running_operation: boolean = false;

	private _setRunningOperation(): void {
		console.log("settings > operations > is running operation");
		this._is_running_operation = true;
	}

	isRunningOperation(): boolean {
		return this._is_running_operation;
	}


	runAddNode(): void {
		this._setRunningOperation();
	}

	runRemoveNode(): void {
		this._setRunningOperation();
	}

	runHealNetwork(): void {
		this._setRunningOperation();
	}

	runUpdateNeighbors(): void {
		this._setRunningOperation();
	}

	runRefreshInfo(): void {
		this._setRunningOperation();
	}
}
