import { CollectionResult, ODataQuery } from "furystack-core";
import * as _ from "lodash";
import { DataProviderBase } from "./DataProviderBase";

export class InMemoryProvider<EntityType, PrimaryKeyType, Fields> extends DataProviderBase<EntityType, PrimaryKeyType> {

    private entities: EntityType[] = [];

    private select(entity: EntityType, fields: Array<keyof EntityType>): Partial<EntityType> {
        const filtered: Partial<EntityType> = {};
        for (const prop in entity) {
            if (fields.indexOf(prop) > -1) {
                filtered[prop] = entity[prop];
            }
        }
        return filtered;
    }

    public async GetSingleAsync(key: PrimaryKeyType): Promise<EntityType> {
        return this.entities.find((a) =>
            a[this.modelDescriptor.PrimaryKey.primaryKey] as PrimaryKeyType === key);
    }

    public async GetSinglePartialAsync(key: PrimaryKeyType, fields: Array<keyof EntityType>): Promise<Partial<EntityType>> {
        const found = await this.GetSingleAsync(key);

        return this.select(found, fields);
    }

    public async GetCollectionAsync<K extends keyof EntityType>(q?: ODataQuery<EntityType, K>): Promise<CollectionResult< EntityType>> {

        // ToDo: Perform filter operations
        let returnedEntities = this.entities as Array<Partial<EntityType>>;

        // ToDO: TESTS
        if (q) {
            if (q.orderBy) {
                returnedEntities = _.orderBy(returnedEntities, q.orderBy);
            }
            if (q.skip) {
                returnedEntities = returnedEntities.slice(q.skip, returnedEntities.length);
            }
            if (q.top) {
                returnedEntities = returnedEntities.slice(0, q.top);
            }
            if (q.select) {
                const selectStrings = q.select.map((a) => a.toString());
                returnedEntities = returnedEntities.map((e) => this.select(e as EntityType, selectStrings as Array<keyof EntityType>));
            }
        }

        return new CollectionResult(returnedEntities, this.entities.length);
    }
    public async PostAsync(entity: EntityType): Promise<EntityType> {
        if (this.entities.find((a) =>
            a[this.modelDescriptor.PrimaryKey.primaryKey] === entity[this.modelDescriptor.PrimaryKey.primaryKey])) {
            throw new Error("Entity already exists!");
        }
        this.entities.push(entity);
        return entity;
    }
    public async PatchAsync(primaryKey: PrimaryKeyType,
                            delta: Partial<EntityType>): Promise<EntityType> {
        const e = await this.GetSingleAsync(primaryKey) as EntityType;
        for (const prop in delta) {
            if (delta[prop]) {
                e[prop] = delta[prop];
            }
        }
        return e;
    }
    public async PutAsync(primaryKey: PrimaryKeyType, entity: EntityType): Promise<EntityType> {
        const e = await this.GetSingleAsync(primaryKey);
        const index = this.entities.indexOf(e as EntityType);
        this.entities[index] = entity;
        return entity;
    }
    public async Delete(primaryKey: PrimaryKeyType): Promise<any> {
        const e = await this.GetSingleAsync( primaryKey );
        const index = this.entities.indexOf(e as EntityType);
        this.entities.splice(index, 1);
        return true;
    }

    public static CreateWithId<EntityType, K extends keyof EntityType>(entityRef: { new (): EntityType }) {
        return new InMemoryProvider<EntityType, number, K>(entityRef);
    }

}
