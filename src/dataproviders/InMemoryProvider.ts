import { CollectionResult, ODataQuery } from 'furystack-core';
import { DataProviderBase } from './DataProviderBase';

export class InMemoryProvider<EntityType, PrimaryKeyType, Fields> extends DataProviderBase<EntityType, PrimaryKeyType> {

    private Entities: EntityType[] = [];

    public async GetSingleAsync(key: PrimaryKeyType): Promise<EntityType> {
        return this.Entities.find((a) =>
            a[this.ModelDescriptor.PrimaryKey.PrimaryKey] as PrimaryKeyType === key);
    }
    public async GetCollectionAsync(q?: ODataQuery<EntityType, Fields>): Promise<CollectionResult<EntityType>> {

        // ToDo: Perform filter operations
        return new CollectionResult(this.Entities, this.Entities.length);
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
        const e = await this.GetSingleAsync(primaryKey);
        for (const prop in delta) {
            if (delta[prop]) {
                e[prop] = delta[prop];
            }
        }
        return e;
    }
    public async PutAsync(primaryKey: PrimaryKeyType, entity: EntityType): Promise<EntityType> {
        const e = await this.GetSingleAsync(primaryKey);
        const index = this.Entities.indexOf(e);
        this.Entities[index] = entity;
        return entity;
    }
    public async Delete(primaryKey: PrimaryKeyType): Promise<any> {
        const e = await this.GetSingleAsync( primaryKey );
        const index = this.Entities.indexOf(e);
        this.Entities.splice(index, 1);
        return true;
    }

    public static CreateWithId<EntityType, K extends keyof EntityType>(entityRef: { new (): EntityType }) {
        return new InMemoryProvider<EntityType, number, K>(entityRef);
    }

}
