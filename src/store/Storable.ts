import { StoreObject } from "./Store";
import { v4 as uuidv4 } from 'uuid';


interface Serializer {
    serialize(object: object): object;
    deserialize(object: object): object;
}

export abstract class Storable<T> {

    type: string;
    guid: string;
    primitiveFields: string[];
    serializers = new Map() as Map<string, Serializer>;
    
    constructor(type: string) {
        this.type = type;
        this.guid = uuidv4();
        this.primitiveFields = this.getPrimitiveFields();
    }

    abstract getPrimitiveFields(): string[];
    
    registerSerializableField(
        name: string, 
        serialize: (f: object) => object, 
        deserialize: (f: object) => object
    ) {
        this.serializers.set(name, {
            serialize,
            deserialize,
        })
    }

    toObject(): StoreObject {
        const object = {};
        for (let field of this.primitiveFields) {
            object[field] = this[field];
        }
        for (let entry of this.serializers) {
            const field = entry[0];
            object[field] = entry[1].serialize(this[field]);
        }
        return {
            ...object,
            guid: this.guid,
            type: this.type,
            index: null,
        };
    }

    readObject(object: StoreObject) {
        this.guid = object.guid;
        for (let field of this.primitiveFields) {
            this[field] = object[field];
        }
        for (let entry of this.serializers) {
            const field = entry[0];
            this[field] = entry[1].deserialize(object[field]);
        }
    }
}