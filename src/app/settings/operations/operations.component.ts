import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings-operations',
  templateUrl: './operations.component.html',
  styleUrls: ['./operations.component.scss']
})
export class SettingsOperationsComponent implements OnInit {

	constructor(private networksvc: NetworkService) { }

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
			this._is_running_operation = this._status.is_running_command;
		}
	}

	private _is_running_operation: boolean = false;
	private _status: CommandStatus;
	private _progress_str: string = ""; // read by the view
	private _progress_percent: number = 0;

	private _setRunningOperation(): void {
		console.log("settings > operations > is running operation");
		this._is_running_operation = true;
	}

	private _handleStatusUpdate(status: CommandStatus) {
		if (!status) { return; }

		if (status.is_running_command && !this._is_running_operation) {
			console.log("we are now running a command.");
			this._is_running_operation = true;
		} else if (!status.is_running_command && this._is_running_operation) {
			console.log("no longer running a command");
			new Promise((resolve, reject) => {
				setTimeout( (resolve) => {
					this._is_running_operation = false;
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
			let diff = now - state.time_started.getTime();
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
