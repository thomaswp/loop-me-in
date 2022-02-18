export class Event<T> {
    private handlers = new Map();
    private nextKey = 0;

    add(callback: (arg: T) => void, key?: any) {
        if (!key) key = this.nextKey++;
        this.handlers.set(key, callback);
        return key;
    }

    remove(key: any) {
        this.handlers.delete(key);
    }

    emit(data: T) {
        this.handlers.forEach(h => h(data));
    }
}
