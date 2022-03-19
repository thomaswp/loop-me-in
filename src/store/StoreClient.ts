import { Store, StateIndex } from "./Store";
import { StoreNet } from "./StoreNet";


export class StoreClient extends StoreNet {

    urlBase: string;
    lastPushIndices = new Map() as Map<string, StateIndex>;

    constructor(store: Store, urlBase: string) {
        super(store);
        this.urlBase = urlBase;
    }

    createURL(api: string, params = {}): string {
        const url = new URL(this.urlBase + api);
        url.searchParams.append('sessionID', this.sessionID);
        for (let param of Object.keys(params)) {
            url.searchParams.append(param, params[param]);
        }
        return url.href;
    }

    // deserializeMap(string: )
    push() {
        this.sync(true);
    }

    sync(force = false) {
        const url = this.createURL('sync');
        const body = this.getBody(this.lastPushIndices);
        if (!force && body.updates.length == 0)
            return;
        fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: new Headers({
                'content-type': 'application/json'
            }),
        }).then(response => response.json())
            .then(data => this.receive(data));
    }

    receive(data: object) {
        this.store.postUpdates(this.deserializePull(data));
        this.lastPushIndices = this.deserializeMap(data['indices']);
        this.sync();
    }
}
