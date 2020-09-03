/*
 * Copyright (C) 2020  Joao Eduardo Luis <joao@wipwd.dev>
 *
 * This file is part of wip:wd's openzwave frontend (ozw-frontend).
 * ozw-frontend is free software: you can redistribute it and/or modify it under
 * the terms of the EUROPEAN UNION PUBLIC LICENSE v1.2, as published by the
 * European Comission.
 */
import { Injectable } from '@angular/core';
import { interval, of, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';


export enum DriverState {
	CONNECTED	= "connected",
	STARTED		= "started",
	STOPPED		= "stopped",
	READY		= "ready",
	FAILED		= "failed",
	UNKNOWN		= "unknown",
}

export enum NetworkState {
	STARTING	= "starting",
	STOPPED		= "stopped",
	ALIVE		= "alive",
	ASLEEP		= "asleep",
	AWAKE		= "awake",
	DEAD		= "dead",
	UNKNOWN		= "unknown",
}

export enum NetworkStateEnum {
	NONE 		= 0,
	STARTING	= 1,
	STOPPED		= 2,
	DEAD		= 3,
	SLEEP 		= 4,
	AWAKE 		= 5,
	ALIVE		= 6
}


interface DriverStateItem {
	is_connected: boolean;
	is_ready: boolean;
	is_failed: boolean;
	is_db_ready: boolean;
	is_scan_completed: boolean;
	device: string;
}

interface NetworkStateItem {
	nodes_alive: number;
	nodes_asleep: number;
	nodes_awake: number;
	nodes_dead: number;
	nodes_total: number;
	state: number;
	str: string;
}


interface FullStatusItem {
	driver: DriverStateItem;
	network: NetworkStateItem;
}

export interface SimpleStatusItem {
	driver_state: string;
	network_state: string;
	device: string;
}


@Injectable({
  providedIn: 'root'
})
export class NetworkService {

	driver_state_str: DriverState = DriverState.UNKNOWN;
  	network_state_str: NetworkState = NetworkState.UNKNOWN;

	status: FullStatusItem;
	driver_state: DriverStateItem;
	network_state: NetworkStateItem;

	private state_subject_observer =
		new BehaviorSubject<NetworkState>(undefined);
	private simplestatus_subject_observer =
		new BehaviorSubject<SimpleStatusItem>(undefined);

	constructor(private http: HttpClient) {
		interval(30000).subscribe(
			(val) => { this.obtainNetworkState(); }
		)
		this.obtainNetworkState()
	}

  private obtainNetworkState() {
	console.log("obtaining network state");
	this.http.get<FullStatusItem>('/api/network/status')
	  .pipe(
		catchError( (err) => of(undefined))
	  )
	  .subscribe( (status: FullStatusItem) => {
		console.log("got network status: ", status);
		
		this.setState(status);
		
		this.state_subject_observer.next(this.get_network_state());
		this.simplestatus_subject_observer.next({
		  driver_state: this.get_server_state(),
		  network_state: this.get_network_state(),
		  device: status.driver.device,
		});
	  },
	  err => {
		console.log("unable to obtain network status")
		this.driver_state_str = DriverState.UNKNOWN;
		this.network_state_str = NetworkState.UNKNOWN;
	  });
  }


	/**
  	 * Translate what we get from the network into what we need.
	 * This turns out to be a bit ugly, but it's straightforward.
	 */
	setState(status: FullStatusItem) {
		let driver_state = status.driver;
		let network_state = status.network;
		
		// driver state
		let driver_state_str = DriverState.UNKNOWN;
		if (!driver_state.is_connected) {
			driver_state_str = DriverState.STOPPED;
		} else if (!driver_state.is_ready) {
			driver_state_str = DriverState.CONNECTED;
		}

		if (driver_state.is_ready) {
			driver_state_str = DriverState.READY;
		}

		if (driver_state.is_ready && driver_state.is_scan_completed) {
			driver_state_str = DriverState.STARTED;
		}

		if (driver_state.is_failed) {
			driver_state_str = DriverState.FAILED;
		}

		// network state
		let network_state_str = NetworkState.UNKNOWN;
		switch (network_state.state) {
			case NetworkStateEnum.STARTING:
				network_state_str = NetworkState.STARTING;
				break;
			case NetworkStateEnum.STOPPED:
				network_state_str = NetworkState.STOPPED;
				break;
			case NetworkStateEnum.ALIVE:
				network_state_str = NetworkState.ALIVE;
				break;
			case NetworkStateEnum.AWAKE:
				network_state_str = NetworkState.AWAKE;
				break;
			case NetworkStateEnum.SLEEP:
				network_state_str = NetworkState.ASLEEP;
				break;
			case NetworkStateEnum.DEAD:
				network_state_str = NetworkState.DEAD;
				break;
		}
		this.status = status;
		this.driver_state = driver_state;
		this.network_state = network_state;
		this.driver_state_str = driver_state_str;
		this.network_state_str = network_state_str;
	}

	get_server_state(): DriverState {
		return this.driver_state_str;
	}

	get_network_state(): NetworkState {
		return this.network_state_str;
	}

	refresh_state() {
		this.obtainNetworkState();
	}

	get_state_observer(): BehaviorSubject<NetworkState> {
		return this.state_subject_observer;
	}

	get_simplestatus_observer() : BehaviorSubject<SimpleStatusItem> {
		return this.simplestatus_subject_observer;
	}


	isAvailable() {
		return (!!this.driver_state && this.driver_state.is_connected);
	}

	isReady() {
		return (!!this.driver_state && this.driver_state.is_ready);
	}

	isStarted() {
		return (!!this.driver_state &&
			    this.driver_state.is_ready &&
		        this.driver_state.is_scan_completed);
	}


	start_network() {
		return this.http.post("/api/network/start", true);
	}

	stop_network() {
		return this.http.post("/api/network/stop", true);
	}
}
