import { } from 'furystack-core';
import { CollectionResult, ModelDescriptor, ModelDescriptorStore, ODataQuery } from 'furystack-core';

export abstract class DataProviderBase<EntityType, PrimaryKeyType>{

    protected readonly ModelDescriptor: ModelDescriptor;

    constructor(entityReference: { new (): EntityType }) {
        this.ModelDescriptor = ModelDescriptorStore.GetDescriptor(entityReference);
    }

    public abstract async GetSingleAsync<K extends keyof EntityType>(
        get: PrimaryKeyType):
        Promise<EntityType>;
    public abstract async GetCollectionAsync<K extends keyof EntityType>(
        query?: ODataQuery<EntityType, K>):
        Promise<CollectionResult<EntityType>>;
    public abstract async PostAsync(entity: EntityType): Promise<EntityType>;
    public abstract async PatchAsync(primaryKey: PrimaryKeyType, delta: Partial<EntityType>): Promise<EntityType>;
    public abstract async PutAsync(primaryKey: PrimaryKeyType, entity: EntityType): Promise<EntityType>;
    public abstract async Delete(primaryKey: PrimaryKeyType): Promise<any>;
}
