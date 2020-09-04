/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave backend (ozw-backend).
 * ozw-backend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */

export enum CommandEnum {
	None                        = 0,
	AddDevice                   = 1,
	CreateNewPrimary            = 2,
	ReceiveConfiguration        = 3,
	RemoveDevice                = 4,
	RemoveFailedNode            = 5,
	HasNodeFailed               = 6,
	ReplaceFailedNode           = 7,
	TransferPrimaryRole         = 8,
	RequestNetworkUpdate        = 9,
	RequestNodeNeighborUpdate   = 10,
	AssignReturnRoute           = 11,
	DeleteAllReturnRoutes       = 12,
	SendNodeInformation         = 13,
	ReplicationSend             = 14,
	CreateButton                = 15,
	DeleteButton                = 16,
	CancelCommand				= 17,
	NotACommand					= 18, // increase on additional commands.
}


export interface CommandState {
	command: CommandEnum;
	is_completed: boolean;
	is_failed: boolean;
	is_cancelled: boolean;
	is_running: boolean;
	is_waiting: boolean;
	percent_done: number;

	time_started: Date;
	time_finished?: Date;
}

export interface CommandStatus {
	is_running_command: boolean;
	current_command?: CommandState;
	last_command?: CommandState;
}

export function CommandEnumToString(cmd: CommandEnum): string {
	switch (cmd) {
		case CommandEnum.AddDevice:
			return "add node";
		case CommandEnum.RemoveDevice:
			return "remove node";
		case CommandEnum.RemoveFailedNode:
			return "remove failed node";
		case CommandEnum.ReplaceFailedNode:
			return "replace failed node";
		case CommandEnum.RequestNetworkUpdate:
			return "network update";
		case CommandEnum.RequestNodeNeighborUpdate:
			return "heal network";
		case CommandEnum.CancelCommand:
			return "cancel command";
		default:
			return "unknown command";
	}
}

export function CommandGetStateString(state: CommandState): string {
	let states: string[] = [];
	if (state.is_completed) { states.push("completed"); }
	if (state.is_cancelled) { states.push("cancelled"); }
	if (state.is_failed) { states.push("failed"); }
	if (state.is_running) { states.push("running"); }
	if (state.is_waiting) { states.push("waiting"); }

	return states.join(" | ");
}