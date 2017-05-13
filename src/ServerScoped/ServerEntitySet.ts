import { CustomAction, EndpointEntitySet, EndpointEntityType } from 'furystack-core';
import { DataProviderBase } from '../index';
import {ServerActionOwnerAbstract} from './ServerActionOwnerAbstract';

export class ServerEntitySet<TBaseType, TPrimaryKey> extends ServerActionOwnerAbstract {

    private dataProvider: DataProviderBase<any, any>;

    protected getActionByName<TBody, TReturns>(name: string): CustomAction<TBody, TReturns> {
        return this.EndpointEntitySet.CustomAction(name) as CustomAction<TBody, TReturns>;
    }

    public get Name(): string{
        return this.EndpointEntitySet.Name;
    }

    public get EndpointEntityType(): EndpointEntityType {
        return this.EndpointEntitySet.EndpointEntityType;
    }

    public SetDataProvider(provider: DataProviderBase<TBaseType, TPrimaryKey> ) {
        if (this.dataProvider != null) {
            throw Error(`DataProvider for ${this.Name} was already set`);
        }
        this.dataProvider = provider;
    }

    constructor(private readonly EndpointEntitySet: EndpointEntitySet,
                baseType: {new(): TBaseType},
                primaryKey: {new(): TPrimaryKey}) {
        super();
    }

}
