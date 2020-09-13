import { Component, OnInit } from '@angular/core';
import { NetworkService } from '../../network/service/network.service';
import { CommandStatus, CommandEnumToString, CommandState, CommandGetStateString, CommandEnum } from '../../types/Command';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-settings-operations',
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.scss']
})
export class SettingsOperationsComponent implements OnInit {

	constructor(
		private networksvc: NetworkService,
		private http: HttpClient,
		private snackbar: MatSnackBar
	) { }

	ngOnInit(): void {
		this._status = this.networksvc.getCommandStatus();
		this.networksvc.getCommandStatusObserver().subscribe(
			(status: CommandStatus) => {
				console.log("operations > command status: ", status);
				if (!status) {
					return;
				}
				this._handleStatusUpdate(status);
			}
		);
		if (!this._status) {
			this._status = {} as CommandStatus;
			this._status.is_running_command = false;
			this._updateStatusProgress(this._status.current_command);
		} else {
			this._is_running_command = this._status.is_running_command;
		}
	}

	private _is_running_command: boolean = false;
	private _status: CommandStatus;
	private _progress_str: string = ""; // read by the view
	private _progress_percent: number = 0;
	// this just allows us to block buttons until an op starts
	private _triggered_operation: boolean = false;

	_operations = [
		{
			name: "add node", icon: "add",
			action: this.runAddNode.bind(this),
			check: this.isRunningAddNode.bind(this)
		},
		{
			name: "remove node", icon: "remove",
			action: this.runRemoveNode.bind(this),
			check: this.isRunningRemoveNode.bind(this)
		},
		{
			name: "heal network", icon: "healing",
			action: this.runHealNetwork.bind(this),
			check: this.isRunningHealNetwork.bind(this)
		},
		{
			name: "refresh information", icon: "refresh",
			action: this.runRefreshInfo.bind(this),
			check: this.isRunningRefreshInfo.bind(this)
		}
	]


	private _handleStatusUpdate(status: CommandStatus) {
		if (!status) { return; }

		if (status.is_running_command && !this._is_running_command) {
			console.log("we are now running a command.");
			this._is_running_command = true;
		} else if (!status.is_running_command && this._is_running_command) {
			console.log("no longer running a command");
			new Promise((resolve, reject) => {
				setTimeout( (resolve) => {
					this._is_running_command = false;
					this._progress_percent = 0;
					this._progress_str = "";
				}, 5000);
			})
			this._updateStatusFinished(status);
		}
		this._updateStatusProgress(status.current_command);
		this._status = status;
	}

	private _updateStatusProgress(state: CommandState) {
		if (!state) {
			return;
		}
		let statestr: string = CommandGetStateString(state);
		let cmdstr = CommandEnumToString(state.command).toUpperCase();
		let progress_str = `${statestr.toLocaleUpperCase()} > ${cmdstr}`;
		if (state.percent_done) {
			this._progress_percent = state.percent_done;
			progress_str += ` (${this._progress_percent}%)`
		}

		if (!!state.time_started) {
			let now: number = new Date().getTime();
			// let diff = now - state.time_started;
			let diff = 0;
			let secs = Math.floor(diff/1000);
			progress_str += " - running for " + secs + " seconds";
		}
		this._progress_str = progress_str;
	}

	private _updateStatusFinished(status: CommandStatus) {
		if (!status.last_command) {
			console.error("expected last command, found ", status);
			return;
		}
		this._updateStatusProgress(status.last_command);
	}


	private _setTriggerOperation(): void {
		console.log("settings > operations > is running operation");
		this._triggered_operation = true;
		new Promise( (resolve, reject) => {
			setTimeout( (resolve) => {
				this._triggered_operation = false;
			}, 10000);
		});
		this.snackbar.open(
			"triggering operation; please wait.",
			"OK",
			{ duration: 5000 }
		);
	}

	isRunningOperation(): boolean {
		return this._is_running_command;
	}

	isTriggeredOperation(): boolean {
		return this._is_running_command || this._triggered_operation;
	}

	cancelOperation() {
		console.log("cancel operation");
		this.http.put('/api/command/cancel', true)
		.subscribe( (res) => {
			console.log("cancelled operation:", res)
		});
	}

	runAddNode(): void {
		console.log("run add node");
		this._setTriggerOperation();
		this.http.put('/api/command/node/add', true)
		.subscribe( (res) => console.log("adding node"));
	}

	runRemoveNode(): void {
		this._setTriggerOperation();
		this.http.put('/api/command/node/remove', true)
		.subscribe( (res) => console.log("removing node"));
	}

	runHealNetwork(): void {
		this._setTriggerOperation();
		this.http.put('/api/command/network/heal', true)
		.subscribe( (res) => console.log("healing network"));
	}

	runRefreshInfo(): void {
		this._setTriggerOperation();
	}

	isRunningOperationType(op: CommandEnum) {
		return (this._is_running_command &&
			this._status && this._status.current_command &&
		    this._status.current_command.command == op);
	}

	isRunningAddNode(): boolean {
		return this.isRunningOperationType(CommandEnum.AddDevice);
	}

	isRunningRemoveNode(): boolean {
		return this.isRunningOperationType(CommandEnum.RemoveDevice);
	}

	isRunningHealNetwork(): boolean {
		return this.isRunningOperationType(CommandEnum.RequestNodeNeighborUpdate);
	}

	isRunningRefreshInfo(): boolean {
		return false;
	}
}
