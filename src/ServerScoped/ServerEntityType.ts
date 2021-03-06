import { CustomAction, EndpointEntityType, ModelDescriptor } from "furystack-core";
import {ServerActionOwnerAbstract} from "./";
export class ServerEntityType extends ServerActionOwnerAbstract {
    protected getActionByName<TBody, TReturns>(name: string): CustomAction<TBody, TReturns> {
        return this.entityType.CustomAction(name) as CustomAction<TBody, TReturns>;
    }

    public get Name(): string {
        return this.entityType.name;
    }

    public get ModelDescriptor(): ModelDescriptor {
        return this.entityType.modelDescriptor;
    }

    constructor(private entityType: EndpointEntityType) {
        super();
    }

}
