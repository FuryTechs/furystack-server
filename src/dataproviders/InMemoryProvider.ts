import { CollectionResult, ODataQuery } from 'furystack-core';
import * as _ from 'lodash';
import { DataProviderBase } from './DataProviderBase';

export class InMemoryProvider<EntityType, PrimaryKeyType, Fields> extends DataProviderBase<EntityType, PrimaryKeyType> {

    private Entities: EntityType[] = [];

    private select(entity: EntityType, fields: Array<keyof EntityType>): Partial<EntityType> {
        const filtered = {} as Partial<EntityType>;
        for (const prop in entity) {
            if (fields.indexOf(prop) > -1) {
                filtered[prop] = entity[prop];
            }
        }
        return filtered;
    }

    public async GetSingleAsync(key: PrimaryKeyType): Promise<EntityType> {
        return this.Entities.find((a) =>
            a[this.ModelDescriptor.PrimaryKey.PrimaryKey] as PrimaryKeyType === key);
    }

    public async GetSinglePartialAsync(key: PrimaryKeyType, fields: Array<keyof EntityType>): Promise<Partial<EntityType>> {
        const found = await this.GetSingleAsync(key);

        return this.select(found, fields);
    }

    public async GetCollectionAsync(q?: ODataQuery<EntityType, Fields>): Promise<CollectionResult< EntityType>> {

        // ToDo: Perform filter operations
        let returnedEntities = this.Entities as Array<Partial<EntityType>>;

        // ToDO: TESTS
        if (q) {
            if (q.OrderBy) {
                returnedEntities = _.orderBy(returnedEntities, q.OrderBy);
            }
            if (q.Skip) {
                returnedEntities = returnedEntities.slice(q.Skip, returnedEntities.length);
            }
            if (q.Top) {
                returnedEntities = returnedEntities.slice(0, q.Top);
            }
            if (q.Select) {
                const selectStrings = q.Select.map((a) => a.toString());
                returnedEntities = returnedEntities.map((e) => this.select(e as EntityType, selectStrings as Array<keyof EntityType>));
            }
        }

        return new CollectionResult(returnedEntities, this.Entities.length);
    }
    public async PostAsync(entity: EntityType): Promise<EntityType> {
        if (this.Entities.find((a) =>
            a[this.ModelDescriptor.PrimaryKey.PrimaryKey] === entity[this.ModelDescriptor.PrimaryKey.PrimaryKey])) {
            throw new Error('Entity already exists!');
        }
        this.Entities.push(entity);
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
        const index = this.Entities.indexOf(e as EntityType);
        this.Entities[index] = entity;
        return entity;
    }
    public async Delete(primaryKey: PrimaryKeyType): Promise<any> {
        const e = await this.GetSingleAsync( primaryKey );
        const index = this.Entities.indexOf(e as EntityType);
        this.Entities.splice(index, 1);
        return true;
    }

    public static CreateWithId<EntityType, K extends keyof EntityType>(entityRef: { new (): EntityType }) {
        return new InMemoryProvider<EntityType, number, K>(entityRef);
    }

}
