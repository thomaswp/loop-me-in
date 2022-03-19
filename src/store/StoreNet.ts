import { Store, StoreObject, StateIndex } from "./Store";

export abstract class StoreNet {
    sessionID: string;
    store: Store;

    constructor(store: Store) {
        this.store = store;
        this.sessionID = store.sessionID;
    }

    serializeMap<K,V>(map: Map<K,V>) {
        return [...map.entries()];
    }

    deserializeMap<K,V>(array: object) : Map<K,V> {
        return new Map(array as Iterable<[K, V]>);
    }

    getBody(indices: Map<string, StateIndex>) {
        return {
            indices: this.serializeMap(this.store.indices),
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

