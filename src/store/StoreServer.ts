import { Store } from "./Store.js";
import { StoreNet } from "./StoreNet.js";


export class StoreServer extends StoreNet {

    constructor(store: Store) {
        super(store);
    }

    receive(data: object) {
        // console.log(data);
        this.store.postUpdates(this.deserializePull(data));
        return this.getBody(this.deserializeMap(data['indices']));
    }
}

export class StoreLibrary {

    servers = new Map() as Map<string, StoreServer>;

    constructor() {
    }

    handle(sessionID: string, body: object): object {
        if (!this.servers.has(sessionID)) {
            const store = new Store(sessionID);
            const server = new StoreServer(store);
            this.servers.set(sessionID, server);
        }
        return this.servers.get(sessionID).receive(body);
    }
}