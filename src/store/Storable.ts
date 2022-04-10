import { StoreObject } from "./Store";
import { v4 as uuidv4 } from 'uuid';


interface Serializer<U> {
    serialize(object: U): Promise<string>;
    deserialize(object: string): Promise<U>;
}

export abstract class Storable<T> {

    type: string;
    guid: string;
    primitiveFields: string[];
    serializers = new Map() as Map<string, Serializer<any>>;
    
    constructor(type: string) {
        this.type = type;
        this.guid = uuidv4();
        this.primitiveFields = this.getPrimitiveFields();
    }

    abstract getPrimitiveFields(): string[];

    onRead() {}
    onConstructed() {}
    
    registerSerializableField<U>(
        name: string, 
        serialize: (f: U) => Promise<string>, 
        deserialize: (f: string) => Promise<U>
    ) {
        this.serializers.set(name, {
            serialize,
            deserialize,
        })
    }

    async toObject(): Promise<StoreObject> {
        const object = {};
        for (let field of this.primitiveFields) {
            object[field] = this[field];
        }
        for (let entry of this.serializers) {
            const field = entry[0];
            object[field] = await entry[1].serialize(this[field]);
        }
        return {
            data: object,
            guid: this.guid,
            type: this.type,
            index: null,
        };
    }

    async readObject(object: StoreObject) {
        this.guid = object.guid;
        if (!object.data) return;
        for (let field of this.primitiveFields) {
            this[field] = object.data[field];
        }
        for (let entry of this.serializers) {
            const field = entry[0];
            this[field] = await entry[1].deserialize(object.data[field]);
        }
        this.onRead();
    }
}