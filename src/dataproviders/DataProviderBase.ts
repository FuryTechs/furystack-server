import { CollectionResult, ModelDescriptor, ModelDescriptorStore, ODataQuery } from "furystack-core";

export abstract class DataProviderBase<EntityType, PrimaryKeyType> {

    protected readonly modelDescriptor: ModelDescriptor;

    constructor(entityReference: { new (): EntityType }) {
        this.modelDescriptor = ModelDescriptorStore.GetDescriptor(entityReference);
    }

    public abstract async GetSingleAsync<K extends keyof EntityType>(
        get: PrimaryKeyType):
        Promise<EntityType>;

    public abstract async GetSinglePartialAsync<K extends keyof EntityType>(
        get: PrimaryKeyType,
        fields: Array<keyof EntityType>):
        Promise<Partial<EntityType>>;

    public abstract async GetCollectionAsync<K extends keyof EntityType>(
        query?: ODataQuery<EntityType, K>):
        Promise<CollectionResult<EntityType>>;
    public abstract async PostAsync(entity: EntityType): Promise<EntityType>;
    public abstract async PatchAsync(primaryKey: PrimaryKeyType, delta: Partial<EntityType>): Promise<EntityType>;
    public abstract async PutAsync(primaryKey: PrimaryKeyType, entity: EntityType): Promise<EntityType>;
    public abstract async Delete(primaryKey: PrimaryKeyType): Promise<any>;
}
