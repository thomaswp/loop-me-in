import { assert } from '@vue/compiler-core';
import { v4 as uuidv4 } from 'uuid';

export class StateIndex {
    guid: string;
    version: number;

    constructor(guid: string, version = 0) {
        this.guid = guid;
        this.version = version;
    }

    increment() : StateIndex {
        return new StateIndex(this.guid, this.version + 1);
    }

    newer(index: StateIndex) {
        assert(index.guid == this.guid, 'Guids do not match');
        return index.version > this.version ? index : this;
    }

    isOlderThan(index: StateIndex) : boolean {
        assert(index.guid == this.guid, 'Guids do not match');
        return this.version < index.version;
    }
}

export class Store {

    sessionID: string;
    clientGuid: string;
    stateIndex: StateIndex;
    objects = new Map() as Map<string, StoreObject>;
    listeners = [] as StoreListener[];
    indices = new Map() as Map<string, StateIndex>;

    static I: Store;

    constructor(sessionID: string) {
        this.sessionID = sessionID || uuidv4();
        this.clientGuid = uuidv4();
        this.updateIndex(new StateIndex(this.clientGuid));
        Store.I = this;
    }

    add(obj: StoreObject) {
        obj.index = this.stateIndex.increment();
        this.updateObject(obj);
        console.log('adding', obj, 'to', this.objects, this.stateIndex);
    }

    private updateObject(obj: StoreObject) {
        this.updateIndex(obj.index);
        this.objects.set(obj.guid, obj);
    }

    private updateIndex(index: StateIndex) {
        if (index.guid == this.clientGuid) this.stateIndex = index;
        this.indices.set(index.guid, index);
    }

    getUpdates(currentIndices: Map<string, StateIndex>) : StoreObject[] {
        const updates = [];
        for (let index of this.indices.values()) {
            const currentVesion = currentIndices.has(index.guid) ? 
                currentIndices.get(index.guid) : -1;
            updates.push(...[...this.objects.values()].filter(o => 
                o.index.guid == index.guid && 
                o.index.version > currentVesion
            ));
        }
        return updates;
    }

    postUpdates(objs: StoreObject[]) {
        objs.forEach(obj => {
            let oldObj = this.objects.get(obj.guid);
            if (oldObj && !oldObj.isOlderThan(obj)) return;
            this.updateObject(obj);
            this.notifyUpdated(obj, oldObj);
        });
    }

    notifyUpdated(object: StoreObject, oldObject: StoreObject) {
        this.listeners.forEach(l => l.updated(object, oldObject))
    }
}

export abstract class StoreObject {

    guid: string;
    index: StateIndex;

    constructor() {
        this.guid = uuidv4();
    }

    isOlderThan(obj: StoreObject) {
        return obj && this.index.isOlderThan(obj.index);
    }

    // toJSON() : object {

    // }

    // static fromJSON(json: object, store: Store) : StoreObject {

    // }
}

export class WrapperObject extends StoreObject {

    value: any;

    constructor(value: any) {
        super();
        this.value = value;
    }
}

export abstract class StoreListener {
    updated(object: StoreObject, oldObject: StoreObject): void {
        
    }
}