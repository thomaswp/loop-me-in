import { Store, StoreObject, StateIndex } from "./Store.js";

export abstract class StoreNet {
    sessionID: string;
    store: Store;

    constructor(store: Store) {
        this.store = store;
        this.sessionID = store.sessionID;
    }

    deserializeMap(array: [[string, StateIndex]]) : Map<string, StateIndex> {
        return new Map(array);
    }

    getBody(indices: Map<string, StateIndex>) {
        return {
            indices: this.store.getIndices(),
            updates: this.store.getUpdates(indices)
        };
    }

    deserializePull(json: object) : StoreObject[] {
        const objs = json['updates'] as object[];
        return objs as StoreObject[];
        // const storeObjs = [] as StoreObject[];
        // objs.forEach(obj => {

        // });
    }
}

