import { assert } from '@vue/compiler-core';
import { v4 as uuidv4 } from 'uuid';

export interface StateIndex {
    guid: string;
    version: number;
}

export interface StoreObject {
    type: String;
    // data: object;
    guid: string;
    index: StateIndex;
}

export class Store {

    sessionID: string;
    clientGuid: string;
    stateIndex: StateIndex;
    objects = new Map() as Map<string, StoreObject>;
    listeners = [] as StoreListener[];
    indices = new Map() as Map<string, StateIndex>;

    static I: Store;
    
    static createObject(type: string, data: object) : StoreObject {
        return {
            ...data,
            type: type,
            index: null,
            guid: uuidv4(),
        };
    }

    static isObjectOlderThan(obj1: StoreObject, obj2: StoreObject) {
        return obj1 && obj2 && Store.isIndexOlderThan(obj1.index, obj2.index);
    }

    static isIndexOlderThan(index1: StateIndex, index2: StateIndex) : boolean {
        assert(index1.guid == index2.guid, 'Guids do not match');
        return index1.version < index2.version;
    }

    constructor(sessionID: string) {
        this.sessionID = sessionID || uuidv4();
        this.clientGuid = uuidv4();
        this.updateIndex({
            guid: this.clientGuid,
            version: 0,
        });
        Store.I = this;
    }

    add(type: string, data: object) {
        this.addObject(Store.createObject(type, data));
    }

    addObject(obj: StoreObject) {
        obj.index = { ...this.stateIndex};
        obj.index.version++;
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

    getIndices() {
        // Don't send version-0 indices, since they have no data
        return [...this.indices.entries()].filter(entry => entry[1].version > 0);
    }

    getUpdates(currentIndices: Map<string, StateIndex>) : StoreObject[] {
        const updates = [];
        for (let index of this.indices.values()) {
            const currentVesion = currentIndices.has(index.guid) ? 
                currentIndices.get(index.guid) : 0;
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
            if (oldObj && !Store.isObjectOlderThan(oldObj, obj)) return;
            this.updateObject(obj);
            this.notifyUpdated(obj, oldObj);
        });
    }

    notifyUpdated(object: StoreObject, oldObject: StoreObject) {
        this.listeners.forEach(l => l.updated(object, oldObject))
    }
}

export abstract class StoreListener {
    updated(object: StoreObject, oldObject: StoreObject): void {
        
    }
}