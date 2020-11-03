import { Component, Input, OnInit } from '@angular/core';
import { NetworkNode } from 'src/app/types/Node';

@Component({
  selector: 'app-device-capabilities',
  templateUrl: './device-capabilities.component.html',
  styleUrls: ['./device-capabilities.component.scss']
})
export class DeviceCapabilitiesComponent implements OnInit {

    @Input() node: NetworkNode;

    constructor() { }

    public ngOnInit(): void {
    }

    public isController(): boolean {
        return this.node.capabilities.is_controller;
    }

    public isPrimary(): boolean {
        return this.node.capabilities.is_primary_controller;
    }

    public isRouting(): boolean {
        return this.node.properties.is_routing;
    }

    public isListening(): boolean {
        return this.node.properties.is_listening;
    }

    public isBeaming(): boolean {
        return this.node.properties.is_beaming;
    }
}
