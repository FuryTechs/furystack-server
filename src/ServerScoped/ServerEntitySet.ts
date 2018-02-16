import { CollectionResult, CustomAction, EndpointEntitySet, EndpointEntityType, ODataQuery } from "furystack-core";
import { DataProviderBase } from "../index";
import { ServerActionOwnerAbstract } from "./ServerActionOwnerAbstract";

export class ServerEntitySet<TBaseType, TPrimaryKey> extends ServerActionOwnerAbstract {

    private dataProvider: DataProviderBase<any, any>;

    protected getActionByName<TBody, TReturns>(name: string): CustomAction<TBody, TReturns> {
        return this.endpointEntitySet.CustomAction(name) as CustomAction<TBody, TReturns>;
    }

    public get Name(): string {
        return this.endpointEntitySet.name;
    }

    public get EndpointEntityType(): EndpointEntityType {
        return this.endpointEntitySet.endpointEntityType;
    }

    public SetDataProvider(provider: DataProviderBase<TBaseType, TPrimaryKey>) {
        if (this.dataProvider != null) {
            throw Error(`DataProvider for ${this.Name} was already set`);
        }
        this.dataProvider = provider;
        return this;
    }

    public get DataProvider(): DataProviderBase<TBaseType, TPrimaryKey> {
        return this.dataProvider;
    }

    constructor(private readonly endpointEntitySet: EndpointEntitySet,
                baseType: { new (): TBaseType },
                primaryKey: { new (): TPrimaryKey }) {
        super();
    }

}
